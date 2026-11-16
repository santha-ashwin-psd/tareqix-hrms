# """Vendor Employee Working Hours.

# Working time of vendor-company employees, taken from Employee Checkin (IN/OUT punches).
# Vendor employee = Employee with ``vendor`` set (custom field, fetched from Company.supplier).

# Hours are the sum of IN -> OUT pairs. A day is credited to the date of the IN punch, so a
# night shift that ends after midnight stays on one row. Days with an unmatched punch are
# flagged instead of guessed.
# """

# import frappe
# from frappe import _
# from frappe.utils import flt, get_datetime, getdate


# def execute(filters=None):
# 	filters = frappe._dict(filters or {})
# 	if not filters.from_date or not filters.to_date:
# 		frappe.throw(_("From Date and To Date are required"))
# 	if getdate(filters.from_date) > getdate(filters.to_date):
# 		frappe.throw(_("From Date cannot be after To Date"))

# 	days = get_day_rows(filters)
# 	summary_view = bool(filters.get("summary_view"))
# 	data = summarise(days) if summary_view else days
# 	return get_columns(summary_view), data, None, None, get_report_summary(days)


# def get_columns(summary_view):
# 	cols = [
# 		{"label": _("Employee"), "fieldname": "employee", "fieldtype": "Link", "options": "Employee", "width": 120},
# 		{"label": _("Employee Name"), "fieldname": "employee_name", "fieldtype": "Data", "width": 170},
# 		{"label": _("Vendor"), "fieldname": "vendor", "fieldtype": "Link", "options": "Supplier", "width": 150},
# 		{"label": _("Company"), "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 150},
# 	]
# 	if summary_view:
# 		cols += [
# 			{"label": _("Days Worked"), "fieldname": "days", "fieldtype": "Int", "width": 100},
# 			{"label": _("Total Hours"), "fieldname": "hours", "fieldtype": "Float", "precision": 2, "width": 110},
# 			{"label": _("Avg Hours / Day"), "fieldname": "avg_hours", "fieldtype": "Float", "precision": 2, "width": 120},
# 			{"label": _("Days With Issues"), "fieldname": "issue_days", "fieldtype": "Int", "width": 120},
# 		]
# 	else:
# 		cols += [
# 			{"label": _("Date"), "fieldname": "date", "fieldtype": "Date", "width": 100},
# 			{"label": _("First IN"), "fieldname": "first_in", "fieldtype": "Datetime", "width": 160},
# 			{"label": _("Last OUT"), "fieldname": "last_out", "fieldtype": "Datetime", "width": 160},
# 			{"label": _("Punches"), "fieldname": "punches", "fieldtype": "Int", "width": 80},
# 			{"label": _("Hours Worked"), "fieldname": "hours", "fieldtype": "Float", "precision": 2, "width": 110},
# 			{"label": _("Status"), "fieldname": "status", "fieldtype": "Data", "width": 120},
# 		]
# 	return cols


# def get_employees(filters):
# 	conditions = ["(status != 'Left' OR relieving_date >= %(from_date)s)"]
# 	if filters.get("employee"):
# 		conditions.append("name = %(employee)s")
# 	if filters.get("company"):
# 		conditions.append("company = %(company)s")
# 	if filters.get("vendor"):
# 		conditions.append("vendor = %(vendor)s")
# 	else:
# 		conditions.append("IFNULL(vendor, '') != ''")

# 	return frappe.db.sql(
# 		f"""
# 		SELECT name AS employee, employee_name, vendor, company
# 		FROM `tabEmployee`
# 		WHERE {" AND ".join(conditions)}
# 		""",
# 		filters,
# 		as_dict=True,
# 	)


# def get_day_rows(filters):
# 	employees = {e.employee: e for e in get_employees(filters)}
# 	if not employees:
# 		return []

# 	# punches may spill past midnight for night shifts, so read one extra day
# 	checkins = frappe.get_all(
# 		"Employee Checkin",
# 		filters={
# 			"employee": ["in", list(employees)],
# 			"time": ["between", [f"{getdate(filters.from_date)} 00:00:00", f"{getdate(filters.to_date)} 23:59:59"]],
# 		},
# 		fields=["employee", "time", "log_type"],
# 		order_by="employee, time",
# 	)
# 	tail = frappe.get_all(
# 		"Employee Checkin",
# 		filters={
# 			"employee": ["in", list(employees)],
# 			"time": ["between", [f"{frappe.utils.add_days(getdate(filters.to_date), 1)} 00:00:00", f"{frappe.utils.add_days(getdate(filters.to_date), 1)} 23:59:59"]],
# 			"log_type": "OUT",
# 		},
# 		fields=["employee", "time", "log_type"],
# 		order_by="employee, time",
# 	)
# 	checkins += tail

# 	by_emp = {}
# 	for c in checkins:
# 		by_emp.setdefault(c.employee, []).append(c)

# 	from_date, to_date = getdate(filters.from_date), getdate(filters.to_date)
# 	rows = []
# 	for emp_id, punches in by_emp.items():
# 		emp = employees[emp_id]
# 		days = {}
# 		open_in = None  # datetime of an IN waiting for its OUT

# 		def day_row(d):
# 			return days.setdefault(
# 				d, {"first_in": None, "last_out": None, "punches": 0, "seconds": 0.0, "issue": None}
# 			)

# 		for p in punches:
# 			t = get_datetime(p.time)
# 			if p.log_type == "IN":
# 				if open_in is not None:
# 					# two INs in a row: previous IN never got an OUT
# 					day_row(open_in.date())["issue"] = "Missing OUT"
# 				open_in = t
# 				if from_date <= t.date() <= to_date:
# 					r = day_row(t.date())
# 					r["punches"] += 1
# 					r["first_in"] = r["first_in"] or t
# 			else:  # OUT
# 				if open_in is None:
# 					if from_date <= t.date() <= to_date:
# 						r = day_row(t.date())
# 						r["punches"] += 1
# 						r["last_out"] = t
# 						r["issue"] = "Missing IN"
# 					continue
# 				r = day_row(open_in.date())
# 				r["seconds"] += (t - open_in).total_seconds()
# 				r["last_out"] = t
# 				r["punches"] += 1
# 				open_in = None
# 		if open_in is not None:
# 			day_row(open_in.date())["issue"] = "Missing OUT"

# 		for d, r in sorted(days.items()):
# 			if not (from_date <= d <= to_date):
# 				continue
# 			rows.append(
# 				{
# 					**emp,
# 					"date": d,
# 					"first_in": r["first_in"],
# 					"last_out": r["last_out"],
# 					"punches": r["punches"],
# 					"hours": flt(r["seconds"] / 3600, 2),
# 					"status": r["issue"] or "OK",
# 				}
# 			)

# 	rows.sort(key=lambda r: (r["employee_name"] or "", r["date"]))
# 	return rows


# def summarise(days):
# 	out = {}
# 	for r in days:
# 		s = out.setdefault(
# 			r["employee"],
# 			{
# 				"employee": r["employee"],
# 				"employee_name": r["employee_name"],
# 				"vendor": r["vendor"],
# 				"company": r["company"],
# 				"days": 0,
# 				"hours": 0.0,
# 				"issue_days": 0,
# 			},
# 		)
# 		if r["hours"] > 0:
# 			s["days"] += 1
# 		s["hours"] += r["hours"]
# 		if r["status"] != "OK":
# 			s["issue_days"] += 1
# 	rows = sorted(out.values(), key=lambda s: s["employee_name"] or "")
# 	for s in rows:
# 		s["hours"] = flt(s["hours"], 2)
# 		s["avg_hours"] = flt(s["hours"] / s["days"], 2) if s["days"] else 0
# 	return rows


# def get_report_summary(days):
# 	total = flt(sum(r["hours"] for r in days), 2)
# 	employees = len({r["employee"] for r in days})
# 	issues = sum(1 for r in days if r["status"] != "OK")
# 	return [
# 		{"value": employees, "label": _("Employees"), "datatype": "Int", "indicator": "Blue"},
# 		{"value": total, "label": _("Total Hours"), "datatype": "Float", "indicator": "Green"},
# 		{
# 			"value": issues,
# 			"label": _("Days With Missing Punch"),
# 			"datatype": "Int",
# 			"indicator": "Red" if issues else "Green",
# 		},
# 	]


























#updated




# """Vendor Employee Working Hours.

# Working time of vendor-company employees, taken from Employee Checkin (IN/OUT punches).
# Vendor employee = Employee with ``vendor`` set (custom field, fetched from Company.supplier).

# Hours are the sum of IN -> OUT pairs. A day is credited to the date of the IN punch, so a
# night shift that ends after midnight stays on one row. Days with an unmatched punch are
# flagged instead of guessed.
# """

# import frappe
# from frappe import _
# from frappe.utils import flt, get_datetime, getdate


# def execute(filters=None):
# 	filters = frappe._dict(filters or {})
# 	if not filters.from_date or not filters.to_date:
# 		frappe.throw(_("From Date and To Date are required"))
# 	if getdate(filters.from_date) > getdate(filters.to_date):
# 		frappe.throw(_("From Date cannot be after To Date"))

# 	days = get_day_rows(filters)
# 	summary_view = bool(filters.get("summary_view"))
# 	data = summarise(days) if summary_view else days
# 	return get_columns(summary_view), data, None, None, get_report_summary(days)


# def get_columns(summary_view):
# 	cols = [
# 		{"label": _("Employee"), "fieldname": "employee", "fieldtype": "Link", "options": "Employee", "width": 120},
# 		{"label": _("Employee Name"), "fieldname": "employee_name", "fieldtype": "Data", "width": 170},
# 		{"label": _("Vendor"), "fieldname": "vendor", "fieldtype": "Link", "options": "Supplier", "width": 150},
# 		{"label": _("Company"), "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 150},
# 	]
# 	if summary_view:
# 		cols += [
# 			{"label": _("Days Worked"), "fieldname": "days", "fieldtype": "Int", "width": 100},
# 			{"label": _("Total Hours"), "fieldname": "hours", "fieldtype": "Float", "precision": 2, "width": 110},
# 			{"label": _("Avg Hours / Day"), "fieldname": "avg_hours", "fieldtype": "Float", "precision": 2, "width": 120},
# 			{"label": _("Days With Issues"), "fieldname": "issue_days", "fieldtype": "Int", "width": 120},
# 		]
# 	else:
# 		cols += [
# 			{"label": _("Date"), "fieldname": "date", "fieldtype": "Date", "width": 100},
# 			{"label": _("First IN"), "fieldname": "first_in", "fieldtype": "Datetime", "width": 160},
# 			{"label": _("Last OUT"), "fieldname": "last_out", "fieldtype": "Datetime", "width": 160},
# 			{"label": _("Punches"), "fieldname": "punches", "fieldtype": "Int", "width": 80},
# 			{"label": _("Hours Worked"), "fieldname": "hours", "fieldtype": "Float", "precision": 2, "width": 110},
# 			{"label": _("Status"), "fieldname": "status", "fieldtype": "Data", "width": 120},
# 			{"label": _("Rest Hours"), "fieldname": "rest_hours", "fieldtype": "Time", "width": 110},
# 		]
# 	return cols


# def get_employees(filters):
# 	conditions = ["(status != 'Left' OR relieving_date >= %(from_date)s)"]
# 	if filters.get("employee"):
# 		conditions.append("name = %(employee)s")
# 	if filters.get("company"):
# 		conditions.append("company = %(company)s")
# 	if filters.get("vendor"):
# 		conditions.append("vendor = %(vendor)s")
# 	else:
# 		conditions.append("IFNULL(vendor, '') != ''")

# 	return frappe.db.sql(
# 		f"""
# 		SELECT name AS employee, employee_name, vendor, company
# 		FROM `tabEmployee`
# 		WHERE {" AND ".join(conditions)}
# 		""",
# 		filters,
# 		as_dict=True,
# 	)


# def get_day_rows(filters):
# 	employees = {e.employee: e for e in get_employees(filters)}
# 	if not employees:
# 		return []

# 	# punches may spill past midnight for night shifts, so read one extra day
# 	checkins = frappe.get_all(
# 		"Employee Checkin",
# 		filters={
# 			"employee": ["in", list(employees)],
# 			"time": ["between", [f"{getdate(filters.from_date)} 00:00:00", f"{getdate(filters.to_date)} 23:59:59"]],
# 		},
# 		fields=["employee", "time", "log_type", "custom_rest_hours"],
# 		order_by="employee, time",
# 	)
# 	tail = frappe.get_all(
# 		"Employee Checkin",
# 		filters={
# 			"employee": ["in", list(employees)],
# 			"time": ["between", [f"{frappe.utils.add_days(getdate(filters.to_date), 1)} 00:00:00", f"{frappe.utils.add_days(getdate(filters.to_date), 1)} 23:59:59"]],
# 			"log_type": "OUT",
# 		},
# 		fields=["employee", "time", "log_type", "custom_rest_hours"],
# 		order_by="employee, time",
# 	)
# 	checkins += tail

# 	by_emp = {}
# 	for c in checkins:
# 		by_emp.setdefault(c.employee, []).append(c)

# 	from_date, to_date = getdate(filters.from_date), getdate(filters.to_date)
# 	rows = []
# 	for emp_id, punches in by_emp.items():
# 		emp = employees[emp_id]
# 		days = {}
# 		open_in = None  # datetime of an IN waiting for its OUT

# 		def day_row(d):
# 			return days.setdefault(
# 				d, {
# 					"first_in": None,
# 					"last_out": None,
# 					"punches": 0,
# 					"seconds": 0.0,
# 					"rest_seconds": 0,
# 					"issue": None,
# 				}
# 			)

# 		for p in punches:
# 			t = get_datetime(p.time)

# 			if p.log_type == "IN":
# 				if open_in is not None:
# 					# two INs in a row: previous IN never got an OUT
# 					day_row(open_in.date())["issue"] = "Missing OUT"
# 				open_in = t
# 				if from_date <= t.date() <= to_date:
# 					r = day_row(t.date())
# 					r["punches"] += 1
# 					r["first_in"] = r["first_in"] or t

# 			else:  # OUT
# 				# Read Rest Hours from the OUT Employee Checkin.
# 				rest_value = str(p.custom_rest_hours or "00:00:00")
# 				rest_parts = rest_value.split(":")
# 				if len(rest_parts) == 3:
# 					rest_seconds = (
# 						int(rest_parts[0]) * 3600
# 						+ int(rest_parts[1]) * 60
# 						+ int(float(rest_parts[2]))
# 					)
# 				elif len(rest_parts) == 2:
# 					rest_seconds = (
# 						int(rest_parts[0]) * 3600
# 						+ int(rest_parts[1]) * 60
# 					)
# 				else:
# 					rest_seconds = 0

# 				if open_in is None:
# 					if from_date <= t.date() <= to_date:
# 						r = day_row(t.date())
# 						r["punches"] += 1
# 						r["last_out"] = t
# 						r["rest_seconds"] += rest_seconds
# 						r["issue"] = "Missing IN"
# 					continue

# 				r = day_row(open_in.date())
# 				r["seconds"] += (t - open_in).total_seconds()
# 				r["rest_seconds"] += rest_seconds
# 				r["last_out"] = t
# 				r["punches"] += 1
# 				open_in = None

# 		if open_in is not None:
# 			day_row(open_in.date())["issue"] = "Missing OUT"

# 		for d, r in sorted(days.items()):
# 			if not (from_date <= d <= to_date):
# 				continue

# 			total_rest_seconds = r["rest_seconds"]
# 			rest_hours, remainder = divmod(total_rest_seconds, 3600)
# 			rest_minutes, rest_seconds = divmod(remainder, 60)
# 			rest_time = f"{rest_hours:02d}:{rest_minutes:02d}:{rest_seconds:02d}"

# 			rows.append(
# 				{
# 					**emp,
# 					"date": d,
# 					"first_in": r["first_in"],
# 					"last_out": r["last_out"],
# 					"punches": r["punches"],
# 					"hours": flt(r["seconds"] / 3600, 2),
# 					"status": r["issue"] or "OK",
# 					"rest_hours": rest_time,
# 				}
# 			)

# 	rows.sort(key=lambda r: (r["employee_name"] or "", r["date"]))
# 	return rows


# def summarise(days):
# 	out = {}
# 	for r in days:
# 		s = out.setdefault(
# 			r["employee"],
# 			{
# 				"employee": r["employee"],
# 				"employee_name": r["employee_name"],
# 				"vendor": r["vendor"],
# 				"company": r["company"],
# 				"days": 0,
# 				"hours": 0.0,
# 				"issue_days": 0,
# 			},
# 		)
# 		if r["hours"] > 0:
# 			s["days"] += 1
# 		s["hours"] += r["hours"]
# 		if r["status"] != "OK":
# 			s["issue_days"] += 1
# 	rows = sorted(out.values(), key=lambda s: s["employee_name"] or "")
# 	for s in rows:
# 		s["hours"] = flt(s["hours"], 2)
# 		s["avg_hours"] = flt(s["hours"] / s["days"], 2) if s["days"] else 0
# 	return rows


# def get_report_summary(days):
# 	total = flt(sum(r["hours"] for r in days), 2)
# 	employees = len({r["employee"] for r in days})
# 	issues = sum(1 for r in days if r["status"] != "OK")
# 	return [
# 		{"value": employees, "label": _("Employees"), "datatype": "Int", "indicator": "Blue"},
# 		{"value": total, "label": _("Total Hours"), "datatype": "Float", "indicator": "Green"},
# 		{
# 			"value": issues,
# 			"label": _("Days With Missing Punch"),
# 			"datatype": "Int",
# 			"indicator": "Red" if issues else "Green",
# 		},
# 	]























# Updated the Backbone record is site time sheet






"""Vendor Employee Working Hours.

Working hours are fetched directly from Site TimeSheet.
Employee master is used only for Employee Name, Vendor and Company details.
"""

import frappe
from frappe import _
from frappe.utils import flt, getdate


def execute(filters=None):
	filters = frappe._dict(filters or {})

	if not filters.from_date or not filters.to_date:
		frappe.throw(_("From Date and To Date are required"))

	if getdate(filters.from_date) > getdate(filters.to_date):
		frappe.throw(_("From Date cannot be after To Date"))

	days = get_day_rows(filters)

	summary_view = bool(filters.get("summary_view"))

	data = summarise(days) if summary_view else days

	return get_columns(summary_view), data, None, None, get_report_summary(days)


def get_columns(summary_view):
	cols = [
		{"label": _("Employee"), "fieldname": "employee", "fieldtype": "Link", "options": "Employee", "width": 120},
		{"label": _("Employee Name"), "fieldname": "employee_name", "fieldtype": "Data", "width": 170},
		{"label": _("Vendor"), "fieldname": "vendor", "fieldtype": "Link", "options": "Supplier", "width": 150},
		{"label": _("Company"), "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 150},
	]

	if summary_view:
		cols += [
			{"label": _("Days Worked"), "fieldname": "days", "fieldtype": "Int", "width": 100},
			{"label": _("Total Hours"), "fieldname": "hours", "fieldtype": "Float", "precision": 2, "width": 110},
			{"label": _("Avg Hours / Day"), "fieldname": "avg_hours", "fieldtype": "Float", "precision": 2, "width": 120},
			{"label": _("Days With Issues"), "fieldname": "issue_days", "fieldtype": "Int", "width": 120},
		]

	else:
		cols += [
			{"label": _("Site"), "fieldname": "site", "fieldtype": "Data", "width": 140},
			{"label": _("Trade"), "fieldname": "trade", "fieldtype": "Link", "options": "Designation", "width": 120},
			{"label": _("Civil ID"), "fieldname": "civil_id", "fieldtype": "Data", "width": 130},
			{"label": _("First IN"), "fieldname": "first_in", "fieldtype": "Data", "width": 160},
			{"label": _("Last OUT"), "fieldname": "last_out", "fieldtype": "Data", "width": 160},
			{"label": _("Normal Hrs"), "fieldname": "normal_hours", "fieldtype": "Data", "width": 110},
			{"label": _("Total Hrs"), "fieldname": "hours", "fieldtype": "Float", "precision": 2, "width": 110},
			{"label": _("Status"), "fieldname": "status", "fieldtype": "Data", "width": 120},
			{"label": _("Rest Hours"), "fieldname": "rest_hours", "fieldtype": "Data", "width": 110},
		]

	return cols


def get_employees(filters):
	conditions = [
		"(status != 'Left' OR relieving_date >= %(from_date)s)"
	]

	if filters.get("employee"):
		conditions.append("name = %(employee)s")

	if filters.get("company"):
		conditions.append("company = %(company)s")

	if filters.get("vendor"):
		conditions.append("vendor = %(vendor)s")
	else:
		conditions.append("IFNULL(vendor, '') != ''")

	return frappe.db.sql(
		f"""
		SELECT
			name AS employee,
			employee_name,
			vendor,
			company
		FROM `tabEmployee`
		WHERE {" AND ".join(conditions)}
		""",
		filters,
		as_dict=True,
	)


def duration_to_hours(value):
	"""Convert HH:MM:SS or HH:MM duration into decimal hours."""

	if value is None or value == "":
		return 0.0

	value = str(value).strip()

	if ":" in value:
		parts = value.split(":")

		if len(parts) == 3:
			hours = flt(parts[0])
			minutes = flt(parts[1])
			seconds = flt(parts[2])

			return flt(hours + minutes / 60 + seconds / 3600, 2)

		if len(parts) == 2:
			hours = flt(parts[0])
			minutes = flt(parts[1])

			return flt(hours + minutes / 60, 2)

	return flt(value, 2)


def get_day_rows(filters):
	employees = {
		e.employee: e
		for e in get_employees(filters)
	}

	if not employees:
		return []

	# Fetch records directly from Site TimeSheet
	timesheets = frappe.get_all(
		"Site TimeSheet",
		filters={
			"custom_emp_name": ["in", list(employees)],
			"custom_date": [
				"between",
				[getdate(filters.from_date), getdate(filters.to_date)]
			],
		},
		fields=[
			"name",
			"custom_current_site",
			"custom_date",
			"custom_emp_name",
			"custom_trade",
			"custom_civil_id",
			"custom_attendance",
			"custom_in_time",
			"custom_out_time",
			"custom_total_hrs",
			"custom_rest_hrs",
			"custom_normal_hrs",
		],
		order_by="custom_date, custom_emp_name",
	)

	rows = []

	for ts in timesheets:

		employee_id = ts.custom_emp_name
		emp = employees.get(employee_id)

		if not emp:
			continue

		total_hours = duration_to_hours(ts.custom_total_hrs)
		rest_hours = duration_to_hours(ts.custom_rest_hrs)
		total_hours = flt(total_hours + rest_hours, 2)

		# Combine Date and Time into the same cell
		in_datetime = (
			f"{getdate(ts.custom_date)} {ts.custom_in_time}"
			if ts.custom_in_time else ""
		)

		out_datetime = (
			f"{getdate(ts.custom_date)} {ts.custom_out_time}"
			if ts.custom_out_time else ""
		)

		rows.append({
			"employee": employee_id,
			"employee_name": emp.employee_name,
			"vendor": emp.vendor,
			"company": emp.company,

			"site": ts.custom_current_site,
			"trade": ts.custom_trade,
			"civil_id": ts.custom_civil_id,

			"date": ts.custom_date,
			"first_in": in_datetime,
			"last_out": out_datetime,

			"normal_hours": ts.custom_normal_hrs,
			"hours": total_hours,

			"status": ts.custom_attendance or "Not Set",

			# Display Break Hours directly without conversion
			"rest_hours": ts.custom_rest_hrs,
		})

	rows.sort(
		key=lambda r: (
			r["employee_name"] or "",
			r["date"]
		)
	)

	return rows


def summarise(days):
	out = {}

	for r in days:

		s = out.setdefault(
			r["employee"],
			{
				"employee": r["employee"],
				"employee_name": r["employee_name"],
				"vendor": r["vendor"],
				"company": r["company"],
				"days": 0,
				"hours": 0.0,
				"issue_days": 0,
			},
		)

		if r["hours"] > 0:
			s["days"] += 1

		s["hours"] += r["hours"]

		if r["status"] in ("Absent", "Sick", "Leave"):
			s["issue_days"] += 1

	rows = sorted(
		out.values(),
		key=lambda s: s["employee_name"] or ""
	)

	for s in rows:
		s["hours"] = flt(s["hours"], 2)

		s["avg_hours"] = (
			flt(s["hours"] / s["days"], 2)
			if s["days"]
			else 0
		)

	return rows


def get_report_summary(days):
	total = flt(sum(r["hours"] for r in days), 2)

	employees = len({
		r["employee"] for r in days
	})

	issues = sum(
		1 for r in days
		if r["status"] in ("Absent", "Sick", "Leave")
	)

	return [
		{
			"value": employees,
			"label": _("Employees"),
			"datatype": "Int",
			"indicator": "Blue"
		},
		{
			"value": total,
			"label": _("Total Hours"),
			"datatype": "Float",
			"indicator": "Green"
		},
		{
			"value": issues,
			"label": _("Days With Issues"),
			"datatype": "Int",
			"indicator": "Red" if issues else "Green",
		},
	]

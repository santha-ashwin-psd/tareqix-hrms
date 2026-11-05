"""Vendor Employee Working Hours.

Working time of vendor-company employees, taken from Employee Checkin (IN/OUT punches).
Vendor employee = Employee with ``vendor`` set (custom field, fetched from Company.supplier).

Hours are the sum of IN -> OUT pairs. A day is credited to the date of the IN punch, so a
night shift that ends after midnight stays on one row. Days with an unmatched punch are
flagged instead of guessed.
"""

import frappe
from frappe import _
from frappe.utils import flt, get_datetime, getdate


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
			{"label": _("Date"), "fieldname": "date", "fieldtype": "Date", "width": 100},
			{"label": _("First IN"), "fieldname": "first_in", "fieldtype": "Datetime", "width": 160},
			{"label": _("Last OUT"), "fieldname": "last_out", "fieldtype": "Datetime", "width": 160},
			{"label": _("Punches"), "fieldname": "punches", "fieldtype": "Int", "width": 80},
			{"label": _("Hours Worked"), "fieldname": "hours", "fieldtype": "Float", "precision": 2, "width": 110},
			{"label": _("Status"), "fieldname": "status", "fieldtype": "Data", "width": 120},
		]
	return cols


def get_employees(filters):
	conditions = ["(status != 'Left' OR relieving_date >= %(from_date)s)"]
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
		SELECT name AS employee, employee_name, vendor, company
		FROM `tabEmployee`
		WHERE {" AND ".join(conditions)}
		""",
		filters,
		as_dict=True,
	)


def get_day_rows(filters):
	employees = {e.employee: e for e in get_employees(filters)}
	if not employees:
		return []

	# punches may spill past midnight for night shifts, so read one extra day
	checkins = frappe.get_all(
		"Employee Checkin",
		filters={
			"employee": ["in", list(employees)],
			"time": ["between", [f"{getdate(filters.from_date)} 00:00:00", f"{getdate(filters.to_date)} 23:59:59"]],
		},
		fields=["employee", "time", "log_type"],
		order_by="employee, time",
	)
	tail = frappe.get_all(
		"Employee Checkin",
		filters={
			"employee": ["in", list(employees)],
			"time": ["between", [f"{frappe.utils.add_days(getdate(filters.to_date), 1)} 00:00:00", f"{frappe.utils.add_days(getdate(filters.to_date), 1)} 23:59:59"]],
			"log_type": "OUT",
		},
		fields=["employee", "time", "log_type"],
		order_by="employee, time",
	)
	checkins += tail

	by_emp = {}
	for c in checkins:
		by_emp.setdefault(c.employee, []).append(c)

	from_date, to_date = getdate(filters.from_date), getdate(filters.to_date)
	rows = []
	for emp_id, punches in by_emp.items():
		emp = employees[emp_id]
		days = {}
		open_in = None  # datetime of an IN waiting for its OUT

		def day_row(d):
			return days.setdefault(
				d, {"first_in": None, "last_out": None, "punches": 0, "seconds": 0.0, "issue": None}
			)

		for p in punches:
			t = get_datetime(p.time)
			if p.log_type == "IN":
				if open_in is not None:
					# two INs in a row: previous IN never got an OUT
					day_row(open_in.date())["issue"] = "Missing OUT"
				open_in = t
				if from_date <= t.date() <= to_date:
					r = day_row(t.date())
					r["punches"] += 1
					r["first_in"] = r["first_in"] or t
			else:  # OUT
				if open_in is None:
					if from_date <= t.date() <= to_date:
						r = day_row(t.date())
						r["punches"] += 1
						r["last_out"] = t
						r["issue"] = "Missing IN"
					continue
				r = day_row(open_in.date())
				r["seconds"] += (t - open_in).total_seconds()
				r["last_out"] = t
				r["punches"] += 1
				open_in = None
		if open_in is not None:
			day_row(open_in.date())["issue"] = "Missing OUT"

		for d, r in sorted(days.items()):
			if not (from_date <= d <= to_date):
				continue
			rows.append(
				{
					**emp,
					"date": d,
					"first_in": r["first_in"],
					"last_out": r["last_out"],
					"punches": r["punches"],
					"hours": flt(r["seconds"] / 3600, 2),
					"status": r["issue"] or "OK",
				}
			)

	rows.sort(key=lambda r: (r["employee_name"] or "", r["date"]))
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
		if r["status"] != "OK":
			s["issue_days"] += 1
	rows = sorted(out.values(), key=lambda s: s["employee_name"] or "")
	for s in rows:
		s["hours"] = flt(s["hours"], 2)
		s["avg_hours"] = flt(s["hours"] / s["days"], 2) if s["days"] else 0
	return rows


def get_report_summary(days):
	total = flt(sum(r["hours"] for r in days), 2)
	employees = len({r["employee"] for r in days})
	issues = sum(1 for r in days if r["status"] != "OK")
	return [
		{"value": employees, "label": _("Employees"), "datatype": "Int", "indicator": "Blue"},
		{"value": total, "label": _("Total Hours"), "datatype": "Float", "indicator": "Green"},
		{
			"value": issues,
			"label": _("Days With Missing Punch"),
			"datatype": "Int",
			"indicator": "Red" if issues else "Green",
		},
	]
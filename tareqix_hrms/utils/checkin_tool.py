"""Server side of the Vendor Checkin Tool page.

Bulk-creates Employee Checkin (IN / OUT) records for vendor-company employees, with an
IN and OUT time per employee. Vendor employee = Employee with ``vendor`` set.
Each employee is saved on its own savepoint, so one bad row never blocks the others.
"""

import json
from datetime import datetime, timedelta

import frappe
from frappe import _
from frappe.utils import get_datetime, getdate

DEVICE_ID = "Vendor Checkin Tool"


@frappe.whitelist()
def get_vendor_employees(date, vendor=None, company=None):
	"""Active vendor employees for ``date`` with the punches they already have that day."""
	frappe.has_permission("Employee Checkin", "read", throw=True)
	date = getdate(date)

	filters = {"status": "Active", "date_of_joining": ["<=", date]}
	if vendor:
		filters["vendor"] = vendor
	else:
		filters["vendor"] = ["is", "set"]
	if company:
		filters["company"] = company

	employees = frappe.get_list(
		"Employee",
		filters=filters,
		fields=["name as employee", "employee_name", "vendor", "company"],
		order_by="employee_name",
		limit_page_length=0,
	)
	if not employees:
		return []

	punches = frappe.get_all(
		"Employee Checkin",
		filters={
			"employee": ["in", [e.employee for e in employees]],
			"time": ["between", [f"{date} 00:00:00", f"{date} 23:59:59"]],
		},
		fields=["employee", "time", "log_type"],
		order_by="time",
		limit_page_length=0,
	)
	by_emp = {}
	for p in punches:
		by_emp.setdefault(p.employee, []).append(f"{p.log_type} {get_datetime(p.time).strftime('%H:%M')}")

	for e in employees:
		e["existing"] = ", ".join(by_emp.get(e.employee, []))
	return employees


def _parse_time(value):
	value = (value or "").strip()
	if not value:
		return None
	for fmt in ("%H:%M", "%H:%M:%S"):
		try:
			return datetime.strptime(value, fmt).time()
		except ValueError:
			continue
	frappe.throw(_("Invalid time: {0}").format(value))


@frappe.whitelist(methods=["POST"])
def create_checkins(date, rows):
	"""rows: [{"employee": "...", "date": "YYYY-MM-DD", "in_time": "HH:MM", "out_time": "HH:MM"}].

	A row's own ``date`` wins; ``date`` (the page filter) is used when a row has none.
	Future dates are rejected.

	An OUT time earlier than or equal to the IN time is taken as next day (night shift).
	Punches that already exist for the employee are skipped.
	"""
	frappe.has_permission("Employee Checkin", "create", throw=True)
	if isinstance(rows, str):
		rows = json.loads(rows)
	date = getdate(date)

	vendor_of = {
		d.name: d.vendor
		for d in frappe.get_all(
			"Employee",
			filters={"name": ["in", [r.get("employee") for r in rows if r.get("employee")]]},
			fields=["name", "vendor"],
		)
	}

	created, skipped, errors = 0, 0, []

	for row in rows:
		emp = row.get("employee")
		if not emp:
			continue
		sp = f"checkin_{frappe.generate_hash(length=8)}"
		frappe.db.savepoint(sp)
		row_created, row_skipped = 0, 0
		try:
			if not vendor_of.get(emp):
				frappe.throw(_("Not a vendor employee"))
			frappe.has_permission("Employee", "read", doc=emp, throw=True)

			t_in, t_out = _parse_time(row.get("in_time")), _parse_time(row.get("out_time"))
			if not t_in and not t_out:
				continue
			row_date = getdate(row.get("date") or date)
			if row_date > getdate():
				frappe.throw(_("Future date {0} is not allowed").format(row_date))
			if t_out and not t_in:
				frappe.throw(_("OUT time given without IN time"))

			punches = [("IN", datetime.combine(row_date, t_in))]
			if t_out:
				out_dt = datetime.combine(row_date, t_out)
				if out_dt <= punches[0][1]:
					out_dt += timedelta(days=1)
				punches.append(("OUT", out_dt))

			for log_type, when in punches:
				if frappe.db.exists("Employee Checkin", {"employee": emp, "time": when, "log_type": log_type}):
					row_skipped += 1
					continue
				frappe.get_doc(
					{
						"doctype": "Employee Checkin",
						"employee": emp,
						"log_type": log_type,
						"time": when,
						"device_id": DEVICE_ID,
					}
				).insert()
				row_created += 1
			created += row_created
			skipped += row_skipped
		except Exception as e:
			frappe.db.rollback(save_point=sp)
			errors.append({"employee": emp, "error": frappe.utils.strip_html(str(e))})

	return {"created": created, "skipped": skipped, "errors": errors}
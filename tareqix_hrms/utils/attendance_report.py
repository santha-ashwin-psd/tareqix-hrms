"""Server-side support for the "Monthly Attendance Sheet" print format.

The print template runs in the browser and can only use what the report already
returned. The standard HRMS report returns no designation, nationality or civil ID,
so this module wraps ``frappe.desk.query_report.run`` and, for the Monthly Attendance
Sheet only, adds those values to every employee row as ``emp_designation``,
``emp_nationality`` and ``emp_civil_id``. The report's own columns are untouched.
"""

import frappe
from frappe.desk.query_report import run as core_run

TARGET_REPORT = "Monthly Attendance Sheet"

# First field that exists on Employee wins, so sites that already carry a custom
# field under a different name keep working.
NATIONALITY_FIELDS = ("nationality", "custom_nationality")
CIVIL_ID_FIELDS = ("civil_id", "custom_civil_id", "civil_id_number", "custom_civil_id_number")


@frappe.whitelist()
@frappe.read_only()
def run(report_name, filters=None, **kwargs):
	result = core_run(report_name=report_name, filters=filters, **kwargs)

	if isinstance(result, dict) and result.get("result") and _is_attendance_sheet(report_name):
		try:
			_add_employee_details(result["result"])
		except Exception:
			# printing extras must never break the report itself
			frappe.log_error(title="Attendance sheet: could not add employee details")

	return result


def _is_attendance_sheet(report_name) -> bool:
	if report_name == TARGET_REPORT:
		return True
	# Custom Reports built on top of the standard one
	return frappe.db.get_value("Report", report_name, "reference_report") == TARGET_REPORT


def _first_existing_field(meta, candidates):
	for fieldname in candidates:
		if meta.has_field(fieldname):
			return fieldname
	return None


def _add_employee_details(rows):
	# rows are dicts for this report; skip anything else (e.g. list rows)
	employees = {row["employee"] for row in rows if isinstance(row, dict) and row.get("employee")}
	if not employees:
		return

	meta = frappe.get_meta("Employee")
	nationality_field = _first_existing_field(meta, NATIONALITY_FIELDS)
	civil_id_field = _first_existing_field(meta, CIVIL_ID_FIELDS)

	fields = ["name", "designation"]
	if nationality_field:
		fields.append(nationality_field)
	if civil_id_field:
		fields.append(civil_id_field)

	details = {
		d.name: d
		for d in frappe.get_all("Employee", filters={"name": ["in", list(employees)]}, fields=fields)
	}

	for row in rows:
		if not isinstance(row, dict) or not row.get("employee"):
			continue
		emp = details.get(row["employee"])
		if not emp:
			continue
		row["emp_designation"] = emp.get("designation") or ""
		row["emp_nationality"] = (emp.get(nationality_field) if nationality_field else "") or ""
		row["emp_civil_id"] = (emp.get(civil_id_field) if civil_id_field else "") or ""
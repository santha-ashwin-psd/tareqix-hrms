
# import os
# from io import BytesIO
# from datetime import datetime, date, time

# import frappe
# from frappe import _
# from frappe.utils.file_manager import save_file
# from openpyxl import Workbook, load_workbook


# DOCTYPE = "Site TimeSheet"

# HEADERS = [
#     "Employee ID",
#     "Trade",
#     "Civil ID",
#     "Attendance",
#     "IN Time",
#     "OUT Time",
#     "Total Hrs",
#     "Break Hrs",
#     "Normal Hrs",
#     "Current Site",
#     "Date",
# ]

# ATTENDANCE_OPTIONS = [
#     "Present",
#     "Absent",
#     "Half Day",
#     "Sick",
#     "Leave",
# ]


# def _get_time(value, label):
#     if isinstance(value, datetime):
#         return value.strftime("%H:%M:%S")

#     if isinstance(value, time):
#         return value.strftime("%H:%M:%S")

#     if isinstance(value, str):
#         value = value.strip()

#         for fmt in ("%H:%M", "%H:%M:%S"):
#             try:
#                 return datetime.strptime(value, fmt).strftime("%H:%M:%S")
#             except ValueError:
#                 pass

#     frappe.throw(_("{0} must be a valid time (HH:MM).").format(label))


# def _get_date(value):
#     if isinstance(value, datetime):
#         return value.date().isoformat()

#     if isinstance(value, date):
#         return value.isoformat()

#     if isinstance(value, str):
#         for fmt in ("%Y-%m-%d", "%d-%m-%Y"):
#             try:
#                 return datetime.strptime(value.strip(), fmt).date().isoformat()
#             except ValueError:
#                 pass

#     frappe.throw(_("Date must be in YYYY-MM-DD format."))


# def _get_cell(row, index):
#     value = row[index] if index < len(row) else None

#     if isinstance(value, str):
#         value = value.strip()

#     return value


# def _create_linked_records(data):
#     # Create IN record first
#     in_doc = frappe.get_doc({
#         "doctype": DOCTYPE,
#         "custom_emp_name": data["employee"],
#         "custom_trade": data["trade"],
#         "custom_civil_id": data["civil_id"],
#         "custom_attendance": data["attendance"],
#         "custom_log_type": "IN",
#         "custom_in_time": data["in_time"],
#         "custom_date": data["date"],
#         "custom_total_hrs": data["total_hrs"],
#         "custom_break_hrs": data["break_hrs"],
#         "custom_normal_hrs": data["normal_hrs"],
#         "custom_current_site": data["current_site"],
#     })

#     in_doc.insert()

#     # Create OUT record and link it to IN
#     out_doc = frappe.get_doc({
#         "doctype": DOCTYPE,
#         "custom_emp_name": data["employee"],
#         "custom_trade": data["trade"],
#         "custom_civil_id": data["civil_id"],
#         "custom_attendance": data["attendance"],
#         "custom_log_type": "OUT",
#         "custom_out_time": data["out_time"],
#         "custom_date": data["date"],
#         "custom_total_hrs": data["total_hrs"],
#         "custom_break_hrs": data["break_hrs"],
#         "custom_normal_hrs": data["normal_hrs"],
#         "custom_current_site": data["current_site"],
#         "custom_inout_log_record_": in_doc.name,
#     })

#     out_doc.insert()

#     # Update IN record with OUT record ID
#     in_doc.custom_inout_log_record_ = out_doc.name
#     in_doc.save()

#     return {
#         "in_record": in_doc.name,
#         "out_record": out_doc.name,
#     }


# @frappe.whitelist()
# def download_sample_excel():
#     frappe.has_permission(DOCTYPE, "create", throw=True)

#     workbook = Workbook()
#     sheet = workbook.active
#     sheet.title = "Site TimeSheet Import"

#     sheet.append(HEADERS)

#     # Example row
#     sheet.append([
#         "HR-EMP-0001",
#         "Mason",
#         "123456",
#         "Present",
#         "08:00",
#         "17:00",
#         "9",
#         "1",
#         "8",
#         "Site A",
#         "2026-11-26",
#     ])

#     sheet.freeze_panes = "A2"
#     sheet.auto_filter.ref = sheet.dimensions

#     widths = [20, 18, 18, 18, 15, 15, 15, 15, 15, 22, 18]

#     for index, width in enumerate(widths, start=1):
#         sheet.column_dimensions[
#             sheet.cell(row=1, column=index).column_letter
#         ].width = width

#     output = BytesIO()
#     workbook.save(output)

#     file_doc = save_file(
#         "Site_TimeSheet_Import_Sample.xlsx",
#         output.getvalue(),
#         DOCTYPE,
#         None,
#         is_private=0,
#     )

#     return file_doc.file_url


# @frappe.whitelist()
# def import_site_timesheet_excel(file_url):
#     frappe.has_permission(DOCTYPE, "create", throw=True)

#     if not file_url:
#         frappe.throw(_("Please attach an Excel file."))

#     if not file_url.lower().endswith(".xlsx"):
#         frappe.throw(_("Only .xlsx Excel files are accepted."))

#     file_record = frappe.db.get_value(
#         "File",
#         {"file_url": file_url},
#         ["name", "file_name"],
#         as_dict=True,
#     )

#     if not file_record:
#         frappe.throw(_("Uploaded file was not found."))

#     file_doc = frappe.get_doc("File", file_record.name)

#     file_path = file_doc.get_full_path()

#     if not os.path.isfile(file_path):
#         frappe.throw(_("Cannot access the uploaded Excel file."))

#     if os.path.getsize(file_path) > 10 * 1024 * 1024:
#         frappe.throw(_("Excel file must be smaller than 10 MB."))

#     try:
#         workbook = load_workbook(
#             file_path,
#             read_only=True,
#             data_only=True,
#         )
#     except Exception:
#         frappe.throw(_("Unable to read the Excel file."))

#     if len(workbook.sheetnames) != 1:
#         workbook.close()
#         frappe.throw(_("The Excel file must contain exactly one worksheet."))

#     sheet = workbook.active

#     if sheet.title != "Site TimeSheet Import":
#         workbook.close()
#         frappe.throw(_("Worksheet name must be Site TimeSheet Import."))

#     actual_headers = [
#         cell.value for cell in next(sheet.iter_rows(min_row=1, max_row=1))
#     ]

#     if actual_headers != HEADERS:
#         workbook.close()
#         frappe.throw(
#             _("Excel format is incorrect. Please download and use our sample Excel file.")
#         )

#     created = []
#     errors = []

#     try:
#         for row_number, row in enumerate(
#             sheet.iter_rows(min_row=2, values_only=True),
#             start=2,
#         ):
#             if not any(value is not None and str(value).strip() for value in row):
#                 continue

#             savepoint = "timesheet_row_{0}".format(row_number)
#             frappe.db.savepoint(savepoint)

#             try:
#                 employee = _get_cell(row, 0)
#                 trade = _get_cell(row, 1)
#                 civil_id = _get_cell(row, 2)
#                 attendance = _get_cell(row, 3)
#                 in_time = _get_cell(row, 4)
#                 out_time = _get_cell(row, 5)
#                 total_hrs = _get_cell(row, 6)
#                 break_hrs = _get_cell(row, 7)
#                 normal_hrs = _get_cell(row, 8)
#                 current_site = _get_cell(row, 9)
#                 date_value = _get_cell(row, 10)

#                 if not employee:
#                     frappe.throw(_("Employee ID is required."))

#                 if not frappe.db.exists("Employee", employee):
#                     frappe.throw(
#                         _("Employee {0} does not exist.").format(employee)
#                     )

#                 if attendance not in ATTENDANCE_OPTIONS:
#                     frappe.throw(
#                         _("Invalid Attendance: {0}").format(attendance)
#                     )

#                 if not in_time or not out_time:
#                     frappe.throw(_("Both IN Time and OUT Time are required."))

#                 data = {
#                     "employee": employee,
#                     "trade": trade or None,
#                     "civil_id": civil_id or None,
#                     "attendance": attendance,
#                     "in_time": _get_time(in_time, "IN Time"),
#                     "out_time": _get_time(out_time, "OUT Time"),
#                     "total_hrs": str(total_hrs) if total_hrs is not None else None,
#                     "break_hrs": str(break_hrs) if break_hrs is not None else None,
#                     "normal_hrs": str(normal_hrs) if normal_hrs is not None else None,
#                     "current_site": current_site or None,
#                     "date": _get_date(date_value),
#                 }

#                 records = _create_linked_records(data)

#                 created.append({
#                     "row": row_number,
#                     "employee": employee,
#                     **records,
#                 })

#             except Exception as error:
#                 frappe.db.rollback(save_point=savepoint)

#                 errors.append({
#                     "row": row_number,
#                     "error": str(error),
#                 })

#     finally:
#         workbook.close()

#     return {
#         "success": True,
#         "total_rows": len(created) + len(errors),
#         "created_rows": len(created),
#         "created_records": len(created) * 2,
#         "failed_rows": len(errors),
#         "created": created,
#         "errors": errors,
#     }























import os
from io import BytesIO
from datetime import datetime, date, time

import frappe
from frappe import _
from frappe.utils.file_manager import save_file
from openpyxl import Workbook, load_workbook


DOCTYPE = "Site TimeSheet"

HEADERS = [
    "Employee ID",
    "Employee Name",
    "Trade",
    "Civil ID",
    "Grade",
    "Attendance",
    "IN Time",
    "OUT Time",
    "OT Day Hrs",
    "Total Hrs",
    "Break Hrs",
    "Normal Hrs",
    "Rest Hrs",
    "OT Night Hrs",
    "Current Site",
    "Date",
]

ATTENDANCE_OPTIONS = [
    "Present",
    "Absent",
    "Half Day",
    "Sick",
    "Leave",
]


def _get_time(value, label):
    if isinstance(value, datetime):
        return value.strftime("%H:%M:%S")

    if isinstance(value, time):
        return value.strftime("%H:%M:%S")

    if isinstance(value, str):
        value = value.strip()

        for fmt in ("%H:%M", "%H:%M:%S"):
            try:
                return datetime.strptime(value, fmt).strftime("%H:%M:%S")
            except ValueError:
                pass

    frappe.throw(_("{0} must be a valid time (HH:MM).").format(label))


def _get_date(value):
    if isinstance(value, datetime):
        return value.date().isoformat()

    if isinstance(value, date):
        return value.isoformat()

    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%d-%m-%Y"):
            try:
                return datetime.strptime(
                    value.strip(), fmt
                ).date().isoformat()
            except ValueError:
                pass

    frappe.throw(_("Date must be in YYYY-MM-DD format."))


def _get_cell(row, index):
    value = row[index] if index < len(row) else None

    if isinstance(value, str):
        value = value.strip()

    return value


def _get_employee_details(employee):
    employee_data = frappe.db.get_value(
        "Employee",
        employee,
        [
            "employee_name",
            "designation",
            "civil_id",
        ],
        as_dict=True,
    )

    if not employee_data:
        frappe.throw(
            _("Employee {0} does not exist.").format(employee)
        )

    # Find the Employee Grade field dynamically.
    employee_meta = frappe.get_meta("Employee")

    grade_field = None

    # Prefer custom_grade if it exists.
    for field in employee_meta.fields:
        if field.fieldname == "custom_grade":
            grade_field = field.fieldname
            break

    # Otherwise find a field whose label is Grade.
    if not grade_field:
        for field in employee_meta.fields:
            if field.label and field.label.strip().lower() == "grade":
                grade_field = field.fieldname
                break

    grade = None

    if grade_field:
        grade = frappe.db.get_value(
            "Employee",
            employee,
            grade_field,
        )

    return {
        "employee_name": employee_data.employee_name,
        "trade": employee_data.designation,
        "civil_id": employee_data.civil_id,
        "grade": grade,
    }


def _get_project(current_site):
    if not current_site:
        frappe.throw(_("Current Site is required."))

    # First match using Project Name.
    project = frappe.db.get_value(
        "Project",
        {"project_name": current_site},
        ["name", "project_name"],
        as_dict=True,
    )

    # If not found, try matching the Project ID.
    if not project:
        project = frappe.db.get_value(
            "Project",
            current_site,
            ["name", "project_name"],
            as_dict=True,
        )

    if not project:
        frappe.throw(
            _("No Project found matching Current Site: {0}").format(
                current_site
            )
        )

    return project


def _create_linked_records(data):

    # Create IN record.
    # Only Log Type and IN Time are populated initially.
    in_doc = frappe.get_doc({
        "doctype": DOCTYPE,
        "custom_log_type": "IN",
        "custom_in_time": data["in_time"],
    })

    in_doc.insert()

    # Create OUT record with all remaining information.
    out_doc = frappe.get_doc({
        "doctype": DOCTYPE,

        "custom_emp_name": data["employee"],
        "custom_employee_name_": data["employee_name"],
        "custom_trade": data["trade"],
        "custom_civil_id": data["civil_id"],
        "custom_grade": data["grade"],

        "custom_attendance": data["attendance"],
        "custom_date": data["date"],
        "custom_current_site": data["current_site"],

        "custom_log_type": "OUT",
        "custom_out_time": data["out_time"],

        "custom_ot_day_hrs": data["ot_day_hrs"],
        "custom_total_hrs": data["total_hrs"],
        "custom_break_hrs": data["break_hrs"],
        "custom_normal_hrs": data["normal_hrs"],
        "custom_rest_hrs": data["rest_hrs"],
        "custom_ot_night_hrs": data["ot_night_hrs"],

        "custom_inout_log_record_": in_doc.name,
    })

    out_doc.insert()

    # Link the IN record back to the OUT record.
    in_doc.custom_inout_log_record_ = out_doc.name
    in_doc.save()

    return {
        "in_record": in_doc.name,
        "out_record": out_doc.name,
    }


@frappe.whitelist()
def download_sample_excel():
    frappe.has_permission(DOCTYPE, "create", throw=True)

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Site TimeSheet Import"

    sheet.append(HEADERS)

    # Example row.
    sheet.append([
        "HR-EMP-0001",
        "Employee Name (Auto Fetch)",
        "Mason (Auto Fetch)",
        "123456 (Auto Fetch)",
        "Grade (Auto Fetch)",
        "Present",
        "08:00",
        "17:00",
        "01:00",
        "09:00",
        "01:00",
        "08:00",
        "00:00",
        "00:00",
        "Site A",
        "2026-11-26",
    ])

    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = sheet.dimensions

    widths = [
        20, 25, 20, 18, 18, 18, 15, 15,
        15, 15, 15, 15, 15, 15, 25, 18
    ]

    for index, width in enumerate(widths, start=1):
        sheet.column_dimensions[
            sheet.cell(row=1, column=index).column_letter
        ].width = width

    output = BytesIO()
    workbook.save(output)

    file_doc = save_file(
        "Site_TimeSheet_Import_Sample.xlsx",
        output.getvalue(),
        DOCTYPE,
        None,
        is_private=0,
    )

    return file_doc.file_url


@frappe.whitelist()
def import_site_timesheet_excel(file_url):
    frappe.has_permission(DOCTYPE, "create", throw=True)

    if not file_url:
        frappe.throw(_("Please attach an Excel file."))

    if not file_url.lower().endswith(".xlsx"):
        frappe.throw(_("Only .xlsx Excel files are accepted."))

    file_record = frappe.db.get_value(
        "File",
        {"file_url": file_url},
        ["name", "file_name"],
        as_dict=True,
    )

    if not file_record:
        frappe.throw(_("Uploaded file was not found."))

    file_doc = frappe.get_doc("File", file_record.name)

    file_path = file_doc.get_full_path()

    if not os.path.isfile(file_path):
        frappe.throw(_("Cannot access the uploaded Excel file."))

    if os.path.getsize(file_path) > 10 * 1024 * 1024:
        frappe.throw(_("Excel file must be smaller than 10 MB."))

    try:
        workbook = load_workbook(
            file_path,
            read_only=True,
            data_only=True,
        )
    except Exception:
        frappe.throw(_("Unable to read the Excel file."))

    if len(workbook.sheetnames) != 1:
        workbook.close()
        frappe.throw(
            _("The Excel file must contain exactly one worksheet.")
        )

    sheet = workbook.active

    if sheet.title != "Site TimeSheet Import":
        workbook.close()
        frappe.throw(
            _("Worksheet name must be Site TimeSheet Import.")
        )

    actual_headers = [
        cell.value
        for cell in next(sheet.iter_rows(min_row=1, max_row=1))
    ]

    if actual_headers != HEADERS:
        workbook.close()
        frappe.throw(
            _("Excel format is incorrect. Please download and use our sample Excel file.")
        )

    created = []
    errors = []

    try:
        for row_number, row in enumerate(
            sheet.iter_rows(min_row=2, values_only=True),
            start=2,
        ):
            if not any(
                value is not None and str(value).strip()
                for value in row
            ):
                continue

            savepoint = "timesheet_row_{0}".format(row_number)
            frappe.db.savepoint(savepoint)

            try:
                employee = _get_cell(row, 0)

                # These Excel columns are informational only.
                # Employee details are fetched from Employee.
                excel_employee_name = _get_cell(row, 1)
                excel_trade = _get_cell(row, 2)
                excel_civil_id = _get_cell(row, 3)
                excel_grade = _get_cell(row, 4)

                attendance = _get_cell(row, 5)
                in_time = _get_cell(row, 6)
                out_time = _get_cell(row, 7)
                ot_day_hrs = _get_cell(row, 8)
                total_hrs = _get_cell(row, 9)
                break_hrs = _get_cell(row, 10)
                normal_hrs = _get_cell(row, 11)
                rest_hrs = _get_cell(row, 12)
                ot_night_hrs = _get_cell(row, 13)
                current_site = _get_cell(row, 14)
                date_value = _get_cell(row, 15)

                if not employee:
                    frappe.throw(_("Employee ID is required."))

                if not frappe.db.exists("Employee", employee):
                    frappe.throw(
                        _("Employee {0} does not exist.").format(
                            employee
                        )
                    )

                if not attendance:
                    frappe.throw(_("Attendance is required."))

                if attendance not in ATTENDANCE_OPTIONS:
                    frappe.throw(
                        _("Invalid Attendance: {0}").format(
                            attendance
                        )
                    )

                if not in_time or not out_time:
                    frappe.throw(
                        _("Both IN Time and OUT Time are required.")
                    )

                if not current_site:
                    frappe.throw(_("Current Site is required."))

                # Fetch Employee details automatically.
                employee_details = _get_employee_details(employee)

                # Validate Current Site against Project.
                project = _get_project(current_site)

                data = {
                    "employee": employee,

                    "employee_name": employee_details["employee_name"],
                    "trade": employee_details["trade"],
                    "civil_id": employee_details["civil_id"],
                    "grade": employee_details["grade"],

                    "attendance": attendance,

                    "in_time": _get_time(
                        in_time, "IN Time"
                    ),

                    "out_time": _get_time(
                        out_time, "OUT Time"
                    ),

                    "ot_day_hrs": (
                        _get_time(ot_day_hrs, "OT Day Hrs")
                        if ot_day_hrs else None
                    ),

                    "total_hrs": (
                        str(total_hrs)
                        if total_hrs is not None else None
                    ),

                    "break_hrs": (
                        str(break_hrs)
                        if break_hrs is not None else None
                    ),

                    "normal_hrs": (
                        str(normal_hrs)
                        if normal_hrs is not None else None
                    ),

                    "rest_hrs": (
                        _get_time(rest_hrs, "Rest Hrs")
                        if rest_hrs else None
                    ),

                    "ot_night_hrs": (
                        _get_time(ot_night_hrs, "OT Night Hrs")
                        if ot_night_hrs else None
                    ),

                    # Store Project Name in the Data field.
                    "current_site": (
                        project.project_name or project.name
                    ),

                    "date": _get_date(date_value),
                }

                records = _create_linked_records(data)

                created.append({
                    "row": row_number,
                    "employee": employee,
                    **records,
                })

            except Exception as error:
                frappe.db.rollback(save_point=savepoint)

                errors.append({
                    "row": row_number,
                    "error": str(error),
                })

    finally:
        workbook.close()

    return {
        "success": True,
        "total_rows": len(created) + len(errors),
        "created_rows": len(created),
        "created_records": len(created) * 2,
        "failed_rows": len(errors),
        "created": created,
        "errors": errors,
    }

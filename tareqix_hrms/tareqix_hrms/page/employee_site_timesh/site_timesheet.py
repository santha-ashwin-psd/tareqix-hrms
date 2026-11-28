"""
Site timesheets page - BACKEND (employee_site_timesh.py)

Place at:
apps/tareqix_hrms/tareqix_hrms/tareqix_hrms/page/employee_site_timesh/employee_site_timesh.py

The JS only renders the UI and calls these methods. Everything else
(data loading, shift maths, validation, record creation) happens here.

SECTIONS (numbers mirror the JS sections they serve)
  0  CONFIG                 doctype / field names
  A  HELPERS                time + number utilities
  7  get_sites              Site dropdown
  8  get_standard_shift     Supplier standard shift for a Site
  9  get_site_employees     Employees of a Site + normal hours
  10 get_shift_map          Normal hours per employee for a date
  17 get_deployment_shifts  Apply Standard Shift (IN / OUT per employee)
  20 submit_timesheet       Create IN / OUT Site TimeSheet records
"""

import json
from datetime import datetime, timedelta
from datetime import time as dtime


import frappe
from frappe import _
from frappe.utils import flt, getdate, nowdate


# =====================================================
# SECTION 0: CONFIG  (change field names only here)
# =====================================================

# Deployments
DEPLOYMENT_DT = "Deployments"
DEP_SITE = "custom_site"
DEP_EMPLOYEE = "custom_employee_id"
DEP_VENDOR = "custom_vendor"
DEP_IN = "custom_shift_in_time"
DEP_OUT = "custom_shift_out_time"

# Supplier standard shift
SUPPLIER_IN = "custom_shift_in_time"
SUPPLIER_OUT = "custom_shift_out_time"

# Employee
EMPLOYEE_FIELDS = ["name", "employee_name", "status", "designation", "civil_id"]
EMPLOYEE_STATUS = "Active"

# Site TimeSheet
TIMESHEET_DT = "Site TimeSheet"


# =====================================================
# SECTION A: HELPERS
# =====================================================

def _to_hhmm(value):
    """timedelta / time / 'H:M[:S]' -> 'HH:MM' ('' when empty or invalid)."""
    if value is None or value == "":
        return ""

    if isinstance(value, timedelta):
        secs = int(value.total_seconds()) % 86400
        return f"{secs // 3600:02d}:{(secs % 3600) // 60:02d}"

    if isinstance(value, (dtime, datetime)):
        return f"{value.hour:02d}:{value.minute:02d}"

    parts = str(value).strip().split(":")
    if len(parts) < 2:
        return ""

    try:
        return f"{int(parts[0]):02d}:{int(parts[1]):02d}"
    except ValueError:
        return ""


def _to_minutes(hhmm):
    hhmm = _to_hhmm(hhmm)
    if not hhmm:
        return None
    hours, minutes = hhmm.split(":")
    return int(hours) * 60 + int(minutes)


def _span_hours(start, end):
    """Hours between two HH:MM values (supports overnight)."""
    s, e = _to_minutes(start), _to_minutes(end)
    if s is None or e is None:
        return 0
    minutes = e - s
    if minutes < 0:
        minutes += 1440
    return minutes / 60


# def _calc_total(in_time, out_time, break_time):
#     """Total working hours = (OUT - IN) - BREAK, overnight aware."""
#     s, e = _to_minutes(in_time), _to_minutes(out_time)
#     if s is None or e is None:
#         return 0
#     minutes = e - s
#     if minutes < 0:
#         minutes += 1440
#     break_minutes = _to_minutes(break_time) or 0
#     return max(0, (minutes - break_minutes) / 60)







def _calc_total(in_date, in_time, out_date, out_time, break_time):
    """
    Calculate total hours using actual IN and OUT dates.
    Supports multi-day attendance and overnight shifts.
    """

    if not in_date or not in_time or not out_date or not out_time:
        return 0

    try:
        start_datetime = datetime.combine(
            getdate(in_date),
            datetime.strptime(_to_hhmm(in_time), "%H:%M").time()
        )

        end_datetime = datetime.combine(
            getdate(out_date),
            datetime.strptime(_to_hhmm(out_time), "%H:%M").time()
        )

        total_minutes = (
            end_datetime - start_datetime
        ).total_seconds() / 60

        break_minutes = _to_minutes(break_time) or 0

        return max(0, (total_minutes - break_minutes) / 60)

    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            "Site TimeSheet Total Hours Calculation"
        )
        raise













def _fmt(value):
    """Same as the JS format_hours(): 2 decimals, drop trailing .00"""
    text = f"{flt(value):.2f}"
    return text[:-3] if text.endswith(".00") else text


def _json_list(value):
    """Accept a JSON string or a list; return unique, non-empty values."""
    if isinstance(value, str):
        value = json.loads(value or "[]")
    return list(dict.fromkeys(v for v in (value or []) if v))


def _build_shift_map(employee_ids, date=None):
    """
    {employee: normal shift hours} from the Shift Assignment active on `date`
    (docstatus 1, start_date <= date, end_date empty or >= date).
    If an employee has several, the latest start_date wins.
    """
    employee_ids = _json_list(employee_ids)

    if not employee_ids:
        return {}

    date = str(getdate(date or nowdate()))

    assignments = frappe.get_list(
        "Shift Assignment",
        filters={
            "employee": ["in", employee_ids],
            "docstatus": 1,
            "start_date": ["<=", date],
        },
        or_filters=[
            ["end_date", "is", "not set"],
            ["end_date", ">=", date],
        ],
        fields=["employee", "shift_type"],
        order_by="start_date asc, creation asc",
        limit_page_length=0,
    )

    if not assignments:
        return {}

    shift_names = list({a.shift_type for a in assignments if a.shift_type})

    shift_hours = {}

    if shift_names:
        shift_types = frappe.get_list(
            "Shift Type",
            filters={"name": ["in", shift_names]},
            fields=["name", "start_time", "end_time"],
            limit_page_length=0,
        )

        for st in shift_types:
            shift_hours[st.name] = _span_hours(
                _to_hhmm(st.start_time), _to_hhmm(st.end_time)
            )

    shift_map = {}

    for a in assignments:  # ascending start_date, so the latest overwrites
        shift_map[a.employee] = shift_hours.get(a.shift_type, 0)

    return shift_map


# =====================================================
# SECTION 7: LOAD UNIQUE SITE LIST
# =====================================================

@frappe.whitelist()
def get_sites():
    rows = frappe.get_list(
        DEPLOYMENT_DT,
        filters={DEP_SITE: ["is", "set"]},
        fields=[DEP_SITE],
        group_by=DEP_SITE,
        order_by=f"{DEP_SITE} asc",
        limit_page_length=0,
    )

    return [r.get(DEP_SITE) for r in rows if (r.get(DEP_SITE) or "").strip()]


# =====================================================
# SECTION 8: SUPPLIER STANDARD SHIFT FOR A SITE
# =====================================================

@frappe.whitelist()
def get_standard_shift(site=None):
    if not site:
        return {}

    rows = frappe.get_list(
        DEPLOYMENT_DT,
        filters={DEP_SITE: site, DEP_VENDOR: ["is", "set"]},
        fields=[DEP_VENDOR],
        order_by="modified desc",
        limit_page_length=0,
    )

    suppliers = list(dict.fromkeys(r.get(DEP_VENDOR) for r in rows))

    if not suppliers:
        return {}

    # Assumption (same as before): one standard Supplier per Site.
    if len(suppliers) > 1:
        frappe.logger("site_timesheet").warning(
            f"Multiple suppliers found for site {site}: {suppliers}"
        )

    supplier = suppliers[0]

    data = frappe.get_list(
        "Supplier",
        filters={"name": supplier},
        fields=[SUPPLIER_IN, SUPPLIER_OUT],
        limit_page_length=1,
    )

    data = data[0] if data else {}

    return {
        "supplier": supplier,
        "in_time": _to_hhmm(data.get(SUPPLIER_IN)),
        "out_time": _to_hhmm(data.get(SUPPLIER_OUT)),
    }


# =====================================================
# SECTION 9: EMPLOYEES OF A SITE + NORMAL SHIFT HOURS
# One call returns {employees, shift_map}.
# No Site selected -> all Active employees (as before).
# =====================================================

@frappe.whitelist()
def get_site_employees(site=None, date=None):
    filters = {"status": EMPLOYEE_STATUS}

    if site:
        rows = frappe.get_list(
            DEPLOYMENT_DT,
            filters={DEP_SITE: site, DEP_EMPLOYEE: ["is", "set"]},
            fields=[DEP_EMPLOYEE],
            group_by=DEP_EMPLOYEE,
            limit_page_length=0,
        )

        employee_ids = [r.get(DEP_EMPLOYEE) for r in rows]

        if not employee_ids:
            return {"employees": [], "shift_map": {}}

        filters["name"] = ["in", employee_ids]

    employees = frappe.get_list(
        "Employee",
        filters=filters,
        fields=EMPLOYEE_FIELDS,
        order_by="employee_name asc",
        limit_page_length=0,
    )

    return {
        "employees": employees,
        "shift_map": _build_shift_map([e.name for e in employees], date),
    }


# =====================================================
# SECTION 10: SHIFT MAP FOR A DATE (Date change)
# =====================================================

@frappe.whitelist()
def get_shift_map(date=None, employee_ids=None):
    return _build_shift_map(employee_ids, date)


# =====================================================
# SECTION 17: APPLY STANDARD SHIFT (from Deployments)
# Matches Employee + Site. Returns:
#   shifts  : {employee: {in_time, out_time}}
#   missing : [employee, ...] with no deployment or no times
# =====================================================

@frappe.whitelist()
def get_deployment_shifts(site=None, employee_ids=None):
    employee_ids = _json_list(employee_ids)

    if not site or not employee_ids:
        return {"shifts": {}, "missing": []}

    rows = frappe.get_list(
        DEPLOYMENT_DT,
        filters={DEP_SITE: site, DEP_EMPLOYEE: ["in", employee_ids]},
        fields=["name", DEP_EMPLOYEE, DEP_IN, DEP_OUT],
        order_by="modified desc",
        limit_page_length=0,
    )

    first_match = {}

    for r in rows:  # newest deployment per employee decides
        first_match.setdefault(r.get(DEP_EMPLOYEE), r)

    shifts, missing = {}, []

    for employee in employee_ids:
        deployment = first_match.get(employee)

        in_time = _to_hhmm(deployment.get(DEP_IN)) if deployment else ""
        out_time = _to_hhmm(deployment.get(DEP_OUT)) if deployment else ""

        if in_time and out_time:
            shifts[employee] = {"in_time": in_time, "out_time": out_time}
        else:
            missing.append(employee)

    return {"shifts": shifts, "missing": missing}






# =====================================================
# NEW API: GET PENDING IN RECORDS
# Gets the latest unmatched IN record for each employee.
# No date restriction (supports overnight shifts).
# =====================================================

@frappe.whitelist()
def get_pending_in_records(employee_ids=None):

    employee_ids = _json_list(employee_ids)

    if not employee_ids:
        return {}

    records = frappe.get_list(
        TIMESHEET_DT,
        filters={
            "custom_emp_name": ["in", employee_ids],
            "custom_log_type": "IN",
            "custom_inout_log_record_": ["is", "not set"],
        },
        fields=[
            "name",
            "custom_emp_name",
            "custom_date",
            "custom_in_time",
        ],
        order_by="custom_date desc, creation desc",
        limit_page_length=0,
    )

    pending = {}

    for record in records:
        employee = record.get("custom_emp_name")

        # Keep only the latest unmatched IN record.
        if employee and employee not in pending:
            pending[employee] = {
                "name": record.get("name"),
                "date": str(record.get("custom_date") or ""),
                "in_time": _to_hhmm(record.get("custom_in_time")),
            }

    return pending



# =====================================================
# SECTION 20: SUBMIT TIME SHEET
# Creates a separate IN and OUT "Site TimeSheet" per row.
# Total / Normal hours are calculated here, not trusted
# from the browser. Each employee is saved atomically:
# if the OUT record fails, the IN record is rolled back.
# =====================================================

# @frappe.whitelist(methods=["POST"])
# def submit_timesheet(site=None, date=None, rows=None):
#     if not site:
#         frappe.throw(_("Site is required"))

#     if not date:
#         frappe.throw(_("Date is required"))

#     if isinstance(rows, str):
#         rows = json.loads(rows or "[]")

#     rows = rows or []

#     shift_map = _build_shift_map(
#         [r.get("employee") for r in rows], date
#     )

#     created = 0
#     errors = []

#     for index, row in enumerate(rows, start=1):

#         employee = (row.get("employee") or "").strip()

#         if not employee:
#             errors.append(f"Row {index}: Employee is not selected.")
#             continue

#         in_time = _to_hhmm(row.get("in_time")) or None
#         out_time = _to_hhmm(row.get("out_time")) or None
        
        
        
        
#         # Check whether this row is completing an existing IN record.
#         pending_in_record = (
#             row.get("pending_in_record") or ""
#         ).strip()

#         pending_in_doc = None

#         if pending_in_record:

#             try:
#                 pending_in_doc = frappe.get_doc(
#                     TIMESHEET_DT,
#                     pending_in_record
#                 )

#                 if pending_in_doc.custom_emp_name != employee:
#                     errors.append(
#                         f"{employee}: IN record does not belong to this employee."
#                     )
#                     continue

#                 if pending_in_doc.custom_log_type != "IN":
#                     errors.append(
#                         f"{employee}: Selected record is not an IN record."
#                     )
#                     continue

#                 if pending_in_doc.custom_inout_log_record_:
#                     errors.append(
#                         f"{employee}: This IN record has already been completed."
#                     )
#                     continue

#                 # Always use the original IN time from the database.
#                 in_time = _to_hhmm(
#                     pending_in_doc.custom_in_time
#                 ) or None

#                 if not out_time:
#                     errors.append(
#                         f"{employee}: Please enter OUT time."
#                     )
#                     continue

#             except frappe.DoesNotExistError:
#                 errors.append(
#                     f"{employee}: Pending IN record no longer exists."
#                 )
#                 continue


#         if not in_time and not out_time:
#             errors.append(f"{employee}: Please enter IN or OUT time.")
#             continue

#         trade = (row.get("trade") or "").strip()
#         civil_id = (row.get("civil_id") or "").strip()

#         common = {
#             "doctype": TIMESHEET_DT,
#             "custom_date": date,
#             "custom_emp_name": employee,
#             "custom_trade": "" if trade == "-" else trade,
#             "custom_civil_id": "" if civil_id == "-" else civil_id,
#             "custom_attendance": row.get("attendance"),
#             "custom_current_site": site,
#         }

#         break_time = _to_hhmm(row.get("break_time")) or None

#         # total = _calc_total(in_time, out_time, break_time)
#         # normal = shift_map.get(employee, 0)
        
#        # =====================================================
#        # CALCULATE ACTUAL IN / OUT DATE AND TIME 
#        # =====================================================

#         if pending_in_doc:
#     # Use original IN record date and time
#          actual_in_date = pending_in_doc.custom_date
#          actual_in_time = pending_in_doc.custom_in_time

#         else:
#     # New IN record submitted on the selected date
#          actual_in_date = date
#          actual_in_time = in_time

# # OUT always uses the currently selected date
#         actual_out_date = date
#         actual_out_time = out_time


# # =====================================================
# # CALCULATE TOTAL WORKING HOURS
# # =====================================================

#         total = _calc_total(
#         actual_in_date,
#         actual_in_time,
#         actual_out_date,
#         actual_out_time,
#         break_time
#       )

#         normal = shift_map.get(employee, 0)
        
             

#         savepoint = f"est_{index}"
#         frappe.db.savepoint(savepoint)

#         row_created = 0

#         # try:

#         #     if in_time:
#         #         frappe.get_doc({
#         #             **common,
#         #             "custom_log_type": "IN",
#         #             "custom_in_time": in_time,
#         #             "custom_out_time": None,
#         #             "custom_total_hrs": 0,
#         #             "custom_rest_hrs": None,
#         #             "custom_normal_hrs": 0,
#         #         }).insert()

#         #         row_created += 1

#         #     if out_time:
#         #         frappe.get_doc({
#         #             **common,
#         #             "custom_log_type": "OUT",
#         #             "custom_in_time": None,
#         #             "custom_out_time": out_time,
#         #             "custom_total_hrs": _fmt(total),
#         #             "custom_rest_hrs": break_time,
#         #             "custom_ot_day_hrs": _to_hhmm(row.get("ot_day")) or None,
#         #             "custom_ot_night_hrs": _to_hhmm(row.get("ot_night")) or None,
#         #             "custom_normal_hrs": _fmt(normal),
#         #         }).insert()

#         #         row_created += 1

#         #     created += row_created
        
        
        
        
        
#         try:
#             in_doc = pending_in_doc
#             out_doc = None
            
            
#             if in_time and not pending_in_record:

#             # if in_time:
#                 in_doc = frappe.get_doc({
#                     **common,
#                     "custom_log_type": "IN",
#                     "custom_in_time": in_time,
#                     "custom_out_time": None,
#                     "custom_total_hrs": 0,
#                     "custom_rest_hrs": None,
#                     "custom_normal_hrs": 0,
#                 }).insert()

#                 row_created += 1
                
                
                
                
                
                
                
#                             # Recheck pending IN record before creating OUT
#             if pending_in_record:
#                 pending_in_doc.reload()

#                 if pending_in_doc.custom_inout_log_record_:
#                     frappe.throw(
#                         _("This IN record has already been completed.")
#                     )

#             # Create OUT record
#             if out_time:
#                 out_doc = frappe.get_doc({
#                     **common,
#                     "custom_log_type": "OUT",
#                     "custom_in_time": None,
#                     "custom_out_time": out_time,
#                     "custom_total_hrs": _fmt(total),
#                     "custom_rest_hrs": break_time,
#                     "custom_ot_day_hrs": _to_hhmm(row.get("ot_day")) or None,
#                     "custom_ot_night_hrs": _to_hhmm(row.get("ot_night")) or None,
#                     "custom_normal_hrs": _fmt(normal),
#                 }).insert()

#                 row_created += 1
                
                
                

#             # if out_time:
#             #     out_doc = frappe.get_doc({
#             #         **common,
#             #         "custom_log_type": "OUT",
#             #         "custom_in_time": None,
#             #         "custom_out_time": out_time,
#             #         "custom_total_hrs": _fmt(total),
#             #         "custom_rest_hrs": break_time,
#             #         "custom_ot_day_hrs": _to_hhmm(row.get("ot_day")) or None,
#             #         "custom_ot_night_hrs": _to_hhmm(row.get("ot_night")) or None,
#             #         "custom_normal_hrs": _fmt(normal),
#             #     }).insert()

#             #     row_created += 1

#             # Link IN and OUT records to each other
#             if in_doc and out_doc:
#                 in_doc.db_set(
#                     "custom_inout_log_record_",
#                     out_doc.name,
#                     update_modified=False
#                 )

#                 out_doc.db_set(
#                     "custom_inout_log_record_",
#                     in_doc.name,
#                     update_modified=False
#                 )

#             created += row_created


#         except Exception as e:

#             frappe.db.rollback(save_point=savepoint)
#             frappe.clear_messages()

#             # Whole employee rolled back, so nothing is added to `created`.

#             frappe.log_error(
#                 title=f"Site TimeSheet submit failed: {employee}",
#                 message=frappe.get_traceback(),
#             )

#             errors.append(f"{employee}: {str(e) or 'Unknown error'}")

#     return {"created": created, "errors": errors}
















@frappe.whitelist(methods=["POST"])
def submit_timesheet(site=None, date=None, rows=None):
    if not site:
        frappe.throw(_("Site is required"))

    if not date:
        frappe.throw(_("Date is required"))

    if isinstance(rows, str):
        rows = json.loads(rows or "[]")

    rows = rows or []

    shift_map = _build_shift_map(
        [r.get("employee") for r in rows], date
    )

    created = 0
    errors = []

    for index, row in enumerate(rows, start=1):

        employee = (row.get("employee") or "").strip()

        if not employee:
            errors.append(f"Row {index}: Employee is not selected.")
            continue

        in_time = _to_hhmm(row.get("in_time")) or None
        out_time = _to_hhmm(row.get("out_time")) or None

        # Both IN and OUT submitted together:
        # Allow creation of a new IN + OUT pair.
        both_in_out = bool(in_time and out_time)

        pending_in_record = (
            row.get("pending_in_record") or ""
        ).strip()

        pending_in_doc = None

        # Do not use an older pending IN when both times
        # are submitted together.
        if both_in_out:
            pending_in_record = ""

        # =====================================================
        # FIND / VALIDATE INCOMPLETE IN RECORD
        # =====================================================

        if out_time and not in_time:

            # If the frontend supplied a pending IN record,
            # validate that record.
            if pending_in_record:
                try:
                    pending_in_doc = frappe.get_doc(
                        TIMESHEET_DT,
                        pending_in_record
                    )

                except frappe.DoesNotExistError:
                    errors.append(
                        f"{employee}: Pending IN record no longer exists."
                    )
                    continue

            else:
                # Automatically find an incomplete IN record
                # for this employee.
                pending_rows = frappe.get_all(
                    TIMESHEET_DT,
                    filters={
                        "custom_emp_name": employee,
                        "custom_log_type": "IN",
                        "custom_inout_log_record_": ["is", "not set"],
                    },
                    fields=["name"],
                    order_by="custom_date desc, creation desc",
                    limit_page_length=1,
                )

                if not pending_rows:
                    errors.append(
                        f"{employee}: There is no IN record. "
                        "Please create an IN record first."
                    )
                    continue

                pending_in_record = pending_rows[0].name

                pending_in_doc = frappe.get_doc(
                    TIMESHEET_DT,
                    pending_in_record
                )

            if pending_in_doc.custom_emp_name != employee:
                errors.append(
                    f"{employee}: IN record does not belong to this employee."
                )
                continue

            if pending_in_doc.custom_log_type != "IN":
                errors.append(
                    f"{employee}: Selected record is not an IN record."
                )
                continue

            if pending_in_doc.custom_inout_log_record_:
                errors.append(
                    f"{employee}: This IN record has already been completed."
                )
                continue

            # Always use original IN time from database.
            in_time = _to_hhmm(
                pending_in_doc.custom_in_time
            ) or None

            if not in_time:
                errors.append(
                    f"{employee}: Original IN time is missing."
                )
                continue

        # =====================================================
        # IN ONLY: CHECK FOR EXISTING INCOMPLETE IN
        # =====================================================

        if in_time and not out_time:

            existing_in = frappe.get_all(
                TIMESHEET_DT,
                filters={
                    "custom_emp_name": employee,
                    "custom_log_type": "IN",
                    "custom_inout_log_record_": ["is", "not set"],
                },
                fields=["name"],
                order_by="custom_date desc, creation desc",
                limit_page_length=1,
            )

            if existing_in:
                errors.append(
                    f"{employee}: IN record already available. "
                    "Please complete that record."
                )
                continue

        if not in_time and not out_time:
            errors.append(
                f"{employee}: Please enter IN or OUT time."
            )
            continue

        trade = (row.get("trade") or "").strip()
        civil_id = (row.get("civil_id") or "").strip()

        common = {
            "doctype": TIMESHEET_DT,
            "custom_date": date,
            "custom_emp_name": employee,
            "custom_trade": "" if trade == "-" else trade,
            "custom_civil_id": "" if civil_id == "-" else civil_id,
            "custom_attendance": row.get("attendance"),
            "custom_current_site": site,
        }

        break_time = _to_hhmm(row.get("break_time")) or None

        # =====================================================
        # CALCULATE ACTUAL IN / OUT DATE AND TIME
        # =====================================================

        if pending_in_doc:
            actual_in_date = pending_in_doc.custom_date
            actual_in_time = pending_in_doc.custom_in_time

        else:
            actual_in_date = date
            actual_in_time = in_time

        actual_out_date = date
        actual_out_time = out_time

        # =====================================================
        # CALCULATE TOTAL WORKING HOURS
        # =====================================================

        if actual_in_time and actual_out_time:
            total = _calc_total(
                actual_in_date,
                actual_in_time,
                actual_out_date,
                actual_out_time,
                break_time
            )
        else:
            total = 0

        normal = shift_map.get(employee, 0)

        savepoint = f"est_{index}"
        frappe.db.savepoint(savepoint)

        row_created = 0

        try:
            in_doc = pending_in_doc
            out_doc = None

            # =================================================
            # CREATE IN RECORD
            # =================================================

            if in_time and not pending_in_doc:
                in_doc = frappe.get_doc({
                    **common,
                    "custom_log_type": "IN",
                    "custom_in_time": in_time,
                    "custom_out_time": None,
                    "custom_total_hrs": 0,
                    "custom_rest_hrs": None,
                    "custom_normal_hrs": 0,
                }).insert()

                row_created += 1

            # =================================================
            # RECHECK PENDING IN BEFORE CREATING OUT
            # =================================================

            if pending_in_doc:
                pending_in_doc.reload()

                if pending_in_doc.custom_inout_log_record_:
                    frappe.throw(
                        _("This IN record has already been completed.")
                    )

            # =================================================
            # CREATE OUT RECORD
            # =================================================

            if out_time:
                out_doc = frappe.get_doc({
                    **common,
                    "custom_log_type": "OUT",
                    "custom_in_time": None,
                    "custom_out_time": out_time,
                    "custom_total_hrs": _fmt(total),
                    "custom_rest_hrs": break_time,
                    "custom_ot_day_hrs": _to_hhmm(
                        row.get("ot_day")
                    ) or None,
                    "custom_ot_night_hrs": _to_hhmm(
                        row.get("ot_night")
                    ) or None,
                    "custom_normal_hrs": _fmt(normal),
                }).insert()

                row_created += 1

            # =================================================
            # LINK IN AND OUT RECORDS
            # =================================================

            if in_doc and out_doc:
                in_doc.db_set(
                    "custom_inout_log_record_",
                    out_doc.name,
                    update_modified=False
                )

                out_doc.db_set(
                    "custom_inout_log_record_",
                    in_doc.name,
                    update_modified=False
                )

            created += row_created

        except Exception as e:

            frappe.db.rollback(save_point=savepoint)
            frappe.clear_messages()

            frappe.log_error(
                title=f"Site TimeSheet submit failed: {employee}",
                message=frappe.get_traceback(),
            )

            errors.append(
                f"{employee}: {str(e) or 'Unknown error'}"
            )

    return {
        "created": created,
        "errors": errors
    }






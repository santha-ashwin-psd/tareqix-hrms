
# ================================================================
# TAREQIX HRMS | LIVE DASHBOARD API
# ================================================================
# File:
# tareqix_hrms/api/dashboard.py
#
# API:
# tareqix_hrms.api.dashboard.get_dashboard_data
#
# PURPOSE:
# Fetch actual records from the current ERPNext account
# and provide dashboard data to the Custom HTML Block.
#
# ================================================================


import frappe

from frappe.utils import (
    getdate,
    nowdate,
    add_days,
    flt
)


# ================================================================
# SECTION 1 - COMMON HELPERS
# ================================================================

def has_doctype(doctype):

    return bool(
        frappe.db.exists("DocType", doctype)
    )


# ----------------------------------------------------------------

def get_fields(doctype):

    if not has_doctype(doctype):
        return set()

    return {
        field.fieldname
        for field in frappe.get_meta(doctype).fields
    }


# ----------------------------------------------------------------

def count_records(doctype, filters=None):

    if not has_doctype(doctype):
        return 0

    try:

        return frappe.db.count(
            doctype,
            filters=filters or {}
        )

    except Exception:

        frappe.log_error(
            frappe.get_traceback(),
            "Tareqix Dashboard Count Error: " + doctype
        )

        return 0


# ----------------------------------------------------------------

def get_field(doctype, candidates):

    fields = get_fields(doctype)

    for candidate in candidates:

        if candidate in fields:
            return candidate

    return None


# ----------------------------------------------------------------

def get_records(
    doctype,
    fields,
    filters=None,
    limit=100,
    order_by="modified desc"
):

    if not has_doctype(doctype):
        return []

    available = get_fields(doctype)

    standard_fields = {
        "name",
        "owner",
        "creation",
        "modified",
        "modified_by",
        "docstatus",
        "idx"
    }

    selected = [
        field
        for field in fields
        if field in standard_fields or field in available
    ]

    if not selected:
        return []

    try:

        return frappe.get_all(
            doctype,
            filters=filters or {},
            fields=selected,
            limit_page_length=limit,
            order_by=order_by
        )

    except Exception:

        frappe.log_error(
            frappe.get_traceback(),
            "Tareqix Dashboard: " + doctype
        )

        return []


# ================================================================
# SECTION 2 - EMPLOYEE DATA
# ================================================================

def get_employee_data():

    if not has_doctype("Employee"):

        return {
            "employees": [],
            "total": 0,
            "direct": 0,
            "vendor": 0,
            "companies": []
        }

    fields = [

        "name",
        "employee_name",
        "company",
        "status",
        "vendor",
        "custom_expiry_date_"

    ]

    filters = {}

    employee_fields = get_fields("Employee")

    if "status" in employee_fields:

        filters["status"] = "Active"

    employees = get_records(
        "Employee",
        fields,
        filters=filters,
        limit=5000,
        order_by="employee_name asc"
    )

    direct = 0

    vendor = 0

    companies = {}

    for employee in employees:

        # Direct / Vendor classification

        if employee.get("vendor"):

            vendor += 1

        else:

            direct += 1

        # Company classification

        company = employee.get("company")

        if company:

            companies[company] = (
                companies.get(company, 0) + 1
            )

    company_breakdown = [

        {
            "company": company,
            "count": count
        }

        for company, count in sorted(
            companies.items(),
            key=lambda item: item[1],
            reverse=True
        )

    ]

    return {

        "employees": employees,

        "total": len(employees),

        "direct": direct,

        "vendor": vendor,

        "companies": company_breakdown

    }


# ================================================================
# SECTION 3 - DEPLOYMENT DATA
# ================================================================

def get_deployment_data(active_employees):

    if not has_doctype("Deployments"):

        return {

            "deployed": 0,

            "bench": len(active_employees),

            "sites": [],

            "activities": []

        }

    # ------------------------------------------------------------
    # 3.1 - ACTIVE EMPLOYEE IDENTIFICATION
    # ------------------------------------------------------------

    employee_ids = {

        employee.name

        for employee in active_employees

    }

    # ------------------------------------------------------------
    # 3.2 - FETCH DEPLOYMENT RECORDS
    # ------------------------------------------------------------

    records = get_records(

        "Deployments",

        [

            "name",

            "custom_site",

            "custom_employee_id",

            "custom_employee_name",

            "modified",

            "owner"

        ],

        limit=10000,

        order_by="modified desc"

    )

    # ------------------------------------------------------------
    # 3.3 - FIND LATEST DEPLOYMENT PER EMPLOYEE
    # ------------------------------------------------------------

    latest = {}

    for row in records:

        employee_id = row.get(
            "custom_employee_id"
        )

        if not employee_id:
            continue

        if employee_id not in employee_ids:
            continue

        # Records are ordered by latest modification.
        # First matching record is retained.

        if employee_id not in latest:

            latest[employee_id] = row

    # ------------------------------------------------------------
    # 3.4 - SITE-WISE EMPLOYEE COUNT
    # ------------------------------------------------------------

    site_counts = {}

    activities = []

    for employee_id, row in latest.items():

        site = (
            row.get("custom_site")
            or "Unassigned"
        )

        site_counts[site] = (
            site_counts.get(site, 0) + 1
        )

        # Actual employee name

        employee_name = (

            row.get("custom_employee_name")

            or employee_id

        )

        # Activity feed

        activities.append({

            "title": "Worker deployed to " + site,

            "subtitle": employee_name

        })

    # ------------------------------------------------------------
    # 3.5 - DEPLOYED / BENCH CALCULATION
    # ------------------------------------------------------------

    deployed = len(latest)

    bench = max(

        len(employee_ids) - deployed,

        0

    )

    # ------------------------------------------------------------
    # 3.6 - SITE PERCENTAGE
    # ------------------------------------------------------------

    maximum = max(
        site_counts.values(),
        default=1
    )

    sites = [

        {

            "site": site,

            "count": count,

            "percent": round(
                count / maximum * 100
            )

        }

        for site, count in sorted(

            site_counts.items(),

            key=lambda item: item[1],

            reverse=True

        )

    ]

    return {

        "deployed": deployed,

        "bench": bench,

        "sites": sites,

        "activities": activities

    }


# ================================================================
# SECTION 4 - ATTENDANCE DATA
# ================================================================

def get_attendance_data():

    result = {

        "present": 0,

        "late": 0,

        "absent": 0,

        "on_leave": 0,

        "total": 0

    }

    if not has_doctype("Attendance"):
        return result

    fields = get_fields("Attendance")

    if not {

        "attendance_date",

        "status"

    }.issubset(fields):

        return result

    # ------------------------------------------------------------
    # 4.1 - FETCH TODAY'S ATTENDANCE
    # ------------------------------------------------------------

    records = get_records(

        "Attendance",

        ["status"],

        filters={

            "attendance_date": nowdate(),

            "docstatus": 1

        },

        limit=5000

    )

    # ------------------------------------------------------------
    # 4.2 - CLASSIFY ATTENDANCE
    # ------------------------------------------------------------

    for row in records:

        status = str(

            row.get("status") or ""

        ).lower()

        if status in ("present", "half day"):

            result["present"] += 1

        elif status == "late":

            result["late"] += 1

        elif status == "absent":

            result["absent"] += 1

        elif status in ("on leave", "leave"):

            result["on_leave"] += 1

    # ------------------------------------------------------------
    # 4.3 - TOTAL ATTENDANCE RECORDS
    # ------------------------------------------------------------

    result["total"] = len(records)

    return result


# ================================================================
# SECTION 5 - EMPLOYEE DOCUMENT EXPIRY
# ================================================================

def get_expiry_data(employees):

    result = {

        "expired": 0,

        "days7": 0,

        "days30": 0,

        "rows": []

    }

    today = getdate(nowdate())

    for employee in employees:

        expiry = employee.get(
            "custom_expiry_date_"
        )

        if not expiry:
            continue

        try:

            expiry_date = getdate(expiry)

        except Exception:

            continue

        days = (
            expiry_date - today
        ).days

        # --------------------------------------------------------
        # EXPIRED
        # --------------------------------------------------------

        if days < 0:

            result["expired"] += 1

            severity = "expired"

            label = (
                f"Expired {abs(days)}d ago"
            )

        # --------------------------------------------------------
        # EXPIRING WITHIN 7 DAYS
        # --------------------------------------------------------

        elif days <= 7:

            result["days7"] += 1

            severity = "soon"

            label = (
                f"In {days} days"
            )

        # --------------------------------------------------------
        # EXPIRING WITHIN 30 DAYS
        # --------------------------------------------------------

        elif days <= 30:

            result["days30"] += 1

            severity = "soon"

            label = (
                f"In {days} days"
            )

        else:

            continue

        # Employee name

        name = (

            employee.get("employee_name")

            or employee.get("name")

        )

        # Employee initials

        initials = "".join(

            part[0]

            for part in str(name).split()[:2]

        ).upper()

        result["rows"].append({

            "employee": name,

            "document": "Employee expiry",

            "site": "",

            "initials": initials,

            "due_label": label,

            "severity": severity

        })

    # ------------------------------------------------------------
    # SORT EXPIRED RECORDS FIRST
    # ------------------------------------------------------------

    result["rows"].sort(

        key=lambda row: (

            0 if row["severity"] == "expired" else 1

        )

    )

    return result


# ================================================================
# SECTION 6 - COMPANY BREAKDOWN
# ================================================================

def get_company_data(employee_data):

    return {

        "total": employee_data["total"],

        "breakdown": employee_data["companies"]

    }


# ================================================================
# SECTION 7 - PAYROLL DATA
# ================================================================

def get_payroll_data(period="Monthly"):

    result = {

        "draft_slips": 0,

        "payroll_entries": 0,

        "salary_slips": 0,

        "series": []

    }

    if not has_doctype("Salary Slip"):
        return result

    # ------------------------------------------------------------
    # 7.1 - PAYROLL COUNTS
    # ------------------------------------------------------------

    result["draft_slips"] = count_records(

        "Salary Slip",

        {"docstatus": 0}

    )

    result["salary_slips"] = count_records(
        "Salary Slip"
    )

    result["payroll_entries"] = count_records(
        "Payroll Entry"
    )

    # ------------------------------------------------------------
    # 7.2 - DETERMINE AVAILABLE FIELDS
    # ------------------------------------------------------------

    fields = get_fields("Salary Slip")

    date_field = (

        "start_date"

        if "start_date" in fields

        else (

            "posting_date"

            if "posting_date" in fields

            else None

        )

    )

    amount_field = (

        "net_pay"

        if "net_pay" in fields

        else None

    )

    if not date_field or not amount_field:
        return result

    # ------------------------------------------------------------
    # 7.3 - FETCH PAYROLL CHART DATA
    # ------------------------------------------------------------

    try:

        if period == "Yearly":

            rows = frappe.db.sql(

                f"""
                SELECT

                    YEAR(`{date_field}`) AS label,

                    SUM(`{amount_field}`) AS value

                FROM `tabSalary Slip`

                WHERE docstatus = 1

                GROUP BY YEAR(`{date_field}`)

                ORDER BY YEAR(`{date_field}`) DESC

                LIMIT 6
                """,

                as_dict=True

            )

            rows.reverse()

        elif period == "Weekly":

            rows = frappe.db.sql(

                f"""
                SELECT

                    DATE_FORMAT(
                        MIN(`{date_field}`),
                        '%%d %%b'
                    ) AS label,

                    SUM(`{amount_field}`) AS value

                FROM `tabSalary Slip`

                WHERE docstatus = 1

                AND `{date_field}` >= %s

                GROUP BY YEARWEEK(`{date_field}`, 1)

                ORDER BY MIN(`{date_field}`)
                """,

                (
                    add_days(nowdate(), -56),

                ),

                as_dict=True

            )

        else:

            rows = frappe.db.sql(

                f"""
                SELECT

                    DATE_FORMAT(
                        `{date_field}`,
                        '%%b'
                    ) AS label,

                    SUM(`{amount_field}`) AS value

                FROM `tabSalary Slip`

                WHERE docstatus = 1

                AND `{date_field}` >= %s

                GROUP BY

                    YEAR(`{date_field}`),

                    MONTH(`{date_field}`)

                ORDER BY

                    YEAR(`{date_field}`),

                    MONTH(`{date_field}`)
                """,

                (
                    add_days(nowdate(), -180),

                ),

                as_dict=True

            )

        # --------------------------------------------------------
        # 7.4 - FORMAT CHART DATA
        # --------------------------------------------------------

        result["series"] = [

            {

                "label": str(row.label),

                "value": flt(row.value)

            }

            for row in rows

        ]

    except Exception:

        frappe.log_error(

            frappe.get_traceback(),

            "Tareqix Dashboard Payroll"

        )

    return result


# ================================================================
# SECTION 8 - PENDING APPROVALS
# ================================================================

def get_pending_data(payroll):

    # ------------------------------------------------------------
    # 8.1 - LEAVE APPLICATIONS
    # ------------------------------------------------------------

    leave_count = 0

    if has_doctype("Leave Application"):

        leave_count = count_records(

            "Leave Application",

            {

                "status": [

                    "in",

                    [

                        "Open",

                        "Pending Approval"

                    ]

                ]

            }

        )

    # ------------------------------------------------------------
    # 8.2 - SITE TIMESHEETS
    # ------------------------------------------------------------

    timesheet_count = count_records(

        "Site TimeSheet",

        {"docstatus": 0}

    )

    # ------------------------------------------------------------
    # 8.3 - VISA APPLICATIONS
    # ------------------------------------------------------------

    visa_count = count_records(

        "Visa and PRO",

        {"docstatus": 0}

    )

    # ------------------------------------------------------------
    # 8.4 - PENDING PAYROLL
    # ------------------------------------------------------------

    return [

        {

            "label": "Leave requests",

            "count": leave_count

        },

        {

            "label": "Site timesheets",

            "count": timesheet_count

        },

        {

            "label": "Salary slips to submit",

            "count": payroll["draft_slips"]

        },

        {

            "label": "Visa applications",

            "count": visa_count

        }

    ]


# ================================================================
# SECTION 9 - RECENT ACTIVITY
# ================================================================

def get_recent_activities(deployment_data):

    activities = list(

        deployment_data.get("activities", [])

    )

    # ------------------------------------------------------------
    # 9.1 - RECENT EMPLOYEE REGISTRATIONS
    # ------------------------------------------------------------

    employees = get_records(

        "Employee",

        [

            "name",

            "employee_name",

            "creation"

        ],

        limit=5,

        order_by="creation desc"

    )

    for employee in employees:

        activities.append({

            "title": "Employee record created",

            "subtitle": (

                employee.get("employee_name")

                or employee.get("name")

                or ""

            )

        })

    # ------------------------------------------------------------
    # 9.2 - RECENT PAYROLL ENTRIES
    # ------------------------------------------------------------

    payroll_entries = get_records(

        "Payroll Entry",

        [

            "name",

            "creation",

            "owner"

        ],

        limit=5,

        order_by="creation desc"

    )

    for entry in payroll_entries:

        activities.append({

            "title": "Payroll entry created",

            "subtitle": str(

                entry.get("creation") or ""

            )

        })

    return activities[:5]


# ================================================================
# SECTION 10 - MAIN DASHBOARD API
# ================================================================

@frappe.whitelist()
def get_dashboard_data(period="Monthly"):

    # ------------------------------------------------------------
    # 10.1 - PERMISSION VALIDATION
    # ------------------------------------------------------------

    if not frappe.has_permission(
        "Employee",
        "read"
    ):

        frappe.throw(
            "You do not have permission to view dashboard employee data."
        )

    # ------------------------------------------------------------
    # 10.2 - PERIOD VALIDATION
    # ------------------------------------------------------------

    if period not in (

        "Weekly",

        "Monthly",

        "Yearly"

    ):

        period = "Monthly"

    # ------------------------------------------------------------
    # 10.3 - FETCH EMPLOYEE DATA
    # ------------------------------------------------------------

    employee_data = get_employee_data()

    employees = employee_data["employees"]

    # ------------------------------------------------------------
    # 10.4 - FETCH DEPLOYMENT DATA
    # ------------------------------------------------------------

    deployment_data = get_deployment_data(
        employees
    )

    # ------------------------------------------------------------
    # 10.5 - FETCH ATTENDANCE DATA
    # ------------------------------------------------------------

    attendance = get_attendance_data()

    # ------------------------------------------------------------
    # 10.6 - FETCH DOCUMENT EXPIRY DATA
    # ------------------------------------------------------------

    expiry = get_expiry_data(
        employees
    )

    # ------------------------------------------------------------
    # 10.7 - FETCH PAYROLL DATA
    # ------------------------------------------------------------

    payroll = get_payroll_data(
        period
    )

    # ------------------------------------------------------------
    # 10.8 - FETCH COMPANY DATA
    # ------------------------------------------------------------

    company = get_company_data(
        employee_data
    )

    # ------------------------------------------------------------
    # 10.9 - FETCH PENDING APPROVAL DATA
    # ------------------------------------------------------------

    pending = get_pending_data(
        payroll
    )

    # ------------------------------------------------------------
    # 10.10 - FETCH RECENT ACTIVITIES
    # ------------------------------------------------------------

    activities = get_recent_activities(
        deployment_data
    )

    # ------------------------------------------------------------
    # 10.11 - RETURN DASHBOARD RESPONSE
    # ------------------------------------------------------------

    return {

        # --------------------------------------------------------
        # WORKFORCE
        # --------------------------------------------------------

        "workforce_total": employee_data["total"],

        "direct_employees": employee_data["direct"],

        "vendor_staff": employee_data["vendor"],

        "active_employees": employee_data["total"],

        "deployed": deployment_data["deployed"],

        "on_bench": deployment_data["bench"],


        # --------------------------------------------------------
        # ATTENDANCE
        # --------------------------------------------------------

        "present": attendance["present"],

        "late": attendance["late"],

        "absent": attendance["absent"],

        "on_leave": attendance["on_leave"],

        "attendance_records": attendance["total"],


        # --------------------------------------------------------
        # DOCUMENT EXPIRY
        # --------------------------------------------------------

        "expired_documents": expiry["expired"],

        "expiring_7_days": expiry["days7"],

        "expiring_30_days": expiry["days30"],

        "expiry_rows": expiry["rows"][:5],


        # --------------------------------------------------------
        # PAYROLL
        # --------------------------------------------------------

        "draft_salary_slips": payroll["draft_slips"],

        "payroll_entries": payroll["payroll_entries"],

        "salary_slips": payroll["salary_slips"],

        "payroll_series": payroll["series"],


        # --------------------------------------------------------
        # COMPANY BREAKDOWN
        # --------------------------------------------------------

        "company_employee_total": company["total"],

        "company_breakdown": company["breakdown"],


        # --------------------------------------------------------
        # DEPLOYMENT SITES
        # --------------------------------------------------------

        "sites": deployment_data["sites"],


        # --------------------------------------------------------
        # PENDING APPROVALS
        # --------------------------------------------------------

        "pending": pending,


        # --------------------------------------------------------
        # RECENT ACTIVITIES
        # --------------------------------------------------------

        "activities": activities

    }


# ================================================================
# END OF TAREQIX HRMS LIVE DASHBOARD API
# ================================================================

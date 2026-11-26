
import frappe
from collections import defaultdict


def execute(filters=None):

    filters = frappe._dict(filters or {})

    # --------------------------------------------------
    # 1. REPORT COLUMNS
    # --------------------------------------------------

    columns = [
        {
            "label": "Designation",
            "fieldname": "designation",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "label": "Direct",
            "fieldname": "direct",
            "fieldtype": "Int",
            "width": 100
        },
        {
            "label": "Vendor",
            "fieldname": "vendor",
            "fieldtype": "Int",
            "width": 100
        },
        {
            "label": "Deployed",
            "fieldname": "deployed",
            "fieldtype": "Int",
            "width": 110
        },
        {
            "label": "Bench",
            "fieldname": "bench",
            "fieldtype": "Int",
            "width": 100
        },
        {
            "label": "Total",
            "fieldname": "total",
            "fieldtype": "Int",
            "width": 100
        }
    ]

    # --------------------------------------------------
    # 2. FETCH ALL ACTIVE EMPLOYEES
    # --------------------------------------------------

    employee_filters = {
        "status": "Active"
    }

    if filters.designation:
        employee_filters["designation"] = filters.designation

    employees = frappe.get_all(
        "Employee",
        filters=employee_filters,
        fields=[
            "name",
            "designation",
            "custom_employee_type"
        ]
    )

    summary = defaultdict(lambda: {
        "direct": 0,
        "vendor": 0,
        "deployed_employees": set()
    })

    employee_map = {}

    # --------------------------------------------------
    # 3. CALCULATE DIRECT AND VENDOR STRENGTH
    # --------------------------------------------------

    for emp in employees:

        designation = emp.designation or "Not Specified"

        employee_type = (
            emp.custom_employee_type or ""
        ).strip().lower()

        employee_map[emp.name] = {
            "designation": designation,
            "employee_type": employee_type
        }

        if employee_type == "direct":
            summary[designation]["direct"] += 1

        elif employee_type == "vendor":
            summary[designation]["vendor"] += 1

    # --------------------------------------------------
    # 4. FETCH ACTIVE DEPLOYMENT RECORDS
    # --------------------------------------------------

    employee_ids = list(employee_map.keys())

    if employee_ids:

        deployment_filters = {
            "custom_active": 1,
            "custom_employee_id": ["in", employee_ids]
        }

        if filters.designation:
            deployment_filters["custom_trade"] = filters.designation

        deployments = frappe.get_all(
            "Deployments",
            filters=deployment_filters,
            fields=[
                "name",
                "custom_employee_id",
                "custom_trade"
            ]
        )

        # ----------------------------------------------
        # 5. COUNT DEPLOYED EMPLOYEES
        # ----------------------------------------------

        selected_type = (
            filters.employee_type or ""
        ).strip().lower()

        for deployment in deployments:

            employee_id = deployment.custom_employee_id

            if not employee_id:
                continue

            employee = employee_map.get(employee_id)

            if not employee:
                continue

            # Apply Direct / Vendor selection
            if selected_type:
                if employee["employee_type"] != selected_type:
                    continue

            designation = deployment.custom_trade

            if not designation:
                continue

            # Count each employee only once per designation
            summary[designation]["deployed_employees"].add(
                employee_id
            )


    # --------------------------------------------------
    # 6. PREPARE FINAL REPORT DATA
    # --------------------------------------------------

    data = []

    grand_direct = 0
    grand_vendor = 0
    grand_deployed = 0
    grand_bench = 0
    grand_total = 0

    selected_type = (
        filters.employee_type or ""
    ).strip().lower()

    for designation in sorted(summary.keys()):

        counts = summary[designation]

        direct = counts["direct"]
        vendor = counts["vendor"]

        deployed = len(counts["deployed_employees"])

        total = direct + vendor

        # Updated Bench Calculation
        if selected_type == "direct":
            bench = direct - deployed

        elif selected_type == "vendor":
            bench = vendor - deployed

        else:
            bench = direct + vendor - deployed

        data.append({
            "designation": designation,
            "direct": direct,
            "vendor": vendor,
            "deployed": deployed,
            "bench": bench,
            "total": total
        })

        grand_direct += direct
        grand_vendor += vendor
        grand_deployed += deployed
        grand_bench += bench
        grand_total += total

    # --------------------------------------------------
    # 7. GRAND TOTAL
    # --------------------------------------------------

    if data:

        data.append({
            "designation": "GRAND TOTAL",
            "direct": grand_direct,
            "vendor": grand_vendor,
            "deployed": grand_deployed,
            "bench": grand_bench,
            "total": grand_total
        })


    return columns, data

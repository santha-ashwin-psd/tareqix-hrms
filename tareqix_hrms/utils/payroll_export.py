
import frappe
import base64
import io
from frappe.utils import flt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter


def get_payroll_export_data(payroll_entry_names):

    logger = frappe.logger()

    logger.info("========== PAYROLL EXPORT STARTED ==========")

    if isinstance(payroll_entry_names, str):
        payroll_entry_names = frappe.parse_json(payroll_entry_names)

    payroll_entry_names = list(dict.fromkeys(payroll_entry_names or []))

    logger.info(
        "Payroll Entry Names Received: " + str(payroll_entry_names)
    )

    if not payroll_entry_names:
        frappe.throw("No Payroll Entry records were provided.")

    if not frappe.has_permission("Payroll Entry", "read"):
        frappe.throw("You do not have permission to read Payroll Entry.")

    if not frappe.has_permission("Salary Slip", "read"):
        frappe.throw("You do not have permission to read Salary Slip.")

    # Fetch submitted Payroll Entries
    payroll_entries = frappe.get_all(
        "Payroll Entry",
        filters={
            "name": ["in", payroll_entry_names],
            "docstatus": 1
        },
        fields=["name", "posting_date"]
    )

    valid_entry_names = [entry.name for entry in payroll_entries]

    logger.info(
        "Submitted Payroll Entries Found: " + str(len(payroll_entries))
    )

    logger.info(
        "Valid Payroll Entry Names: " + str(valid_entry_names)
    )

    if not valid_entry_names:
        frappe.throw("No submitted Payroll Entry records found.")

    entry_dates = {
        entry.name: entry.posting_date
        for entry in payroll_entries
    }

    # Fetch non-cancelled Salary Slips linked to submitted Payroll Entries
    salary_slips = frappe.get_all(
        "Salary Slip",
        filters={
            "payroll_entry": ["in", valid_entry_names],
            "docstatus": ["!=", 2]
        },
        fields=[
            "name",
            "employee",
            "employee_name",
            "payroll_entry",
            "docstatus"
        ],
        order_by="employee_name asc"
    )

    logger.info(
        "Salary Slips Found: " + str(len(salary_slips))
    )

    for slip_ref in salary_slips:
        logger.info(
            "Salary Slip: "
            + str(slip_ref.name)
            + " | Employee ID: "
            + str(slip_ref.employee)
            + " | Employee Name: "
            + str(slip_ref.employee_name)
            + " | Payroll Entry: "
            + str(slip_ref.payroll_entry)
            + " | Docstatus: "
            + str(slip_ref.docstatus)
        )

    if not salary_slips:
        frappe.throw(
            "No non-cancelled Salary Slips found for these Payroll Entries."
        )

    earning_components = []
    deduction_components = []
    salary_data = []

    for slip_ref in salary_slips:

        logger.info(
            "Processing Salary Slip: " + str(slip_ref.name)
        )

        slip = frappe.get_doc("Salary Slip", slip_ref.name)

        employee_name = slip.employee_name or ""
        employee_id = slip.employee or ""

        civil_id = ""

        if employee_id:
            civil_id = frappe.db.get_value(
                "Employee",
                employee_id,
                "civil_id"
            ) or ""

        earnings = {}
        deductions = {}

        # Collect earning components
        for item in slip.earnings or []:

            component = item.salary_component

            if not component:
                continue

            earnings[component] = (
                earnings.get(component, 0) + flt(item.amount)
            )

            if component not in earning_components:
                earning_components.append(component)

        # Collect deduction components
        for item in slip.deductions or []:

            component = item.salary_component

            if not component:
                continue

            deductions[component] = (
                deductions.get(component, 0) + flt(item.amount)
            )

            if component not in deduction_components:
                deduction_components.append(component)

        gross_pay = flt(slip.gross_pay)

        if not gross_pay:
            gross_pay = sum(earnings.values())

        net_pay = flt(slip.net_pay)

        if not net_pay:
            net_pay = gross_pay - sum(deductions.values())

        salary_data.append({
            "date": entry_dates.get(slip.payroll_entry),
            "employee_name": employee_name,
            "employee_id": employee_id,
            "civil_id": civil_id,
            "earnings": earnings,
            "deductions": deductions,
            "gross_pay": gross_pay,
            "net_pay": net_pay
        })

        logger.info(
            "Employee Added: "
            + str(employee_name)
            + " | Employee ID: "
            + str(employee_id)
        )

    # Construct dynamic Excel columns
    columns = [
        "Date",
        "Employee Name",
        "Employee ID",
        "Civil ID"
    ]

    for component in earning_components:
        columns.append("Earning - " + component)

    for component in deduction_components:
        columns.append("Deduction - " + component)

    columns.extend([
        "Gross Pay (Before Deductions)",
        "Net Pay (After Deductions)"
    ])

    # Construct preview and Excel rows
    rows = []

    for record in salary_data:

        row = [
            str(record["date"]) if record["date"] else "",
            record["employee_name"],
            record["employee_id"],
            record["civil_id"]
        ]

        for component in earning_components:
            row.append(
                flt(record["earnings"].get(component, 0))
            )

        for component in deduction_components:
            row.append(
                flt(record["deductions"].get(component, 0))
            )

        row.extend([
            record["gross_pay"],
            record["net_pay"]
        ])

        rows.append(row)

    logger.info(
        "Total Employee Rows Generated: " + str(len(rows))
    )

    logger.info(
        "Total Excel Columns Generated: " + str(len(columns))
    )

    logger.info("========== PAYROLL EXPORT COMPLETED ==========")

    return {
        "columns": columns,
        "rows": rows
    }


@frappe.whitelist()
def get_payroll_preview(payroll_entry_names):

    logger = frappe.logger()

    logger.info("========== PAYROLL PREVIEW REQUESTED ==========")

    data = get_payroll_export_data(payroll_entry_names)

    logger.info(
        "Preview Rows Returned: " + str(len(data.get("rows", [])))
    )

    return data


@frappe.whitelist()
def download_payroll_excel(payroll_entry_names):

    logger = frappe.logger()

    logger.info("========== PAYROLL EXCEL DOWNLOAD STARTED ==========")

    data = get_payroll_export_data(payroll_entry_names)

    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Payroll Report"

    columns = data["columns"]

    # Header
    worksheet.append(columns)

    for row in data["rows"]:
        worksheet.append(row)

    # Header styling
    for cell in worksheet[1]:

        cell.font = Font(
            bold=True,
            color="FFFFFF"
        )

        cell.fill = PatternFill(
            fill_type="solid",
            fgColor="1F4E78"
        )

        cell.alignment = Alignment(
            horizontal="center",
            vertical="center"
        )

    worksheet.freeze_panes = "A2"
    worksheet.auto_filter.ref = worksheet.dimensions

    # Column widths
    for column_index, column in enumerate(columns, start=1):

        column_letter = get_column_letter(column_index)

        max_length = len(str(column))

        for row in worksheet.iter_rows(
            min_col=column_index,
            max_col=column_index
        ):

            for cell in row:

                if cell.value is not None:
                    max_length = max(
                        max_length,
                        len(str(cell.value))
                    )

        worksheet.column_dimensions[column_letter].width = min(
            max_length + 3,
            35
        )

    # Format amount columns
    for column_index, column in enumerate(columns, start=1):

        if (
            column.startswith("Earning -")
            or column.startswith("Deduction -")
            or column in [
                "Gross Pay (Before Deductions)",
                "Net Pay (After Deductions)"
            ]
        ):

            for row_index in range(2, worksheet.max_row + 1):

                worksheet.cell(
                    row=row_index,
                    column=column_index
                ).number_format = '#,##0.00'

    output = io.BytesIO()

    workbook.save(output)

    file_data = base64.b64encode(
        output.getvalue()
    ).decode("utf-8")

    logger.info(
        "Excel Rows Exported: " + str(len(data["rows"]))
    )

    logger.info("========== PAYROLL EXCEL DOWNLOAD COMPLETED ==========")

    return {
        "file_name": "Payroll_Export.xlsx",
        "file_data": file_data
    }

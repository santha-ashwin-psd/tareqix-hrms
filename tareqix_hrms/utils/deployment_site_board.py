
import frappe
from frappe import _
from frappe.utils import cint


@frappe.whitelist()
def get_deployment_site_board_data():

    if not frappe.has_permission("Deployments", "read"):
        frappe.throw(_("You do not have permission to view Deployments."))

    fields = [
        "name",
        "custom_site",
        "custom_employee_id",
        "custom_employee_name",
        "custom_trade",
        "custom_employee_type",
        "custom_supplier",
        "custom_mobile_no",
        "custom_vendor"
    ]

    records = frappe.get_list(
        "Deployments",
        fields=fields,
        order_by="custom_site asc, modified desc",
        limit_page_length=0
    )

    grouped = {}
    sites = []

    for record in records:

        site = record.get("custom_site") or ""

        if site not in grouped:
            grouped[site] = []
            sites.append(site)

        grouped[site].append(record)

    columns = []

    for site in sites:
        columns.append({
            "site": site,
            "label": site or "Unassigned",
            "records": grouped[site]
        })

    return columns


@frappe.whitelist()
def update_deployment_site(deployment, new_site):

    if not frappe.has_permission("Deployments", "write"):
        frappe.throw(_("You do not have permission to update Deployments."))

    if not deployment:
        frappe.throw(_("Deployment ID is required."))

    doc = frappe.get_doc("Deployments", deployment)

    doc.check_permission("write")

    new_site = (new_site or "").strip()

    if doc.custom_site == new_site:
        return {
            "success": True,
            "message": "Site is unchanged."
        }

    doc.custom_site = new_site
    doc.save()

    return {
        "success": True,
        "deployment": doc.name,
        "custom_site": doc.custom_site,
        "message": _("Deployment moved successfully.")
    }

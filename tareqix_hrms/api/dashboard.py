"""Permission-aware KPI data for selected Tareqix HRMS list pages."""

import frappe
from frappe.utils import get_first_day, get_last_day, nowdate


ALLOWED_DOCTYPES = {"Employee", "Supplier", "Company", "Payroll Entry"}


def _has_field(meta, fieldname):
    return bool(meta and meta.has_field(fieldname))

def _count(doctype, filters=None):
    """Count records using permission-aware frappe.get_list."""

    try:
        rows = frappe.get_list(
            doctype,
            filters=filters or {},
            fields=[{"COUNT": "*"}],
            page_length=1,
        )

        if rows:
            return int(list(rows[0].values())[0] or 0)

        return 0

    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            f"Tareqix HRMS KPI count: {doctype}"
        )
        return 0



def _card(label, value, note="Current records", percent=100):
    return {
        "label": label,
        "value": int(value or 0),
        "note": note,
        "percent": max(0, min(100, int(percent or 0))),
    }


def _percentage(part, total):
    return round((part / total) * 100) if total else 0


@frappe.whitelist()
def get_page_stats(doctype):
    """Return KPI cards for Employee, Supplier, Company or Payroll Entry.

    The endpoint only accepts the four configured DocTypes and all counts are
    obtained through frappe.get_list, which applies the current user's read
    permissions and permission query conditions.
    """
    doctype = (doctype or "").strip()
    if doctype not in ALLOWED_DOCTYPES:
        frappe.throw("Statistics are not configured for this page.")

    if not frappe.has_permission(doctype, "read"):
        frappe.throw("You do not have permission to view these statistics.", frappe.PermissionError)

    meta = frappe.get_meta(doctype)
    total = _count(doctype)
    cards = []

    if doctype == "Employee":
        cards.append(_card("Total Employees", total, "All visible employee records"))
        if _has_field(meta, "status"):
            active = _count(doctype, {"status": "Active"})
            inactive = _count(doctype, {"status": "Inactive"})
            suspended = _count(doctype, {"status": "Suspended"})
            cards.append(_card("Active Employees", active, f"{_percentage(active, total)}% of visible employees", _percentage(active, total)))
            cards.append(_card("Inactive Employees", inactive, f"{_percentage(inactive, total)}% of visible employees", _percentage(inactive, total)))
            cards.append(_card("Suspended", suspended, "Suspended employee records", _percentage(suspended, total)))
        elif _has_field(meta, "date_of_joining"):
            first_day = get_first_day(nowdate())
            last_day = get_last_day(nowdate())
            joined = _count(doctype, {"date_of_joining": ["between", [first_day, last_day]]})
            cards.append(_card("Joined This Month", joined, "Employees joined this month", _percentage(joined, total)))

    elif doctype == "Supplier":
        cards.append(_card("Total Suppliers", total, "All visible supplier records"))
        if _has_field(meta, "disabled"):
            active = _count(doctype, {"disabled": 0})
            disabled = _count(doctype, {"disabled": 1})
            cards.append(_card("Active Suppliers", active, f"{_percentage(active, total)}% of suppliers", _percentage(active, total)))
            cards.append(_card("Disabled Suppliers", disabled, "Disabled supplier records", _percentage(disabled, total)))
        if _has_field(meta, "supplier_group"):
            grouped = _count(doctype, {"supplier_group": ["is", "set"]})
            cards.append(_card("Assigned to a Group", grouped, f"{_percentage(grouped, total)}% with a supplier group", _percentage(grouped, total)))

    elif doctype == "Company":
        cards.append(_card("Total Companies", total, "All visible company records"))
        if _has_field(meta, "default_currency"):
            with_currency = _count(doctype, {"default_currency": ["is", "set"]})
            cards.append(_card("Currency Configured", with_currency, "Companies with a default currency", _percentage(with_currency, total)))
        if _has_field(meta, "abbreviation"):
            with_abbreviation = _count(doctype, {"abbreviation": ["is", "set"]})
            cards.append(_card("Abbreviation Set", with_abbreviation, "Companies with an abbreviation", _percentage(with_abbreviation, total)))
        # Keep a consistent four-card layout without inventing Company fields.
        if len(cards) == 1:
            cards.append(_card("Registered Companies", total, "Visible to your account"))

    elif doctype == "Payroll Entry":
        cards.append(_card("Total Payroll Entries", total, "All visible payroll entries"))
        if _has_field(meta, "docstatus"):
            draft = _count(doctype, {"docstatus": 0})
            submitted = _count(doctype, {"docstatus": 1})
            cancelled = _count(doctype, {"docstatus": 2})
            cards.append(_card("Draft", draft, "Not yet submitted", _percentage(draft, total)))
            cards.append(_card("Submitted", submitted, "Submitted payroll entries", _percentage(submitted, total)))
            cards.append(_card("Cancelled", cancelled, "Cancelled payroll entries", _percentage(cancelled, total)))

    return {"doctype": doctype, "cards": cards}

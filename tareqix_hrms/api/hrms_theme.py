# # -*- coding: utf-8 -*-
# """
# Tareqix HRMS | Oman Modern Theme - backend API

# File location:
#     apps/tareqix_hrms/tareqix_hrms/api/hrms_theme.py

# Called by hrms_theme.js (SERVER_STATS_METHOD):
#     tareqix_hrms.api.hrms_theme.get_page_stats

# Returns the KPI cards shown under the hero banner on selected list pages
# (Employee, Supplier, Company, Payroll Entry).

# - Every count goes through frappe.get_list(), so Role Permissions and
#   User Permissions are respected automatically.
# - Filters on fields that do not exist in your DocType are skipped
#   instead of raising an error.
# - Add or change cards in PAGE_STATS only; no other code change is needed.
# """

# import frappe
# from frappe.utils import add_days, nowdate


# # Fields that exist on every DocType (not listed in meta.fields)
# STANDARD_FIELDS = {
#     "name",
#     "owner",
#     "creation",
#     "modified",
#     "modified_by",
#     "docstatus",
# }

# DAYS_AGO_30 = "__DAYS_AGO_30__"


# # ---------------------------------------------------------------
# # KPI CARD DEFINITIONS
# #   label   : card title
# #   filters : list of [fieldname, operator, value]
# #   note    : small coloured text under the number
# #   icon    : users | deploy | pin | alert | building | box | card | doc
# #   tone    : green | blue | gold | red
# # ---------------------------------------------------------------

# PAGE_STATS = {
#     "Employee": [
#         {
#             "label": "Total employees",
#             "filters": [],
#             "note": "All employee records",
#             "icon": "users",
#             "tone": "green",
#         },
#         {
#             "label": "Active",
#             "filters": [["status", "=", "Active"]],
#             "note": "Currently working",
#             "icon": "deploy",
#             "tone": "blue",
#         },
#         {
#             "label": "Inactive / Left",
#             "filters": [["status", "in", ["Inactive", "Suspended", "Left"]]],
#             "note": "Not currently active",
#             "icon": "alert",
#             "tone": "red",
#         },
#         {
#             "label": "Added in 30 days",
#             "filters": [["creation", ">=", DAYS_AGO_30]],
#             "note": "New records",
#             "icon": "pin",
#             "tone": "gold",
#         },
#     ],
#     "Supplier": [
#         {
#             "label": "Total suppliers",
#             "filters": [],
#             "note": "All vendors",
#             "icon": "box",
#             "tone": "green",
#         },
#         {
#             "label": "Enabled",
#             "filters": [["disabled", "=", 0]],
#             "note": "Active partners",
#             "icon": "deploy",
#             "tone": "blue",
#         },
#         {
#             "label": "Disabled",
#             "filters": [["disabled", "=", 1]],
#             "note": "Not in use",
#             "icon": "alert",
#             "tone": "red",
#         },
#         {
#             "label": "Added in 30 days",
#             "filters": [["creation", ">=", DAYS_AGO_30]],
#             "note": "New vendors",
#             "icon": "pin",
#             "tone": "gold",
#         },
#     ],
#     "Company": [
#         {
#             "label": "Total companies",
#             "filters": [],
#             "note": "Active entities",
#             "icon": "building",
#             "tone": "green",
#         },
#         {
#             "label": "Group companies",
#             "filters": [["is_group", "=", 1]],
#             "note": "Parent entities",
#             "icon": "users",
#             "tone": "blue",
#         },
#         {
#             "label": "Perpetual inventory",
#             "filters": [["enable_perpetual_inventory", "=", 1]],
#             "note": "Enabled companies",
#             "icon": "box",
#             "tone": "gold",
#         },
#         {
#             "label": "Added in 30 days",
#             "filters": [["creation", ">=", DAYS_AGO_30]],
#             "note": "New entities",
#             "icon": "pin",
#             "tone": "red",
#         },
#     ],
#     "Payroll Entry": [
#         {
#             "label": "Total entries",
#             "filters": [],
#             "note": "All payroll runs",
#             "icon": "card",
#             "tone": "green",
#         },
#         {
#             "label": "Draft",
#             "filters": [["docstatus", "=", 0]],
#             "note": "Awaiting submission",
#             "icon": "doc",
#             "tone": "gold",
#         },
#         {
#             "label": "Submitted",
#             "filters": [["docstatus", "=", 1]],
#             "note": "Processed",
#             "icon": "deploy",
#             "tone": "blue",
#         },
#         {
#             "label": "Cancelled",
#             "filters": [["docstatus", "=", 2]],
#             "note": "Cancelled runs",
#             "icon": "alert",
#             "tone": "red",
#         },
#     ],
# }


# # ---------------------------------------------------------------
# # HELPERS
# # ---------------------------------------------------------------

# def _resolve_filters(doctype, filters):
#     """
#     Replace the date placeholder and drop filters that point to a
#     field which does not exist in this DocType.

#     Returns None when a filter cannot be applied (card is skipped).
#     """
#     meta = frappe.get_meta(doctype)
#     resolved = []

#     for condition in filters or []:
#         fieldname, operator, value = condition

#         if fieldname not in STANDARD_FIELDS and not meta.has_field(fieldname):
#             return None

#         if value == DAYS_AGO_30:
#             value = add_days(nowdate(), -30)

#         resolved.append([doctype, fieldname, operator, value])

#     return resolved


# def _count(doctype, filters):
#     """Permission-aware count."""
#     rows = frappe.get_list(
#         doctype,
#         filters=filters,
#         fields=["count(name) as total"],
#         limit_page_length=0,
#     )

#     return int(rows[0].total) if rows else 0


# # ---------------------------------------------------------------
# # PUBLIC API
# # ---------------------------------------------------------------

# @frappe.whitelist()
# def get_page_stats(doctype=None):
#     """
#     KPI cards for a list page.

#     Response:
#         {"cards": [{"label", "value", "note", "icon", "tone"}, ...]}

#     An empty "cards" list means: no permission, unknown DocType, or
#     nothing could be counted. The browser then falls back to its own
#     counting logic.
#     """
#     if not doctype or doctype not in PAGE_STATS:
#         return {"cards": []}

#     if not frappe.has_permission(doctype, "read"):
#         return {"cards": []}

#     cards = []

#     for definition in PAGE_STATS[doctype]:
#         filters = _resolve_filters(doctype, definition["filters"])

#         # Field missing in this site's DocType -> skip this card
#         if filters is None:
#             continue

#         try:
#             value = _count(doctype, filters)
#         except Exception:
#             frappe.log_error(
#                 title="Tareqix HRMS theme: KPI count failed",
#                 message=frappe.get_traceback(),
#             )
#             continue

#         cards.append(
#             {
#                 "label": definition["label"],
#                 "value": value,
#                 "note": definition["note"],
#                 "icon": definition["icon"],
#                 "tone": definition["tone"],
#             }
#         )

#     return {"cards": cards}

















































# -*- coding: utf-8 -*-
"""
Tareqix HRMS | Oman Modern Theme - backend API

File location:
    apps/tareqix_hrms/tareqix_hrms/api/hrms_theme.py

Called by hrms_theme.js (SERVER_STATS_METHOD):
    tareqix_hrms.api.hrms_theme.get_page_stats

Returns the KPI cards shown under the hero banner on the Tareqix list pages
(Workers, Company, Supplier, Site Detail, Deployments, Site TimeSheet,
Salary Structure, Salary Structure Assignment, Bulk Salary Structure
Assignment, Payroll Entry, Salary Slip, Salary Component, Oman Labour Rules,
Visa and PRO, Attendance, Employee Attendance).

How it works
------------
- Every count goes through frappe.get_list(), so Role Permissions and
  User Permissions are respected automatically.
- Each page lists MORE candidate cards than needed. Cards that use a field
  which does not exist in your DocType are skipped, and the first 4 valid
  cards are returned. So a wrong field name never breaks the page.
- To change a card, edit PAGE_STATS only.

Card format:  c(label, filters, note, icon, tone)
    filters : list of [fieldname, operator, value]
    icon    : users | deploy | pin | alert | building | box | card | doc
    tone    : green | blue | gold | red
    date placeholder: "__DAYS_AGO_N__"  (N = 0 means today)
"""

import re

import frappe
from frappe.utils import add_days, nowdate


MAX_CARDS = 4

# Fields that exist on every DocType (not listed in meta.fields)
STANDARD_FIELDS = {
    "name",
    "owner",
    "creation",
    "modified",
    "modified_by",
    "docstatus",
}

DAYS_TOKEN = re.compile(r"__DAYS_AGO_(\d+)__")


def c(label, filters, note, icon, tone):
    """Card definition helper."""
    return {
        "label": label,
        "filters": filters,
        "note": note,
        "icon": icon,
        "tone": tone,
    }


def recent(noun="records"):
    """Generic 'recently created' cards (always valid - use standard fields)."""
    return [
        c("Added in 30 days", [["creation", ">=", "__DAYS_AGO_30__"]], "New " + noun, "pin", "blue"),
        c("Added in 7 days", [["creation", ">=", "__DAYS_AGO_7__"]], "This week", "deploy", "gold"),
        c("Added today", [["creation", ">=", "__DAYS_AGO_0__"]], "Created today", "building", "green"),
    ]


def generic(total_label, noun="records"):
    return [c(total_label, [], "All " + noun, "doc", "green")] + recent(noun)


# ---------------------------------------------------------------
# KPI CARD DEFINITIONS  (edit here)
# ---------------------------------------------------------------

EMPLOYEE_CARDS = [
    c("Total employees", [], "All employee records", "users", "green"),
    c("Active", [["status", "=", "Active"]], "Currently working", "deploy", "blue"),
    c("Inactive / Left", [["status", "in", ["Inactive", "Suspended", "Left"]]], "Not currently active", "alert", "red"),
    c("Added in 30 days", [["creation", ">=", "__DAYS_AGO_30__"]], "New records", "pin", "gold"),
]

PAGE_STATS = {
    # ----- Workforce -----
    "Employee": EMPLOYEE_CARDS,
    "Worker": EMPLOYEE_CARDS,

    "Company": [
        c("Total companies", [], "Active entities", "building", "green"),
        c("Group companies", [["is_group", "=", 1]], "Parent entities", "users", "blue"),
        c("Perpetual inventory", [["enable_perpetual_inventory", "=", 1]], "Enabled companies", "box", "gold"),
        c("Added in 30 days", [["creation", ">=", "__DAYS_AGO_30__"]], "New entities", "pin", "red"),
    ],

    "Supplier": [
        c("Total suppliers", [], "All vendors", "box", "green"),
        c("Enabled", [["disabled", "=", 0]], "Active partners", "deploy", "blue"),
        c("Disabled", [["disabled", "=", 1]], "Not in use", "alert", "red"),
        c("Added in 30 days", [["creation", ">=", "__DAYS_AGO_30__"]], "New vendors", "pin", "gold"),
    ],

    # ----- Operations -----
    "Site Detail": [
        c("Total sites", [], "All client sites", "pin", "green"),
        c("Active sites", [["status", "=", "Active"]], "Currently running", "deploy", "blue"),
        c("Inactive sites", [["status", "=", "Inactive"]], "Not running", "alert", "red"),
    ] + recent("sites"),

    "Deployments": [
        c("Total deployments", [], "All deployments", "deploy", "green"),
        c("Active", [["status", "=", "Active"]], "Currently deployed", "users", "blue"),
        c("Completed", [["status", "=", "Completed"]], "Finished assignments", "doc", "gold"),
    ] + recent("deployments"),

    "Site TimeSheet": [
        c("Total timesheets", [], "All site entries", "doc", "green"),
        c("Present", [["attendance", "=", "Present"]], "Marked present", "users", "blue"),
        c("Absent", [["attendance", "=", "Absent"]], "Marked absent", "alert", "red"),
        c("Added today", [["creation", ">=", "__DAYS_AGO_0__"]], "Entries today", "pin", "gold"),
    ] + recent("entries"),

    # ----- Payroll -----
    "Salary Structure": [
        c("Total structures", [], "All salary structures", "doc", "green"),
        c("Active", [["is_active", "=", "Yes"]], "In use", "deploy", "blue"),
        c("Inactive", [["is_active", "=", "No"]], "Not in use", "alert", "red"),
        c("Submitted", [["docstatus", "=", 1]], "Finalised", "card", "gold"),
    ] + recent("structures"),

    "Salary Structure Assignment": [
        c("Total assignments", [], "All assignments", "doc", "green"),
        c("Submitted", [["docstatus", "=", 1]], "Effective", "deploy", "blue"),
        c("Draft", [["docstatus", "=", 0]], "Awaiting submission", "alert", "gold"),
    ] + recent("assignments"),

    "Bulk Salary Structure Assignment": generic("Total bulk assignments", "bulk assignments"),

    "Payroll Entry": [
        c("Total entries", [], "All payroll runs", "card", "green"),
        c("Draft", [["docstatus", "=", 0]], "Awaiting submission", "doc", "gold"),
        c("Submitted", [["docstatus", "=", 1]], "Processed", "deploy", "blue"),
        c("Cancelled", [["docstatus", "=", 2]], "Cancelled runs", "alert", "red"),
    ],

    "Salary Slip": [
        c("Total salary slips", [], "All slips", "card", "green"),
        c("Draft", [["docstatus", "=", 0]], "Awaiting submission", "doc", "gold"),
        c("Submitted", [["docstatus", "=", 1]], "Issued", "deploy", "blue"),
        c("Cancelled", [["docstatus", "=", 2]], "Cancelled slips", "alert", "red"),
    ],

    "Salary Component": [
        c("Total components", [], "All components", "doc", "green"),
        c("Earnings", [["type", "=", "Earning"]], "Added to salary", "deploy", "blue"),
        c("Deductions", [["type", "=", "Deduction"]], "Taken from salary", "alert", "red"),
        c("Disabled", [["disabled", "=", 1]], "Not in use", "box", "gold"),
    ] + recent("components"),

    # ----- Compliance -----
    "Oman Labour Rules": generic("Total rules", "rules"),
    "Visa and PRO": generic("Total visa / PRO records", "records"),

    # ----- Attendance -----
    "Attendance": [
        c("Total attendance", [], "All records", "doc", "green"),
        c("Present", [["status", "=", "Present"]], "Marked present", "users", "blue"),
        c("Absent", [["status", "=", "Absent"]], "Marked absent", "alert", "red"),
        c("On leave", [["status", "=", "On Leave"]], "Approved leave", "box", "gold"),
    ] + recent("records"),

    "Employee Attendance": generic("Total attendance records", "records"),
}

# Pages whose cards get "Draft / Submitted" added automatically when the
# DocType is submittable (docstatus is meaningful only then).
AUTO_DOCSTATUS = {
    "Bulk Salary Structure Assignment",
    "Oman Labour Rules",
    "Visa and PRO",
    "Employee Attendance",
}

_PAGE_KEYS = {name.lower(): name for name in PAGE_STATS}


# ---------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------

def _definitions(canonical, doctype):
    """Candidate cards for a page (adds Draft / Submitted when relevant)."""
    definitions = list(PAGE_STATS[canonical])

    if canonical in AUTO_DOCSTATUS and frappe.get_meta(doctype).is_submittable:
        definitions[1:1] = [
            c("Submitted", [["docstatus", "=", 1]], "Finalised", "deploy", "blue"),
            c("Draft", [["docstatus", "=", 0]], "Awaiting submission", "alert", "gold"),
        ]

    return definitions


def _resolve_filters(doctype, filters):
    """
    Replace date placeholders. Returns None when a filter points to a
    field that does not exist in this DocType (the card is skipped).
    """
    meta = frappe.get_meta(doctype)
    resolved = []

    for fieldname, operator, value in filters or []:
        if fieldname not in STANDARD_FIELDS and not meta.has_field(fieldname):
            return None

        if isinstance(value, str):
            match = DAYS_TOKEN.fullmatch(value)

            if match:
                value = add_days(nowdate(), -int(match.group(1)))

        resolved.append([doctype, fieldname, operator, value])

    return resolved


def _count(doctype, filters):
    """Permission-aware count."""
    rows = frappe.get_list(
        doctype,
        filters=filters,
        fields=["count(name) as total"],
        limit_page_length=0,
    )

    return int(rows[0].total) if rows else 0


# ---------------------------------------------------------------
# PUBLIC API
# ---------------------------------------------------------------

@frappe.whitelist()
def get_page_stats(doctype=None):
    """
    KPI cards for a list page.

    Response:
        {"cards": [{"label", "value", "note", "icon", "tone"}, ...]}

    An empty "cards" list means: unknown DocType, DocType missing on this
    site, no permission, or nothing could be counted. The browser then
    falls back to its own counting logic.
    """
    canonical = _PAGE_KEYS.get(str(doctype or "").lower())

    if not canonical:
        return {"cards": []}

    # Use the real DocType name as installed on this site
    if not frappe.db.exists("DocType", doctype):
        return {"cards": []}

    if not frappe.has_permission(doctype, "read"):
        return {"cards": []}

    cards = []

    for definition in _definitions(canonical, doctype):
        if len(cards) >= MAX_CARDS:
            break

        filters = _resolve_filters(doctype, definition["filters"])

        # Field missing in this site's DocType -> skip this card
        if filters is None:
            continue

        try:
            value = _count(doctype, filters)
        except Exception:
            frappe.log_error(
                title="Tareqix HRMS theme: KPI count failed",
                message=frappe.get_traceback(),
            )
            continue

        cards.append(
            {
                "label": definition["label"],
                "value": value,
                "note": definition["note"],
                "icon": definition["icon"],
                "tone": definition["tone"],
            }
        )

    return {"cards": cards}
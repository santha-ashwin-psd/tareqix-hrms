
import frappe
from frappe import _
from frappe.utils import getdate, nowdate, date_diff


# ============================================================
# SECTION 1: SECTION-WISE ATTACHMENT CONFIGURATION
# ============================================================

SECTION_CONFIG = [
    {
        "section": "Offer & Document Collection",
        "submission_date": "custom_last_submission_offer",
        "attachments": [
            ("Signed Offer Letter", "signed_offer_letter"),
            ("Signed Employment Contract", "signed_employment_contract"),
            ("Updated CV / Resume", "updated_cv__resume"),
            ("Recent Passport Size Photographs (white background)", "recent_passport_size_photographs_white_background"),
            ("Passport Copy", "passport_copy"),
        ],
    },
    {
        "section": "Certificate Attestation",
        "submission_date": "custom_last_submission_certificate",
        "attachments": [
            ("Apostilled / MEA Attested Educational Certificate", "apostilled__mea_attested_educational_certificate"),
        ],
    },
    {
        "section": "Labour Clearance Applied (MOL)",
        "submission_date": "custom_last_submission_laberclearance",
        "attachments": [
            ("Company Commercial Registration (CR) Copy", "company_commercial_registration_cr_copy"),
            ("Omanisation Compliance Certificate", "omanisation_compliance_certificate"),
            ("Candidate Passport Copy", "candidate_passport_copy"),
            ("Attested Educational / Trade Certificate Copy", "attested_educational__trade_certificate_copy"),
        ],
    },
    {
        "section": "Labour Clearance Approved",
        "submission_date": "custom_last_submission_labouraproved",
        "attachments": [
            ("Official Ministry of Labour (MOL) Work Permit", "official_ministry_of_labour_mol_work_permit"),
        ],
    },
    {
        "section": "GAMCA Medical & PCC",
        "submission_date": "custom_last_submission_gamca",
        "attachments": [
            ("Wafid / GAMCA Medical Slip", "wafid__gamca_medical_slip"),
            ("Wafid / GAMCA Medical Fitness Certificate", "wafid__gamca_medical_fitness_certificate"),
            ("Approved Labour Clearance Copy", "approved_labour_clearance_copy"),
        ],
    },
    {
        "section": "Employment Visa Applied (ROP)",
        "submission_date": "custom_last_submission_employment_visaapp",
        "attachments": [
            ("ROP eVisa Application Form Receipt", "rop_evisa_application_form_receipt"),
            ("Approved Labour Clearance Certificate", "approved_labour_clearance_certificate"),
            ("GAMCA Medical Fitness Report Copy", "gamca_medical_fitness_report_copy"),
            ("Candidate Passport Scan with Digital White Background Photo", "candidate_passport_scan_with_digital_white_background_photo"),
        ],
    },
    {
        "section": "Employment Visa Issued",
        "submission_date": "custom_last_submission_employment_visaissued",
        "attachments": [
            ("Official ROP Employment eVisa Copy", "official_rop_employment_evisa_copy"),
        ],
    },
    {
        "section": "Emigration & Flight Booked",
        "submission_date": "custom_last_submission_emigration_flight",
        "attachments": [
            ("Confirmed One Way Flight Ticket", "confirmed_one_way_flight_ticket"),
            ("Printed Employment eVisa Copy", "printed_employment_evisa_copy"),
        ],
    },
    {
        "section": "Arrived in Oman (Medical & Biometrics)",
        "submission_date": "custom_last_submission_arrived_oman",
        "attachments": [
            ("Passport Page Scan with Oman Entry Stamp", "passport_page_scan_with_oman_entry_stamp"),
            ("Oman Ministry of Health (MOH) Local Medical Fitness Certificate", "oman_ministry_of_health_moh_local_medical_fitness_certificate"),
            ("ROP Biometric / Fingerprint Registration Receipt", "rop_biometric__fingerprint_registration_receipt"),
            ("Blood Group Certificate", "blood_group_certificate"),
        ],
    },
    {
        "section": "Resident Card Issued (Completed)",
        "submission_date": "custom_last_submission_residential_cardissued",
        "attachments": [
            ("Omani Resident Card (Civil ID) Copy", "omani_resident_card_civil_id_copy"),
            ("Ministry of Labour Attested Local Employment Contract", "ministry_of_labour_attested_local_employment_contract"),
        ],
    },
]


# ============================================================
# SECTION 2: REPORT EXECUTION
# ============================================================

def execute(filters=None):
    filters = filters or {}

    columns = get_columns()
    data = get_report_data(filters)

    return columns, data


# ============================================================
# SECTION 3: REPORT COLUMNS
# ============================================================


def get_columns():
    return [
        {
            "label": _("Record ID"),
            "fieldname": "visa_and_pro",
            "fieldtype": "Link",
            "options": "Visa and PRO",
            "width": 180,
        },
        {
            "label": _("Candidate Name"),
            "fieldname": "candidate_name",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": _("Stage"),
            "fieldname": "stage",
            "fieldtype": "Data",
            "width": 220,
        },
        {
            "label": _("Attachment Name"),
            "fieldname": "attachment_name",
            "fieldtype": "Data",
            "width": 330,
        },
        {
            "label": _("Status"),
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 110,
        },
        {
            "label": _("Last Submission Date"),
            "fieldname": "last_submission_date",
            "fieldtype": "Date",
            "width": 150,
        },
        {
            "label": _("Days Left"),
            "fieldname": "days_left",
            "fieldtype": "Int",
            "width": 110,
        },
    ]

# ============================================================
# SECTION 4: CANDIDATE NAME GENERATION
# ============================================================

def get_candidate_name(doc):
    name_parts = [
        doc.get("first_name"),
        doc.get("last_name"),
        doc.get("middle_name"),
    ]

    return " ".join(
        str(part).strip()
        for part in name_parts
        if part and str(part).strip()
    )


# ============================================================
# SECTION 5: DAYS LEFT CALCULATION
# ============================================================

def calculate_days_left(submission_date):
    if not submission_date:
        return None

    today = getdate(nowdate())
    submission_date = getdate(submission_date)

    difference = date_diff(submission_date, today)

    # Future dates: include the submission date itself.
    if difference > 0:
        return difference + 1

    # Today or past dates: retain the actual signed difference.
    return difference


# ============================================================
# SECTION 6: FETCH VISA AND PRO RECORDS
# ============================================================

def get_report_data(filters):

    required_fields = {
        "name",
        "first_name",
        "last_name",
        "middle_name",
    }

    for section in SECTION_CONFIG:

        required_fields.add(section["submission_date"])

        for attachment_label, attachment_field in section["attachments"]:
            required_fields.add(attachment_field)

    document_filters = {}

    if filters.get("visa_and_pro"):
        document_filters["name"] = filters["visa_and_pro"]

    documents = frappe.get_list(
        "Visa and PRO",
        filters=document_filters,
        fields=sorted(required_fields),
        limit_page_length=0,
        order_by="modified desc",
    )

    data = []


# ============================================================
# SECTION 7: CHECK MISSING ATTACHMENTS
# ============================================================

    for doc in documents:

        candidate_name = get_candidate_name(doc)

        for section in SECTION_CONFIG:

            submission_date = doc.get(section["submission_date"])

            days_left = calculate_days_left(submission_date)

            for attachment_label, attachment_field in section["attachments"]:

                attachment_value = doc.get(attachment_field)

                # Include only missing attachments.
                if not attachment_value:

                   data.append({
    "visa_and_pro": doc.name,
    "candidate_name": candidate_name,
    "stage": section["section"],
    "attachment_name": attachment_label,
    "status": "Missing",
    "last_submission_date": submission_date,
    "days_left": days_left,
})
    return data

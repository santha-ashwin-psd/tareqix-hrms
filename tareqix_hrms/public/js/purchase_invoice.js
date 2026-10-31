// Purchase Invoice: limit the Employee dropdown on item rows to active employees
// of the vendor Company (the Company whose "Vendor (Supplier)" is this invoice's Supplier).

frappe.ui.form.on("Purchase Invoice", {
	setup(frm) {
		frm.vendor_companies = [];

		frm.set_query("employee", "items", () => {
			const filters = { status: "Active" };
			// No vendor Company found for this Supplier: do not restrict, so nothing gets blocked.
			if (frm.vendor_companies.length) {
				filters.company = ["in", frm.vendor_companies];
			}
			return { filters };
		});
	},

	refresh(frm) {
		tareqix_hrms_load_vendor_companies(frm);
	},

	supplier(frm) {
		tareqix_hrms_load_vendor_companies(frm);
	},
});

function tareqix_hrms_load_vendor_companies(frm) {
	if (!frm.doc.supplier) {
		frm.vendor_companies = [];
		return;
	}
	frappe.db
		.get_list("Company", { filters: { supplier: frm.doc.supplier }, pluck: "name", limit: 50 })
		.then((names) => {
			frm.vendor_companies = names || [];
		});
}
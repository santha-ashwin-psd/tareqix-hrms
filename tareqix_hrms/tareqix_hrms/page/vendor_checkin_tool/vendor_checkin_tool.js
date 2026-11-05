frappe.pages["vendor-checkin-tool"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Vendor Checkin Tool"),
		single_column: true,
	});
	wrapper.vendor_checkin_tool = new VendorCheckinTool(page);
};

class VendorCheckinTool {
	constructor(page) {
		this.page = page;
		this.employees = [];
		this.make_filters();
		this.make_body();
		this.page.set_primary_action(__("Create Checkins"), () => this.create_checkins());
		this.load();
	}

	make_filters() {
		const reload = () => this.load();
		this.date = this.page.add_field({
			fieldname: "date",
			label: __("Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			reqd: 1,
			change: reload,
		});
		this.vendor = this.page.add_field({
			fieldname: "vendor",
			label: __("Vendor (Supplier)"),
			fieldtype: "Link",
			options: "Supplier",
			change: reload,
		});
		this.company = this.page.add_field({
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			change: reload,
		});
		this.def_in = this.page.add_field({
			fieldname: "default_in",
			label: __("Default IN"),
			fieldtype: "Time",
		});
		this.def_out = this.page.add_field({
			fieldname: "default_out",
			label: __("Default OUT"),
			fieldtype: "Time",
		});
		this.page.add_inner_button(__("Fill Empty Rows with Defaults"), () => this.fill_defaults());
		this.page.add_inner_button(__("Clear All Times"), () => {
			this.body.find(".vct-in, .vct-out").val("");
		});
	}

	make_body() {
		this.body = $('<div class="vct-body"></div>').appendTo(this.page.main);
	}

	load() {
		const date = this.date.get_value();
		if (!date) return;
		frappe.call({
			method: "tareqix_hrms.utils.checkin_tool.get_vendor_employees",
			args: {
				date,
				vendor: this.vendor.get_value() || null,
				company: this.company.get_value() || null,
			},
			freeze: true,
			callback: (r) => {
				this.employees = r.message || [];
				this.render();
			},
		});
	}

	render() {
		if (!this.employees.length) {
			this.body.html(
				`<div class="text-muted text-center" style="padding: 40px;">${__(
					"No active vendor employees found for these filters."
				)}</div>`
			);
			return;
		}
		const esc = frappe.utils.escape_html;
		const date = this.date.get_value();
		const rows = this.employees
			.map(
				(e, i) => `
			<tr data-employee="${esc(e.employee)}">
				<td>${i + 1}</td>
				<td>${esc(e.employee)}</td>
				<td>${esc(e.employee_name || "")}</td>
				<td>${esc(e.vendor || "")}</td>
				<td><input type="date" class="form-control input-sm vct-date" value="${date}" max="${frappe.datetime.get_today()}" style="width: 150px;"></td>
				<td><input type="time" class="form-control input-sm vct-in" style="width: 130px;"></td>
				<td><input type="time" class="form-control input-sm vct-out" style="width: 130px;"></td>
				<td class="text-muted">${esc(e.existing || "")}</td>
				<td><button class="btn btn-xs btn-default vct-add" title="${__("Add another date for this employee")}">+</button></td>
			</tr>`
			)
			.join("");
		this.body.html(`
			<p class="text-muted small" style="margin: 10px 0;">
				${__("Enter IN and OUT time per employee. Change the Date on a row, or press + to add another date for the same employee. Empty rows are ignored. An OUT time earlier than the IN time is saved on the next day (night shift). Punches that already exist are skipped.")}
			</p>
			<div style="overflow-x: auto;">
				<table class="table table-bordered table-sm">
					<thead>
						<tr>
							<th>#</th><th>${__("Employee")}</th><th>${__("Name")}</th><th>${__("Vendor")}</th>
							<th>${__("Date")}</th><th>${__("IN Time")}</th><th>${__("OUT Time")}</th>
							<th>${__("Already Checked In (filter date)")}</th><th></th>
						</tr>
					</thead>
					<tbody>${rows}</tbody>
				</table>
			</div>`);

		// "+" copies the row for another date (one day earlier than the row it was copied from)
		this.body.off("click.vct").on("click.vct", ".vct-add", (ev) => {
			const $tr = $(ev.currentTarget).closest("tr");
			const $new = $tr.clone();
			$new.find(".vct-in, .vct-out").val("");
			$new.find("td").eq(7).text("");
			const d = $tr.find(".vct-date").val();
			if (d) $new.find(".vct-date").val(frappe.datetime.add_days(d, -1));
			$tr.after($new);
		});
	}

	fill_defaults() {
		const t_in = this.def_in.get_value();
		const t_out = this.def_out.get_value();
		if (!t_in && !t_out) {
			frappe.show_alert({ message: __("Set Default IN / OUT first"), indicator: "orange" });
			return;
		}
		const hhmm = (v) => (v ? v.substring(0, 5) : "");
		this.body.find("tbody tr").each((_, tr) => {
			const $in = $(tr).find(".vct-in");
			const $out = $(tr).find(".vct-out");
			if (!$in.val() && t_in) $in.val(hhmm(t_in));
			if (!$out.val() && t_out) $out.val(hhmm(t_out));
		});
	}

	create_checkins() {
		const date = this.date.get_value();
		if (!date) {
			frappe.msgprint(__("Select a Date"));
			return;
		}
		const rows = [];
		this.body.find("tbody tr").each((_, tr) => {
			const $tr = $(tr);
			const in_time = $tr.find(".vct-in").val();
			const out_time = $tr.find(".vct-out").val();
			if (in_time || out_time) {
				rows.push({
					employee: $tr.attr("data-employee"),
					date: $tr.find(".vct-date").val() || date,
					in_time,
					out_time,
				});
			}
		});
		if (!rows.length) {
			frappe.msgprint(__("Enter at least one IN time."));
			return;
		}
		frappe.confirm(
			__("Create checkins for {0} row(s)?", [rows.length]),
			() => {
				frappe.call({
					method: "tareqix_hrms.utils.checkin_tool.create_checkins",
					type: "POST",
					args: { date, rows },
					freeze: true,
					freeze_message: __("Creating checkins..."),
					callback: (r) => {
						const res = r.message || {};
						let msg = __("Created: {0}, Skipped (already exist): {1}", [
							res.created || 0,
							res.skipped || 0,
						]);
						if ((res.errors || []).length) {
							const esc = frappe.utils.escape_html;
							msg +=
								"<br><br><b>" +
								__("Errors") +
								"</b><ul>" +
								res.errors.map((e) => `<li>${esc(e.employee)}: ${esc(e.error)}</li>`).join("") +
								"</ul>";
						}
						frappe.msgprint({
							title: __("Vendor Checkin Tool"),
							message: msg,
							indicator: (res.errors || []).length ? "orange" : "green",
						});
						this.load();
					},
				});
			}
		);
	}
}
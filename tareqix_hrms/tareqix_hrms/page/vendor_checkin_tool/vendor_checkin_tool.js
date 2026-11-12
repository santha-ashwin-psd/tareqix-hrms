// frappe.pages["vendor-checkin-tool"].on_page_load = function (wrapper) {
// 	const page = frappe.ui.make_app_page({
// 		parent: wrapper,
// 		title: __("Vendor Checkin Tool"),
// 		single_column: true,
// 	});
// 	wrapper.vendor_checkin_tool = new VendorCheckinTool(page);
// };

// class VendorCheckinTool {
// 	constructor(page) {
// 		this.page = page;
// 		this.employees = [];
// 		this.make_filters();
// 		this.make_body();
// 		this.page.set_primary_action(__("Create Checkins"), () => this.create_checkins());
// 		this.load();
// 	}

// 	make_filters() {
// 		const reload = () => this.load();
// 		this.date = this.page.add_field({
// 			fieldname: "date",
// 			label: __("Date"),
// 			fieldtype: "Date",
// 			default: frappe.datetime.get_today(),
// 			reqd: 1,
// 			change: reload,
// 		});
// 		this.vendor = this.page.add_field({
// 			fieldname: "vendor",
// 			label: __("Vendor (Supplier)"),
// 			fieldtype: "Link",
// 			options: "Supplier",
// 			change: reload,
// 		});
// 		this.company = this.page.add_field({
// 			fieldname: "company",
// 			label: __("Company"),
// 			fieldtype: "Link",
// 			options: "Company",
// 			change: reload,
// 		});
// 		this.def_in = this.page.add_field({
// 			fieldname: "default_in",
// 			label: __("Default IN"),
// 			fieldtype: "Time",
// 		});
// 		this.def_out = this.page.add_field({
// 			fieldname: "default_out",
// 			label: __("Default OUT"),
// 			fieldtype: "Time",
// 		});
// 		this.page.add_inner_button(__("Fill Empty Rows with Defaults"), () => this.fill_defaults());
// 		this.page.add_inner_button(__("Clear All Times"), () => {
// 			this.body.find(".vct-in, .vct-out").val("");
// 		});
// 	}

// 	make_body() {
// 		this.body = $('<div class="vct-body"></div>').appendTo(this.page.main);
// 	}

// 	load() {
// 		const date = this.date.get_value();
// 		if (!date) return;
// 		frappe.call({
// 			method: "tareqix_hrms.utils.checkin_tool.get_vendor_employees",
// 			args: {
// 				date,
// 				vendor: this.vendor.get_value() || null,
// 				company: this.company.get_value() || null,
// 			},
// 			freeze: true,
// 			callback: (r) => {
// 				this.employees = r.message || [];
// 				this.render();
// 			},
// 		});
// 	}

// 	render() {
// 		if (!this.employees.length) {
// 			this.body.html(
// 				`<div class="text-muted text-center" style="padding: 40px;">${__(
// 					"No active vendor employees found for these filters."
// 				)}</div>`
// 			);
// 			return;
// 		}
// 		const esc = frappe.utils.escape_html;
// 		const date = this.date.get_value();
// 		const rows = this.employees
// 			.map(
// 				(e, i) => `
// 			<tr data-employee="${esc(e.employee)}">
// 				<td>${i + 1}</td>
// 				<td>${esc(e.employee)}</td>
// 				<td>${esc(e.employee_name || "")}</td>
// 				<td>${esc(e.vendor || "")}</td>
// 				<td><input type="date" class="form-control input-sm vct-date" value="${date}" max="${frappe.datetime.get_today()}" style="width: 150px;"></td>
// 				<td><input type="time" class="form-control input-sm vct-in" style="width: 130px;"></td>
// 				<td><input type="time" class="form-control input-sm vct-out" style="width: 130px;"></td>
// 				<td class="text-muted">${esc(e.existing || "")}</td>
// 				<td><button class="btn btn-xs btn-default vct-add" title="${__("Add another date for this employee")}">+</button></td>
// 			</tr>`
// 			)
// 			.join("");
// 		this.body.html(`
// 			<p class="text-muted small" style="margin: 10px 0;">
// 				${__("Enter IN and OUT time per employee. Change the Date on a row, or press + to add another date for the same employee. Empty rows are ignored. An OUT time earlier than the IN time is saved on the next day (night shift). Punches that already exist are skipped.")}
// 			</p>
// 			<div style="overflow-x: auto;">
// 				<table class="table table-bordered table-sm">
// 					<thead>
// 						<tr>
// 							<th>#</th><th>${__("Employee")}</th><th>${__("Name")}</th><th>${__("Vendor")}</th>
// 							<th>${__("Date")}</th><th>${__("IN Time")}</th><th>${__("OUT Time")}</th>
// 							<th>${__("Already Checked In (filter date)")}</th><th></th>
// 						</tr>
// 					</thead>
// 					<tbody>${rows}</tbody>
// 				</table>
// 			</div>`);

// 		// "+" copies the row for another date (one day earlier than the row it was copied from)
// 		this.body.off("click.vct").on("click.vct", ".vct-add", (ev) => {
// 			const $tr = $(ev.currentTarget).closest("tr");
// 			const $new = $tr.clone();
// 			$new.find(".vct-in, .vct-out").val("");
// 			$new.find("td").eq(7).text("");
// 			const d = $tr.find(".vct-date").val();
// 			if (d) $new.find(".vct-date").val(frappe.datetime.add_days(d, -1));
// 			$tr.after($new);
// 		});
// 	}

// 	fill_defaults() {
// 		const t_in = this.def_in.get_value();
// 		const t_out = this.def_out.get_value();
// 		if (!t_in && !t_out) {
// 			frappe.show_alert({ message: __("Set Default IN / OUT first"), indicator: "orange" });
// 			return;
// 		}
// 		const hhmm = (v) => (v ? v.substring(0, 5) : "");
// 		this.body.find("tbody tr").each((_, tr) => {
// 			const $in = $(tr).find(".vct-in");
// 			const $out = $(tr).find(".vct-out");
// 			if (!$in.val() && t_in) $in.val(hhmm(t_in));
// 			if (!$out.val() && t_out) $out.val(hhmm(t_out));
// 		});
// 	}

// 	create_checkins() {
// 		const date = this.date.get_value();
// 		if (!date) {
// 			frappe.msgprint(__("Select a Date"));
// 			return;
// 		}
// 		const rows = [];
// 		this.body.find("tbody tr").each((_, tr) => {
// 			const $tr = $(tr);
// 			const in_time = $tr.find(".vct-in").val();
// 			const out_time = $tr.find(".vct-out").val();
// 			if (in_time || out_time) {
// 				rows.push({
// 					employee: $tr.attr("data-employee"),
// 					date: $tr.find(".vct-date").val() || date,
// 					in_time,
// 					out_time,
// 				});
// 			}
// 		});
// 		if (!rows.length) {
// 			frappe.msgprint(__("Enter at least one IN time."));
// 			return;
// 		}
// 		frappe.confirm(
// 			__("Create checkins for {0} row(s)?", [rows.length]),
// 			() => {
// 				frappe.call({
// 					method: "tareqix_hrms.utils.checkin_tool.create_checkins",
// 					type: "POST",
// 					args: { date, rows },
// 					freeze: true,
// 					freeze_message: __("Creating checkins..."),
// 					callback: (r) => {
// 						const res = r.message || {};
// 						let msg = __("Created: {0}, Skipped (already exist): {1}", [
// 							res.created || 0,
// 							res.skipped || 0,
// 						]);
// 						if ((res.errors || []).length) {
// 							const esc = frappe.utils.escape_html;
// 							msg +=
// 								"<br><br><b>" +
// 								__("Errors") +
// 								"</b><ul>" +
// 								res.errors.map((e) => `<li>${esc(e.employee)}: ${esc(e.error)}</li>`).join("") +
// 								"</ul>";
// 						}
// 						frappe.msgprint({
// 							title: __("Vendor Checkin Tool"),
// 							message: msg,
// 							indicator: (res.errors || []).length ? "orange" : "green",
// 						});
// 						this.load();
// 					},
// 				});
// 			}
// 		);
// 	}
// }
































//Updated













/* =========================================================
   SECTION 1: PAGE INITIALIZATION
========================================================= */

frappe.pages["vendor-checkin-tool"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Vendor Checkin Tool"),
		single_column: true,
	});
	wrapper.vendor_checkin_tool = new VendorCheckinTool(page);
};


/* =========================================================
   SECTION 2: MAIN CLASS AND INITIALIZATION
========================================================= */

class VendorCheckinTool {
	constructor(page) {
		this.page = page;
		this.employees = [];
		this.make_filters();
		this.make_body();
		this.bind_events();
		this.page.set_primary_action(__("Create Checkins"), () => this.create_checkins());
		this.load();
	}


/* =========================================================
   SECTION 3: FILTERS AND BUTTONS
========================================================= */

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


/* =========================================================
   SECTION 4: BODY CREATION
========================================================= */

	make_body() {
		this.body = $('<div class="vct-body"></div>').appendTo(this.page.main);
	}


/* =========================================================
   SECTION 5: LOAD EMPLOYEE DATA
========================================================= */

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


// /* =========================================================
//    SECTION 6: RENDER EMPLOYEE TABLE
//    Includes IN, OUT and Rest Hours columns
// ========================================================= */

// 	render() {
// 		if (!this.employees.length) {
// 			this.body.html(
// 				`<div class="text-muted text-center" style="padding: 40px;">${__(
// 					"No active vendor employees found for these filters."
// 				)}</div>`
// 			);
// 			return;
// 		}

// 		const esc = frappe.utils.escape_html;
// 		const date = this.date.get_value();

// 		const rows = this.employees
// 			.map(
// 				(e, i) => `
// 		<tr data-employee="${esc(e.employee)}">
// 			<td>${i + 1}</td>
// 			<td>${esc(e.employee)}</td>
// 			<td>${esc(e.employee_name || "")}</td>
// 			<td>${esc(e.vendor || "")}</td>

// 			<td>
// 				<input type="date" class="form-control input-sm vct-date"
// 					value="${date}"
// 					max="${frappe.datetime.get_today()}"
// 					style="width: 150px;">
// 			</td>

// 			<td>
// 				<input type="time" class="form-control input-sm vct-in"
// 					style="width: 130px;">
// 			</td>

// 			<td>
// 				<input type="time" class="form-control input-sm vct-out"
// 					style="width: 130px;">
// 			</td>

// 			<td>
// 				<input type="number" class="form-control input-sm vct-rest-hours"
// 					min="0" step="0.01" placeholder="Hours"
// 					style="width: 110px;">
// 			</td>

// 			<td class="text-muted">${esc(e.existing || "")}</td>

// 			<td style="white-space: nowrap;">
// 				<button class="btn btn-xs btn-default vct-add"
// 					title="${__("Add another date for this employee")}">+</button>

// 				<button class="btn btn-xs btn-danger vct-remove"
// 					title="${__("Remove this row")}"
// 					style="margin-left: 4px;">−</button>
// 			</td>
// 		</tr>`
// 			)
// 			.join("");

// 		this.body.html(`
// 		<p class="text-muted small" style="margin: 10px 0;">
// 			${__("Enter IN and OUT time per employee. Enter Rest Hours where required. Change the Date on a row, or press + to add another date for the same employee. Empty rows are ignored. An OUT time earlier than the IN time is saved on the next day (night shift). Punches that already exist are skipped.")}
// 		</p>

// 		<div style="overflow-x: auto;">
// 			<table class="table table-bordered table-sm">
// 				<thead>
// 					<tr>
// 						<th>#</th>
// 						<th>${__("Employee")}</th>
// 						<th>${__("Name")}</th>
// 						<th>${__("Vendor")}</th>
// 						<th>${__("Date")}</th>
// 						<th>${__("IN Time")}</th>
// 						<th>${__("OUT Time")}</th>
// 						<th>${__("Rest Hours")}</th>
// 						<th>${__("Already Checked In (filter date)")}</th>
// 						<th>${__("Actions")}</th>
// 					</tr>
// 				</thead>

// 				<tbody>${rows}</tbody>
// 			</table>
// 		</div>`);




/* =========================================================
   SECTION 6: RENDER EMPLOYEE TABLE
   Includes IN, OUT buttons and Rest Hours clock button
========================================================= */

	// render() {
	// 	if (!this.employees.length) {
	// 		this.body.html(
	// 			`<div class="text-muted text-center" style="padding: 40px;">${__(
	// 				"No active vendor employees found for these filters."
	// 			)}</div>`
	// 		);
	// 		return;
	// 	}

	// 	const esc = frappe.utils.escape_html;
	// 	const date = this.date.get_value();

	// 	const rows = this.employees
	// 		.map(
	// 			(e, i) => `
	// 	<tr data-employee="${esc(e.employee)}">
	// 		<td>${i + 1}</td>
	// 		<td>${esc(e.employee)}</td>
	// 		<td>${esc(e.employee_name || "")}</td>
	// 		<td>${esc(e.vendor || "")}</td>

	// 		<td>
	// 			<input type="date" class="form-control input-sm vct-date"
	// 				value="${date}"
	// 				max="${frappe.datetime.get_today()}"
	// 				style="width: 150px;">
	// 		</td>

	// 		<td>
	// 			<input type="hidden" class="vct-in">
	// 			<button type="button"
	// 				class="btn btn-default btn-sm vct-time-btn"
	// 				data-time-type="in"
	// 				style="width: 130px;">
	// 				IN - Select
	// 			</button>
	// 		</td>

	// 		<td>
	// 			<input type="hidden" class="vct-out">
	// 			<button type="button"
	// 				class="btn btn-default btn-sm vct-time-btn"
	// 				data-time-type="out"
	// 				style="width: 130px;">
	// 				OUT - Select
	// 			</button>
	// 		</td>

	// 		<td>
	// 			<input type="hidden" class="vct-rest-hours">
	// 			<button type="button"
	// 				class="btn btn-default btn-sm vct-rest-btn"
	// 				data-time-type="rest"
	// 				style="width: 130px;">
	// 				REST - Select
	// 			</button>
	// 		</td>

	// 		<td class="text-muted">${esc(e.existing || "")}</td>

	// 		<td style="white-space: nowrap;">
	// 			<button class="btn btn-xs btn-default vct-add"
	// 				title="${__("Add another date for this employee")}">+</button>

	// 			<button class="btn btn-xs btn-danger vct-remove"
	// 				title="${__("Remove this row")}"
	// 				style="margin-left: 4px;">−</button>
	// 		</td>
	// 	</tr>`
	// 		)
	// 		.join("");

	// 	this.body.html(`
	// 	<p class="text-muted small" style="margin: 10px 0;">
	// 		${__("Enter IN and OUT time per employee. Select Rest Hours where required. Change the Date on a row, or press + to add another date for the same employee. Empty rows are ignored. An OUT time earlier than the IN time is saved on the next day (night shift). Punches that already exist are skipped.")}
	// 	</p>

	// 	<div style="overflow-x: auto;">
	// 		<table class="table table-bordered table-sm">
	// 			<thead>
	// 				<tr>
	// 					<th>#</th>
	// 					<th>${__("Employee")}</th>
	// 					<th>${__("Name")}</th>
	// 					<th>${__("Vendor")}</th>
	// 					<th>${__("Date")}</th>
	// 					<th>${__("IN Time")}</th>
	// 					<th>${__("OUT Time")}</th>
	// 					<th>${__("Rest Hours")}</th>
	// 					<th>${__("Already Checked In (filter date)")}</th>
	// 					<th>${__("Actions")}</th>
	// 				</tr>
	// 			</thead>

	// 			<tbody>${rows}</tbody>
	// 		</table>
	// 	</div>`);
	// }











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

	const formatTime = (value) => {
		if (!value) return "";

		const parts = value.split(":");
		let hour = parseInt(parts[0], 10);
		const minute = parts[1] || "00";
		const period = hour >= 12 ? "PM" : "AM";

		hour = hour % 12 || 12;

		return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
	};

	const rows = this.employees
		.map((e, i) => {
			const inTime = e.shift_start_time || "";
			const outTime = e.shift_end_time || "";

			return `
	<tr data-employee="${esc(e.employee)}">
		<td>${i + 1}</td>
		<td>${esc(e.employee)}</td>
		<td>${esc(e.employee_name || "")}</td>
		<td>${esc(e.vendor || "")}</td>

		<td>
			<input type="date" class="form-control input-sm vct-date"
				value="${date}"
				max="${frappe.datetime.get_today()}"
				style="width: 150px;">
		</td>

		<td>
			<input type="hidden" class="vct-in" value="${esc(inTime)}">
			<button type="button"
				class="btn btn-default btn-sm vct-time-btn"
				data-time-type="in"
				style="width: 130px;">
				${inTime ? `IN - ${formatTime(inTime)}` : "IN - Select"}
			</button>
		</td>

		<td>
			<input type="hidden" class="vct-out" value="${esc(outTime)}">
			<button type="button"
				class="btn btn-default btn-sm vct-time-btn"
				data-time-type="out"
				style="width: 130px;">
				${outTime ? `OUT - ${formatTime(outTime)}` : "OUT - Select"}
			</button>
		</td>

		<td>
			<input type="hidden" class="vct-rest-hours">
			<button type="button"
				class="btn btn-default btn-sm vct-rest-btn"
				data-time-type="rest"
				style="width: 130px;">
				REST - Select
			</button>
		</td>

		<td class="text-muted">${esc(e.existing || "")}</td>

		<td style="white-space: nowrap;">
			<button class="btn btn-xs btn-default vct-add"
				title="${__("Add another date for this employee")}">+</button>

			<button class="btn btn-xs btn-danger vct-remove"
				title="${__("Remove this row")}"
				style="margin-left: 4px;">−</button>
		</td>
	</tr>`;
		})
		.join("");

	this.body.html(`
	<p class="text-muted small" style="margin: 10px 0;">
		${__("Enter IN and OUT time per employee. Select Rest Hours where required. Change the Date on a row, or press + to add another date for the same employee. Empty rows are ignored. An OUT time earlier than the IN time is saved on the next day (night shift). Punches that already exist are skipped.")}
	</p>

	<div style="overflow-x: auto;">
		<table class="table table-bordered table-sm">
			<thead>
				<tr>
					<th>#</th>
					<th>${__("Employee")}</th>
					<th>${__("Name")}</th>
					<th>${__("Vendor")}</th>
					<th>${__("Date")}</th>
					<th>${__("IN Time")}</th>
					<th>${__("OUT Time")}</th>
					<th>${__("Rest Hours")}</th>
					<th>${__("Already Checked In (filter date)")}</th>
					<th>${__("Actions")}</th>
				</tr>
			</thead>

			<tbody>${rows}</tbody>
		</table>
	</div>`);
}



// /* =========================================================
//    SECTION 7: ADD ROW (+) AND REMOVE ROW (−)
// ========================================================= */

// 		this.body.off("click.vct");

// 		// PLUS: Add another date for the same employee
// 		this.body.on("click.vct", ".vct-add", (ev) => {
// 			const $tr = $(ev.currentTarget).closest("tr");
// 			const $new = $tr.clone();

// 			// Clear time and Rest Hours fields in the new row
// 			$new.find(".vct-in, .vct-out, .vct-rest-hours").val("");

// 			// Clear existing check-in information
// 			$new.find("td").eq(8).text("");

// 			// Set the new date one day earlier
// 			const d = $tr.find(".vct-date").val();

// 			if (d) {
// 				$new.find(".vct-date").val(frappe.datetime.add_days(d, -1));
// 			}

// 			$tr.after($new);
// 		});

// 		// MINUS: Remove only the selected row
// 		this.body.on("click.vct", ".vct-remove", (ev) => {
// 			$(ev.currentTarget).closest("tr").remove();
// 		});
// 	}






/* =========================================================
   SECTION 7: ADD ROW (+), REMOVE ROW (−)
   AND IN / OUT / REST HOURS TIME PICKER BUTTONS
========================================================= */

bind_events() {

	this.body.off("click.vct");

	// PLUS: Add another date for the same employee
	this.body.on("click.vct", ".vct-add", (ev) => {

		const $tr = $(ev.currentTarget).closest("tr");
		const $new = $tr.clone();

		// Clear IN, OUT and Rest Hours fields
		$new.find(".vct-in, .vct-out, .vct-rest-hours").val("");

		// Reset IN and OUT button labels
		$new.find(".vct-time-btn[data-time-type='in']").text("IN - Select");
		$new.find(".vct-time-btn[data-time-type='out']").text("OUT - Select");

		// Reset Rest Hours button label
		$new.find(".vct-rest-btn").text("REST - Select");

		// Clear existing check-in information
		$new.find("td").eq(8).text("");

		// Set the new date one day earlier
		const d = $tr.find(".vct-date").val();

		if (d) {
			$new.find(".vct-date").val(frappe.datetime.add_days(d, -1));
		}

		$tr.after($new);
	});

	// MINUS: Remove only the selected row
	this.body.on("click.vct", ".vct-remove", (ev) => {
		$(ev.currentTarget).closest("tr").remove();
	});

	// IN / OUT: Open custom time picker
	this.body.on("click.vct", ".vct-time-btn", (ev) => {

		const $btn = $(ev.currentTarget);
		const $tr = $btn.closest("tr");

		const type = $btn.attr("data-time-type");
		const $input = $tr.find(".vct-" + type);

		this.open_time_picker($input, $btn, type);
	});

	// REST HOURS: Open custom duration picker
	this.body.on("click.vct", ".vct-rest-btn", (ev) => {

		const $btn = $(ev.currentTarget);
		const $tr = $btn.closest("tr");

		const $input = $tr.find(".vct-rest-hours");

		this.open_time_picker($input, $btn, "rest");
	});

}





/* =========================================================
   SECTION 7A: CUSTOM BLACK & WHITE TIME PICKER

   IN / OUT:
   1. Hour selection (1-12)
   2. Minute selection (00-55, intervals of 5)
   3. Manual hour and minute entry
   4. AM / PM selection

   REST:
   1. Hour selection (1-12 on clock)
   2. Minute selection (00-55, intervals of 5)
   3. Manual hour entry (00-23)
   4. Manual minute entry (00-59)
   5. No AM / PM
   6. Saves as HH:MM:00
========================================================= */

open_time_picker($input, $btn, type) {

    $(".vct-time-overlay").remove();

    const is_rest = type === "rest";

    let hour = is_rest ? 0 : 9;
    let minute = 0;
    let period = "AM";
    let selection_mode = "hour";

    // Load previously selected time or duration
    const existing = $input.val();

    if (existing) {

        const parts = existing.split(":");
        const h = parseInt(parts[0], 10);

        minute = parseInt(parts[1], 10) || 0;

        if (is_rest) {
            hour = Number.isInteger(h) ? h : 0;
        } else {
            period = h >= 12 ? "PM" : "AM";
            hour = h % 12 || 12;
        }
    }

    const overlay = $(`
        <div class="vct-time-overlay">

            <div class="vct-time-dialog">

                <div class="vct-time-title">
                    SELECT HOUR
                </div>

                <div class="vct-time-display">

                    <input type="text"
                        class="vct-hour"
                        inputmode="numeric"
                        maxlength="2"
                        autocomplete="off"
                        value="${String(hour).padStart(2, "0")}">

                    <span class="vct-time-colon">:</span>

                    <input type="text"
                        class="vct-minute"
                        inputmode="numeric"
                        maxlength="2"
                        autocomplete="off"
                        value="${String(minute).padStart(2, "0")}">

                    <div class="vct-period">
                        <button type="button" class="vct-am">AM</button>
                        <button type="button" class="vct-pm">PM</button>
                    </div>

                </div>

                <div class="vct-clock"></div>

                <div class="vct-time-actions">

                    <button type="button" class="vct-cancel">
                        CANCEL
                    </button>

                    <button type="button" class="vct-ok">
                        OK
                    </button>

                </div>

            </div>

        </div>
    `);

    $("body").append(overlay);

    const dialog = overlay.find(".vct-time-dialog");

    // =========================================================
    // STYLE OK AND CANCEL BUTTONS ONLY
    // =========================================================

    dialog.find(".vct-time-actions").css({
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "22px"
    });

    dialog.find(".vct-time-actions button").css({
        minWidth: "95px",
        height: "38px",
        padding: "0 18px",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease"
    });

    dialog.find(".vct-cancel").css({
        background: "#ffffff",
        color: "#333333",
        border: "1px solid #d1d5db"
    });

    dialog.find(".vct-ok").css({
        background: "#222222",
        color: "#ffffff",
        border: "1px solid #222222"
    });

    // Continue with your existing code below...

    // =====================================================
    // BLACK AND WHITE DESIGN
    // =====================================================

    overlay.css({
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        backdropFilter: "blur(2px)"
    });

    dialog.css({
        width: "360px",
        maxWidth: "95vw",
        background: "#ffffff",
        color: "#111111",
        padding: "22px",
        border: "1px solid #dddddd",
        borderRadius: "12px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.22)"
    });

    overlay.find(".vct-time-title").css({
        fontSize: "11px",
        color: "#777777",
        marginBottom: "18px",
        letterSpacing: "1.5px",
        fontWeight: "600"
    });

    overlay.find(".vct-time-display").css({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        marginBottom: "22px"
    });

    overlay.find(".vct-hour, .vct-minute").css({
        width: "65px",
        height: "52px",
        fontSize: "27px",
        textAlign: "center",
        background: "#f1f1f1",
        color: "#111111",
        border: "1px solid #d5d5d5",
        borderRadius: "6px",
        outline: "none",
        fontWeight: "500",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)"
    });

    overlay.find(".vct-hour, .vct-minute").on("focus", function () {
        $(this).css({
            background: "#ffffff",
            border: "2px solid #222222"
        });
    });

    overlay.find(".vct-hour, .vct-minute").on("blur", function () {
        $(this).css({
            background: "#f1f1f1",
            border: "1px solid #d5d5d5"
        });
    });

    overlay.find(".vct-time-colon").css({
        fontSize: "28px",
        fontWeight: "bold"
    });

    // Hide AM / PM for Rest Hours
    if (is_rest) {
        overlay.find(".vct-period").hide();
    }

    overlay.find(".vct-period").css({
        display: "flex",
        flexDirection: "column",
        marginLeft: "5px",
        gap: "2px"
    });

    overlay.find(".vct-period button").css({
        width: "43px",
        height: "26px",
        background: "#ffffff",
        color: "#111111",
        border: "1px solid #cccccc",
        fontSize: "12px",
        cursor: "pointer",
        transition: "all 0.15s"
    });

    const update_period = () => {

        overlay.find(".vct-am, .vct-pm").css({
            background: "#ffffff",
            color: "#111111",
            fontWeight: "normal"
        });

        overlay.find(".vct-" + period.toLowerCase()).css({
            background: "#222222",
            color: "#ffffff",
            fontWeight: "bold"
        });
    };

    if (!is_rest) {
        update_period();
    }

    // =====================================================
    // CLOCK DESIGN AND RENDERING
    // =====================================================

    overlay.find(".vct-clock").css({
        width: "220px",
        height: "220px",
        maxWidth: "100%",
        aspectRatio: "1",
        position: "relative",
        margin: "auto",
        borderRadius: "50%",
        background: "#f1f1f1",
        border: "1px solid #d0d0d0",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)"
    });

    const render_clock = () => {

        const is_hour = selection_mode === "hour";

        overlay.find(".vct-time-title").text(
            is_hour
                ? (is_rest ? "SELECT REST HOURS" : "SELECT HOUR")
                : (is_rest ? "SELECT REST MINUTES" : "SELECT MINUTE")
        );

        const numbers = Array.from({ length: 12 }, (_, i) => {

            const value = is_hour
                ? (i === 0 ? 12 : i)
                : i * 5;

            const angle = (i * 30 - 90) * Math.PI / 180;

            const left = 50 + 40 * Math.cos(angle);
            const top = 50 + 40 * Math.sin(angle);

            const selected = is_hour
                ? hour === value
                : minute === value;

            const display_value = is_hour
                ? value
                : String(value).padStart(2, "0");

            return `
                <button type="button"
                    class="vct-clock-number"
                    data-value="${value}"
                    style="
                        position:absolute;
                        left:${left}%;
                        top:${top}%;
                        transform:translate(-50%,-50%);
                        width:34px;
                        height:34px;
                        border:none;
                        border-radius:50%;
                        background:${selected ? "#222222" : "transparent"};
                        color:${selected ? "#ffffff" : "#111111"};
                        font-size:13px;
                        font-weight:${selected ? "bold" : "normal"};
                        cursor:pointer;
                        z-index:2;
                        transition:background 0.15s;
                    ">
                    ${display_value}
                </button>
            `;
        }).join("");

        const selected_index = is_hour
            ? (hour % 12)
            : Math.round(minute / 5) % 12;

        const hand_angle = selected_index * 30;

        const hand = `
            <div class="vct-clock-hand"
                style="
                    position:absolute;
                    width:2px;
                    height:40%;
                    left:50%;
                    top:10%;
                    background:#222222;
                    transform-origin:50% 100%;
                    transform:rotate(${hand_angle}deg);
                    border-radius:3px;
                    z-index:1;
                ">
            </div>
        `;

        overlay.find(".vct-clock").html(`
            ${hand}
            ${numbers}

            <div class="vct-clock-center"
                style="
                    position:absolute;
                    width:8px;
                    height:8px;
                    background:#222222;
                    border-radius:50%;
                    left:50%;
                    top:50%;
                    transform:translate(-50%,-50%);
                    z-index:3;
                ">
            </div>
        `);
    };

    render_clock();

    // =====================================================
    // CLOCK NUMBER SELECTION
    // =====================================================

    overlay.on("click", ".vct-clock-number", function () {

        const value = parseInt($(this).attr("data-value"), 10);

        if (selection_mode === "hour") {

            hour = value;

            overlay.find(".vct-hour").val(
                String(hour).padStart(2, "0")
            );

            selection_mode = "minute";

            render_clock();

        } else {

            minute = value;

            overlay.find(".vct-minute").val(
                String(minute).padStart(2, "0")
            );

            render_clock();
        }
    });

    // =====================================================
    // MANUAL HOUR ENTRY
    // =====================================================

    overlay.on("input", ".vct-hour", function () {

        const value = this.value.replace(/\D/g, "").slice(0, 2);

        this.value = value;

        const parsed = parseInt(value, 10);

        const max_hour = is_rest ? 23 : 12;
        const min_hour = is_rest ? 0 : 1;

        if (
            Number.isInteger(parsed) &&
            parsed >= min_hour &&
            parsed <= max_hour
        ) {
            hour = parsed;
            selection_mode = "hour";
            render_clock();
        }
    });

    // =====================================================
    // MANUAL MINUTE ENTRY
    // =====================================================

    overlay.on("input", ".vct-minute", function () {

        const value = this.value.replace(/\D/g, "").slice(0, 2);

        this.value = value;

        const parsed = parseInt(value, 10);

        if (
            Number.isInteger(parsed) &&
            parsed >= 0 &&
            parsed <= 59
        ) {
            minute = parsed;
            selection_mode = "minute";
            render_clock();
        }
    });

    // Clicking hour field switches to hour clock
    overlay.on("focus", ".vct-hour", function () {
        selection_mode = "hour";
        render_clock();
    });

    // Clicking minute field switches to minute clock
    overlay.on("focus", ".vct-minute", function () {
        selection_mode = "minute";
        render_clock();
    });

    // =====================================================
    // AM / PM SELECTION - IN / OUT ONLY
    // =====================================================

    if (!is_rest) {

        overlay.on("click", ".vct-am", function () {
            period = "AM";
            update_period();
        });

        overlay.on("click", ".vct-pm", function () {
            period = "PM";
            update_period();
        });
    }

    // =====================================================
    // CANCEL
    // =====================================================

    overlay.on("click", ".vct-cancel", function () {
        overlay.remove();
    });

    // =====================================================
    // OK: SAVE SELECTED TIME / DURATION
    // =====================================================

    overlay.on("click", ".vct-ok", () => {

        hour = parseInt(overlay.find(".vct-hour").val(), 10);
        minute = parseInt(overlay.find(".vct-minute").val(), 10);

        const min_hour = is_rest ? 0 : 1;
        const max_hour = is_rest ? 23 : 12;

        if (
            !Number.isInteger(hour) ||
            hour < min_hour ||
            hour > max_hour ||
            !Number.isInteger(minute) ||
            minute < 0 ||
            minute > 59
        ) {
            frappe.msgprint(
                __("Enter a valid hour and minute.")
            );
            return;
        }

        let saved_value;
        let display_time;

        if (is_rest) {

            // Duration format: HH:MM:SS
            saved_value =
                String(hour).padStart(2, "0") +
                ":" +
                String(minute).padStart(2, "0") +
                ":00";

            display_time =
                String(hour).padStart(2, "0") +
                ":" +
                String(minute).padStart(2, "0");

        } else {

            let hour24 = hour % 12;

            if (period === "PM") {
                hour24 += 12;
            }

            saved_value =
                String(hour24).padStart(2, "0") +
                ":" +
                String(minute).padStart(2, "0");

            display_time =
                String(hour).padStart(2, "0") +
                ":" +
                String(minute).padStart(2, "0") +
                " " +
                period;
        }

        $input.val(saved_value);

        $btn.text(
            (is_rest ? "REST" : type.toUpperCase()) +
            " - " +
            display_time
        );

        overlay.remove();
    });

}




/* =========================================================
   SECTION 8: FILL DEFAULT IN / OUT TIMES
========================================================= */

	fill_defaults() {
		const t_in = this.def_in.get_value();
		const t_out = this.def_out.get_value();

		if (!t_in && !t_out) {
			frappe.show_alert({
				message: __("Set Default IN / OUT first"),
				indicator: "orange",
			});
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


// /* =========================================================
//    SECTION 9: CREATE CHECKINS
//    Includes Rest Hours in submitted row data
// ========================================================= */

// 	create_checkins() {
// 		const date = this.date.get_value();

// 		if (!date) {
// 			frappe.msgprint(__("Select a Date"));
// 			return;
// 		}

// 		const rows = [];

// 		this.body.find("tbody tr").each((_, tr) => {
// 			const $tr = $(tr);

// 			const in_time = $tr.find(".vct-in").val();
// 			const out_time = $tr.find(".vct-out").val();
// 			const rest_hours = $tr.find(".vct-rest-hours").val();

// 			if (in_time || out_time) {
// 				rows.push({
// 					employee: $tr.attr("data-employee"),
// 					date: $tr.find(".vct-date").val() || date,
// 					in_time,
// 					out_time,
// 					rest_hours: rest_hours === "" ? null : parseFloat(rest_hours),
// 				});
// 			}
// 		});

// 		if (!rows.length) {
// 			frappe.msgprint(__("Enter at least one IN time."));
// 			return;
// 		}

// 		frappe.confirm(
// 			__("Create checkins for {0} row(s)?", [rows.length]),

// 			() => {
// 				frappe.call({
// 					method: "tareqix_hrms.utils.checkin_tool.create_checkins",
// 					type: "POST",
// 					args: { date, rows },
// 					freeze: true,
// 					freeze_message: __("Creating checkins..."),

// 					callback: (r) => {
// 						const res = r.message || {};

// 						let msg = __("Created: {0}, Skipped (already exist): {1}", [
// 							res.created || 0,
// 							res.skipped || 0,
// 						]);

// 						if ((res.errors || []).length) {
// 							const esc = frappe.utils.escape_html;

// 							msg +=
// 								"<br><br><b>" +
// 								__("Errors") +
// 								"</b><ul>" +
// 								res.errors.map((e) =>
// 									`<li>${esc(e.employee)}: ${esc(e.error)}</li>`
// 								).join("") +
// 								"</ul>";
// 						}

// 						frappe.msgprint({
// 							title: __("Vendor Checkin Tool"),
// 							message: msg,
// 							indicator: (res.errors || []).length ? "orange" : "green",
// 						});

// 						this.load();
// 					},
// 				});
// 			}
// 		);
// 	}
// }














/* =========================================================
   SECTION 9: CREATE CHECKINS
   Includes Rest Hours in submitted row data
========================================================= */

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
        const rest_hours = $tr.find(".vct-rest-hours").val();

        if (in_time || out_time) {

            rows.push({

                employee: $tr.attr("data-employee"),

                date: $tr.find(".vct-date").val() || date,

                in_time: in_time || null,

                out_time: out_time || null,

                // Time field format: HH:MM:SS
                // Example: 02:30:00
                rest_hours: rest_hours || null

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

                args: {
                    date,
                    rows
                },

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
                            res.errors.map((e) =>
                                `<li>${esc(e.employee)}: ${esc(e.error)}</li>`
                            ).join("") +
                            "</ul>";
                    }

                    frappe.msgprint({

                        title: __("Vendor Checkin Tool"),

                        message: msg,

                        indicator: (res.errors || []).length
                            ? "orange"
                            : "green",

                    });

                    this.load();
                },

            });
        }
    );
}



}
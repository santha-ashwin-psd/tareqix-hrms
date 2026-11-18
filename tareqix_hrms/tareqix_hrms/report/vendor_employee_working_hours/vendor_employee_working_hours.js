// frappe.query_reports["Vendor Employee Working Hours"] = {
// 	filters: [
// 		{
// 			fieldname: "from_date",
// 			label: __("From Date"),
// 			fieldtype: "Date",
// 			default: frappe.datetime.month_start(),
// 			reqd: 1,
// 		},
// 		{
// 			fieldname: "to_date",
// 			label: __("To Date"),
// 			fieldtype: "Date",
// 			default: frappe.datetime.month_end(),
// 			reqd: 1,
// 		},
// 		{
// 			fieldname: "vendor",
// 			label: __("Vendor (Supplier)"),
// 			fieldtype: "Link",
// 			options: "Supplier",
// 		},
// 		{
// 			fieldname: "company",
// 			label: __("Company"),
// 			fieldtype: "Link",
// 			options: "Company",
// 		},
// 		{
// 			fieldname: "employee",
// 			label: __("Employee"),
// 			fieldtype: "Link",
// 			options: "Employee",
// 		},
// 		{
// 			fieldname: "summary_view",
// 			label: __("Summary per Employee"),
// 			fieldtype: "Check",
// 			default: 0,
// 		},
// 	],

// 	formatter(value, row, column, data, default_formatter) {
// 		value = default_formatter(value, row, column, data);
// 		if (column.fieldname === "status" && data && data.status && data.status !== "OK") {
// 			value = `<span style="color: var(--red-500); font-weight: 600;">${data.status}</span>`;
// 		}
// 		return value;
// 	},
// };












// // ===========================================================================
// // Vendor Employee Working Hours  -  MODERN UI (UI ONLY)
// // Filters, defaults, report data, columns and summary logic are unchanged.
// // Everything UI-related lives in window.vewh_ui below.
// // ===========================================================================
// window.vewh_ui = (function () {
// 	var ROUTE = "query-report/Vendor Employee Working Hours";
// 	var STYLE_ID = "vewh-modern-style";
// 	var SHADOW = "box-shadow:0 1px 2px rgba(18,32,51,.04),0 8px 24px rgba(18,32,51,.06);";

// 	var ICON = {
// 		users: "<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#2B4BFF' stroke-width='2' stroke-linecap='round'><circle cx='9' cy='8' r='4'/><path d='M2 21c0-4 3-7 7-7s7 3 7 7M17 4a4 4 0 0 1 0 8M22 21c0-3-2-5.5-5-6.5'/></svg>",
// 		clock: "<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#0FA37F' stroke-width='2' stroke-linecap='round'><circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/></svg>",
// 		warn: "<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#E5484D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3l10 18H2z'/><path d='M12 10v5M12 18v.5'/></svg>",
// 	};
// 	var CARD_CLASS = ["c-blue", "c-green", "c-red"];
// 	var CARD_ICON = [ICON.users, ICON.clock, ICON.warn];

// 	function css() {
// 		var V = "body.vewh-active ";
// 		return `
// 		${V} { background: #EEF1F5 !important; }
// 		${V}.page-container, ${V}.page-body, ${V}.layout-main-section { background: transparent !important; }
// 		${V}{ font-family: 'DM Sans','Inter',-apple-system,'Segoe UI',sans-serif; }

// 		/* ---------- Header ---------- */
// 		${V}.page-head { background: #EEF1F5 !important; border-bottom: 0 !important; box-shadow: none !important; }
// 		${V}.page-head .page-head-content { padding-top: 22px; padding-bottom: 8px; }
// 		${V}.page-head .page-title { display: flex; align-items: center; gap: 16px; }
// 		${V}.page-head .page-title:before {
// 			content: ""; flex: none; width: 52px; height: 52px; border-radius: 15px;
// 			background: linear-gradient(135deg,#2B4BFF,#6C5CFF) center/26px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 7v5l3 2'/%3E%3C/svg%3E");
// 			box-shadow: 0 8px 20px rgba(43,75,255,.28);
// 		}
// 		${V}.page-head .title-text { font-size: 28px !important; font-weight: 700; letter-spacing: -.5px; color: #122033; max-width: none !important; overflow: visible !important; white-space: nowrap; }
// 		${V}.page-head .title-text:after {
// 			content: "Daily clock-in and clock-out records by vendor, site and employee";
// 			display: block; font-size: 13.5px; font-weight: 400; letter-spacing: 0; color: #6B778A; margin-top: 3px;
// 		}
// 		${V}.page-head .btn, ${V}.page-head .menu-btn-group .btn {
// 			height: 42px; border-radius: 12px; font-weight: 600; font-size: 14px;
// 			background: #fff !important; border: 1px solid #E3E8EF !important; color: #122033 !important; box-shadow: none !important;
// 		}
// 		${V}.page-head .btn-primary, ${V}.page-head .actions-btn-group .btn { background: #122033 !important; border-color: #122033 !important; color: #fff !important; }
// 		${V}.page-head .actions-btn-group .btn svg { stroke: #fff; }

// 		/* ---------- Filters ---------- */
// 		${V}.page-form {
// 			background: #fff !important; border: 0 !important; border-radius: 18px; padding: 18px 20px 8px !important;
// 			margin: 12px 15px 20px !important; ${SHADOW}
// 			display: flex; flex-wrap: wrap; gap: 0 14px; align-items: flex-end;
// 		}
// 		${V}.page-form > .form-group, ${V}.page-form .frappe-control { flex: 1 1 180px; min-width: 150px; margin-bottom: 12px !important; }
// 		${V}.page-form .control-label { display: block !important; font-size: 12px; font-weight: 600; color: #6B778A; margin-bottom: 6px; }
// 		${V}.page-form .form-control, ${V}.page-form .awesomplete > input, ${V}.page-form input.input-with-feedback {
// 			height: 44px !important; border-radius: 12px !important; font-weight: 600; font-size: 14.5px; color: #122033;
// 			background: #F5F7FA !important; border: 1px solid #E3E8EF !important; box-shadow: none !important; padding: 0 14px !important;
// 		}
// 		${V}.page-form .form-control::placeholder { color: #A3ADBB; font-weight: 500; }
// 		${V}.page-form .form-control:focus { background: #fff !important; border-color: #2B4BFF !important; box-shadow: 0 0 0 3px rgba(43,75,255,.15) !important; }
// 		${V}.page-form .frappe-control[data-fieldtype="Check"] { flex: 0 0 auto; align-self: flex-end; }
// 		${V}.page-form .checkbox label { display: flex; align-items: center; height: 44px; margin: 0; font-weight: 600; font-size: 14px; color: #122033; cursor: pointer; }
// 		${V}.page-form .checkbox .label-area { font-size: 14px; }
// 		${V}.page-form input[type="checkbox"] {
// 			-webkit-appearance: none; appearance: none; width: 42px !important; height: 24px !important; border-radius: 20px;
// 			background: #D5DBE5 !important; position: relative !important; border: 0 !important; margin: 0 10px 0 0 !important;
// 			box-shadow: none !important; cursor: pointer; transition: background .15s; flex: none;
// 		}
// 		${V}.page-form input[type="checkbox"]:after {
// 			content: "" !important; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; border-radius: 50%;
// 			background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: left .15s; background-image: none !important; border: 0 !important;
// 		}
// 		${V}.page-form input[type="checkbox"]:checked { background: #2B4BFF !important; }
// 		${V}.page-form input[type="checkbox"]:checked:after { left: 21px; }
// 		${V}.page-form input[type="checkbox"]:before { display: none !important; }

// 		/* ---------- Summary cards (custom render of the same summary data) ---------- */
// 		${V}.report-summary { display: none !important; }
// 		${V}.vewh-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin: 0 15px 20px; }
// 		${V}.vewh-card { display: flex; align-items: center; gap: 18px; background: #fff; border-radius: 20px; padding: 22px 24px; ${SHADOW} }
// 		${V}.vewh-ic { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; flex: none; }
// 		${V}.vewh-card .l { font-size: 14px; font-weight: 600; color: #6B778A; }
// 		${V}.vewh-card .v { font-size: 40px; font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-top: 2px; font-variant-numeric: tabular-nums; }
// 		${V}.c-blue .vewh-ic { background: #E6EBFF; } ${V}.c-blue .v { color: #2B4BFF; }
// 		${V}.c-green .vewh-ic { background: #E3F7F0; } ${V}.c-green .v { color: #0FA37F; }
// 		${V}.c-red .vewh-ic { background: #FDECEC; } ${V}.c-red .v { color: #E5484D; }

// 		/* ---------- Table card ---------- */
// 		${V}.vewh-thead {
// 			display: flex; justify-content: space-between; align-items: center; margin: 0 15px; padding: 18px 24px;
// 			background: #fff; border-radius: 20px 20px 0 0; border-bottom: 1px solid #E3E8EF;
// 		}
// 		${V}.vewh-thead b { font-size: 16px; font-weight: 700; color: #122033; }
// 		${V}.vewh-thead span { font-size: 13px; color: #6B778A; }
// 		${V}.report-wrapper { margin: 0 15px !important; background: #fff; border: 0 !important; border-radius: 0 0 20px 20px; overflow: hidden; ${SHADOW} }
// 		${V}.datatable { border: 0 !important; font-family: inherit; }
// 		${V}.datatable .dt-scrollable { border: 0 !important; }
// 		${V}.datatable .dt-header .dt-cell, ${V}.datatable .dt-header .dt-cell--header { background: #F8FAFC !important; border-color: #E3E8EF !important; }
// 		${V}.datatable .dt-header .dt-cell__content { font-size: 12.5px; font-weight: 700; color: #6B778A; padding: 12px 10px; }
// 		${V}.datatable .dt-row-filter .dt-cell { background: #fff !important; border-color: #E3E8EF !important; }
// 		${V}.datatable .dt-row-filter .dt-cell__content { padding: 8px 6px; }
// 		${V}.datatable .dt-filter, ${V}.datatable .dt-row-filter input {
// 			height: 30px !important; border-radius: 9px !important; background: #F5F7FA !important; border: 1px solid #E3E8EF !important; box-shadow: none !important;
// 		}
// 		${V}.datatable .dt-body .dt-cell { border-color: #EEF1F5 !important; background: #fff; height: 60px !important; }
// 		${V}.datatable .dt-body .dt-row:hover .dt-cell { background: #FAFBFF !important; }
// 		${V}.datatable .dt-body .dt-cell__content {
// 			height: 100%; display: flex !important; align-items: center; padding: 0 10px !important; font-size: 13.5px; font-weight: 500; color: #122033; white-space: nowrap;
// 		}
// 		${V}.datatable .dt-cell__content--right-aligned, ${V}.datatable .dt-cell__content[style*="text-align: right"] { justify-content: flex-end; font-variant-numeric: tabular-nums; }
// 		${V}.datatable .dt-body .dt-cell--col-0 .dt-cell__content { color: #A3ADBB; font-weight: 600; }

// 		/* ---------- Cell components (from formatter) ---------- */
// 		${V}.vewh-code { font-weight: 600; font-size: 12.5px; color: #2B4BFF; background: #EEF1FF; padding: 5px 10px; border-radius: 8px; }
// 		${V}.vewh-code a { color: #2B4BFF; }
// 		${V}.vewh-emp { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; }
// 		${V}.vewh-av { width: 30px; height: 30px; border-radius: 50%; background: #E6EBFF; color: #2B4BFF; display: inline-grid; place-items: center; font-size: 11.5px; font-weight: 700; flex: none; }
// 		${V}.vewh-site { background: #F1F4F8; padding: 5px 11px; border-radius: 8px; font-weight: 600; font-size: 12.5px; }
// 		${V}.vewh-na { color: #C3CBD6; }
// 		${V}.vewh-tm { display: inline-block; line-height: 1.3; font-variant-numeric: tabular-nums; font-weight: 600; }
// 		${V}.vewh-tm small { display: block; font-size: 11.5px; font-weight: 500; color: #6B778A; }
// 		${V}.vewh-tm.in { color: #0FA37F; }
// 		${V}.vewh-tm.out { color: #D9822B; }
// 		${V}.vewh-hrs { display: inline-block; width: 74px; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.2; }
// 		${V}.vewh-bar { height: 6px; border-radius: 6px; background: #EDF0F5; margin-top: 5px; overflow: hidden; }
// 		${V}.vewh-bar i { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg,#2B4BFF,#6C5CFF); }
// 		${V}.vewh-pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 12.5px; }
// 		${V}.vewh-pill:before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
// 		${V}.vewh-pill.is-ok { color: #0A7F61; background: #E3F7F0; }
// 		${V}.vewh-pill.is-issue { color: #E5484D; background: #FDECEC; }

// 		/* ---------- Footer text ---------- */
// 		${V}.report-footer, ${V}.datatable-footer, ${V}.report-wrapper + .text-muted, ${V}.layout-main-section > .text-muted {
// 			margin: 0 15px; padding: 12px 24px; font-size: 12.5px; color: #6B778A; background: #F8FAFC; border-radius: 0 0 20px 20px;
// 		}
// 		`;
// 	}

// 	function inject_styles() {
// 		var old = document.getElementById(STYLE_ID);
// 		if (old) old.parentNode.removeChild(old);
// 		var el = document.createElement("style");
// 		el.id = STYLE_ID;
// 		el.textContent = css();
// 		document.head.appendChild(el);
// 	}

// 	function is_this_report() {
// 		try {
// 			return (frappe.get_route_str() || "").indexOf(ROUTE) === 0 ||
// 				decodeURIComponent(frappe.get_route_str() || "").indexOf(ROUTE) === 0;
// 		} catch (e) { return false; }
// 	}

// 	function sync_body_class() {
// 		$("body").toggleClass("vewh-active", is_this_report());
// 	}

// 	function esc(s) { return frappe.utils.escape_html(String(s)); }

// 	// reads the summary values that Frappe already rendered (display only)
// 	function read_summary($scope) {
// 		var items = [];
// 		$scope.find(".report-summary .summary-stat").each(function () {
// 			var $s = $(this);
// 			var $v = $s.find(".summary-value").first();
// 			var label = ($s.find(".summary-label, .summary-title").first().text() || "").trim();
// 			if (!label) {
// 				var $c = $s.clone();
// 				$c.find(".summary-value").remove();
// 				label = $c.text().trim();
// 			}
// 			items.push({ label: label, value: $v.text().trim() });
// 		});
// 		return items;
// 	}

// 	function render_cards() {
// 		var qr = frappe.query_report;
// 		if (!qr || !qr.page) return;
// 		var $scope = $(qr.page.wrapper);
// 		var items = read_summary($scope);
// 		$scope.find(".vewh-cards, .vewh-thead").remove();

// 		var $anchor = $scope.find(".report-summary").first();
// 		if (!$anchor.length) $anchor = $scope.find(".report-wrapper").first();
// 		if (!$anchor.length) return;

// 		if (items.length) {
// 			var html = items.map(function (it, i) {
// 				return `<div class="vewh-card ${CARD_CLASS[i % 3]}">
// 					<div class="vewh-ic">${CARD_ICON[i % 3]}</div>
// 					<div><div class="l">${esc(it.label)}</div><div class="v">${esc(it.value)}</div></div>
// 				</div>`;
// 			}).join("");
// 			$(`<div class="vewh-cards">${html}</div>`).insertBefore($anchor);
// 		}

// 		var from = qr.get_filter_value("from_date"), to = qr.get_filter_value("to_date");
// 		var n = (qr.data || []).length;
// 		var range = from && to ? ` · ${frappe.datetime.str_to_user(from)} to ${frappe.datetime.str_to_user(to)}` : "";
// 		var $wrap = $scope.find(".report-wrapper").first();
// 		if ($wrap.length) {
// 			$(`<div class="vewh-thead"><b>Working hours</b><span>${n} records${range}</span></div>`).insertBefore($wrap);
// 		}
// 	}

// 	function set_placeholders(report) {
// 		try {
// 			var ph = { vendor: __("Select vendor"), company: __("Select company"), employee: __("Select employee") };
// 			Object.keys(ph).forEach(function (k) {
// 				var f = report.get_filter(k);
// 				if (f && f.$input) f.$input.attr("placeholder", ph[k]);
// 			});
// 		} catch (e) {}
// 	}

// 	// helper: does this column match any fieldname / label?
// 	function col(column, names) {
// 		var f = (column.fieldname || "").toLowerCase();
// 		var l = (column.label || "").toLowerCase();
// 		return names.some(function (n) { return f === n || l === n.replace(/_/g, " "); });
// 	}

// 	return {
// 		onload: function (report) {
// 			inject_styles();
// 			sync_body_class();
// 			$(document).off("page-change.vewh").on("page-change.vewh", sync_body_class);
// 			setTimeout(function () { set_placeholders(report); }, 400);
// 		},
// 		after_render: function () {
// 			sync_body_class();
// 			render_cards();
// 		},
// 		col: col,
// 		esc: esc,
// 	};
// })();

// frappe.query_reports["Vendor Employee Working Hours"] = {
// 	// ----- UI hooks only -----
// 	onload(report) {
// 		window.vewh_ui.onload(report);
// 	},
// 	after_datatable_render() {
// 		window.vewh_ui.after_render();
// 	},
// 	get_datatable_options(options) {
// 		return Object.assign(options, { cellHeight: 60 });
// 	},

// 	filters: [
// 		{
// 			fieldname: "from_date",
// 			label: __("From Date"),
// 			fieldtype: "Date",
// 			default: frappe.datetime.month_start(),
// 			reqd: 1,
// 		},
// 		{
// 			fieldname: "to_date",
// 			label: __("To Date"),
// 			fieldtype: "Date",
// 			default: frappe.datetime.month_end(),
// 			reqd: 1,
// 		},
// 		{
// 			fieldname: "vendor",
// 			label: __("Vendor (Supplier)"),
// 			fieldtype: "Link",
// 			options: "Supplier",
// 		},
// 		{
// 			fieldname: "company",
// 			label: __("Company"),
// 			fieldtype: "Link",
// 			options: "Company",
// 		},
// 		{
// 			fieldname: "employee",
// 			label: __("Employee"),
// 			fieldtype: "Link",
// 			options: "Employee",
// 		},
// 		{
// 			fieldname: "summary_view",
// 			label: __("Summary per Employee"),
// 			fieldtype: "Check",
// 			default: 0,
// 		},
// 	],

// 	formatter(value, row, column, data, default_formatter) {
// 		var U = window.vewh_ui;
// 		var raw = value;
// 		value = default_formatter(value, row, column, data);
// 		var empty = raw === null || raw === undefined || raw === "";
// 		var dash = '<span class="vewh-na">—</span>';

// 		// Status: original rule kept (status !== "OK" is an issue); OK / Present shown green
// 		if (column.fieldname === "status" && data && data.status) {
// 			var good = data.status === "OK" || data.status === "Present";
// 			return `<span class="vewh-pill ${good ? "is-ok" : "is-issue"}">${U.esc(data.status)}</span>`;
// 		}

// 		if (U.col(column, ["employee"])) {
// 			return empty ? value : `<span class="vewh-code">${value}</span>`;
// 		}
// 		if (U.col(column, ["employee_name"])) {
// 			if (empty) return value;
// 			var ini = String(raw).trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
// 			return `<span class="vewh-emp"><span class="vewh-av">${U.esc(ini)}</span>${value}</span>`;
// 		}
// 		if (U.col(column, ["site"])) {
// 			return empty ? dash : `<span class="vewh-site">${value}</span>`;
// 		}
// 		if (U.col(column, ["trade", "civil_id"])) {
// 			return empty ? dash : value;
// 		}
// 		if (U.col(column, ["first_in", "last_out"])) {
// 			if (empty) return dash; // no "Missing" tag
// 			var parts = String(raw).split(" ");
// 			var time = (parts[1] || parts[0]).slice(0, 5);
// 			var cls = U.col(column, ["first_in"]) ? "in" : "out";
// 			return `<span class="vewh-tm ${cls}">${U.esc(time)}${parts[1] ? `<small>${U.esc(parts[0])}</small>` : ""}</span>`;
// 		}
// 		if (U.col(column, ["total_hrs", "total_hours"]) && !empty && !isNaN(parseFloat(raw))) {
// 			var pct = Math.max(0, Math.min(100, (parseFloat(raw) / 10) * 100));
// 			return `<span class="vewh-hrs">${value}<div class="vewh-bar"><i style="width:${pct}%"></i></div></span>`;
// 		}
// 		if (U.col(column, ["rest_hours"])) {
// 			return empty ? dash : `<b>${value}</b>`;
// 		}
// 		return value;
// 	},
// };









































// ===========================================================================
// Vendor Employee Working Hours  -  MODERN UI (UI ONLY)
// Filters, defaults, report data, columns and summary logic are unchanged.
// Everything UI-related lives in window.vewh_ui below.
// ===========================================================================
window.vewh_ui = (function () {
	var ROUTE = "query-report/Vendor Employee Working Hours";
	var STYLE_ID = "vewh-modern-style";
	var SHADOW = "box-shadow:0 1px 2px rgba(18,32,51,.04),0 8px 24px rgba(18,32,51,.06);";

	var ICON = {
		users: "<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#2B4BFF' stroke-width='2' stroke-linecap='round'><circle cx='9' cy='8' r='4'/><path d='M2 21c0-4 3-7 7-7s7 3 7 7M17 4a4 4 0 0 1 0 8M22 21c0-3-2-5.5-5-6.5'/></svg>",
		clock: "<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#0FA37F' stroke-width='2' stroke-linecap='round'><circle cx='12' cy='12' r='9'/><path d='M12 12V7'><animateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='6s' repeatCount='indefinite'/></path><path d='M12 12l3 2'><animateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='36s' repeatCount='indefinite'/></path></svg>",
		warn: "<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#E5484D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3l10 18H2z'/><path d='M12 10v5M12 18v.5'/></svg>",
	};
	var CARD_CLASS = ["c-blue", "c-green", "c-red"];
	var CARD_ICON = [ICON.users, ICON.clock, ICON.warn];

	function css() {
		var V = "body.vewh-active ";
		return `
		${V} { background: #EEF1F5 !important; }
		${V}.page-container, ${V}.page-body, ${V}.layout-main-section { background: transparent !important; }
		${V}{ font-family: 'DM Sans','Inter',-apple-system,'Segoe UI',sans-serif; }

		/* ---------- Header ---------- */
		${V}.page-head { background: #EEF1F5 !important; border-bottom: 0 !important; box-shadow: none !important; }
		${V}.page-head .page-head-content { padding-top: 22px; padding-bottom: 8px; }
		${V}.page-head .page-title { display: flex !important; align-items: center; gap: 16px; }
		${V}.page-head .page-title:before {
			content: ""; flex: none; width: 52px; height: 52px; border-radius: 15px;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 12V7'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='6s' repeatCount='indefinite'/%3E%3C/path%3E%3Cpath d='M12 12l3 2'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='36s' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E"), linear-gradient(135deg,#2B4BFF,#6C5CFF);
			background-repeat: no-repeat, no-repeat; background-position: center, center; background-size: 26px 26px, cover;
			box-shadow: 0 8px 20px rgba(43,75,255,.28);
			animation: vewh-float 3.2s ease-in-out infinite, vewh-glow 3.2s ease-in-out infinite;
		}
		${V}.page-head .page-title .title-area { display: flex !important; flex-direction: column; align-items: flex-start; }
		${V}.page-head .page-title .title-text, ${V}.page-head .page-title h1, ${V}.page-head .page-title h3 {
			font-size: 28px !important; line-height: 1.2 !important; font-weight: 700 !important; letter-spacing: -.5px; color: #122033 !important;
			max-width: none !important; overflow: visible !important; white-space: nowrap;
		}
		${V}.vewh-sub { font-size: 13.5px; font-weight: 400; color: #6B778A; margin-top: 3px; }
		${V}.page-head .btn, ${V}.page-head .menu-btn-group .btn {
			height: 42px; border-radius: 12px; font-weight: 600; font-size: 14px;
			background: #fff !important; border: 1px solid #E3E8EF !important; color: #122033 !important; box-shadow: none !important;
		}
		${V}.page-head .inner-group-button[data-label="Actions"] > .btn, ${V}.page-head .btn-primary, ${V}.page-head .actions-btn-group .btn {
			background: #122033 !important; border-color: #122033 !important; color: #fff !important;
		}
		${V}.page-head .inner-group-button[data-label="Actions"] > .btn svg, ${V}.page-head .actions-btn-group .btn svg { stroke: #fff !important; }

		/* ---------- Filters ---------- */
		${V}.page-form {
			background: #fff !important; border: 0 !important; border-radius: 18px; padding: 18px 20px 8px !important;
			margin: 12px 15px 20px !important; ${SHADOW}
			display: flex; flex-wrap: wrap; gap: 0 14px; align-items: flex-end;
		}
		${V}.page-form > .form-group, ${V}.page-form .frappe-control { flex: 1 1 180px; min-width: 150px; margin-bottom: 12px !important; }
		${V}.vewh-flabel { font-size: 12px; font-weight: 600; color: #6B778A; margin-bottom: 6px; }
		${V}.page-form .control-label { display: block !important; font-size: 12px; font-weight: 600; color: #6B778A; margin-bottom: 6px; }
		${V}.page-form .form-control, ${V}.page-form .awesomplete > input, ${V}.page-form input.input-with-feedback {
			height: 44px !important; border-radius: 12px !important; font-weight: 600; font-size: 14.5px; color: #122033;
			background: #F5F7FA !important; border: 1px solid #E3E8EF !important; box-shadow: none !important; padding: 0 14px !important;
		}
		${V}.page-form .form-control::placeholder { color: #A3ADBB; font-weight: 500; }
		${V}.page-form .form-control:focus { background: #fff !important; border-color: #2B4BFF !important; box-shadow: 0 0 0 3px rgba(43,75,255,.15) !important; }
		${V}.page-form .frappe-control[data-fieldtype="Check"] { flex: 0 0 auto; align-self: flex-end; }
		${V}.page-form .checkbox label { display: flex; align-items: center; height: 44px; margin: 0; font-weight: 600; font-size: 14px; color: #122033; cursor: pointer; }
		${V}.page-form .checkbox .label-area { font-size: 14px; }
		${V}.page-form input[type="checkbox"] {
			-webkit-appearance: none; appearance: none; width: 42px !important; height: 24px !important; border-radius: 20px;
			background: #D5DBE5 !important; position: relative !important; border: 0 !important; margin: 0 10px 0 0 !important;
			box-shadow: none !important; cursor: pointer; transition: background .15s; flex: none;
		}
		${V}.page-form input[type="checkbox"]:after {
			content: "" !important; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; border-radius: 50%;
			background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: left .15s; background-image: none !important; border: 0 !important;
		}
		${V}.page-form input[type="checkbox"]:checked { background: #2B4BFF !important; }
		${V}.page-form input[type="checkbox"]:checked:after { left: 21px; }
		${V}.page-form input[type="checkbox"]:before { display: none !important; }

		/* ---------- Summary cards (custom render of the same summary data) ---------- */
		${V}.report-summary { display: none !important; }
		${V}.vewh-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin: 0 15px 20px; }
		${V}.vewh-card { display: flex; align-items: center; gap: 18px; background: #fff; border-radius: 20px; padding: 22px 24px; ${SHADOW} }
		${V}.vewh-ic { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; flex: none; }
		${V}.vewh-card .l { font-size: 14px; font-weight: 600; color: #6B778A; }
		${V}.vewh-card .v { font-size: 40px; font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-top: 2px; font-variant-numeric: tabular-nums; }
		${V}.c-blue .vewh-ic { background: #E6EBFF; } ${V}.c-blue .v { color: #2B4BFF; }
		${V}.c-green .vewh-ic { background: #E3F7F0; } ${V}.c-green .v { color: #0FA37F; }
		${V}.c-red .vewh-ic { background: #FDECEC; } ${V}.c-red .v { color: #E5484D; }

		/* ---------- Animations (icons) ---------- */
		@keyframes vewh-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
		@keyframes vewh-glow { 0%,100% { box-shadow: 0 8px 20px rgba(43,75,255,.28); } 50% { box-shadow: 0 10px 28px rgba(108,92,255,.5); } }
		@keyframes vewh-ring { 0% { transform: scale(1); opacity: .55; } 70%,100% { transform: scale(1.45); opacity: 0; } }
		@keyframes vewh-wiggle { 0%,60%,100% { transform: rotate(0); } 68% { transform: rotate(-12deg); } 76% { transform: rotate(10deg); } 84% { transform: rotate(-7deg); } 92% { transform: rotate(4deg); } }
		@keyframes vewh-bob { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-2px) scale(1.1); } }
		${V}.vewh-ic { position: relative; }
		${V}.vewh-ic:after { content: ""; position: absolute; inset: 0; border-radius: 16px; border: 2px solid currentColor; opacity: 0; animation: vewh-ring 2.6s ease-out infinite; pointer-events: none; }
		${V}.c-blue .vewh-ic { color: #2B4BFF; } ${V}.c-green .vewh-ic { color: #0FA37F; } ${V}.c-red .vewh-ic { color: #E5484D; }
		${V}.c-blue .vewh-ic svg { animation: vewh-bob 2.4s ease-in-out infinite; }
		${V}.c-red .vewh-ic svg { transform-origin: 50% 85%; animation: vewh-wiggle 3s ease-in-out infinite; }
		${V}.c-green .vewh-ic:after { animation-delay: .5s; }
		${V}.c-red .vewh-ic:after { animation-delay: 1s; }
		@media (prefers-reduced-motion: reduce) {
			${V}.page-head .page-title:before, ${V}.vewh-ic:after, ${V}.vewh-ic svg { animation: none !important; }
		}

		/* ---------- Table card ---------- */
		${V}.vewh-thead {
			display: flex; justify-content: space-between; align-items: center; margin: 0 15px; padding: 18px 24px;
			background: #fff; border-radius: 20px 20px 0 0; border-bottom: 1px solid #E3E8EF;
		}
		${V}.vewh-thead b { font-size: 16px; font-weight: 700; color: #122033; }
		${V}.vewh-thead span { font-size: 13px; color: #6B778A; }
		${V}.report-wrapper { margin: 0 15px !important; background: #fff; border: 0 !important; border-radius: 0 0 20px 20px; overflow: hidden; ${SHADOW} }
		${V}.datatable { border: 0 !important; font-family: inherit; }
		${V}.datatable .dt-scrollable { border: 0 !important; }
		${V}.datatable .dt-header .dt-cell, ${V}.datatable .dt-header .dt-cell--header { background: #F8FAFC !important; border-color: #E3E8EF !important; }
		${V}.datatable .dt-header .dt-cell__content { font-size: 12.5px; font-weight: 700; color: #6B778A; padding: 12px 10px; }
		${V}.datatable .dt-row-filter .dt-cell { background: #fff !important; border-color: #E3E8EF !important; }
		${V}.datatable .dt-header .dt-cell { height: 46px !important; }
		${V}.datatable .dt-row-filter .dt-cell { height: 52px !important; }
		${V}.datatable .dt-row-filter .dt-cell__content { height: 100%; display: flex; align-items: center; padding: 0 6px; }
		${V}.datatable .dt-row-filter .dt-cell--col-0 .dt-filter, ${V}.datatable .dt-row-filter .dt-cell--col-0 input { display: none !important; }
		${V}.datatable .dt-filter, ${V}.datatable .dt-row-filter input {
			height: 30px !important; border-radius: 9px !important; background: #F5F7FA !important; border: 1px solid #E3E8EF !important; box-shadow: none !important;
		}
		${V}.datatable .dt-body .dt-cell { border-color: #EEF1F5 !important; background: #fff; height: 60px !important; display: flex !important; align-items: center; }
		${V}.datatable .dt-body .dt-row:hover .dt-cell { background: #FAFBFF !important; }
		${V}.datatable .dt-body .dt-cell__content {
			width: 100%; height: auto !important; display: flex !important; align-items: center; padding: 0 10px !important; font-size: 13.5px; font-weight: 500; color: #122033; white-space: nowrap;
		}
		${V}.datatable .dt-body .dt-cell__content, ${V}.datatable .dt-body .dt-cell__content--right-aligned, ${V}.datatable .dt-body .dt-cell__content[style*="text-align"] { justify-content: center !important; text-align: center !important; font-variant-numeric: tabular-nums; }
		${V}.datatable .dt-body .dt-cell--col-0 .dt-cell__content { color: #A3ADBB; font-weight: 600; }

		/* ---------- Center all data cells (horizontal + vertical), column widths untouched ---------- */
		${V}.datatable .dt-scrollable .dt-cell__content { text-align: center !important; line-height: 58px; }
		${V}.datatable .dt-scrollable .dt-cell__content:has([class^="vewh-"]) {
			display: flex !important; align-items: center; justify-content: center; height: 58px; line-height: 1.4;
		}

		/* ---------- Cell components (from formatter) ---------- */
		${V}.vewh-code { font-weight: 600; font-size: 12.5px; color: #2B4BFF; background: #EEF1FF; padding: 5px 10px; border-radius: 8px; }
		${V}.vewh-code a { color: #2B4BFF; }
		${V}.vewh-emp { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; }
		${V}.vewh-av { width: 30px; height: 30px; border-radius: 50%; background: #E6EBFF; color: #2B4BFF; display: inline-grid; place-items: center; font-size: 11.5px; font-weight: 700; flex: none; }
		${V}.vewh-site { background: #F1F4F8; padding: 5px 11px; border-radius: 8px; font-weight: 600; font-size: 12.5px; }
		${V}.vewh-na { color: #C3CBD6; }
		${V}.vewh-tm { display: inline-block; line-height: 1.3; font-variant-numeric: tabular-nums; font-weight: 600; }
		${V}.vewh-tm small { display: block; font-size: 11.5px; font-weight: 500; color: #6B778A; }
		${V}.vewh-tm.in { color: #0FA37F; }
		${V}.vewh-tm.out { color: #D9822B; }
		${V}.vewh-hrs { display: inline-block; width: 74px; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.2; }
		${V}.vewh-bar { height: 6px; border-radius: 6px; background: #EDF0F5; margin-top: 5px; overflow: hidden; }
		${V}.vewh-bar i { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg,#2B4BFF,#6C5CFF); }
		${V}.vewh-pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 12.5px; }
		${V}.vewh-pill:before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
		${V}.vewh-pill.is-ok { color: #0A7F61; background: #E3F7F0; }
		${V}.vewh-pill.is-issue { color: #E5484D; background: #FDECEC; }

		/* ---------- Footer text ---------- */
		${V}.report-footer, ${V}.datatable-footer, ${V}.report-wrapper + .text-muted, ${V}.layout-main-section > .text-muted {
			margin: 0 15px; padding: 12px 24px; font-size: 12.5px; color: #6B778A; background: #F8FAFC; border-radius: 0 0 20px 20px;
		}
		`;
	}

	function inject_styles() {
		var old = document.getElementById(STYLE_ID);
		if (old) old.parentNode.removeChild(old);
		var el = document.createElement("style");
		el.id = STYLE_ID;
		el.textContent = css();
		document.head.appendChild(el);
	}

	function is_this_report() {
		try {
			return (frappe.get_route_str() || "").indexOf(ROUTE) === 0 ||
				decodeURIComponent(frappe.get_route_str() || "").indexOf(ROUTE) === 0;
		} catch (e) { return false; }
	}

	function sync_body_class() {
		$("body").toggleClass("vewh-active", is_this_report());
	}

	function esc(s) { return frappe.utils.escape_html(String(s)); }

	// reads the summary values that Frappe already rendered (display only)
	function read_summary($scope) {
		var items = [];
		$scope.find(".report-summary .summary-item, .report-summary .summary-stat").each(function () {
			var $s = $(this);
			var $v = $s.find(".summary-value").first();
			var label = ($s.find(".summary-label, .summary-title").first().text() || "").trim();
			if (!label) {
				var $c = $s.clone();
				$c.find(".summary-value").remove();
				label = $c.text().trim();
			}
			items.push({ label: label, value: $v.text().trim() });
		});
		if (!items.length) {
			// fallback: read the summary data itself
			try {
				var qr = frappe.query_report;
				var arr = (qr.raw_data && qr.raw_data.report_summary) || qr.report_summary || [];
				arr.forEach(function (x) { items.push({ label: x.label, value: String(x.value) }); });
			} catch (e) {}
		}
		return items;
	}

	function render_cards() {
		var qr = frappe.query_report;
		if (!qr || !qr.page) return;
		var $scope = $(qr.page.wrapper);
		var items = read_summary($scope);
		$scope.find(".vewh-cards, .vewh-thead").remove();

		var $anchor = $scope.find(".report-summary").first();
		if (!$anchor.length) $anchor = $scope.find(".report-wrapper").first();
		if (!$anchor.length) return 0;

		if (items.length) {
			var html = items.map(function (it, i) {
				return `<div class="vewh-card ${CARD_CLASS[i % 3]}">
					<div class="vewh-ic">${CARD_ICON[i % 3]}</div>
					<div><div class="l">${esc(it.label)}</div><div class="v">${esc(it.value)}</div></div>
				</div>`;
			}).join("");
			$(`<div class="vewh-cards">${html}</div>`).insertBefore($anchor);
		}

		var from = qr.get_filter_value("from_date"), to = qr.get_filter_value("to_date");
		var n = (qr.data || []).length;
		var range = from && to ? ` · ${frappe.datetime.str_to_user(from)} to ${frappe.datetime.str_to_user(to)}` : "";
		var $wrap = $scope.find(".report-wrapper").first();
		if ($wrap.length) {
			$(`<div class="vewh-thead"><b>Working hours</b><span>${n} records${range}</span></div>`).insertBefore($wrap);
		}
		return items.length;
	}

	// real subtitle under the title + labels above filters (display only)
	function decorate_header(report) {
		try {
			var $w = $(report.page.wrapper);
			var $t = $w.find(".page-head .title-text").first();
			if ($t.length && !$w.find(".vewh-sub").length) {
				$('<div class="vewh-sub">Daily clock-in and clock-out records by vendor, site and employee</div>').insertAfter($t);
			}
			(report.filters || []).forEach(function (f) {
				if (!f || !f.df || f.df.fieldtype === "Check" || !f.$wrapper) return;
				if (f.$wrapper.find(".vewh-flabel").length) return;
				$('<div class="vewh-flabel"></div>').text(f.df.label).prependTo(f.$wrapper);
			});
		} catch (e) {}
	}

	function set_placeholders(report) {
		try {
			var ph = { vendor: __("Select vendor"), company: __("Select company"), employee: __("Select employee") };
			Object.keys(ph).forEach(function (k) {
				var f = report.get_filter(k);
				if (f && f.$input) f.$input.attr("placeholder", ph[k]);
			});
		} catch (e) {}
	}

	// helper: does this column match any fieldname / label?
	function col(column, names) {
		var f = (column.fieldname || "").toLowerCase();
		var l = (column.label || "").toLowerCase();
		return names.some(function (n) { return f === n || l === n.replace(/_/g, " "); });
	}

	return {
		onload: function (report) {
			inject_styles();
			sync_body_class();
			$(document).off("page-change.vewh").on("page-change.vewh", sync_body_class);
			setTimeout(function () { decorate_header(report); set_placeholders(report); }, 400);
		},
		after_render: function () {
			sync_body_class();
			if (!render_cards()) {
				setTimeout(render_cards, 500); // summary may render a moment later
			}
			decorate_header(frappe.query_report);
		},
		col: col,
		esc: esc,
	};
})();

frappe.query_reports["Vendor Employee Working Hours"] = {
	// ----- UI hooks only -----
	onload(report) {
		window.vewh_ui.onload(report);
	},
	after_datatable_render() {
		window.vewh_ui.after_render();
	},
	get_datatable_options(options) {
		return Object.assign(options, { cellHeight: 60 });
	},

	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.month_start(),
			reqd: 1,
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.month_end(),
			reqd: 1,
		},
		{
			fieldname: "vendor",
			label: __("Vendor (Supplier)"),
			fieldtype: "Link",
			options: "Supplier",
		},
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
		},
		{
			fieldname: "employee",
			label: __("Employee"),
			fieldtype: "Link",
			options: "Employee",
		},
		{
			fieldname: "summary_view",
			label: __("Summary per Employee"),
			fieldtype: "Check",
			default: 0,
		},
	],

	formatter(value, row, column, data, default_formatter) {
		var U = window.vewh_ui;
		var raw = value;
		value = default_formatter(value, row, column, data);
		var empty = raw === null || raw === undefined || raw === "";
		var dash = '<span class="vewh-na">—</span>';

		// Status: original rule kept (status !== "OK" is an issue); OK / Present shown green
		if (column.fieldname === "status" && data && data.status) {
			var good = data.status === "OK" || data.status === "Present";
			return `<span class="vewh-pill ${good ? "is-ok" : "is-issue"}">${U.esc(data.status)}</span>`;
		}

		if (U.col(column, ["employee"])) {
			return empty ? value : `<span class="vewh-code">${value}</span>`;
		}
		if (U.col(column, ["employee_name"])) {
			if (empty) return value;
			var ini = String(raw).trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
			return `<span class="vewh-emp"><span class="vewh-av">${U.esc(ini)}</span>${value}</span>`;
		}
		if (U.col(column, ["site"])) {
			return empty ? dash : `<span class="vewh-site">${value}</span>`;
		}
		if (U.col(column, ["trade", "civil_id"])) {
			return empty ? dash : value;
		}
		if (U.col(column, ["first_in", "last_out"])) {
			if (empty) return dash; // no "Missing" tag
			var str = String(raw);
			var tm = str.match(/(\d{1,2}):(\d{2})/);
			var dt = str.match(/\d{4}-\d{2}-\d{2}/);
			var time = tm ? (tm[1].length < 2 ? "0" + tm[1] : tm[1]) + ":" + tm[2] : str;
			var cls = U.col(column, ["first_in"]) ? "in" : "out";
			return `<span class="vewh-tm ${cls}">${U.esc(time)}${dt ? `<small>${U.esc(dt[0])}</small>` : ""}</span>`;
		}
		if (U.col(column, ["total_hrs", "total_hours"]) && !empty && !isNaN(parseFloat(raw))) {
			var pct = Math.max(0, Math.min(100, (parseFloat(raw) / 10) * 100));
			return `<span class="vewh-hrs">${value}<div class="vewh-bar"><i style="width:${pct}%"></i></div></span>`;
		}
		if (U.col(column, ["rest_hours"])) {
			return empty ? dash : `<b>${value}</b>`;
		}
		return value;
	},
};
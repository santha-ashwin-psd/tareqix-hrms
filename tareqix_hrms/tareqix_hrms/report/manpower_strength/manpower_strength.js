// =====================================================================
// MANPOWER STRENGTH - modern report UI
// File: apps/tareqix_hrms/tareqix_hrms/tareqix_hrms/report/manpower_strength/manpower_strength.js
//
// SECTIONS (share only the section that changes for later updates)
//   0  CONFIG            report name, labels, colours, hint text
//   1  FILTERS           the report filters (drive the Python query)
//   2  PAGE STYLING      all CSS
//   3  PAGE SHELL        header + filters (built once)
//   4  HELPERS           parsing, formatting, icons
//   5  DATA PARSING      report rows -> {rows, totals}
//   6  RENDER            KPI cards, table, footer
//   7  EVENTS            filters, refresh, actions, export, print
//   8  HOOKS             wires everything to the Frappe report
//                        (activates only on this report, removed on every other page)
// =====================================================================

(function () {

    // =================================================================
    // SECTION 0: CONFIG
    // =================================================================

    const REPORT_NAME = 'Manpower Strength';

    const TEXT = {
        title: 'Manpower Strength',
        subtitle: 'Headcount by designation across Direct, Vendor, Deployed and Bench',
        table_title: 'Strength by Designation',
        hint: 'For comparison, use >5, <10 or =324. For ranges, use 5:10 (for values between 5 & 10).'
    };

    // Avatar colours used for the designation badges (cycled by row)
    const AVATARS = [
        { bg: '#eef0ff', fg: '#4f46e5' },
        { bg: '#e6f3fb', fg: '#0284c7' },
        { bg: '#e6f7f5', fg: '#0d9488' },
        { bg: '#f1f3f8', fg: '#64748b' },
        { bg: '#f1ebff', fg: '#7c3aed' },
        { bg: '#fff4e0', fg: '#d97706' },
        { bg: '#ffe9ee', fg: '#e11d48' },
        { bg: '#e8f8ee', fg: '#16a34a' }
    ];

    // Names (fieldname or label, lower-case, letters only) used to find columns
    const COLUMN_NAMES = {
        designation: ['designation'],
        direct: ['direct'],
        vendor: ['vendor'],
        deployed: ['deployed'],
        bench: ['bench'],
        total: ['total']
    };

    const GRAND_TOTAL_LABELS = ['grandtotal', 'total'];


    // =================================================================
    // SECTION 1: FILTERS (unchanged - they drive the Python query)
    // =================================================================

    const FILTERS = [
        {
            fieldname: 'designation',
            label: 'Designation',
            fieldtype: 'Link',
            options: 'Designation'
        },
        {
            fieldname: 'employee_type',
            label: 'Employee Type',
            fieldtype: 'Select',
            options: '\nDirect\nVendor'
        }
    ];


    // =================================================================
    // SECTION 2: PAGE STYLING
    // =================================================================

    const CSS = `
        .mps-page { background: #f4f6fb !important; }
        .mps-page .page-head { display: none !important; }
        .mps-page .layout-main-section > *:not(#mps-root) { display: none !important; }
        .mps-page .layout-main-section { padding: 0 !important; }

        #mps-root {
            --ink:#0f172a; --muted:#64748b; --line:#e8ecf4; --card:#ffffff;
            --indigo:#4f46e5; --indigo-soft:#eef0ff;
            --violet:#7c3aed; --violet-soft:#f1ebff;
            --green:#16a34a; --green-soft:#e8f8ee;
            --amber:#d97706; --amber-soft:#fff4e0;
            font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
            color: var(--ink);
            padding: 28px 32px 32px;
            max-width: 100%;
        }
        #mps-root *, #mps-root *::before, #mps-root *::after { box-sizing: border-box; }
        #mps-root h1, #mps-root h2, #mps-root p { margin: 0; }

        /* header */
        #mps-root .mps-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; gap:16px; flex-wrap:wrap; }
        #mps-root .mps-title { display:flex; align-items:center; gap:14px; }
        #mps-root .mps-logo { width:44px; height:44px; border-radius:13px; background:linear-gradient(135deg,#4f46e5,#7c3aed); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 20px rgba(79,70,229,.30); }
        #mps-root .mps-title h1 { font-size:24px; font-weight:700; letter-spacing:-.4px; line-height:1.2; }
        #mps-root .mps-title p { font-size:13px; color:var(--muted); margin-top:3px; }
        #mps-root .mps-actions { display:flex; gap:10px; align-items:center; position:relative; }
        #mps-root .mps-btn { height:38px; padding:0 16px; border-radius:10px; border:1px solid var(--line); background:#fff; font-size:13px; font-weight:600; color:var(--ink); display:inline-flex; align-items:center; gap:8px; box-shadow:0 1px 2px rgba(15,23,42,.04); cursor:pointer; transition:all .15s ease; font-family:inherit; }
        #mps-root .mps-btn:hover { background:#f8f9fc; transform:translateY(-1px); }
        #mps-root .mps-btn.icon { width:38px; padding:0; justify-content:center; }
        #mps-root .mps-btn.primary { background:var(--ink); color:#fff; border-color:var(--ink); }
        #mps-root .mps-btn.primary:hover { background:#1e293b; }
        #mps-root .mps-menu { position:absolute; top:46px; right:96px; min-width:180px; background:#fff; border:1px solid var(--line); border-radius:12px; box-shadow:0 12px 32px rgba(15,23,42,.14); padding:6px; display:none; z-index:50; }
        #mps-root .mps-menu.open { display:block; }
        #mps-root .mps-menu div { padding:9px 12px; font-size:13px; font-weight:600; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:9px; }
        #mps-root .mps-menu div:hover { background:#f1f3f8; }

        /* filters */
        #mps-root .mps-filters { display:flex; gap:14px; align-items:flex-end; margin-bottom:20px; flex-wrap:wrap; }
        #mps-root .mps-field label { display:block; font-size:10.5px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
        #mps-root .mps-select { height:42px; min-width:260px; background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.4' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 14px center; border:1px solid var(--line); border-radius:11px; padding:0 38px 0 14px; font-size:14px; font-weight:600; color:var(--ink); box-shadow:0 1px 2px rgba(15,23,42,.04); -webkit-appearance:none; appearance:none; cursor:pointer; font-family:inherit; outline:none; }
        #mps-root .mps-select.ph { color:#94a3b8; font-weight:500; }
        #mps-root .mps-select:focus { border-color:#c7cbff; box-shadow:0 0 0 3px rgba(79,70,229,.12); }

        /* KPI cards */
        #mps-root .mps-kpis { display:grid; grid-template-columns:1.25fr 1fr 1fr 1fr 1fr; gap:16px; margin-bottom:22px; }
        #mps-root .mps-kpi { background:var(--card); border-radius:18px; padding:20px 22px; border:1px solid var(--line); box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.04); position:relative; overflow:hidden; }
        #mps-root .mps-kpi .top { display:flex; align-items:center; justify-content:space-between; }
        #mps-root .mps-kpi .lbl { font-size:12px; font-weight:700; letter-spacing:.6px; text-transform:uppercase; color:var(--muted); }
        #mps-root .mps-kpi .ico { width:36px; height:36px; border-radius:11px; display:flex; align-items:center; justify-content:center; }
        #mps-root .mps-kpi .val { font-size:40px; font-weight:800; letter-spacing:-1.5px; margin-top:14px; line-height:1; }
        #mps-root .mps-kpi .sub { font-size:12px; color:var(--muted); margin-top:8px; font-weight:500; }
        #mps-root .mps-kpi.hero { background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%); color:#fff; border:none; box-shadow:0 14px 34px rgba(79,70,229,.32); }
        #mps-root .mps-kpi.hero .lbl, #mps-root .mps-kpi.hero .sub { color:rgba(255,255,255,.78); }
        #mps-root .mps-kpi.hero .ico { background:rgba(255,255,255,.18); }
        #mps-root .mps-kpi.hero::after { content:""; position:absolute; right:-40px; bottom:-60px; width:170px; height:170px; border-radius:50%; background:rgba(255,255,255,.10); }
        #mps-root .mps-kpi.hero::before { content:""; position:absolute; right:30px; bottom:-80px; width:130px; height:130px; border-radius:50%; background:rgba(255,255,255,.08); }
        #mps-root .bar-mini { height:6px; border-radius:99px; background:#eef1f7; margin-top:12px; overflow:hidden; }
        #mps-root .bar-mini i { display:block; height:100%; border-radius:99px; transition:width .5s ease; }

        /* table card */
        #mps-root .mps-card { background:var(--card); border-radius:20px; border:1px solid var(--line); box-shadow:0 1px 2px rgba(15,23,42,.04),0 10px 30px rgba(15,23,42,.05); overflow:hidden; }
        #mps-root .mps-card-h { display:flex; align-items:center; justify-content:space-between; padding:20px 26px; border-bottom:1px solid var(--line); }
        #mps-root .mps-card-h h2 { font-size:16px; font-weight:700; letter-spacing:-.2px; }
        #mps-root .mps-card-h p { font-size:12.5px; color:var(--muted); margin-top:3px; }
        #mps-root .mps-legend { display:flex; gap:18px; font-size:12px; color:var(--muted); font-weight:600; }
        #mps-root .mps-legend span { display:flex; align-items:center; gap:7px; }
        #mps-root .mps-legend b { width:10px; height:10px; border-radius:3px; display:inline-block; }
        #mps-root .mps-scroll { overflow-x:auto; }
        #mps-root table { width:100%; border-collapse:collapse; margin:0; }
        #mps-root thead th { font-size:10.5px; font-weight:700; letter-spacing:.9px; text-transform:uppercase; color:var(--muted); text-align:left; padding:14px 18px; background:#f8f9fc; border:0; border-bottom:1px solid var(--line); white-space:nowrap; }
        #mps-root thead th.num, #mps-root td.num { text-align:center; }
        #mps-root tbody td { padding:15px 18px; border:0; border-bottom:1px solid #f0f3f9; font-size:14px; vertical-align:middle; background:transparent; }
        #mps-root tbody tr:last-child td { border-bottom:none; }
        #mps-root tbody tr.mps-row { transition:background .15s ease; }
        #mps-root tbody tr.mps-row:hover td { background:#fafbff; }
        #mps-root .idx { color:#a3aec2; font-size:12.5px; font-weight:600; width:56px; }
        #mps-root .desig { display:flex; align-items:center; gap:13px; font-weight:600; white-space:nowrap; }
        #mps-root .av { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; flex-shrink:0; }
        #mps-root .cellnum { display:inline-flex; flex-direction:column; align-items:center; gap:7px; min-width:92px; }
        #mps-root .cellnum .n { font-size:16px; font-weight:700; }
        #mps-root .cellnum .n.z { color:#c3cad8; font-weight:600; }
        #mps-root .track { width:84px; height:5px; border-radius:99px; background:#eef1f7; overflow:hidden; }
        #mps-root .track i { display:block; height:100%; border-radius:99px; }
        #mps-root .pill { display:inline-flex; align-items:center; justify-content:center; min-width:44px; height:30px; padding:0 12px; border-radius:999px; font-weight:700; font-size:14px; }
        #mps-root .pill.g { background:var(--green-soft); color:var(--green); }
        #mps-root .pill.a { background:var(--amber-soft); color:var(--amber); }
        #mps-root .pill.z { background:#f3f5f9; color:#b4bccb; font-weight:600; }
        #mps-root .total { display:flex; align-items:center; gap:12px; justify-content:center; }
        #mps-root .total .t { font-size:18px; font-weight:800; min-width:24px; text-align:right; }
        #mps-root .stack { width:110px; height:8px; border-radius:99px; background:#eef1f7; display:flex; overflow:hidden; }
        #mps-root .stack i { display:block; height:100%; }
        #mps-root tr.grand { background:#0f172a; }
        #mps-root tr.grand td { background:#0f172a !important; color:#fff; border-bottom:none; padding:19px 18px; }
        #mps-root tr.grand .idx { color:#64748b; }
        #mps-root tr.grand .desig { font-weight:800; letter-spacing:.4px; }
        #mps-root tr.grand .av { background:rgba(255,255,255,.12); color:#fff; }
        #mps-root tr.grand .cellnum .n { color:#fff; }
        #mps-root tr.grand .track { background:rgba(255,255,255,.14); }
        #mps-root tr.grand .pill.g { background:rgba(34,197,94,.20); color:#6ee7a0; }
        #mps-root tr.grand .pill.a { background:rgba(251,191,36,.20); color:#fcd34d; }
        #mps-root tr.grand .stack { background:rgba(255,255,255,.14); }
        #mps-root tr.grand .t { color:#fff; }
        #mps-root .mps-empty { text-align:center; padding:48px 20px; color:var(--muted); font-size:14px; }
        #mps-root .mps-foot { display:flex; justify-content:space-between; align-items:center; margin-top:14px; font-size:12px; color:var(--muted); padding:0 6px; gap:12px; flex-wrap:wrap; }
        #mps-root .mps-foot .ok { display:flex; align-items:center; gap:7px; }
        #mps-root .dot { width:7px; height:7px; border-radius:50%; background:#22c55e; display:inline-block; box-shadow:0 0 0 4px rgba(34,197,94,.15); }

        @media (max-width: 1100px) {
            #mps-root .mps-kpis { grid-template-columns: repeat(2, 1fr); }
        }
        @media print {
            .mps-page .navbar, #mps-root .mps-actions, #mps-root .mps-filters { display:none !important; }
            #mps-root { padding: 0; }
        }
    `;


    // =================================================================
    // SECTION 4: HELPERS
    // =================================================================

    const esc = (v) => frappe.utils.escape_html(String(v === null || v === undefined ? '' : v));

    const num = (v) => {
        const n = Number(v);
        return isFinite(n) ? n : 0;
    };

    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

    const pct = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

    const width = (value, total) => (total > 0 ? Math.min(100, (value / total) * 100) : 0);

    function initials(name) {
        const words = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!words.length) return '--';
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
        return (words[0][0] + words[1][0]).toUpperCase();
    }

    const ICON = {
        logo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
        chev: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.4" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>',
        download: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        print: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
        csv: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        direct: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        vendor: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
        deployed: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
        bench: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
    };


    // =================================================================
    // SECTION 5: DATA PARSING
    // Finds the columns by name, separates the GRAND TOTAL row and
    // works out the totals used by the cards and the bars.
    // =================================================================

    function resolve_columns(columns) {

        columns = columns || [];

        const find = (names) => columns.findIndex(c =>
            names.includes(norm(c.fieldname)) || names.includes(norm(c.label))
        );

        const keys = {};

        Object.keys(COLUMN_NAMES).forEach((key, position) => {

            let index = find(COLUMN_NAMES[key]);

            const found = index >= 0;

            // Fallback: same order as the report (Designation, Direct, Vendor, Deployed, Bench, Total)
            if (!found) index = position;

            keys[key] = {
                index: index,
                found: found,
                field: columns[index] ? columns[index].fieldname : null
            };
        });

        return keys;
    }

    function parse_data(columns, data) {

        const keys = resolve_columns(columns);

        // Only treat the data as Manpower Strength data when the key columns exist.
        // (Stops stale data from another report being drawn in this design.)
        const valid = keys.designation.found && keys.direct.found && keys.total.found;

        const read = (row, key) => {
            const k = keys[key];
            return Array.isArray(row) ? row[k.index] : row[k.field];
        };

        const rows = [];

        let grand = null;

        (data || []).forEach(row => {

            if (!row) return;

            const item = {
                designation: read(row, 'designation'),
                direct: num(read(row, 'direct')),
                vendor: num(read(row, 'vendor')),
                deployed: num(read(row, 'deployed')),
                bench: num(read(row, 'bench')),
                total: num(read(row, 'total'))
            };

            const is_grand = GRAND_TOTAL_LABELS.includes(norm(item.designation));

            if (is_grand) {
                grand = item;
            } else {
                rows.push(item);
            }
        });

        // No GRAND TOTAL row from the report? Calculate it.
        if (!grand) {

            grand = { designation: 'GRAND TOTAL', direct: 0, vendor: 0, deployed: 0, bench: 0, total: 0 };

            rows.forEach(r => {
                ['direct', 'vendor', 'deployed', 'bench', 'total'].forEach(k => { grand[k] += r[k]; });
            });

        } else if (!norm(grand.designation).startsWith('grand')) {

            grand.designation = 'GRAND TOTAL';
        }

        return { rows, grand, valid };
    }


    // =================================================================
    // SECTION 3: PAGE SHELL (header + filters, built once)
    // =================================================================

    function shell_html() {

        return `
            <div class="mps-header">
                <div class="mps-title">
                    <div class="mps-logo">${ICON.logo}</div>
                    <div>
                        <h1>${esc(TEXT.title)}</h1>
                        <p>${esc(TEXT.subtitle)}</p>
                    </div>
                </div>

                <div class="mps-actions">
                    <button type="button" class="mps-btn icon" data-act="refresh" title="Refresh">${ICON.refresh}</button>
                    <button type="button" class="mps-btn" data-act="menu">Actions ${ICON.chev}</button>
                    <button type="button" class="mps-btn primary" data-act="export">${ICON.download} Export</button>

                    <div class="mps-menu">
                        <div data-act="print">${ICON.print} Print</div>
                        <div data-act="export">${ICON.csv} Export as CSV</div>
                        <div data-act="refresh">${ICON.refresh} Refresh</div>
                    </div>
                </div>
            </div>

            <div class="mps-filters">
                <div class="mps-field">
                    <label>Designation</label>
                    <select class="mps-select ph" id="mps-designation">
                        <option value="">All designations</option>
                    </select>
                </div>

                <div class="mps-field">
                    <label>Type</label>
                    <select class="mps-select" id="mps-type">
                        <option value="">All types</option>
                        <option value="Direct">Direct</option>
                        <option value="Vendor">Vendor</option>
                    </select>
                </div>
            </div>

            <div id="mps-dynamic"></div>
        `;
    }


    // =================================================================
    // SECTION 6: RENDER (KPI cards, table, footer)
    // =================================================================

    function kpi_card(cls, label, icon, icon_bg, value, bar_color, bar_pct, sub) {

        return `
            <div class="mps-kpi ${cls}">
                <div class="top">
                    <span class="lbl">${label}</span>
                    <span class="ico" ${icon_bg ? `style="background:${icon_bg}"` : ''}>${icon}</span>
                </div>
                <div class="val">${value}</div>
                ${bar_color ? `<div class="bar-mini"><i style="width:${bar_pct}%;background:${bar_color}"></i></div>` : ''}
                <div class="sub">${sub}</div>
            </div>
        `;
    }

    function cell_num(value, bar_width, color) {

        return `
            <td class="num">
                <div class="cellnum">
                    <span class="n ${value ? '' : 'z'}">${value}</span>
                    <div class="track"><i style="width:${value ? bar_width : 0}%;${value ? `background:${color}` : ''}"></i></div>
                </div>
            </td>
        `;
    }

    function pill(value, cls) {
        return `<td class="num"><span class="pill ${value ? cls : 'z'}">${value}</span></td>`;
    }

    function total_cell(item, green, amber) {

        const base = item.deployed + item.bench;

        const g = width(item.deployed, base);
        const a = base > 0 ? 100 - g : 0;

        return `
            <td class="num">
                <div class="total">
                    <span class="t">${item.total}</span>
                    <div class="stack">
                        <i style="width:${g}%;background:${green}"></i>
                        <i style="width:${a}%;background:${amber}"></i>
                    </div>
                </div>
            </td>
        `;
    }

    function type_label(filters) {

        if (filters.employee_type) return `${esc(filters.employee_type)} employees`;

        return 'All employees';
    }

    function render_dynamic(root, parsed, filters, exec_time) {

        const { rows, grand } = parsed;

        const total = grand.total;

        // ---------- KPI cards ----------

        const kpis = [
            kpi_card('hero', 'Total Manpower', ICON.users, '', grand.total, '', 0,
                `Across ${rows.length} designation${rows.length === 1 ? '' : 's'}`),

            kpi_card('', 'Direct', ICON.direct, 'var(--indigo-soft)', grand.direct,
                'var(--indigo)', pct(grand.direct, total), `${pct(grand.direct, total)}% of total`),

            kpi_card('', 'Vendor', ICON.vendor, 'var(--violet-soft)', grand.vendor,
                'var(--violet)', pct(grand.vendor, total), `${pct(grand.vendor, total)}% of total`),

            kpi_card('', 'Deployed', ICON.deployed, 'var(--green-soft)', grand.deployed,
                'var(--green)', pct(grand.deployed, total), `${pct(grand.deployed, total)}% on site`),

            kpi_card('', 'Bench', ICON.bench, 'var(--amber-soft)', grand.bench,
                'var(--amber)', pct(grand.bench, total), `${pct(grand.bench, total)}% available`)
        ].join('');

        // ---------- Table rows ----------

        let body = '';

        rows.forEach((r, i) => {

            const av = AVATARS[i % AVATARS.length];

            body += `
                <tr class="mps-row">
                    <td class="idx">${i + 1}</td>
                    <td>
                        <div class="desig">
                            <div class="av" style="background:${av.bg};color:${av.fg}">${esc(initials(r.designation))}</div>
                            ${esc(r.designation)}
                        </div>
                    </td>
                    ${cell_num(r.direct, width(r.direct, grand.direct), 'var(--indigo)')}
                    ${cell_num(r.vendor, width(r.vendor, grand.vendor), 'var(--violet)')}
                    ${pill(r.deployed, 'g')}
                    ${pill(r.bench, 'a')}
                    ${total_cell(r, 'var(--green)', 'var(--amber)')}
                </tr>
            `;
        });

        if (rows.length || grand.total) {

            body += `
                <tr class="grand">
                    <td class="idx">${rows.length + 1}</td>
                    <td>
                        <div class="desig">
                            <div class="av">&Sigma;</div>
                            ${esc(grand.designation)}
                        </div>
                    </td>
                    ${cell_num(grand.direct, width(grand.direct, total), '#818cf8')}
                    ${cell_num(grand.vendor, width(grand.vendor, total), '#a78bfa')}
                    ${pill(grand.deployed, 'g')}
                    ${pill(grand.bench, 'a')}
                    ${total_cell(grand, '#22c55e', '#fbbf24')}
                </tr>
            `;
        }

        const row_count = rows.length ? rows.length + 1 : 0;

        const table = body
            ? `
                <div class="mps-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th style="width:56px">#</th>
                                <th>Designation</th>
                                <th class="num">Direct</th>
                                <th class="num">Vendor</th>
                                <th class="num">Deployed</th>
                                <th class="num">Bench</th>
                                <th class="num">Total</th>
                            </tr>
                        </thead>
                        <tbody>${body}</tbody>
                    </table>
                </div>
            `
            : `<div class="mps-empty">No manpower data found for the selected filters.</div>`;

        root.find('#mps-dynamic').html(`
            <div class="mps-kpis">${kpis}</div>

            <div class="mps-card">
                <div class="mps-card-h">
                    <div>
                        <h2>${esc(TEXT.table_title)}</h2>
                        <p>${row_count} row${row_count === 1 ? '' : 's'} &middot; ${type_label(filters)}</p>
                    </div>
                    <div class="mps-legend">
                        <span><b style="background:var(--green)"></b>Deployed</span>
                        <span><b style="background:var(--amber)"></b>Bench</span>
                    </div>
                </div>
                ${table}
            </div>

            <div class="mps-foot">
                <span>${esc(TEXT.hint)}</span>
                <span class="ok"><span class="dot"></span>Execution Time: ${esc(exec_time)}</span>
            </div>
        `);
    }


    // =================================================================
    // SECTION 8: HOOKS (connects the UI to the Frappe report)
    // =================================================================

    let ctx = null;

    const cache = { designations: null };

    let last_report = null;   // the Frappe report object (remembered between visits)

    // True only while the browser is on THIS report's route
    function route_is_ours() {

        let route = [];

        try {
            route = frappe.get_route() || [];
        } catch (e) {
            route = [];
        }

        let name = route[1] || '';

        try { name = decodeURIComponent(name); } catch (e) { /* keep raw */ }

        return route[0] === 'query-report' && name === REPORT_NAME;
    }

    // Removes everything this design added to the page.
    // Called whenever the user leaves the report, so no other page is affected.
    function deactivate() {

        if (ctx && ctx.observer) ctx.observer.disconnect();

        $(document).off('click.mps');

        $('.mps-page').removeClass('mps-page');
        $('#mps-root').remove();

        ctx = null;
    }

    // Builds the design (only while we are on this report)
    function activate(report) {

        report = report || frappe.query_report || last_report;

        if (!report || !report.page || !route_is_ours()) return;

        last_report = report;

        // Already active and still on screen
        if (ctx && ctx.report === report && document.body.contains(ctx.root[0])) {
            maybe_render();
            return;
        }

        deactivate();

        // ---------- styling ----------

        if (!document.getElementById('mps-css')) {
            $('head').append(`<style id="mps-css">${CSS}</style>`);
        }

        const $wrapper = $(report.page.wrapper);

        $wrapper.addClass('mps-page');

        // ---------- shell ----------

        const $main = report.page.main && report.page.main.length
            ? report.page.main
            : $wrapper.find('.layout-main-section');

        const root = $('<div id="mps-root"></div>').html(shell_html());

        $main.prepend(root);

        ctx = { report, root, last_sig: '', parsed: null, exec_time: '--' };

        root.find('#mps-dynamic').html('<div class="mps-empty">Loading...</div>');

        load_designations(root, report);

        bind_events(root, report);

        // Re-render whenever the report data changes (works for every refresh)
        let timer = null;

        const observer = new MutationObserver((mutations) => {

            if (mutations.every(m => root[0].contains(m.target))) return;

            clearTimeout(timer);
            timer = setTimeout(maybe_render, 60);
        });

        observer.observe($main[0], { childList: true, subtree: true, characterData: true });

        ctx.observer = observer;

        // draw straight away if the report data is already loaded
        maybe_render();
    }

    // Route changes: build the design on our report, remove it everywhere else
    function on_route_change() {

        if (route_is_ours()) {

            // give Frappe a moment to build the report page
            setTimeout(() => activate(frappe.query_report || last_report), 150);

        } else {

            deactivate();
        }
    }

    $(document).off('page-change.mps').on('page-change.mps', on_route_change);

    $(window).off('popstate.mps').on('popstate.mps', () => setTimeout(on_route_change, 50));

    function current_filters(report) {

        const get = (name) => {
            try { return report.get_filter_value(name) || ''; } catch (e) { return ''; }
        };

        return {
            designation: get('designation'),
            employee_type: get('employee_type')
        };
    }

    function read_exec_time(report) {

        // Execution time is printed by Frappe's own footer (we ignore our own copy)
        const clone = $(report.page.wrapper).clone();
        clone.find('#mps-root').remove();

        const match = clone.text().match(/Execution Time:\s*([\d.]+)\s*sec/i);

        return match ? `${match[1]} sec` : '--';
    }

    function maybe_render() {

        if (!ctx) return;

        // Our block was removed by Frappe (page rebuilt) - build it again
        if (!document.body.contains(ctx.root[0])) {
            const report = ctx.report;
            deactivate();
            activate(report);
            return;
        }

        const report = ctx.report;

        if (!route_is_ours() || !Array.isArray(report.data)) return;

        const parsed = parse_data(report.columns, report.data);

        // Data belongs to another report (or is not loaded yet)
        if (!parsed.valid) return;

        const filters = current_filters(report);
        const exec_time = read_exec_time(report);

        let sig = '';

        try {
            sig = JSON.stringify([
                (report.columns || []).map(c => c.fieldname),
                report.data,
                filters,
                exec_time
            ]);
        } catch (e) {
            sig = String(Date.now());
        }

        if (sig === ctx.last_sig) return;

        ctx.last_sig = sig;
        ctx.exec_time = exec_time;
        ctx.parsed = parsed;

        // keep the custom filters in sync with the real report filters
        const $d = ctx.root.find('#mps-designation');
        const $t = ctx.root.find('#mps-type');

        if (filters.designation && !$d.find(`option[value="${CSS_escape(filters.designation)}"]`).length) {
            $d.append(new Option(filters.designation, filters.designation));
        }

        $d.val(filters.designation).toggleClass('ph', !filters.designation);
        $t.val(filters.employee_type);

        render_dynamic(ctx.root, ctx.parsed, filters, exec_time);
    }

    function CSS_escape(value) {
        return String(value).replace(/["\\]/g, '\\$&');
    }

    function load_designations(root, report) {

        const apply = (list) => {

            if (!ctx || ctx.root !== root) return;

            const $d = root.find('#mps-designation');
            const selected = current_filters(report).designation;

            (list || []).forEach(row => {
                if (!$d.find(`option[value="${CSS_escape(row.name)}"]`).length) {
                    $d.append(new Option(row.name, row.name));
                }
            });

            $d.val(selected).toggleClass('ph', !selected);
        };

        if (cache.designations) {
            apply(cache.designations);
            return;
        }

        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Designation',
                fields: ['name'],
                order_by: 'name asc',
                limit_page_length: 0
            },
            callback: (r) => {
                cache.designations = r.message || [];
                apply(cache.designations);
            }
        });
    }


    // =================================================================
    // SECTION 7: EVENTS
    // =================================================================

    function set_filter(report, name, value) {

        if (typeof report.set_filter_value === 'function') {
            return report.set_filter_value(name, value);
        }

        const f = (report.filters || []).find(x => x.df.fieldname === name);

        if (f) return f.set_value(value);
    }

    function export_csv() {

        if (!ctx || !ctx.parsed) return;

        const { rows, grand } = ctx.parsed;

        const cell = (v) => `"${String(v === null || v === undefined ? '' : v).replace(/"/g, '""')}"`;

        const lines = [['Designation', 'Direct', 'Vendor', 'Deployed', 'Bench', 'Total'].map(cell).join(',')];

        rows.concat([grand]).forEach(r => {
            lines.push([r.designation, r.direct, r.vendor, r.deployed, r.bench, r.total].map(cell).join(','));
        });

        const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');

        link.href = URL.createObjectURL(blob);
        link.download = `Manpower_Strength_${frappe.datetime.get_today()}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }

    function bind_events(root, report) {

        root.on('change', '#mps-designation', function () {

            $(this).toggleClass('ph', !$(this).val());

            set_filter(report, 'designation', $(this).val() || '');
        });

        root.on('change', '#mps-type', function () {

            set_filter(report, 'employee_type', $(this).val() || '');
        });

        root.on('click', '[data-act]', function (e) {

            const act = $(this).attr('data-act');

            const $menu = root.find('.mps-menu');

            if (act === 'menu') {
                e.stopPropagation();
                $menu.toggleClass('open');
                return;
            }

            $menu.removeClass('open');

            if (act === 'refresh') {

                ctx.last_sig = '';
                report.refresh();

            } else if (act === 'export') {

                export_csv();

            } else if (act === 'print') {

                window.print();
            }
        });

        $(document).off('click.mps').on('click.mps', function () {
            root.find('.mps-menu').removeClass('open');
        });
    }


    // =================================================================
    // REPORT DEFINITION
    // =================================================================

    frappe.query_reports[REPORT_NAME] = {

        filters: FILTERS,

        onload: function (report) {

            activate(report);

            maybe_render();
        },

        after_datatable_render: function () {

            if (ctx) {
                maybe_render();
            } else {
                activate(frappe.query_report || last_report);
            }
        }
    };

})();
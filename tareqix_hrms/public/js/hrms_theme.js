// /* ================================================================
//    TAREQIX HRMS | OMAN MODERN THEME  (v5)
//    Frappe v16 - light theme + Oman hero + KPI cards
//    - Works with Frappe SPA navigation (no page reload needed)
//    - Theme applies ONLY inside the Tareqix HRMS workspace
//    ================================================================ */

// (function () {
//     "use strict";

//     /* ============================================================
//        CONFIGURATION
//     ============================================================ */

//     const TAREQIX_WORKSPACE_PATH = "/desk/tareqix-hrms";
//     const THEME_CLASS = "tareqix-hrms-theme";
//     const STYLE_ID = "tareqix-oman-executive-css";
//     const FONT_ID = "tareqix-oman-font";
//     const ASSET_VERSION = "5"; // bump when CSS/JS changes

//     const STYLE_URL = "/assets/tareqix_hrms/css/hrms_theme.css";
//     const FONT_URL =
//         "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

//     const KPI_CACHE_MS = 15000;

//     /* Pages that receive the hero + KPI cards (List view only) */
//     const KPI_PAGES = {
//         "Employee": {
//             ar: "الموظفون",
//             description: "Manage your workforce and employee records across Oman.",
//             eyebrow: "Workforce management"
//         },
//         "Supplier": {
//             ar: "الموردون",
//             description: "Manage manpower vendors and supply partners across Oman.",
//             eyebrow: "Supplier management"
//         },
//         "Company": {
//             ar: "الشركات",
//             description: "Manage your companies and legal entities that supply and deploy your workforce.",
//             eyebrow: "Company management"
//         },
//         "Payroll Entry": {
//             ar: "كشوف الرواتب",
//             description: "Monitor payroll processing and payment records.",
//             eyebrow: "Time & payroll"
//         }
//     };

//     /* Icons used by KPI cards (card.icon from the API, else by position) */
//     const ICONS = {
//         users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 12 0v1M16 4a4 4 0 0 1 0 8M22 21v-1a5 5 0 0 0-4-5"/>',
//         deploy: '<path d="M4 12h16M14 6l6 6-6 6"/>',
//         pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
//         alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
//         building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>',
//         box: '<path d="M21 8l-9-5-9 5 9 5zM3 8v8l9 5 9-5V8M12 13v8"/>',
//         card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
//         doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'
//     };

//     const DEFAULT_ICON_ORDER = ["users", "deploy", "pin", "alert"];
//     const DEFAULT_TONE_ORDER = ["green", "blue", "gold", "red"];

//     const HERO_SKYLINE_SVG =
//         '<svg class="tx-hero-skyline" viewBox="0 0 520 200" aria-hidden="true" focusable="false">' +
//         '<path d="M0 200V150h44V116h18V92a14 14 0 0 1 28 0v24h18v34h34V132a50 50 0 0 1 100 0v18h26V106h14v44h42V120a28 28 0 0 1 56 0v30h26V84h10V56h8v28h10v66h44v50z" fill="#fff" fill-opacity=".14"/>' +
//         '<path d="M218 86a50 50 0 0 1 100 0z" fill="#FFD36B" fill-opacity=".55"/>' +
//         '<circle cx="450" cy="40" r="20" fill="#FFD36B"/>' +
//         '<circle cx="459" cy="34" r="17" fill="#139C84"/>' +
//         "</svg>";


//     /* ============================================================
//        STATE
//     ============================================================ */

//     let renderTimer = null;
//     let observer = null;
//     let initialized = false;
//     const kpiCache = {};


//     /* ============================================================
//        ROUTE HELPERS
//     ============================================================ */

//     function getRoute() {
//         if (window.frappe && typeof frappe.get_route === "function") {
//             return frappe.get_route() || [];
//         }
//         return [];
//     }

//     function getCurrentPath() {
//         return window.location.pathname.replace(/\/+$/, "");
//     }

//     /*
//        Identify the Tareqix workspace by:
//        1) URL prefix  (/desk/tareqix-hrms...)
//        2) the sidebar title, because DocType routes such as
//           /desk/company stay inside the Tareqix sidebar.
//        DocType names alone are NOT used (Company, Supplier, Employee
//        are shared with other apps).
//     */
//     function sidebarIsTareqix() {
//         const title = document.querySelector(
//             ".body-sidebar .sidebar-header .header-title, .body-sidebar .header-title"
//         );

//         return !!(title && /tareqix/i.test(title.textContent || ""));
//     }

//     function isHrmsRoute() {
//         const path = getCurrentPath();

//         return (
//             path === TAREQIX_WORKSPACE_PATH ||
//             path.startsWith(TAREQIX_WORKSPACE_PATH + "/") ||
//             sidebarIsTareqix()
//         );
//     }


//     /* ============================================================
//        GENERATED CONTENT
//     ============================================================ */

//     function removeGenerated() {
//         document
//             .querySelectorAll("[data-tx-generated]")
//             .forEach(function (node) {
//                 node.remove();
//             });
//     }

//     function escapeHtml(value) {
//         return String(value == null ? "" : value).replace(
//             /[&<>"']/g,
//             function (ch) {
//                 return {
//                     "&": "&amp;",
//                     "<": "&lt;",
//                     ">": "&gt;",
//                     '"': "&quot;",
//                     "'": "&#39;"
//                 }[ch];
//             }
//         );
//     }


//     /* ============================================================
//        THEME CSS / CLASS
//     ============================================================ */

//     function loadAsset(id, href) {
//         if (document.getElementById(id)) {
//             return;
//         }

//         const link = document.createElement("link");
//         link.id = id;
//         link.rel = "stylesheet";
//         link.href = href;
//         document.head.appendChild(link);
//     }

//     function setThemeState(enabled) {
//         document.documentElement.classList.toggle(THEME_CLASS, enabled);

//         if (document.body) {
//             document.body.classList.toggle(THEME_CLASS, enabled);
//         }

//         if (enabled) {
//             /* All rules are scoped under .tareqix-hrms-theme,
//                so the stylesheet can safely stay loaded. */
//             loadAsset(STYLE_ID, STYLE_URL + "?v=" + ASSET_VERSION);
//             loadAsset(FONT_ID, FONT_URL);
//         }
//     }


//     /* ============================================================
//        HERO
//     ============================================================ */

//     function makeHero(doctype, meta) {
//         const node = document.createElement("section");

//         node.className = "tx-oman-hero";
//         node.setAttribute("data-tx-generated", "hero");
//         node.setAttribute("data-tx-doctype", doctype);

//         node.innerHTML =
//             HERO_SKYLINE_SVG +
//             '<div class="tx-hero-content">' +
//             '<span class="tx-hero-eyebrow">' +
//             escapeHtml(meta.eyebrow || "Tareqix HRMS") +
//             " &middot; Sultanate of Oman</span>" +
//             '<h2 class="tx-hero-title">' +
//             escapeHtml(doctype) +
//             ' <span lang="ar" dir="rtl">' +
//             escapeHtml(meta.ar || "") +
//             "</span></h2>" +
//             '<p class="tx-hero-description">' +
//             escapeHtml(meta.description || "") +
//             "</p></div>" +
//             '<div class="tx-hero-flag" aria-hidden="true">' +
//             "<span></span><span></span><span></span></div>";

//         return node;
//     }


//     /* ============================================================
//        KPI CARDS
//     ============================================================ */

//     function makeKpiShell(doctype) {
//         const grid = document.createElement("section");

//         grid.className = "tx-kpi-grid";
//         grid.setAttribute("data-tx-generated", "kpis");
//         grid.setAttribute("data-tx-doctype", doctype);

//         grid.innerHTML =
//             '<div class="tx-kpi-loading">Loading dashboard statistics…</div>';

//         return grid;
//     }

//     function formatValue(value) {
//         const number = Number(value);

//         if (value === "" || value == null || Number.isNaN(number)) {
//             return escapeHtml(value == null ? "0" : value);
//         }

//         return number.toLocaleString();
//     }

//     function renderKpiCards(grid, cards) {
//         if (!Array.isArray(cards) || !cards.length) {
//             grid.classList.add("tx-kpi-empty");
//             grid.innerHTML =
//                 '<div class="tx-kpi-loading">Statistics are not available for your permissions.</div>';
//             return;
//         }

//         grid.classList.remove("tx-kpi-empty");

//         grid.innerHTML = cards
//             .map(function (card, index) {
//                 const iconKey =
//                     ICONS[card.icon] ?
//                     card.icon :
//                     DEFAULT_ICON_ORDER[index % DEFAULT_ICON_ORDER.length];

//                 const tone =
//                     ["green", "blue", "gold", "red"].indexOf(card.tone) > -1 ?
//                     card.tone :
//                     DEFAULT_TONE_ORDER[index % DEFAULT_TONE_ORDER.length];

//                 return (
//                     '<article class="tx-kpi-card" data-tone="' + tone + '">' +
//                     '<div class="tx-kpi-top">' +
//                     '<span class="tx-kpi-label">' + escapeHtml(card.label) + "</span>" +
//                     '<span class="tx-kpi-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
//                     ICONS[iconKey] +
//                     "</svg></span></div>" +
//                     '<strong class="tx-kpi-value">' + formatValue(card.value) + "</strong>" +
//                     '<span class="tx-kpi-note">' +
//                     escapeHtml(card.note || "Current records") +
//                     "</span></article>"
//                 );
//             })
//             .join("");
//     }

//     function fetchKpis(doctype, grid) {
//         if (!window.frappe || typeof frappe.call !== "function") {
//             return;
//         }

//         const cached = kpiCache[doctype];
//         const now = Date.now();

//         /* Show cached numbers instantly, refresh only if stale. */
//         if (cached) {
//             renderKpiCards(grid, cached.cards);

//             if (now - cached.time < KPI_CACHE_MS) {
//                 return;
//             }
//         }

//         const token = String(now) + Math.random();
//         grid.dataset.txToken = token;

//         frappe.call({
//             method: "tareqix_hrms.api.dashboard.get_page_stats",
//             args: { doctype: doctype },

//             callback: function (response) {
//                 /* Ignore late responses (user navigated / re-rendered). */
//                 if (
//                     !grid.isConnected ||
//                     grid.dataset.txToken !== token ||
//                     !isHrmsRoute()
//                 ) {
//                     return;
//                 }

//                 const cards =
//                     (response && response.message && response.message.cards) || [];

//                 kpiCache[doctype] = { time: Date.now(), cards: cards };
//                 renderKpiCards(grid, cards);
//             },

//             error: function () {
//                 if (grid.isConnected && grid.dataset.txToken === token) {
//                     renderKpiCards(grid, (cached && cached.cards) || []);
//                 }
//             }
//         });
//     }


//     /* ============================================================
//        PAGE RENDERING (idempotent - safe to call repeatedly)
//     ============================================================ */

//     /*
//        Frappe keeps previously opened pages in the DOM (hidden), so we
//        must pick the VISIBLE list section that belongs to this route.
//     */
//     function findVisibleMain(doctype) {
//         const sections = Array.prototype.slice
//             .call(document.querySelectorAll(".layout-main-section"))
//             .filter(function (el) {
//                 return el.offsetParent !== null;
//             });

//         if (!sections.length) {
//             return null;
//         }

//         const wanted = ("list/" + doctype).toLowerCase();

//         const exact = sections.find(function (el) {
//             const page = el.closest("[data-page-route]");
//             const route = page ? page.getAttribute("data-page-route") : "";
//             return String(route || "").toLowerCase().indexOf(wanted) > -1;
//         });

//         return exact || sections[0];
//     }

//     function renderSelectedListPage() {
//         const route = getRoute();
//         const doctype = route[1];
//         const meta = KPI_PAGES[doctype];

//         if (route[0] !== "List" || !meta) {
//             removeGenerated();
//             return;
//         }

//         const main = findVisibleMain(doctype);

//         if (!main) {
//             return;
//         }

//         const hero = main.querySelector('[data-tx-generated="hero"]');
//         const kpis = main.querySelector('[data-tx-generated="kpis"]');

//         /* Already rendered for this DocType - nothing to do. */
//         if (
//             hero && kpis &&
//             hero.getAttribute("data-tx-doctype") === doctype &&
//             main.firstElementChild === hero &&
//             hero.nextElementSibling === kpis
//         ) {
//             return;
//         }

//         removeGenerated();

//         const newHero = makeHero(doctype, meta);
//         const newKpis = makeKpiShell(doctype);

//         main.insertBefore(newKpis, main.firstChild);
//         main.insertBefore(newHero, newKpis);

//         fetchKpis(doctype, newKpis);
//     }


//     /* ============================================================
//        SYNC (theme + page) AND SCHEDULING
//     ============================================================ */

//     function sync() {
//         const enabled = isHrmsRoute();

//         setThemeState(enabled);

//         if (!enabled) {
//             removeGenerated();
//             return;
//         }

//         renderSelectedListPage();
//     }

//     function scheduleSync(delay) {
//         window.clearTimeout(renderTimer);

//         renderTimer = window.setTimeout(function () {
//             renderTimer = null;
//             sync();
//         }, typeof delay === "number" ? delay : 120);
//     }

//     function onRouteChange() {
//         /* 1) Instant: switch the theme class with no delay (no flash). */
//         setThemeState(isHrmsRoute());

//         /* 2) Frappe replaces page DOM asynchronously, so re-check a few
//               times. sync() is idempotent so this is cheap. */
//         scheduleSync(0);
//         window.setTimeout(sync, 250);
//         window.setTimeout(sync, 700);
//     }


//     /* ============================================================
//        INITIALIZATION
//     ============================================================ */

//     function startObserver() {
//         if (observer || !window.MutationObserver || !document.body) {
//             return;
//         }

//         observer = new MutationObserver(function (mutations) {
//             const relevant = mutations.some(function (mutation) {
//                 const target = mutation.target;

//                 /* Ignore changes inside our own generated nodes. */
//                 if (
//                     target.nodeType === 1 &&
//                     target.closest &&
//                     target.closest("[data-tx-generated]")
//                 ) {
//                     return false;
//                 }

//                 return mutation.addedNodes.length || mutation.removedNodes.length;
//             });

//             if (relevant) {
//                 scheduleSync(120);
//             }
//         });

//         observer.observe(document.body, { childList: true, subtree: true });
//     }

//     function initialize() {
//         if (initialized || window.__tareqixThemeInitialized) {
//             return;
//         }

//         initialized = true;
//         window.__tareqixThemeInitialized = true;

//         /* Frappe SPA navigation */
//         if (frappe.router && typeof frappe.router.on === "function") {
//             frappe.router.on("change", onRouteChange);
//         }

//         if (window.$) {
//             window.$(document).on("page-change", onRouteChange);
//         }

//         window.addEventListener("popstate", onRouteChange);

//         if (typeof frappe.after_ajax === "function") {
//             frappe.after_ajax(function () {
//                 scheduleSync(120);
//             });
//         }

//         startObserver();
//         sync();
//         scheduleSync(400);
//     }

//     /* Wait until Frappe is available, then start. */
//     function boot() {
//         if (window.frappe && frappe.router && document.body) {
//             initialize();
//             return;
//         }

//         window.setTimeout(boot, 100);
//     }

//     if (document.readyState === "loading") {
//         document.addEventListener("DOMContentLoaded", boot, { once: true });
//     } else {
//         boot();
//     }
// })();







































/* ================================================================
   TAREQIX HRMS | OMAN MODERN THEME  (v5)
   Frappe v16 - light theme + Oman hero + KPI cards
   - Works with Frappe SPA navigation (no page reload needed)
   - Theme applies ONLY inside the Tareqix HRMS workspace
   ================================================================ */

(function () {
    "use strict";

    /* ============================================================
       CONFIGURATION
    ============================================================ */

    const TAREQIX_WORKSPACE_PATH = "/desk/tareqix-hrms";
    const THEME_CLASS = "tareqix-hrms-theme";
    const STYLE_ID = "tareqix-oman-executive-css";
    const FONT_ID = "tareqix-oman-font";
    const ASSET_VERSION = "5"; // bump when CSS/JS changes

    const STYLE_URL = "/assets/tareqix_hrms/css/hrms_theme.css";
    const FONT_URL =
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

    const KPI_CACHE_MS = 15000;

    /* Pages that receive the hero + KPI cards (List view only) */
    const KPI_PAGES = {
        "Employee": {
            ar: "الموظفون",
            description: "Manage your workforce and employee records across Oman.",
            eyebrow: "Workforce management"
        },
        "Supplier": {
            ar: "الموردون",
            description: "Manage manpower vendors and supply partners across Oman.",
            eyebrow: "Supplier management"
        },
        "Company": {
            ar: "الشركات",
            description: "Manage your companies and legal entities that supply and deploy your workforce.",
            eyebrow: "Company management"
        },
        "Payroll Entry": {
            ar: "كشوف الرواتب",
            description: "Monitor payroll processing and payment records.",
            eyebrow: "Time & payroll"
        },
        "Worker": {
            ar: "العمال",
            description: "Manage workers, vendor staff and their records across Oman.",
            eyebrow: "Workforce management"
        },
        "Site Detail": {
            ar: "تفاصيل المواقع",
            description: "Manage client sites and project locations where your workforce is deployed.",
            eyebrow: "Site management"
        },
        "Deployments": {
            ar: "التكليفات",
            description: "Track which workers are deployed to which sites and for how long.",
            eyebrow: "Workforce deployment"
        },
        "Site TimeSheet": {
            ar: "سجلات دوام المواقع",
            description: "Review daily site attendance, in/out times and total working hours.",
            eyebrow: "Site time tracking"
        },
        "Salary Structure": {
            ar: "هياكل الرواتب",
            description: "Define salary structures and the components used for payroll.",
            eyebrow: "Payroll setup"
        },
        "Salary Structure Assignment": {
            ar: "تعيين هياكل الرواتب",
            description: "Assign salary structures to employees and track effective dates.",
            eyebrow: "Payroll setup"
        },
        "Bulk Salary Structure Assignment": {
            ar: "التعيين الجماعي لهياكل الرواتب",
            description: "Assign salary structures to many employees in one step.",
            eyebrow: "Payroll setup"
        },
        "Salary Slip": {
            ar: "قسائم الرواتب",
            description: "View and manage employee salary slips and payments.",
            eyebrow: "Time & payroll"
        },
        "Salary Component": {
            ar: "مكونات الراتب",
            description: "Manage earnings and deductions used in salary structures.",
            eyebrow: "Payroll setup"
        },
        "Oman Labour Rules": {
            ar: "قوانين العمل العُماني",
            description: "Maintain Oman labour law rules applied to your workforce.",
            eyebrow: "Compliance"
        },
        "Visa and PRO": {
            ar: "التأشيرات والعلاقات العامة",
            description: "Track visas, labour cards and PRO documents for your workers.",
            eyebrow: "Visa & PRO"
        },
        "Attendance": {
            ar: "الحضور",
            description: "Monitor daily attendance status across your workforce.",
            eyebrow: "Attendance"
        },
        "Employee Attendance": {
            ar: "حضور الموظفين",
            description: "Review employee attendance records and working days.",
            eyebrow: "Attendance"
        }
    };

    /* Case-insensitive DocType lookup (returns the key used in KPI_PAGES) */
    const KPI_PAGE_KEYS = {};
    Object.keys(KPI_PAGES).forEach(function (key) {
        KPI_PAGE_KEYS[key.toLowerCase()] = key;
    });

    function canonicalDoctype(name) {
        return KPI_PAGE_KEYS[String(name || "").toLowerCase()] || null;
    }

    /*
       KPI definitions (counted in the browser with frappe.client.get_count,
       so NO custom Python method is required and user permissions are
       respected automatically). Edit labels / filters freely.

       If you later add a server method that returns
       { cards: [{label, value, note, icon, tone}] }, put its dotted path in
       SERVER_STATS_METHOD below. It is tried first, then these definitions.
    */
    const SERVER_STATS_METHOD = "tareqix_hrms.api.hrms_theme.get_page_stats";

    const KPI_DEFINITIONS = {
        "Employee": [
            { label: "Total employees", filters: [], note: "All employee records", icon: "users", tone: "green" },
            { label: "Active", filters: [["status", "=", "Active"]], note: "Currently working", icon: "deploy", tone: "blue" },
            { label: "Inactive / Left", filters: [["status", "in", ["Inactive", "Suspended", "Left"]]], note: "Not currently active", icon: "alert", tone: "red" },
            { label: "Added in 30 days", filters: [["creation", ">=", "__DAYS_AGO_30__"]], note: "New records", icon: "pin", tone: "gold" }
        ],
        "Supplier": [
            { label: "Total suppliers", filters: [], note: "All vendors", icon: "box", tone: "green" },
            { label: "Enabled", filters: [["disabled", "=", 0]], note: "Active partners", icon: "deploy", tone: "blue" },
            { label: "Disabled", filters: [["disabled", "=", 1]], note: "Not in use", icon: "alert", tone: "red" },
            { label: "Added in 30 days", filters: [["creation", ">=", "__DAYS_AGO_30__"]], note: "New vendors", icon: "pin", tone: "gold" }
        ],
        "Company": [
            { label: "Total companies", filters: [], note: "Active entities", icon: "building", tone: "green" },
            { label: "Group companies", filters: [["is_group", "=", 1]], note: "Parent entities", icon: "users", tone: "blue" },
            { label: "Perpetual inventory", filters: [["enable_perpetual_inventory", "=", 1]], note: "Enabled companies", icon: "box", tone: "gold" },
            { label: "Added in 30 days", filters: [["creation", ">=", "__DAYS_AGO_30__"]], note: "New entities", icon: "pin", tone: "red" }
        ],
        "Payroll Entry": [
            { label: "Total entries", filters: [], note: "All payroll runs", icon: "card", tone: "green" },
            { label: "Draft", filters: [["docstatus", "=", 0]], note: "Awaiting submission", icon: "doc", tone: "gold" },
            { label: "Submitted", filters: [["docstatus", "=", 1]], note: "Processed", icon: "deploy", tone: "blue" },
            { label: "Cancelled", filters: [["docstatus", "=", 2]], note: "Cancelled runs", icon: "alert", tone: "red" }
        ]
    };

    /* Used for every page above that has no specific entry in KPI_DEFINITIONS */
    const GENERIC_DEFINITIONS = [
        { label: "Total records", filters: [], note: "All records", icon: "doc", tone: "green" },
        { label: "Added in 30 days", filters: [["creation", ">=", "__DAYS_AGO_30__"]], note: "This month", icon: "pin", tone: "blue" },
        { label: "Added in 7 days", filters: [["creation", ">=", "__DAYS_AGO_7__"]], note: "This week", icon: "deploy", tone: "gold" },
        { label: "Added today", filters: [["creation", ">=", "__DAYS_AGO_0__"]], note: "Created today", icon: "building", tone: "green" }
    ];

    /* Icons used by KPI cards (card.icon from the API, else by position) */
    const ICONS = {
        users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 12 0v1M16 4a4 4 0 0 1 0 8M22 21v-1a5 5 0 0 0-4-5"/>',
        deploy: '<path d="M4 12h16M14 6l6 6-6 6"/>',
        pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
        alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
        building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>',
        box: '<path d="M21 8l-9-5-9 5 9 5zM3 8v8l9 5 9-5V8M12 13v8"/>',
        card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
        doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'
    };

    const DEFAULT_ICON_ORDER = ["users", "deploy", "pin", "alert"];
    const DEFAULT_TONE_ORDER = ["green", "blue", "gold", "red"];

    const HERO_SKYLINE_SVG =
        '<svg class="tx-hero-skyline" viewBox="0 0 520 200" aria-hidden="true" focusable="false">' +
        '<path d="M0 200V150h44V116h18V92a14 14 0 0 1 28 0v24h18v34h34V132a50 50 0 0 1 100 0v18h26V106h14v44h42V120a28 28 0 0 1 56 0v30h26V84h10V56h8v28h10v66h44v50z" fill="#fff" fill-opacity=".14"/>' +
        '<path d="M218 86a50 50 0 0 1 100 0z" fill="#FFD36B" fill-opacity=".55"/>' +
        '<circle cx="450" cy="40" r="20" fill="#FFD36B"/>' +
        '<circle cx="459" cy="34" r="17" fill="#139C84"/>' +
        "</svg>";


    /* ============================================================
       STATE
    ============================================================ */

    let renderTimer = null;
    let observer = null;
    let initialized = false;
    const kpiCache = {};


    /* ============================================================
       ROUTE HELPERS
    ============================================================ */

    function getRoute() {
        if (window.frappe && typeof frappe.get_route === "function") {
            return frappe.get_route() || [];
        }
        return [];
    }

    function getCurrentPath() {
        return window.location.pathname.replace(/\/+$/, "");
    }

    /*
       Identify the Tareqix workspace by:
       1) URL prefix  (/desk/tareqix-hrms...)
       2) the sidebar title, because DocType routes such as
          /desk/company stay inside the Tareqix sidebar.
       DocType names alone are NOT used (Company, Supplier, Employee
       are shared with other apps).
    */
    function sidebarIsTareqix() {
        const title = document.querySelector(
            ".body-sidebar .sidebar-header .header-title, .body-sidebar .header-title"
        );

        return !!(title && /tareqix/i.test(title.textContent || ""));
    }

    function isHrmsRoute() {
        const path = getCurrentPath();

        return (
            path === TAREQIX_WORKSPACE_PATH ||
            path.startsWith(TAREQIX_WORKSPACE_PATH + "/") ||
            sidebarIsTareqix()
        );
    }


    /* ============================================================
       GENERATED CONTENT
    ============================================================ */

    function removeGenerated() {
        document
            .querySelectorAll("[data-tx-generated]")
            .forEach(function (node) {
                node.remove();
            });
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(
            /[&<>"']/g,
            function (ch) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                }[ch];
            }
        );
    }


    /* ============================================================
       THEME CSS / CLASS
    ============================================================ */

    function loadAsset(id, href) {
        if (document.getElementById(id)) {
            return;
        }

        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
    }

    function setThemeState(enabled) {
        document.documentElement.classList.toggle(THEME_CLASS, enabled);

        if (document.body) {
            document.body.classList.toggle(THEME_CLASS, enabled);
        }

        if (enabled) {
            /* All rules are scoped under .tareqix-hrms-theme,
               so the stylesheet can safely stay loaded. */
            loadAsset(STYLE_ID, STYLE_URL + "?v=" + ASSET_VERSION);
            loadAsset(FONT_ID, FONT_URL);
        }
    }


    /* ============================================================
       HERO
    ============================================================ */

    function makeHero(doctype, meta) {
        const node = document.createElement("section");

        node.className = "tx-oman-hero";
        node.setAttribute("data-tx-generated", "hero");
        node.setAttribute("data-tx-doctype", doctype);

        node.innerHTML =
            HERO_SKYLINE_SVG +
            '<div class="tx-hero-content">' +
            '<span class="tx-hero-eyebrow">' +
            escapeHtml(meta.eyebrow || "Tareqix HRMS") +
            " &middot; Sultanate of Oman</span>" +
            '<h2 class="tx-hero-title">' +
            escapeHtml(doctype) +
            ' <span lang="ar" dir="rtl">' +
            escapeHtml(meta.ar || "") +
            "</span></h2>" +
            '<p class="tx-hero-description">' +
            escapeHtml(meta.description || "") +
            "</p></div>" +
            '<div class="tx-hero-flag" aria-hidden="true">' +
            "<span></span><span></span><span></span></div>";

        return node;
    }


    /* ============================================================
       KPI CARDS
    ============================================================ */

    function makeKpiShell(doctype) {
        const grid = document.createElement("section");

        grid.className = "tx-kpi-grid";
        grid.setAttribute("data-tx-generated", "kpis");
        grid.setAttribute("data-tx-doctype", doctype);

        grid.innerHTML =
            '<div class="tx-kpi-loading">Loading dashboard statistics…</div>';

        return grid;
    }

    function formatValue(value) {
        const number = Number(value);

        if (value === "" || value == null || Number.isNaN(number)) {
            return escapeHtml(value == null ? "0" : value);
        }

        return number.toLocaleString();
    }

    function renderKpiCards(grid, cards) {
        if (!Array.isArray(cards) || !cards.length) {
            grid.classList.add("tx-kpi-empty");
            grid.innerHTML =
                '<div class="tx-kpi-loading">Statistics are not available for your permissions.</div>';
            return;
        }

        grid.classList.remove("tx-kpi-empty");
        grid.style.setProperty("--tx-cols", String(Math.min(cards.length, 4)));

        grid.innerHTML = cards
            .map(function (card, index) {
                const iconKey =
                    ICONS[card.icon] ?
                    card.icon :
                    DEFAULT_ICON_ORDER[index % DEFAULT_ICON_ORDER.length];

                const tone =
                    ["green", "blue", "gold", "red"].indexOf(card.tone) > -1 ?
                    card.tone :
                    DEFAULT_TONE_ORDER[index % DEFAULT_TONE_ORDER.length];

                return (
                    '<article class="tx-kpi-card" data-tone="' + tone + '">' +
                    '<div class="tx-kpi-top">' +
                    '<span class="tx-kpi-label">' + escapeHtml(card.label) + "</span>" +
                    '<span class="tx-kpi-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    ICONS[iconKey] +
                    "</svg></span></div>" +
                    '<strong class="tx-kpi-value">' + formatValue(card.value) + "</strong>" +
                    '<span class="tx-kpi-note">' +
                    escapeHtml(card.note || "Current records") +
                    "</span></article>"
                );
            })
            .join("");
    }

    function resolveFilters(filters) {
        const text = JSON.stringify(filters || []).replace(
            /__DAYS_AGO_(\d+)__/g,
            function (match, days) {
                return frappe.datetime.add_days(
                    frappe.datetime.get_today(),
                    -Number(days)
                );
            }
        );

        return JSON.parse(text);
    }

    /* One count; resolves to a number, or null when not permitted / failed. */
    function countRecords(doctype, filters) {
        return new Promise(function (resolve) {
            frappe.call({
                method: "frappe.client.get_count",
                type: "GET",
                args: { doctype: doctype, filters: resolveFilters(filters) },
                silent: true,
                callback: function (r) {
                    const n = r && r.message;
                    resolve(typeof n === "number" ? n : Number(n) || 0);
                },
                error: function () {
                    resolve(null);
                }
            });
        });
    }

    function loadFromDefinitions(doctype) {
        const defs =
            KPI_DEFINITIONS[canonicalDoctype(doctype)] || GENERIC_DEFINITIONS;

        return Promise.all(
            defs.map(function (def) {
                return countRecords(doctype, def.filters).then(function (value) {
                    return {
                        label: def.label,
                        value: value == null ? "–" : value,
                        note: value == null ? "Not available" : def.note,
                        icon: def.icon,
                        tone: def.tone,
                        _ok: value != null
                    };
                });
            })
        ).then(function (cards) {
            /* If nothing could be counted, report "no permission". */
            return cards.some(function (c) { return c._ok; }) ? cards : [];
        });
    }

    function loadFromServer(doctype) {
        return new Promise(function (resolve) {
            if (!SERVER_STATS_METHOD) {
                resolve(null);
                return;
            }

            frappe.call({
                method: SERVER_STATS_METHOD,
                args: { doctype: doctype },
                silent: true,
                callback: function (r) {
                    const cards = r && r.message && r.message.cards;
                    resolve(Array.isArray(cards) && cards.length ? cards : null);
                },
                error: function () {
                    resolve(null);
                }
            });
        });
    }

    function fetchKpis(doctype, grid) {
        if (!window.frappe || typeof frappe.call !== "function") {
            return;
        }

        const cached = kpiCache[doctype];
        const now = Date.now();

        /* Show cached numbers instantly, refresh only if stale. */
        if (cached) {
            renderKpiCards(grid, cached.cards);

            if (now - cached.time < KPI_CACHE_MS) {
                return;
            }
        }

        const token = String(now) + Math.random();
        grid.dataset.txToken = token;

        loadFromServer(doctype)
            .then(function (cards) {
                return cards || loadFromDefinitions(doctype);
            })
            .then(function (cards) {
                /* Ignore late responses (user navigated / re-rendered). */
                if (
                    !grid.isConnected ||
                    grid.dataset.txToken !== token ||
                    !isHrmsRoute()
                ) {
                    return;
                }

                kpiCache[doctype] = { time: Date.now(), cards: cards };
                console.info("[Tareqix Theme] KPI cards loaded for", doctype, "->", cards.length, "cards");
                renderKpiCards(grid, cards);
            });
    }


    /* ============================================================
       PAGE RENDERING (idempotent - safe to call repeatedly)
    ============================================================ */

    /*
       Frappe keeps previously opened pages in the DOM (hidden), so we
       must pick the VISIBLE list section that belongs to this route.
    */
    function findVisibleMain(doctype) {
        const sections = Array.prototype.slice
            .call(document.querySelectorAll(".layout-main-section"))
            .filter(function (el) {
                return el.offsetParent !== null;
            });

        if (!sections.length) {
            return null;
        }

        const wanted = ("list/" + doctype).toLowerCase();

        const exact = sections.find(function (el) {
            const page = el.closest("[data-page-route]");
            const route = page ? page.getAttribute("data-page-route") : "";
            return String(route || "").toLowerCase().indexOf(wanted) > -1;
        });

        return exact || sections[0];
    }

    const rebuildTimes = [];

    function rebuildAllowed() {
        const now = Date.now();

        while (rebuildTimes.length && now - rebuildTimes[0] > 3000) {
            rebuildTimes.shift();
        }

        if (rebuildTimes.length >= 4) {
            console.warn(
                "[Tareqix Theme] banner was rebuilt 4 times in 3s - " +
                "another script is removing it. Pausing re-render."
            );
            return false;
        }

        rebuildTimes.push(now);
        return true;
    }

    /* Cheap check used by the observer: is there anything left to do? */
    function isUpToDate() {
        const enabled = isHrmsRoute();

        if (
            document.documentElement.classList.contains(THEME_CLASS) !== enabled
        ) {
            return false;
        }

        if (!enabled) {
            return !document.querySelector("[data-tx-generated]");
        }

        const route = getRoute();
        const doctype = route[1];

        if (route[0] !== "List" || !canonicalDoctype(doctype)) {
            return !document.querySelector("[data-tx-generated]");
        }

        const main = findVisibleMain(doctype);

        return !!(
            main &&
            main.querySelector('[data-tx-generated="hero"]') &&
            main.querySelector('[data-tx-generated="kpis"]')
        );
    }

    function renderSelectedListPage() {
        const route = getRoute();
        const doctype = route[1];
        const meta = KPI_PAGES[canonicalDoctype(doctype)];

        if (route[0] !== "List" || !meta) {
            removeGenerated();
            return;
        }

        const main = findVisibleMain(doctype);

        if (!main) {
            return;
        }

        const hero = main.querySelector('[data-tx-generated="hero"]');
        const kpis = main.querySelector('[data-tx-generated="kpis"]');

        /* Already rendered for this DocType - nothing to do.
           (Position is NOT enforced: if another script puts a node above
           the banner we must not remove/re-add it, that causes blinking.) */
        if (
            hero && kpis &&
            hero.getAttribute("data-tx-doctype") === doctype &&
            hero.nextElementSibling === kpis
        ) {
            return;
        }

        /* Safety: never rebuild in a tight loop. */
        if (!rebuildAllowed()) {
            return;
        }

        removeGenerated();

        const newHero = makeHero(doctype, meta);
        const newKpis = makeKpiShell(doctype);

        main.insertBefore(newKpis, main.firstChild);
        main.insertBefore(newHero, newKpis);

        console.info("[Tareqix Theme] banner + KPI shell rendered for:", doctype);
        fetchKpis(doctype, newKpis);
    }


    /* ============================================================
       SYNC (theme + page) AND SCHEDULING
    ============================================================ */

    function sync() {
        const enabled = isHrmsRoute();

        setThemeState(enabled);

        if (!enabled) {
            removeGenerated();
            return;
        }

        renderSelectedListPage();
    }

    function scheduleSync(delay) {
        window.clearTimeout(renderTimer);

        renderTimer = window.setTimeout(function () {
            renderTimer = null;
            sync();
        }, typeof delay === "number" ? delay : 120);
    }

    function onRouteChange() {
        /* 1) Instant: switch the theme class with no delay (no flash). */
        setThemeState(isHrmsRoute());

        /* 2) Frappe replaces page DOM asynchronously, so re-check a few
              times. sync() is idempotent so this is cheap. */
        scheduleSync(0);
        window.setTimeout(sync, 250);
        window.setTimeout(sync, 700);
    }


    /* ============================================================
       INITIALIZATION
    ============================================================ */

    function startObserver() {
        if (observer || !window.MutationObserver || !document.body) {
            return;
        }

        observer = new MutationObserver(function (mutations) {
            const relevant = mutations.some(function (mutation) {
                const target = mutation.target;

                /* Ignore changes inside our own generated nodes. */
                if (
                    target.nodeType === 1 &&
                    target.closest &&
                    target.closest("[data-tx-generated]")
                ) {
                    return false;
                }

                return mutation.addedNodes.length || mutation.removedNodes.length;
            });

            if (relevant && !isUpToDate()) {
                scheduleSync(60);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function initialize() {
        if (initialized || window.__tareqixThemeInitialized) {
            return;
        }

        initialized = true;
        window.__tareqixThemeInitialized = true;
        console.info("[Tareqix Theme] JS v" + ASSET_VERSION + " initialized");

        /* Frappe SPA navigation */
        if (frappe.router && typeof frappe.router.on === "function") {
            frappe.router.on("change", onRouteChange);
        }

        if (window.$) {
            window.$(document).on("page-change", onRouteChange);
        }

        window.addEventListener("popstate", onRouteChange);

        if (typeof frappe.after_ajax === "function") {
            frappe.after_ajax(function () {
                scheduleSync(120);
            });
        }

        startObserver();
        sync();
        scheduleSync(400);
    }

    /* Wait until Frappe is available, then start. */
    function boot() {
        if (window.frappe && frappe.router && document.body) {
            initialize();
            return;
        }

        window.setTimeout(boot, 100);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
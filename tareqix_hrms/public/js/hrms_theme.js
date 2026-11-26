/* ================================================================
   TAREQIX HRMS | OMAN EXECUTIVE THEME
   Frappe v16
   Workspace-isolated theme + selected list-page KPI cards
   Theme applies ONLY inside /desk/tareqix-hrms
   ================================================================ */

(function() {
    "use strict";

    /* ============================================================
       CONFIGURATION
    ============================================================ */

    const TAREQIX_WORKSPACE_PATH = "/desk/tareqix-hrms";

    const THEME_CLASS = "tareqix-hrms-theme";
    const STYLE_ID = "tareqix-oman-executive-css";

    const STYLE_URL =
        "/assets/tareqix_hrms/css/hrms_theme.css";

    const HRMS_DOCTYPES = [
        "Employee",
        "Company",
        "Supplier",
        "Site Detail",
        "Deployments",
        "Site TimeSheet",
        "Employee Site Sheet",
        "Vendor Employee Work Order",
        "Visa and PRO",
        "Oman Labour Rules",
        "Salary Slip",
        "Payroll Entry",
        "Employee Salary",
        "Job Applicant",
        "Job Offer",
        "Employee Checkin",
        "Attendance",
        "Leave Application",
        "Leave Allocation",
        "Salary Structure",
        "Salary Structure Assignment",
        "Bulk Salary Structure Assignment",
        "Salary Component",
        "Department",
        "Designation",
        "Branch"
    ];

    const HRMS_REPORTS = [
        "Document Expiry Report",
        "Manpower Strength"
    ];

    const HRMS_PAGES = [
        "employee-site-timesh",
        "employee-site-sheet"
    ];

    const KPI_PAGES = {
        "Employee": {
            ar: "الموظفون",
            description: "Manage your workforce and employee records across Oman",
            eyebrow: "Workforce management"
        },

        "Supplier": {
            ar: "الموردون",
            description: "Manage manpower vendors and supply partners across Oman",
            eyebrow: "Supplier management"
        },

        "Company": {
            ar: "الشركات",
            description: "Manage your companies and business entities",
            eyebrow: "Company management"
        },

        "Payroll Entry": {
            ar: "كشوف الرواتب",
            description: "Monitor payroll processing and payment records",
            eyebrow: "Time & payroll"
        }
    };

    let renderTimer = null;
    let lastRouteKey = "";
    let observer = null;
    let initialized = false;


    /* ============================================================
       ROUTE HELPERS
    ============================================================ */

    function getRoute() {
        if (
            window.frappe &&
            typeof frappe.get_route === "function"
        ) {
            return frappe.get_route() || [];
        }

        return [];
    }


    function getCurrentPath() {
        return window.location.pathname
            .replace(/\/+$/, "");
    }


    /*
       IMPORTANT:

       Do not identify the theme by DocType name.

       Supplier, Employee, Company and other DocTypes are
       shared between multiple apps.

       Identify the Tareqix workspace using its URL prefix.
    */

    function isHrmsRoute() {
        const path = getCurrentPath();

        return (
            path === TAREQIX_WORKSPACE_PATH ||
            path.startsWith(TAREQIX_WORKSPACE_PATH + "/")
        );
    }


    function routeKey(route) {
        return (route || [])
            .map(String)
            .join("::");
    }


    /* ============================================================
       GENERATED CONTENT CLEANUP
    ============================================================ */

    function removeGenerated() {
        document.querySelectorAll(
            '[data-tx-generated="hero"], ' +
            '[data-tx-generated="kpis"], ' +
            '[data-tx-generated="footer"]'
        ).forEach(function(element) {
            element.remove();
        });
    }


    /* ============================================================
       CSS LOADING AND THEME ACTIVATION
    ============================================================ */

    function loadThemeCSS() {
        let link = document.getElementById(STYLE_ID);

        if (link) {
            return;
        }

        link = document.createElement("link");

        link.id = STYLE_ID;
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = STYLE_URL + "?v=3";

        document.head.appendChild(link);
    }


    function removeThemeCSS() {
        const link = document.getElementById(STYLE_ID);

        if (link) {
            link.remove();
        }
    }


    function applyThemeClass() {
        const enabled = isHrmsRoute();

        document.documentElement.classList.toggle(
            THEME_CLASS,
            enabled
        );

        if (document.body) {
            document.body.classList.toggle(
                THEME_CLASS,
                enabled
            );
        }

        if (enabled) {
            loadThemeCSS();
        } else {
            /*
               Leaving Tareqix:
               remove CSS, theme classes and generated content.
            */

            removeThemeCSS();
            removeGenerated();
        }

        return enabled;
    }


    /* ============================================================
       HTML HELPERS
    ============================================================ */

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/[&<>"']/g, function(character) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                } [character];
            });
    }


    /* ============================================================
       HERO SECTION
    ============================================================ */

    function makeHero(doctype, meta) {
        const title = escapeHtml(doctype);
        const arabic = escapeHtml(meta.ar || "");

        const description = escapeHtml(
            meta.description ||
            "Manage your HRMS records across Oman"
        );

        const eyebrow = escapeHtml(
            meta.eyebrow || "Tareqix HRMS"
        );

        const node = document.createElement("section");

        node.className = "tx-oman-hero";

        node.setAttribute(
            "data-tx-generated",
            "hero"
        );

        node.innerHTML = `
            <div class="tx-hero-eyebrow">
                <span aria-hidden="true">✦</span>
                ${eyebrow} · مرحباً وسهلاً
            </div>

            <h2 class="tx-hero-title">
                ${title}
                <span lang="ar" dir="rtl">${arabic}</span>
            </h2>

            <p class="tx-hero-description">
                ${description}
            </p>
        `;

        return node;
    }


    /* ============================================================
       KPI CONTAINER
    ============================================================ */

    function makeKpiShell() {
        const grid = document.createElement("section");

        grid.className = "tx-kpi-grid";

        grid.setAttribute(
            "data-tx-generated",
            "kpis"
        );

        grid.innerHTML = `
            <div class="tx-kpi-loading">
                Loading dashboard statistics…
            </div>
        `;

        return grid;
    }


    /* ============================================================
       KPI CARDS
    ============================================================ */

    function renderKpiCards(grid, cards) {

        if (!Array.isArray(cards) || !cards.length) {
            grid.innerHTML = `
                <div class="tx-kpi-loading">
                    Statistics are not available for your permissions.
                </div>
            `;

            return;
        }

        grid.innerHTML = cards.map(function(card) {

            const value = Number(
                card.value || 0
            ).toLocaleString();

            const percent = Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        card.percent == null ?
                        100 :
                        card.percent
                    )
                )
            );

            return `
                <article class="tx-kpi-card">

                    <span class="tx-kpi-label">
                        ${escapeHtml(card.label)}
                    </span>

                    <strong class="tx-kpi-value">
                        ${value}
                    </strong>

                    <span class="tx-kpi-note">
                        ${escapeHtml(
                            card.note || "Current records"
                        )}
                    </span>

                    <div class="tx-kpi-bar">
                        <span style="width:${percent}%"></span>
                    </div>

                </article>
            `;

        }).join("");
    }


    /* ============================================================
       FETCH KPI DATA
    ============================================================ */

    function fetchKpis(doctype, grid) {

        if (
            !window.frappe ||
            typeof frappe.call !== "function"
        ) {
            return;
        }

        frappe.call({

            method: "tareqix_hrms.api.dashboard.get_page_stats",

            args: {
                doctype: doctype
            },

            callback: function(response) {

                /*
                   Prevent an old API response from rendering
                   after navigating to another workspace.
                */

                if (
                    !grid.isConnected ||
                    !isHrmsRoute()
                ) {
                    return;
                }

                if (
                    response &&
                    response.message
                ) {
                    renderKpiCards(
                        grid,
                        response.message.cards || []
                    );
                } else {
                    renderKpiCards(grid, []);
                }
            },

            error: function() {

                if (
                    grid.isConnected &&
                    isHrmsRoute()
                ) {
                    renderKpiCards(grid, []);
                }
            }
        });
    }


    /* ============================================================
       SELECTED LIST PAGE RENDERING
    ============================================================ */

    function renderSelectedListPage() {

        /*
           Absolutely no Tareqix generated content
           outside the Tareqix workspace.
        */

        if (!isHrmsRoute()) {
            removeGenerated();
            return;
        }

        const route = getRoute();

        const type = route[0];
        const doctype = route[1];

        const meta = KPI_PAGES[doctype];

        /*
           Only selected List pages receive KPI cards.
           Other Tareqix DocTypes still receive the theme CSS.
        */

        if (
            type !== "List" ||
            !meta
        ) {
            removeGenerated();
            return;
        }

        const main = document.querySelector(
            ".layout-main-section"
        );

        if (!main) {
            return;
        }

        if (
            main.querySelector(
                '[data-tx-generated="hero"]'
            )
        ) {
            return;
        }

        const hero = makeHero(
            doctype,
            meta
        );

        const kpis = makeKpiShell();

        const footer = document.createElement("div");

        footer.className = "tx-oman-footer";

        footer.setAttribute(
            "data-tx-generated",
            "footer"
        );

        footer.innerHTML = `
            <span>
                Powered by Frappe · Tareqix HRMS
            </span>

            <strong>
                OMR · ريال عماني
            </strong>
        `;

        main.insertBefore(
            footer,
            main.firstChild
        );

        main.insertBefore(
            kpis,
            footer
        );

        main.insertBefore(
            hero,
            kpis
        );

        fetchKpis(
            doctype,
            kpis
        );
    }


//     /* ============================================================
//        RENDER SCHEDULER
//     ============================================================ */

//     function scheduleRender() {

//         /*
//            Apply the theme immediately.
//            Do not wait for the rendering timer.
//         */

//         const enabled = applyThemeClass();

//         if (!enabled) {
//             removeGenerated();

//             if (renderTimer) {
//                 window.clearTimeout(renderTimer);
//                 renderTimer = null;
//             }

//             return;
//         }

//         if (renderTimer) {
//             window.clearTimeout(renderTimer);
//         }

//         renderTimer = window.setTimeout(function() {

//             renderTimer = null;

//             /*
//                Check again because the user may have navigated
//                while the timer was waiting.
//             */

//             if (!applyThemeClass()) {
//                 removeGenerated();
//                 return;
//             }

//             renderSelectedListPage();

//         }, 180);
//     }




//     /* =========================================================
//        SPA THEME REFRESH
//        Reapply Tareqix styling after Frappe navigation
//     ========================================================= */

//     function refreshTareqixUI() {

//         const enabled = isHrmsRoute();

//         document.documentElement.classList.toggle(
//             THEME_CLASS,
//             enabled
//         );

//         if (document.body) {
//             document.body.classList.toggle(
//                 THEME_CLASS,
//                 enabled
//             );
//         }

//         if (!enabled) {
//             removeThemeCSS();
//             removeGenerated();
//             return;
//         }

//         let link = document.getElementById(STYLE_ID);

//         if (!link) {
//             link = document.createElement("link");

//             link.id = STYLE_ID;
//             link.rel = "stylesheet";
//             link.type = "text/css";
//             link.href = STYLE_URL + "?v=4";

//             document.head.appendChild(link);
//         }

//         // Reapply after the stylesheet has loaded.
//         if (link.dataset.txLoadHandler !== "1") {
//             link.dataset.txLoadHandler = "1";

//             link.addEventListener("load", function() {
//                 if (isHrmsRoute()) {
//                     document.documentElement.classList.add(THEME_CLASS);

//                     if (document.body) {
//                         document.body.classList.add(THEME_CLASS);
//                     }

//                     renderSelectedListPage();
//                 }
//             });
//         }
//     }


//     /* =========================================================
//        ROUTE CHANGE
//     ========================================================= */

//     function handleRouteChange() {

//         const route = getRoute();
//         const currentKey = routeKey(route);

//         if (currentKey !== lastRouteKey) {
//             lastRouteKey = currentKey;
//             removeGenerated();
//         }

//         // Apply immediately during SPA navigation.
//         refreshTareqixUI();

//         if (renderTimer) {
//             window.clearTimeout(renderTimer);
//         }

//         // Allow Frappe to finish replacing the page DOM.
//         requestAnimationFrame(function() {
//             requestAnimationFrame(function() {

//                 refreshTareqixUI();

//                 if (isHrmsRoute()) {
//                     renderSelectedListPage();
//                 }

//             });
//         });

//         // Final check after Frappe's page rendering.
//         renderTimer = window.setTimeout(function() {

//             refreshTareqixUI();

//             if (isHrmsRoute()) {
//                 renderSelectedListPage();
//             }

//         }, 350);
//     }



//     /* ============================================================
//        ROUTER CHANGE HANDLER
//     ============================================================ */

//     // function handleRouteChange() {

//     //     const route = getRoute();
//     //     const currentKey = routeKey(route);

//     //     /*
//     //        Remove previously generated sections whenever
//     //        the route changes.
//     //     */

//     //     if (currentKey !== lastRouteKey) {
//     //         lastRouteKey = currentKey;
//     //         removeGenerated();
//     //     }

//     //     scheduleRender();
//     // }


//     /* ============================================================
//        INITIALIZATION
//     ============================================================ */

//     function initialize() {

//         if (initialized) {
//             return;
//         }

//         initialized = true;

//         lastRouteKey = routeKey(getRoute());

//         /*
//            Initial page load.
//         */

//         scheduleRender();


//         /* -----------------------------------------------
//            Frappe SPA navigation
//         ----------------------------------------------- */

//         if (
//             window.frappe &&
//             frappe.router &&
//             typeof frappe.router.on === "function"
//         ) {
//             frappe.router.on(
//                 "change",
//                 handleRouteChange
//             );
//         }


//         /* -----------------------------------------------
//            DOM observer
//            Handles Frappe page content replacement.
//         ----------------------------------------------- */

//         if (
//             window.MutationObserver &&
//             document.body
//         ) {
//             observer = new MutationObserver(function() {

//                 const enabled = applyThemeClass();

//                 if (!enabled) {
//                     removeGenerated();
//                     return;
//                 }

//                 const route = getRoute();

//                 const isSelectedList =
//                     route[0] === "List" &&
//                     !!KPI_PAGES[route[1]];

//                 if (
//                     isSelectedList &&
//                     !document.querySelector(
//                         '[data-tx-generated="hero"]'
//                     )
//                 ) {
//                     scheduleRender();
//                 }
//             });

//             observer.observe(
//                 document.body, {
//                     childList: true,
//                     subtree: true
//                 }
//             );
//         }


//         /* -----------------------------------------------
//            Frappe AJAX completion
//         ----------------------------------------------- */

//         if (
//             window.frappe &&
//             typeof frappe.after_ajax === "function"
//         ) {
//             frappe.after_ajax(function() {
//                 scheduleRender();
//             });
//         }
//     }


//     /* ============================================================
//        START
//     ============================================================ */

//     if (
//         document.readyState === "loading"
//     ) {
//         document.addEventListener(
//             "DOMContentLoaded",
//             initialize, {
//                 once: true
//             }
//         );
//     } else {
//         initialize();
//     }

// })();








/* =====================================================
   RENDER SCHEDULER AND ROUTE REFRESH
===================================================== */

// Existing declarations are already at the top:
// renderTimer, lastRouteKey and observer.

function hideUntilThemeReady() {

    if (!isHrmsRoute()) return;

    document.documentElement.style.visibility = "hidden";

    document.documentElement.classList.add(THEME_CLASS);

    loadThemeCSS();

    const styleLink = document.getElementById(STYLE_ID);

    if (!styleLink) {
        document.documentElement.style.visibility = "";
        return;
    }

    const showPage = () => {

        if (!isHrmsRoute()) {
            document.documentElement.style.visibility = "";
            return;
        }

        applyThemeClass();
        renderSelectedListPage();

        requestAnimationFrame(() => {
            document.documentElement.style.visibility = "";
        });
    };

    if (styleLink.sheet) {
        showPage();
    } else {
        styleLink.addEventListener("load", showPage, { once: true });
        styleLink.addEventListener("error", () => {
            document.documentElement.style.visibility = "";
        }, { once: true });
    }
}


function scheduleRender() {

    clearTimeout(renderTimer);

    renderTimer = setTimeout(() => {

        if (!isHrmsRoute()) {

            removeGenerated();
            removeThemeCSS();

            document.documentElement.classList.remove(THEME_CLASS);
            document.documentElement.style.visibility = "";

            if (document.body) {
                document.body.classList.remove(THEME_CLASS);
            }

            return;
        }

        document.documentElement.classList.add(THEME_CLASS);

        loadThemeCSS();
        applyThemeClass();

        const main = document.querySelector(".layout-main-section");

        if (!main) return;

        renderSelectedListPage();

    }, 250);
}


function handleRouteChange() {

    const currentRouteKey = routeKey(getRoute());

    if (currentRouteKey !== lastRouteKey) {
        lastRouteKey = currentRouteKey;
        removeGenerated();
    }

    if (isHrmsRoute()) {
        hideUntilThemeReady();
    } else {
        document.documentElement.style.visibility = "";
        scheduleRender();
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(scheduleRender);
    });

    setTimeout(scheduleRender, 700);
}


function initialize() {

    if (window.__tareqixThemeInitialized) return;

    window.__tareqixThemeInitialized = true;

    lastRouteKey = routeKey(getRoute());

    if (frappe.router && frappe.router.on) {
        frappe.router.on("change", handleRouteChange);
    }

    observer = new MutationObserver((mutations) => {

        const relevantChange = mutations.some(mutation => {

            const target = mutation.target;

            if (
                target.nodeType === 1 &&
                target.closest &&
                target.closest("[data-tx-generated]")
            ) {
                return false;
            }

            return (
                mutation.addedNodes.length > 0 ||
                mutation.removedNodes.length > 0
            );
        });

        if (relevantChange) {
            scheduleRender();
        }
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (frappe.after_ajax) {
        frappe.after_ajax(() => {
            scheduleRender();
        });
    }

    if (isHrmsRoute()) {
        hideUntilThemeReady();
    } else {
        scheduleRender();
    }
}


if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", initialize, {
        once: true
    });

} else {

    initialize();

}

})();
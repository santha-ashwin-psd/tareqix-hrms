
/* =========================================================
   DEPLOYMENT SITE BOARD
   App: tareqix_hrms
   DocType: Deployments
   Site Field: custom_site
========================================================= */

frappe.pages['deployment-site-boar'].on_page_load = function (wrapper) {

    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Deployment Site Board',
        single_column: true
    });

    const board = new DeploymentSiteBoard(page, wrapper);

    board.make();
};


/* =========================================================
   SECTION 1: BOARD INITIALIZATION
========================================================= */

class DeploymentSiteBoard {

    constructor(page, wrapper) {
        this.page = page;
        this.wrapper = wrapper;
        this.$main = $(wrapper).find('.layout-main-section');
        this.loading = false;
        this.moving = false;
    }

    make() {

        this.add_styles();
        this.add_toolbar();

        this.$main.html(`
            <div class="deployment-board-container">
                <div class="deployment-board-loading">
                    Loading deployments...
                </div>
            </div>
        `);

        this.load_board();
    }


    /* =====================================================
       SECTION 2: TOOLBAR
    ===================================================== */

    add_toolbar() {

        this.page.set_primary_action(
            'Refresh',
            () => this.load_board(),
            'refresh'
        );

        this.page.add_inner_button(
            'List View',
            () => frappe.set_route('List', 'Deployments', 'List')
        );
    }


    /* =====================================================
       SECTION 3: CSS STYLES
    ===================================================== */

    add_styles() {

        if ($('#deployment-site-board-styles').length) {
            return;
        }

        const css = `
            <style id="deployment-site-board-styles">

                .deployment-board-container {
                    width: 100%;
                    overflow-x: auto;
                    padding: 15px 5px;
                }

                .deployment-board {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    min-height: 450px;
                    padding-bottom: 20px;
                }

                .deployment-board-column {
                    flex: 0 0 300px;
                    width: 300px;
                    min-height: 400px;
                    background: var(--subtle-fg);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 12px;
                }

                .deployment-board-column.drag-over {
                    background: var(--blue-50);
                    border: 2px dashed var(--primary);
                }

                .deployment-board-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    padding: 4px 3px 10px;
                    border-bottom: 1px solid var(--border-color);
                }

                .deployment-board-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--heading-color);
                    overflow-wrap: anywhere;
                }

                .deployment-board-count {
                    background: var(--control-bg);
                    border-radius: 20px;
                    padding: 3px 9px;
                    font-size: 12px;
                }

                .deployment-board-card {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 13px;
                    margin-bottom: 10px;
                    cursor: grab;
                    box-shadow: var(--shadow-sm);
                    transition: box-shadow 0.15s;
                }

                .deployment-board-card:hover {
                    box-shadow: var(--shadow-md);
                }

                .deployment-board-card:active {
                    cursor: grabbing;
                }

                .deployment-board-card.dragging {
                    opacity: 0.4;
                }

                .deployment-card-id {
                    font-weight: 600;
                    font-size: 13px;
                    color: var(--primary);
                    margin-bottom: 8px;
                }

                .deployment-card-name {
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 8px;
                    color: var(--heading-color);
                }

                .deployment-card-detail {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin-top: 5px;
                    overflow-wrap: anywhere;
                }

                .deployment-board-empty {
                    text-align: center;
                    padding: 35px 10px;
                    color: var(--text-muted);
                    font-size: 12px;
                    border: 1px dashed var(--border-color);
                    border-radius: 7px;
                }

                .deployment-board-loading {
                    padding: 40px;
                    text-align: center;
                    color: var(--text-muted);
                }

                .deployment-board-message {
                    padding: 25px;
                    text-align: center;
                    color: var(--text-muted);
                }

            </style>
        `;

        $('head').append(css);
    }


    /* =====================================================
       SECTION 4: LOAD BOARD DATA
    ===================================================== */

    load_board() {

        if (this.loading) {
            return;
        }

        this.loading = true;

        this.$main.html(`
            <div class="deployment-board-loading">
                <i class="fa fa-spinner fa-spin"></i>
                Loading deployments...
            </div>
        `);

        frappe.call({
            method: 'tareqix_hrms.utils.deployment_site_board.get_deployment_site_board_data',

            callback: (r) => {

                this.loading = false;

                if (!r.message) {
                    this.show_error('Unable to load Deployment records.');
                    return;
                }

                this.render_board(r.message);
            },

            error: () => {
                this.loading = false;
                this.show_error('Error loading Deployment records. Please check your permissions and server logs.');
            }
        });
    }


    /* =====================================================
       SECTION 5: RENDER BOARD COLUMNS
    ===================================================== */

    render_board(columns) {

        if (!columns.length) {

            this.$main.html(`
                <div class="deployment-board-message">
                    No Deployment records found.
                </div>
            `);

            return;
        }

        let html = `
            <div class="deployment-board-container">
                <div class="deployment-board">
        `;

        columns.forEach((column, index) => {

            const site = column.site || '';
            const label = column.label || 'Unassigned';
            const records = column.records || [];

            html += `
                <div class="deployment-board-column"
                     data-site="${encodeURIComponent(site)}"
                     data-column="${index}">

                    <div class="deployment-board-header">

                        <div class="deployment-board-title">
                            ${frappe.utils.escape_html(label)}
                        </div>

                        <div class="deployment-board-count">
                            ${records.length}
                        </div>

                    </div>

                    <div class="deployment-board-cards">
            `;

            if (!records.length) {

                html += `
                    <div class="deployment-board-empty">
                        Drop Deployment here
                    </div>
                `;

            } else {

                records.forEach(record => {
                    html += this.render_card(record);
                });

            }

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        this.$main.html(html);

        this.bind_drag_events();
    }


    /* =====================================================
       SECTION 6: DEPLOYMENT CARD
    ===================================================== */

    render_card(record) {

        const safe = (value) => {
            return frappe.utils.escape_html(String(value || '-'));
        };

        return `
            <div class="deployment-board-card"
                 draggable="true"
                 data-name="${safe(record.name)}">

                <div class="deployment-card-id">
                    ${safe(record.name)}
                </div>

                <div class="deployment-card-name">
                    ${safe(record.custom_employee_name)}
                </div>

                <div class="deployment-card-detail">
                    Trade: ${safe(record.custom_trade)}
                </div>

                <div class="deployment-card-detail">
                    Employee Type: ${safe(record.custom_employee_type)}
                </div>

                <div class="deployment-card-detail">
                    Supplier: ${safe(record.custom_supplier || record.custom_vendor)}
                </div>

                <div class="deployment-card-detail">
                    Mobile: ${safe(record.custom_mobile_no)}
                </div>

            </div>
        `;
    }


    /* =====================================================
       SECTION 7: DRAG AND DROP EVENTS
    ===================================================== */

    bind_drag_events() {

        const $board = this.$main;

        $board.off('.deploymentBoard');

        // Start dragging a card
        $board.on(
            'dragstart.deploymentBoard',
            '.deployment-board-card',
            (event) => {

                if (this.moving) {
                    event.preventDefault();
                    return;
                }

                const card = event.currentTarget;

                event.originalEvent.dataTransfer.setData(
                    'text/plain',
                    card.dataset.name
                );

                event.originalEvent.dataTransfer.effectAllowed = 'move';

                $(card).addClass('dragging');
            }
        );


        // Finish dragging
        $board.on(
            'dragend.deploymentBoard',
            '.deployment-board-card',
            (event) => {
                $(event.currentTarget).removeClass('dragging');

                $board.find('.deployment-board-column')
                    .removeClass('drag-over');
            }
        );


        // Allow dropping on columns
        $board.on(
            'dragover.deploymentBoard',
            '.deployment-board-column',
            (event) => {

                event.preventDefault();

                if (!this.moving) {
                    $(event.currentTarget).addClass('drag-over');
                }

                event.originalEvent.dataTransfer.dropEffect = 'move';
            }
        );


        $board.on(
            'dragleave.deploymentBoard',
            '.deployment-board-column',
            (event) => {

                if (
                    !event.currentTarget.contains(event.relatedTarget)
                ) {
                    $(event.currentTarget).removeClass('drag-over');
                }
            }
        );


        // Drop card into destination site
        $board.on(
            'drop.deploymentBoard',
            '.deployment-board-column',
            (event) => {

                event.preventDefault();

                const column = event.currentTarget;

                $(column).removeClass('drag-over');

                if (this.moving) {
                    return;
                }

                const deployment = event.originalEvent.dataTransfer
                    .getData('text/plain');

                const new_site = decodeURIComponent(
                    column.dataset.site || ''
                );

                if (!deployment) {
                    return;
                }

                this.update_site(deployment, new_site);
            }
        );
    }


    /* =====================================================
       SECTION 8: SAVE NEW SITE
    ===================================================== */

    update_site(deployment, new_site) {

        this.moving = true;

        frappe.call({

            method: 'tareqix_hrms.utils.deployment_site_board.update_deployment_site',

            args: {
                deployment: deployment,
                new_site: new_site
            },

            callback: (r) => {

                this.moving = false;

                if (r.message && r.message.success) {

                    frappe.show_alert({
                        message: r.message.message || 'Deployment moved successfully.',
                        indicator: 'green'
                    });

                    this.load_board();

                } else {

                    frappe.msgprint(
                        'Unable to update Deployment site.'
                    );

                    this.load_board();
                }
            },

            error: () => {

                this.moving = false;

                frappe.msgprint(
                    'Failed to move Deployment. Please check your permissions.'
                );

                this.load_board();
            }
        });
    }


    /* =====================================================
       SECTION 9: ERROR DISPLAY
    ===================================================== */

    show_error(message) {

        this.$main.html(`
            <div class="deployment-board-message">
                ${frappe.utils.escape_html(message)}
            </div>
        `);
    }

}

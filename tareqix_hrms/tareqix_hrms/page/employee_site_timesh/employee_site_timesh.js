frappe.pages['employee-site-timesh'].on_page_load = function(wrapper) {

    // =====================================================
    // SECTION 1: PAGE SETUP
    // =====================================================

    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Site timesheets',
        single_column: true
    });


    // =====================================================
    // SECTION 2: PAGE STYLING
    // =====================================================

    if (!document.getElementById('employee-site-timesh-css')) {

        $('head').append(`
            <style id="employee-site-timesh-css">

                .est-page {
                    background: var(--bg-color);
                    padding: 15px;
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                }

                .est-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--border-color);
                }

                .est-filters {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .est-filter label {
                    display: block;
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-muted);
                    margin-bottom: 5px;
                    text-transform: uppercase;
                }

                .est-filter input,
                .est-filter select {
                    height: 36px;
                    border: 1px solid var(--border-color);
                    border-radius: 7px;
                    padding: 5px 10px;
                    background: var(--control-bg);
                    color: var(--text-color);
                }

                .est-refresh-btn {
                    height: 36px;
                    padding: 0 16px;
                    border: none;
                    border-radius: 7px;
                    background: #2563eb;
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    box-shadow: 0 2px 5px rgba(37,99,235,.25);
                    transition: all .2s ease;
                }

                .est-refresh-btn:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }

                .est-refresh-btn:disabled {
                    opacity: .65;
                    cursor: not-allowed;
                    transform: none;
                }

                .est-standard-shift-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                    padding: 14px 0;
                    border-bottom: 1px solid var(--border-color);
                }


				.est-standard-shift-actions {
				display: flex;
				align-items: center;
				justify-content: flex-end;
				gap: 12px;
				margin-left: auto;
				
				}

                .est-standard-shift-info {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .est-supplier-name {
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--text-color);
                }

                .est-shift-time {
                    font-size: 12px;
                    color: var(--text-muted);
                }

                .est-apply-shift-btn {
                    height: 36px;
                    padding: 0 16px;
                    border: none;
                    border-radius: 7px;
                    background: #2563eb;
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all .2s ease;
                }

                .est-apply-shift-btn:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }

                .est-apply-shift-btn:disabled {
                    opacity: .6;
                    cursor: not-allowed;
                    transform: none;
                }

                .est-info {
                    padding: 14px 0;
                    color: var(--text-muted);
                    font-size: 12px;
                }

                .est-table-wrapper {
                    overflow-x: auto;
                }

                .est-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .est-table th {
                    padding: 12px;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: .5px;
                    color: var(--text-muted);
                    border-bottom: 1px solid var(--border-color);
                    white-space: nowrap;
                }

                .est-table td {
                    padding: 11px 12px;
                    border-bottom: 1px solid var(--border-color);
                    white-space: nowrap;
                    vertical-align: middle;
                }

                .est-worker {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .est-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-blue);
                    color: var(--text-color);
                    font-weight: 700;
                    font-size: 11px;
                }

                .est-worker-name {
                    font-weight: 600;
                    color: var(--text-color);
                }

                .est-worker-id {
                    font-size: 11px;
                    color: var(--text-muted);
                    margin-top: 3px;
                }

                .est-input {
                    height: 32px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    padding: 4px 7px;
                    background: var(--control-bg);
                    color: var(--text-color);
                    font-size: 12px;
                }

                .est-attendance {
                    width: 105px;
                }

                .est-time {
                    width: 105px;
                }

                .est-break {
                    width: 65px;
                    text-align: center;
                }

                .est-total,
                .est-normal {
                    font-weight: 700;
                    text-align: center;
                }

                .est-readonly {
                    background: var(--subtle-fg);
                    border-radius: 5px;
                    padding: 6px 10px;
                    display: inline-block;
                    min-width: 55px;
                    text-align: center;
                }

                .est-summary {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    margin-top: 10px;
                    border: 1px solid var(--border-color);
                }

                .est-summary-item {
                    padding: 14px;
                    border-right: 1px solid var(--border-color);
                }

                .est-summary-value {
                    font-size: 20px;
                    font-weight: 700;
                }

                .est-summary-label {
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .est-empty {
                    text-align: center;
                    padding: 30px !important;
                    color: var(--text-muted);
                }

                @media(max-width: 768px) {
                    .est-summary {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }









				.est-time-picker-btn {
                width: 100%;
                min-width: 110px;
                padding: 7px 10px;
                background: #f1f1f1;
                color: #111111;
                border: 1px solid #dddddd;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
                text-align: center;
               }

                .est-time-picker-btn:hover {
                 background: #e5e5e5;
                 border-color: #999999;
                }














				// =====================================================
// ENHANCED OK AND CANCEL BUTTON DESIGN
// =====================================================

overlay.find('.est-time-actions').css({

    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '10px',
    marginTop: '24px',
    paddingTop: '15px',
    borderTop: '1px solid #eeeeee'

});

// CANCEL BUTTON
overlay.find('.est-cancel').css({

    background: '#ffffff',
    color: '#555555',
    border: '1px solid #d5d5d5',
    borderRadius: '7px',
    padding: '9px 18px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.4px',
    cursor: 'pointer',
    transition: 'all 0.2s'

});

// OK BUTTON
overlay.find('.est-ok').css({

    background: '#222222',
    color: '#ffffff',
    border: '1px solid #222222',
    borderRadius: '7px',
    padding: '9px 22px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)'

});

// CANCEL HOVER
overlay.find('.est-cancel').hover(

    function() {
        $(this).css({
            background: '#f1f1f1',
            borderColor: '#aaaaaa'
        });
    },

    function() {
        $(this).css({
            background: '#ffffff',
            borderColor: '#d5d5d5'
        });
    }

);

// OK HOVER
overlay.find('.est-ok').hover(

    function() {
        $(this).css({
            background: '#444444',
            borderColor: '#444444'
        });
    },

    function() {
        $(this).css({
            background: '#222222',
            borderColor: '#222222'
        });
    }

);














            </style>
        `);
    }


    // =====================================================
    // SECTION 3: PAGE HTML
    // =====================================================

    $(page.body).html(`

        <div class="est-page">

            <div class="est-toolbar">

                <div class="est-filters">

                    <div class="est-filter">
                        <label>Site</label>
                        <select id="est-site" style="min-width:200px;">
                            <option value="">Loading Sites...</option>
                        </select>
                    </div>

                    <div class="est-filter">
                        <label>Date</label>
                        <input type="date" id="est-date">
                    </div>

                </div>

                <button class="est-refresh-btn" id="est-refresh">
                    <i class="fa fa-refresh"></i>
                    <span>Refresh</span>
                </button>

            </div>


            <!-- STANDARD SHIFT INFORMATION -->

            <div class="est-standard-shift-row">

                <div class="est-standard-shift-info">

                    <div class="est-supplier-name" id="est-supplier-name">
                        Loading Supplier...
                    </div>

                    <div class="est-shift-time" id="est-shift-time">
                        Shift Time: --
                    </div>

                </div>

                <div class="est-standard-shift-actions">
				<button class="est-apply-shift-btn" id="est-apply-shift">
				<i class="fa fa-clock-o"></i>
				Apply Standard Shift
				</button>
				
				<button class="est-apply-shift-btn"
				id="est-submit-timesheet"
				style="background:#15803d;">
				<i class="fa fa-save"></i>
				Submit Time Sheet
				</button>
				
				</div>

            </div>


            <div class="est-info">
                Employee attendance and working hours
            </div>


            <div class="est-table-wrapper">

                <table class="est-table">

                    <thead>
                        <tr>
                            <th style="min-width:240px;">Worker</th>
                            <th>Trade</th>
							<th>Civil ID</th>
                            <th>Attendance</th>
                            <th>IN</th>
                            <th>OUT</th>
                            <th>Break</th>
                            <th>Total Hrs</th>
                            <th>Normal</th>
                        </tr>
                    </thead>

                    <tbody id="est-employee-rows">
                        <tr>
                            <td colspan="8" class="est-empty">
                                Loading Employees...
                            </td>
                        </tr>
                    </tbody>

                </table>

            </div>


            <!-- SUMMARY -->

            <div class="est-summary">

                <div class="est-summary-item">
                    <div class="est-summary-value" id="est-present">0</div>
                    <div class="est-summary-label">Present</div>
                </div>

                <div class="est-summary-item">
                    <div class="est-summary-value" id="est-total">0</div>
                    <div class="est-summary-label">Total Working Hours</div>
                </div>

                <div class="est-summary-item">
                    <div class="est-summary-value" id="est-normal">0</div>
                    <div class="est-summary-label">Normal Hours</div>
                </div>

                <div class="est-summary-item">
                    <div class="est-summary-value" id="est-employees">0</div>
                    <div class="est-summary-label">Total Employees</div>
                </div>

            </div>

        </div>

    `);


    // =====================================================
    // SECTION 4: INITIAL SETTINGS
    // =====================================================

    $('#est-date').val(frappe.datetime.get_today());

    let employees = [];

    let employee_shift_map = {};

    let standard_shift = {
        supplier: '',
        in_time: '',
        out_time: ''
    };


    // =====================================================
    // SECTION 5: HELPER FUNCTIONS
    // =====================================================

    function escape_html(value) {
        return $('<div>').text(value || '').html();
    }


    function initials(name) {
        return String(name || '')
            .split(' ')
            .slice(0, 2)
            .map(v => v.charAt(0))
            .join('')
            .toUpperCase();
    }


    function format_hours(value) {
        return Number(value || 0)
            .toFixed(2)
            .replace(/\.00$/, '');
    }


    function time_to_minutes(value) {
        if (!value) return null;

        const parts = value.split(':');

        return (
            Number(parts[0]) * 60
        ) + Number(parts[1]);
    }


    // =====================================================
    // SECTION 6: TOTAL HOURS CALCULATION
    // =====================================================

    // function calculate_total(in_time, out_time, break_hours) {

    //     const start = time_to_minutes(in_time);
    //     const end = time_to_minutes(out_time);

    //     if (start === null || end === null) {
    //         return 0;
    //     }

    //     let minutes = end - start;

    //     // Support overnight shifts
    //     if (minutes < 0) {
    //         minutes += 1440;
    //     }

    //     const break_minutes = Number(break_hours || 0) * 60;

    //     return Math.max(0, (minutes - break_minutes) / 60);
    // }




    function calculate_total(in_time, out_time, break_time) {

        const start = time_to_minutes(in_time);
        const end = time_to_minutes(out_time);

        if (start === null || end === null) {
            return 0;
        }

        let minutes = end - start;

        // Support overnight shifts
        if (minutes < 0) {
            minutes += 1440;
        }

        // Break is now HH:mm, not decimal hours
        const break_minutes = time_to_minutes(break_time) || 0;

        return Math.max(0, (minutes - break_minutes) / 60);
    }




    // =====================================================
    // SECTION 7: SHIFT HOURS CALCULATION
    // =====================================================

    function calculate_shift_hours(start_time, end_time) {

        const start = time_to_minutes(start_time);
        const end = time_to_minutes(end_time);

        if (start === null || end === null) {
            return 0;
        }

        let minutes = end - start;

        if (minutes < 0) {
            minutes += 1440;
        }

        return minutes / 60;
    }


    // =====================================================
    // SECTION 8: LOAD UNIQUE SITE LIST
    // =====================================================

    async function load_sites() {

        const site_field = $('#est-site');
        const selected_site = site_field.val();

        site_field.html(`
            <option value="">Loading Sites...</option>
        `);

        try {

            const deployments = await frappe.db.get_list(
                'Deployments', {
                    fields: ['custom_site'],
                    limit_page_length: 5000
                }
            );

            // Get unique site values

            const unique_sites = [
                ...new Set(
                    deployments
                    .map(row => row.custom_site)
                    .filter(site => site && site.trim())
                )
            ];

            unique_sites.sort((a, b) => a.localeCompare(b));

            site_field.empty();

            // No Select Site option

            unique_sites.forEach(site => {
                site_field.append(new Option(site, site));
            });

            // Preserve existing selection or choose first site

            if (unique_sites.includes(selected_site)) {

                site_field.val(selected_site);

            } else if (unique_sites.length) {

                site_field.val(unique_sites[0]);

            }

            if (!unique_sites.length) {
                site_field.html(`
                    <option value="">No Sites Found</option>
                `);
            }

        } catch (error) {

            console.error('Site Loading Error:', error);

            site_field.html(`
                <option value="">Unable to Load Sites</option>
            `);

            frappe.msgprint({
                title: 'Site Loading Error',
                message: error.message,
                indicator: 'red'
            });
        }
    }


    // =====================================================
    // SECTION 9: LOAD SUPPLIER STANDARD SHIFT
    // =====================================================

    async function load_standard_shift() {

        const selected_site = $('#est-site').val();

        standard_shift = {
            supplier: '',
            in_time: '',
            out_time: ''
        };

        $('#est-supplier-name').text('Loading Supplier...');
        $('#est-shift-time').text('Shift Time: --');

        if (!selected_site) {

            $('#est-supplier-name').text('No Site Selected');
            return;
        }

        try {

            // STEP 1: GET SUPPLIER FROM DEPLOYMENT

            const deployments = await frappe.db.get_list(
                'Deployments', {
                    fields: ['custom_vendor'],
                    filters: {
                        custom_site: selected_site
                    },
                    limit_page_length: 5000
                }
            );

            const suppliers = [
                ...new Set(
                    deployments
                    .map(row => row.custom_vendor)
                    .filter(Boolean)
                )
            ];

            if (!suppliers.length) {

                $('#est-supplier-name').text('No Supplier Found');
                $('#est-shift-time').text('Shift Time: --');

                return;
            }

            // Assumption: one standard Supplier per Site.
            const supplier_name = suppliers[0];

            // STEP 2: FETCH SUPPLIER SHIFT DETAILS

            const supplier = await frappe.db.get_value(
                'Supplier',
                supplier_name,
                [
                    'custom_shift_in_time',
                    'custom_shift_out_time'
                ]
            );

            const supplier_data = supplier.message || {};

            standard_shift = {
                supplier: supplier_name,
                in_time: supplier_data.custom_shift_in_time || '',
                out_time: supplier_data.custom_shift_out_time || ''
            };

            // STEP 3: DISPLAY SUPPLIER AND SHIFT

            $('#est-supplier-name').text(supplier_name);

            if (standard_shift.in_time && standard_shift.out_time) {

                $('#est-shift-time').text(
                    `Shift Time: ${standard_shift.in_time} - ${standard_shift.out_time}`
                );

            } else {

                $('#est-shift-time').text(
                    'Shift Time: Not Configured'
                );
            }

            // STEP 4: WARN IF MULTIPLE SUPPLIERS

            if (suppliers.length > 1) {

                console.warn(
                    'Multiple Suppliers found for Site:',
                    selected_site,
                    suppliers
                );
            }

        } catch (error) {

            console.error('Standard Shift Loading Error:', error);

            $('#est-supplier-name').text('Unable to Load Supplier');
            $('#est-shift-time').text('Shift Time: --');

            frappe.msgprint({
                title: 'Supplier Shift Error',
                message: error.message,
                indicator: 'red'
            });
        }
    }


    // =====================================================
    // SECTION 10: LOAD EMPLOYEES BY SELECTED SITE
    // =====================================================

    async function load_employees() {

        const tbody = $('#est-employee-rows');
        const selected_site = $('#est-site').val();

        tbody.html(`
            <tr>
                <td colspan="8" class="est-empty">
                    Loading Employees...
                </td>
            </tr>
        `);

        try {

            // Load supplier shift for selected Site

            await load_standard_shift();

            // Load Employee metadata

            await frappe.model.with_doctype('Employee');

            const meta = frappe.get_meta('Employee');

            const fields = [
                'name',
                'employee_name',
                'status',
                'designation',
                'civil_id'
            ];

            // STEP 1: GET EMPLOYEES FROM DEPLOYMENTS

            let employee_ids = [];

            if (selected_site) {

                const deployments = await frappe.db.get_list(
                    'Deployments', {
                        fields: [
                            'custom_site',
                            'custom_employee_id'
                        ],
                        filters: {
                            custom_site: selected_site
                        },
                        limit_page_length: 5000
                    }
                );

                employee_ids = [
                    ...new Set(
                        deployments
                        .map(row => row.custom_employee_id)
                        .filter(Boolean)
                    )
                ];

                if (!employee_ids.length) {

                    employees = [];
                    employee_shift_map = {};

                    render_employees({});

                    return;
                }
            }

            // STEP 2: FILTER ACTIVE EMPLOYEES

            const filters = {
                status: 'Active'
            };

            if (selected_site) {
                filters.name = ['in', employee_ids];
            }

            employees = await frappe.db.get_list(
                'Employee', {
                    fields: fields,
                    filters: filters,
                    order_by: 'employee_name asc',
                    limit_page_length: 5000
                }
            );

            // STEP 3: LOAD SHIFT ASSIGNMENTS

            await load_shift_assignments();

        } catch (error) {

            console.error('Employee Loading Error:', error);

            tbody.html(`
                <tr>
                    <td colspan="8" class="est-empty">
                        Unable to load Employees.
                        Check browser console for details.
                    </td>
                </tr>
            `);

            frappe.msgprint({
                title: 'Employee Loading Error',
                message: error.message,
                indicator: 'red'
            });
        }
    }


    // =====================================================
    // SECTION 11: LOAD SHIFT ASSIGNMENTS
    // =====================================================

    async function load_shift_assignments() {

        const selected_date = $('#est-date').val();

        try {

            const assignments = await frappe.db.get_list(
                'Shift Assignment', {
                    fields: [
                        'employee',
                        'shift_type',
                        'start_date',
                        'end_date'
                    ],
                    filters: {
                        docstatus: 1,
                        start_date: ['<=', selected_date]
                    },
                    limit_page_length: 5000
                }
            );

            const active_assignments = assignments.filter(a => {

                return (
                    !a.end_date ||
                    a.end_date >= selected_date
                );

            });

            const shift_names = [
                ...new Set(
                    active_assignments.map(a => a.shift_type)
                )
            ];

            let shifts = [];

            if (shift_names.length) {

                shifts = await frappe.db.get_list(
                    'Shift Type', {
                        fields: [
                            'name',
                            'start_time',
                            'end_time'
                        ],
                        filters: {
                            name: ['in', shift_names]
                        },
                        limit_page_length: 5000
                    }
                );
            }

            const shift_map = {};

            shifts.forEach(shift => {

                shift_map[shift.name] = calculate_shift_hours(
                    shift.start_time,
                    shift.end_time
                );

            });

            employee_shift_map = {};

            active_assignments.forEach(assignment => {

                employee_shift_map[assignment.employee] =
                    shift_map[assignment.shift_type] || 0;

            });

            render_employees(employee_shift_map);

        } catch (error) {

            console.error('Shift Assignment Error:', error);

            frappe.msgprint(
                'Unable to load Shift Assignments. Please check the Shift Assignment records.'
            );
        }
    }




    // =====================================================
    // SECTION 12: RENDER EMPLOYEE TABLE
    // =====================================================

    function render_employees(shift_map) {

        const tbody = $('#est-employee-rows');

        tbody.empty();

        if (!employees.length) {

            tbody.html(`
            <tr>
                <td colspan="9" class="est-empty">
                    No Employees found for the selected Site.
                </td>
            </tr>
        `);

            update_summary();
            return;
        }

        employees.forEach(emp => {

            // Designation displayed in Trade column
            const trade = emp.designation || '-';

            // Employee Civil ID
            const civil_id = emp.civil_id || '-';

            const normal_hours = shift_map[emp.name] || 0;

            const employee_name = emp.employee_name || emp.name;

            const row = $(`
            <tr class="est-row"
                data-employee="${escape_html(emp.name)}">

                <td>
                    <div class="est-worker">

                        <div class="est-avatar">
                            ${escape_html(initials(employee_name))}
                        </div>

                        <div>
                            <div class="est-worker-name">
                                ${escape_html(employee_name)}
                            </div>

                            <div class="est-worker-id">
                                ${escape_html(emp.name)}
                            </div>
                        </div>

                    </div>
                </td>

                <td class="est-trade-value">
                    ${escape_html(trade)}
                </td>

                <td class="est-civil-id-value">
                    ${escape_html(civil_id)}
                </td>

                <td>
                    <select class="est-input est-attendance">

                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Sick">Sick</option>
                        <option value="Leave">Leave</option>

                    </select>
                </td>
<td>
    <input type="hidden" class="est-in">

    <button type="button"
        class="est-time-picker-btn"
        data-time-type="in">
        IN - Select
    </button>
</td>

<td>
    <input type="hidden" class="est-out">

    <button type="button"
        class="est-time-picker-btn"
        data-time-type="out">
        OUT - Select
    </button>
</td>
                <td>
<input type="hidden" class="est-break" value="00:00">

<button type="button"
    class="est-time-picker-btn est-break-picker-btn"
    data-time-type="break">
    BREAK - Select
</button>
                </td>

                <td class="est-total">
                    <span class="est-readonly est-total-value">0</span>
                </td>

                <td class="est-normal">
                    <span class="est-readonly est-normal-value">
                        ${format_hours(normal_hours)}
                    </span>
                </td>

            </tr>
        `);

            tbody.append(row);

        });

        update_summary();

    }
    // =====================================================
    // SECTION 13: INPUT CHANGE EVENTS
    // TOTAL HOURS CALCULATION
    // =====================================================

    $(page.body).on(
        'change input',
        '.est-in, .est-out, .est-break',
        function() {

            const row = $(this).closest('.est-row');

            const in_time = row.find('.est-in').val();

            const out_time = row.find('.est-out').val();

            const break_hours = row.find('.est-break').val();

            const total = calculate_total(
                in_time,
                out_time,
                break_hours
            );

            row.find('.est-total-value').text(
                format_hours(total)
            );

            update_summary();
        }
    );


    // =====================================================
    // SECTION 14: SUMMARY CALCULATION
    // =====================================================

    function update_summary() {

        let present = 0;
        let total_hours = 0;
        let normal_hours = 0;

        $('.est-row').each(function() {

            const row = $(this);

            const attendance = row.find('.est-attendance').val();

            const total = Number(
                row.find('.est-total-value').text()
            ) || 0;

            const normal = Number(
                row.find('.est-normal-value').text()
            ) || 0;

            if (
                attendance === 'Present' ||
                attendance === 'Half Day'
            ) {
                present++;
            }

            total_hours += total;
            normal_hours += normal;
        });

        $('#est-present').text(present);

        $('#est-total').text(format_hours(total_hours));

        $('#est-normal').text(format_hours(normal_hours));

        $('#est-employees').text(employees.length);
    }


    // =====================================================
    // SECTION 15: ATTENDANCE CHANGE EVENT
    // =====================================================

    $(page.body).on(
        'change',
        '.est-attendance',
        update_summary
    );


    // =====================================================
    // SECTION 16: SITE CHANGE EVENT
    // =====================================================

    $(page.body).on(
        'change',
        '#est-site',
        function() {

            load_employees();

        }
    );


    // =====================================================
    // SECTION 17: DATE CHANGE EVENT
    // =====================================================

    $(page.body).on(
        'change',
        '#est-date',
        function() {

            load_shift_assignments();

        }
    );

    // =====================================================
    // SECTION 18: APPLY STANDARD SHIFT
    // =====================================================

    function normalize_time(value) {

        if (!value) return '';

        const parts = String(value).trim().split(':');

        if (parts.length < 2) return '';

        return String(parts[0]).padStart(2, '0') + ':' +
            String(parts[1]).padStart(2, '0');

    }


    $(page.body).on('click', '#est-apply-shift', function() {

        const in_time = normalize_time(standard_shift.in_time);

        const out_time = normalize_time(standard_shift.out_time);

        if (!in_time || !out_time) {

            frappe.msgprint({
                title: 'Shift Time Missing',
                message: 'Supplier standard IN and OUT times are not configured.',
                indicator: 'orange'
            });

            return;
        }

        if (!employees.length) {

            frappe.msgprint('No Employees available for the selected Site.');

            return;
        }

        $('.est-row').each(function() {

            const row = $(this);

            // // Set IN Time
            // row.find('.est-in').val(in_time);

            // // Set OUT Time
            // row.find('.est-out').val(out_time);
            set_est_time(row, 'in', in_time);
            set_est_time(row, 'out', out_time);

            // Recalculate Total Hours
            const total = calculate_total(
                in_time,
                out_time,
                row.find('.est-break').val()
            );

            row.find('.est-total-value').text(format_hours(total));

        });

        // Update Summary
        update_summary();

        frappe.show_alert({
            message: 'Standard IN and OUT Shift Applied Successfully',
            indicator: 'green'
        });

    });




    /* =========================================================
       SECTION 18A: COMPLETE BLACK & WHITE CLOCK TIME PICKER

       Features:
       1. Hour selection (1-12)
       2. Minute selection (00-55, intervals of 5)
       3. Automatic Hour to Minute switching
       4. Click Hour / Minute input to switch clock
       5. Manual hour and minute entry
       6. AM / PM selection
       7. Enhanced OK and CANCEL buttons
       8. Saves time in HH:mm format
       9. Automatically recalculates Total Hours
    ========================================================= */


    // =====================================================
    // FORMAT TIME FOR BUTTON DISPLAY
    // =====================================================

    function format_est_time_display(value, type) {

        if (!value) return '';

        const parts = value.split(':');

        if (type === 'break') {
            return parts[0] + ':' + parts[1];
        }

        let hour = parseInt(parts[0], 10);

        const minute = String(parts[1] || '00').padStart(2, '0');

        const period = hour >= 12 ? 'PM' : 'AM';

        hour = hour % 12 || 12;

        return String(hour).padStart(2, '0') +
            ':' + minute + ' ' + period;

    }


    // =====================================================
    // SET TIME INTO IN / OUT INPUT AND BUTTON
    // =====================================================

    function set_est_time(row, type, value) {

        const time = value ? value.substring(0, 5) : '';

        row.find('.est-' + type).val(time);

        row.find(
            `.est-time-picker-btn[data-time-type="${type}"]`
        ).text(
            time ?
            type.toUpperCase() + ' - ' +
            format_est_time_display(time, type) :
            type.toUpperCase() + ' - Select'
        );

    }


    // =====================================================
    // OPEN CUSTOM CLOCK PICKER
    // =====================================================

    function open_est_time_picker($input, $btn, type) {

        // Remove previously opened clock
        $('.est-time-overlay').remove();

        const is_break = type === 'break';

        let hour = is_break ? 0 : 9;
        let minute = 0;
        let period = 'AM';
        let selection_mode = 'hour';

        // Load existing selected time
        const existing = $input.val();

        if (existing) {
            const parts = existing.split(':');

            const h = parseInt(parts[0], 10);
            minute = parseInt(parts[1], 10) || 0;

            if (is_break) {
                hour = h;
            } else {
                period = h >= 12 ? 'PM' : 'AM';
                hour = h % 12 || 12;
            }
        }
        // =================================================
        // CLOCK HTML
        // =================================================

        const overlay = $(`

        <div class="est-time-overlay">

            <div class="est-time-dialog">

                <div class="est-time-title">
                    SELECT HOUR
                </div>

                <div class="est-time-display">

                    <input type="text"
                        class="est-hour"
                        inputmode="numeric"
                        maxlength="2"
                        autocomplete="off"
                        value="${String(hour).padStart(2, '0')}">

                    <span class="est-time-colon">:</span>

                    <input type="text"
                        class="est-minute"
                        inputmode="numeric"
                        maxlength="2"
                        autocomplete="off"
                        value="${String(minute).padStart(2, '0')}">

<div class="est-period" style="${is_break ? 'display:none;' : ''}">

    <button type="button" class="est-am">AM</button>

    <button type="button" class="est-pm">PM</button>

</div>

                </div>

                <div class="est-clock"></div>

                <div class="est-time-actions">

                    <button type="button" class="est-cancel">
                        <i class="fa fa-times"></i>
                        CANCEL
                    </button>

                    <button type="button" class="est-ok">
                        <i class="fa fa-check"></i>
                        OK
                    </button>

                </div>

            </div>

        </div>

    `);


        $('body').append(overlay);

        const dialog = overlay.find('.est-time-dialog');


        // =================================================
        // OVERLAY DESIGN
        // =================================================

        overlay.css({

            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(2px)'

        });


        // =================================================
        // DIALOG DESIGN
        // =================================================

        dialog.css({

            width: '360px',
            maxWidth: '95vw',
            background: '#ffffff',
            color: '#111111',
            padding: '22px',
            border: '1px solid #dddddd',
            borderRadius: '12px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.22)'

        });


        // =================================================
        // TITLE DESIGN
        // =================================================

        overlay.find('.est-time-title').css({

            fontSize: '11px',
            color: '#777777',
            marginBottom: '15px',
            letterSpacing: '1px',
            fontWeight: 'bold',
            textAlign: 'center'

        });


        // =================================================
        // TIME DISPLAY DESIGN
        // =================================================

        overlay.find('.est-time-display').css({

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            marginBottom: '22px'

        });


        overlay.find('.est-hour, .est-minute').css({

            width: '65px',
            height: '52px',
            fontSize: '27px',
            textAlign: 'center',
            background: '#f1f1f1',
            color: '#111111',
            border: '1px solid #d5d5d5',
            borderRadius: '6px',
            outline: 'none',
            fontWeight: '500',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'

        });


        overlay.find('.est-hour, .est-minute').on('focus', function() {

            $(this).css({

                background: '#ffffff',
                border: '2px solid #222222'

            });

        });


        overlay.find('.est-hour, .est-minute').on('blur', function() {

            $(this).css({

                background: '#f1f1f1',
                border: '1px solid #d5d5d5'

            });

        });


        overlay.find('.est-time-colon').css({

            fontSize: '28px',
            fontWeight: 'bold'

        });


        // =================================================
        // AM / PM DESIGN
        // =================================================

        overlay.find('.est-period').css({

            display: is_break ? 'none' : 'flex',
            flexDirection: 'column',
            marginLeft: '5px',
            gap: '2px'

        });


        overlay.find('.est-period button').css({

            width: '43px',
            height: '26px',
            background: '#ffffff',
            color: '#111111',
            border: '1px solid #cccccc',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'

        });


        const update_period = () => {

            overlay.find('.est-am, .est-pm').css({

                background: '#ffffff',
                color: '#111111',
                fontWeight: 'normal'

            });

            overlay.find('.est-' + period.toLowerCase()).css({

                background: '#222222',
                color: '#ffffff',
                fontWeight: 'bold'

            });

        };


        update_period();


        // =================================================
        // CLOCK DESIGN
        // =================================================

        overlay.find('.est-clock').css({

            width: '220px',
            height: '220px',
            maxWidth: '100%',
            aspectRatio: '1',
            position: 'relative',
            margin: 'auto',
            borderRadius: '50%',
            background: '#f1f1f1',
            border: '1px solid #d0d0d0',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)'

        });


        // =================================================
        // RENDER HOUR / MINUTE CLOCK
        // =================================================

        // const render_clock = () => {

        //     const is_hour = selection_mode === 'hour';

        //     overlay.find('.est-time-title').text(

        //         is_hour ? 'SELECT HOUR' : 'SELECT MINUTE'

        //     );


        //     const numbers = Array.from({ length: 12 }, (_, i) => {

        //         const value = is_hour
        //             ? (i === 0 ? 12 : i)
        //             : i * 5;

        //         const angle = (i * 30 - 90) * Math.PI / 180;

        //         const left = 50 + 40 * Math.cos(angle);

        //         const top = 50 + 40 * Math.sin(angle);


        //         const selected = is_hour
        //             ? hour === value
        //             : minute === value;


        //         const display_value = is_hour
        //             ? value
        //             : String(value).padStart(2, '0');


        //         return `

        //             <button type="button"

        //                 class="est-clock-number"

        //                 data-value="${value}"

        //                 style="

        //                     position:absolute;

        //                     left:${left}%;

        //                     top:${top}%;

        //                     transform:translate(-50%,-50%);

        //                     width:34px;

        //                     height:34px;

        //                     border:none;

        //                     border-radius:50%;

        //                     background:${selected ? '#222222' : 'transparent'};

        //                     color:${selected ? '#ffffff' : '#111111'};

        //                     font-size:13px;

        //                     font-weight:${selected ? 'bold' : 'normal'};

        //                     cursor:pointer;

        //                 ">

        //                 ${display_value}

        //             </button>

        //         `;

        //     });


        //     overlay.find('.est-clock').html(

        //         numbers.join('') +

        //         `<div class="est-clock-center"></div>`

        //     );


        //     overlay.find('.est-clock-center').css({

        //         position: 'absolute',
        //         width: '7px',
        //         height: '7px',
        //         background: '#222222',
        //         borderRadius: '50%',
        //         left: '50%',
        //         top: '50%',
        //         transform: 'translate(-50%, -50%)'

        //     });

        // };




        const render_clock = () => {

            const is_hour = selection_mode === 'hour';

            overlay.find('.est-time-title').text(
                is_hour ? 'SELECT HOUR' : 'SELECT MINUTE'
            );

            let numbers = [];

            const count = is_hour ?
                (is_break ? 24 : 12) :
                12;

            for (let i = 0; i < count; i++) {

                const value = is_hour ?
                    (is_break ? i : (i === 0 ? 12 : i)) :
                    i * 5;

                const angle = ((is_break && is_hour ? i % 12 : i) * 30 - 90) * Math.PI / 180;

                const radius = is_break && is_hour ?
                    (i < 12 ? 41 : 26) :
                    40;

                const left = 50 + radius * Math.cos(angle);
                const top = 50 + radius * Math.sin(angle);

                const selected = is_hour ?
                    hour === value :
                    minute === value;

                const display_value = is_hour ?
                    String(value).padStart(2, '0') :
                    String(value).padStart(2, '0');

                const btn_size = (is_break && is_hour && i >= 12) ? 26 : 30;

                numbers.push(`
            <button type="button"
                class="est-clock-number"
                data-value="${value}"
                style="
                    position:absolute;
                    left:${left}%;
                    top:${top}%;
                    transform:translate(-50%,-50%);
                    width:${btn_size}px;
                    height:${btn_size}px;
                    border:none;
                    border-radius:50%;
                    background:${selected ? '#222222' : 'transparent'};
                    color:${selected ? '#ffffff' : '#111111'};
                    font-size:12px;
                    font-weight:${selected ? 'bold' : 'normal'};
                    cursor:pointer;
                ">
                ${display_value}
            </button>
        `);
            }

            overlay.find('.est-clock').html(
                numbers.join('') +
                `<div class="est-clock-center"></div>`
            );

            overlay.find('.est-clock-center').css({
                position: 'absolute',
                width: '7px',
                height: '7px',
                background: '#222222',
                borderRadius: '50%',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            });
        };




        // Initial clock display
        render_clock();


        // =================================================
        // SELECT HOUR / MINUTE FROM CLOCK
        // =================================================

        overlay.on('click', '.est-clock-number', function() {

            const value = parseInt($(this).attr('data-value'), 10);


            if (selection_mode === 'hour') {

                // Set selected hour
                hour = value;

                overlay.find('.est-hour').val(

                    String(hour).padStart(2, '0')

                );


                // Automatically switch to minute clock
                selection_mode = 'minute';

                render_clock();


            } else {

                // Set selected minute
                minute = value;

                overlay.find('.est-minute').val(

                    String(minute).padStart(2, '0')

                );


                // Keep minute clock visible
                selection_mode = 'minute';

                render_clock();

            }

        });


        // =================================================
        // CLICK HOUR INPUT TO SHOW HOUR CLOCK
        // =================================================

        overlay.on('click', '.est-hour', function() {

            selection_mode = 'hour';

            render_clock();

        });


        // =================================================
        // CLICK MINUTE INPUT TO SHOW MINUTE CLOCK
        // =================================================

        overlay.on('click', '.est-minute', function() {

            selection_mode = 'minute';

            render_clock();

        });


        // =================================================
        // MANUAL HOUR ENTRY
        // =================================================

        overlay.on('input', '.est-hour', function() {

            const value = parseInt($(this).val(), 10);

            if (Number.isInteger(value)) {

                hour = value;

            }

        });


        // =================================================
        // MANUAL MINUTE ENTRY
        // =================================================

        overlay.on('input', '.est-minute', function() {

            const value = parseInt($(this).val(), 10);

            if (Number.isInteger(value)) {

                minute = value;

            }

        });


        // =================================================
        // AM / PM SELECTION
        // =================================================

        overlay.on('click', '.est-am', function() {

            period = 'AM';

            update_period();

        });


        overlay.on('click', '.est-pm', function() {

            period = 'PM';

            update_period();

        });


        // =================================================
        // CANCEL BUTTON
        // =================================================

        overlay.on('click', '.est-cancel', function() {

            overlay.remove();

        });


        // =================================================
        // OK / SAVE BUTTON
        // =================================================

        overlay.on('click', '.est-ok', function() {




            hour = parseInt(overlay.find('.est-hour').val(), 10);

            minute = parseInt(overlay.find('.est-minute').val(), 10);

            // Validate time
            const valid_hour = is_break ?
                (hour >= 0 && hour <= 23) :
                (hour >= 1 && hour <= 12);

            if (
                !Number.isInteger(hour) ||
                !valid_hour ||
                !Number.isInteger(minute) ||
                minute < 0 ||
                minute > 59
            ) {
                frappe.msgprint({
                    title: 'Invalid Time',
                    message: is_break ?
                        'Enter a valid hour (00–23) and minute (00–59).' :
                        'Enter a valid hour (1–12) and minute (0–59).',
                    indicator: 'orange'
                });

                return;
            }

            // Convert to 24-hour format
            let hour24;

            if (is_break) {
                hour24 = hour;
            } else {
                hour24 = hour % 12;

                if (period === 'PM') {
                    hour24 += 12;
                }
            }

            const time24 =
                String(hour24).padStart(2, '0') +
                ':' +
                String(minute).padStart(2, '0');

            // Save IN / OUT / BREAK time
            set_est_time(
                $btn.closest('.est-row'),
                type,
                time24
            );




            // hour = parseInt(overlay.find('.est-hour').val(), 10);

            // minute = parseInt(overlay.find('.est-minute').val(), 10);


            // // Validate time
            // if (

            //     !Number.isInteger(hour) ||

            //     hour < 1 ||

            //     hour > 12 ||

            //     !Number.isInteger(minute) ||

            //     minute < 0 ||

            //     minute > 59

            // ) {

            //     frappe.msgprint({

            //         title: 'Invalid Time',

            //         message: 'Please enter a valid hour (1–12) and minute (0–59).',

            //         indicator: 'orange'

            //     });

            //     return;

            // }


            // // Convert 12-hour format to 24-hour format
            // let hour24 = hour % 12;

            // if (period === 'PM') {

            //     hour24 += 12;

            // }


            // const time24 =

            //     String(hour24).padStart(2, '0') +

            //     ':' +

            //     String(minute).padStart(2, '0');


            // // Save IN / OUT time
            // set_est_time(

            //     $btn.closest('.est-row'),

            //     type,

            //     time24

            // );


            // Close clock
            overlay.remove();


            // =================================================
            // RECALCULATE TOTAL HOURS
            // =================================================

            const row = $btn.closest('.est-row');

            const total = calculate_total(
                row.find('.est-in').val(),
                row.find('.est-out').val(),
                row.find('.est-break').val()
            );

            row.find('.est-total-value').text(format_hours(total));


            // Refresh summary cards
            update_summary();

        });


        // =================================================
        // BUTTON HOVER EFFECTS
        // =================================================

        overlay.find('.est-time-actions').css({

            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            marginTop: '24px',
            paddingTop: '15px',
            borderTop: '1px solid #eeeeee'

        });


        // CANCEL BUTTON DESIGN
        overlay.find('.est-cancel').css({

            background: '#ffffff',
            color: '#555555',
            border: '1px solid #d5d5d5',
            borderRadius: '7px',
            padding: '9px 18px',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.4px',
            cursor: 'pointer',
            transition: 'all 0.2s'

        });


        // OK BUTTON DESIGN
        overlay.find('.est-ok').css({

            background: '#222222',
            color: '#ffffff',
            border: '1px solid #222222',
            borderRadius: '7px',
            padding: '9px 22px',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.4px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)'

        });


        // CANCEL HOVER
        overlay.find('.est-cancel').hover(

            function() {

                $(this).css({

                    background: '#f1f1f1',
                    borderColor: '#aaaaaa'

                });

            },

            function() {

                $(this).css({

                    background: '#ffffff',
                    borderColor: '#d5d5d5'

                });

            }

        );


        // OK HOVER
        overlay.find('.est-ok').hover(

            function() {

                $(this).css({

                    background: '#444444',
                    borderColor: '#444444'

                });

            },

            function() {

                $(this).css({

                    background: '#222222',
                    borderColor: '#222222'

                });

            }

        );

    }


    // =====================================================
    // BIND IN / OUT CLOCK BUTTONS
    // =====================================================

    $(wrapper).off('click.estclock', '.est-time-picker-btn');

    $(wrapper).on('click.estclock', '.est-time-picker-btn', function() {

        const button = $(this);

        const row = button.closest('.est-row');

        const type = button.attr('data-time-type');

        const input = row.find('.est-' + type);

        open_est_time_picker(input, button, type);

    });




    // =====================================================
    // SECTION 19: REFRESH PAGE DATA
    // =====================================================

    $(page.body).on(
        'click',
        '#est-refresh',
        async function() {

            const button = $(this);

            if (button.prop('disabled')) {
                return;
            }

            button.prop('disabled', true);

            button.html(`
                <i class="fa fa-spinner fa-spin"></i>
                <span>Refreshing...</span>
            `);

            try {

                // Refresh Site List

                await load_sites();

                // Refresh Employees, Supplier and Shift

                await load_employees();

                frappe.show_alert({
                    message: 'Page refreshed successfully',
                    indicator: 'green'
                });

            } catch (error) {

                console.error('Page Refresh Error:', error);

            } finally {

                button.prop('disabled', false);

                button.html(`
                    <i class="fa fa-refresh"></i>
                    <span>Refresh</span>
                `);
            }
        }
    );




    // =====================================================
    // SECTION 20: SUBMIT TIME SHEET
    // =====================================================

    $(page.body).on('click', '#est-submit-timesheet', async function() {

        const button = $(this);

        const selected_site = $('#est-site').val();

        const selected_date = $('#est-date').val();

        if (!selected_site) {

            frappe.msgprint({
                title: 'Site Required',
                message: 'Please select a Site before submitting the Time Sheet.',
                indicator: 'orange'
            });

            return;
        }

        const rows = $('.est-row');

        if (!rows.length) {

            frappe.msgprint('No employee rows available to submit.');

            return;
        }

        // Confirmation
        const confirmed = await new Promise(resolve => {

            frappe.confirm(
                `Create Site TimeSheet records for ${rows.length} employees at ${selected_site}?`,
                () => resolve(true),
                () => resolve(false)
            );

        });

        if (!confirmed) return;

        button.prop('disabled', true);

        const original_html = button.html();

        button.html(
            '<i class="fa fa-spinner fa-spin"></i> Submitting...'
        );

        let created = 0;

        const errors = [];

        try {

            for (const element of rows.toArray()) {

                const row = $(element);

                const employee_id = row.attr('data-employee');

                const trade = row.find('.est-trade-value').text().trim();

                const civil_id = row.find('.est-civil-id-value').text().trim();

                const in_time = row.find('.est-in').val() || null;

                const out_time = row.find('.est-out').val() || null;

                // Check whether at least one time is entered
                if (!in_time && !out_time) {

                    errors.push(
                        `${employee_id}: Please enter IN or OUT time.`
                    );

                    continue;

                }

                // Common Site TimeSheet fields
                const common_doc = {

                    doctype: 'Site TimeSheet',

                    custom_date: selected_date,

                    custom_emp_name: employee_id,

                    custom_trade: trade === '-' ? '' : trade,

                    custom_civil_id: civil_id === '-' ? '' : civil_id,

                    custom_attendance: row.find('.est-attendance').val(),

                    custom_current_site: selected_site

                };

                try {

                    // Create separate IN record
                    if (in_time) {

                        const in_doc = {

                            ...common_doc,

                            custom_log_type: 'IN',

                            custom_in_time: in_time,

                            custom_out_time: null,

                            custom_total_hrs: 0,

                            custom_rest_hrs: null,

                            custom_normal_hrs: 0

                        };

                        await frappe.db.insert(in_doc);

                        created++;

                    }

                    // Create separate OUT record
                    if (out_time) {

                        const out_doc = {

                            ...common_doc,

                            custom_log_type: 'OUT',

                            custom_in_time: null,

                            custom_out_time: out_time,

                            custom_total_hrs: row.find('.est-total-value').text().trim(),

                            custom_rest_hrs: row.find('.est-break').val() || null,

                            custom_normal_hrs: row.find('.est-normal-value').text().trim()

                        };

                        await frappe.db.insert(out_doc);

                        created++;

                    }

                } catch (row_error) {

                    console.error(
                        'Site TimeSheet creation failed for',
                        employee_id,
                        row_error
                    );

                    errors.push(
                        `${employee_id}: ${row_error.message || 'Unknown error'}`
                    );

                }

            }

            if (errors.length) {

                frappe.msgprint({

                    title: 'Time Sheet Submission Completed with Errors',

                    indicator: 'orange',

                    message: `${created} record(s) created successfully.
                    <br><br>
                    Failed records:
                    <br>
                    ${errors.map(escape_html).join('<br>')}`

                });

            } else {

                frappe.msgprint({

                    title: 'Time Sheet Submitted',

                    indicator: 'green',

                    message: `${created} Site TimeSheet record(s) created successfully for ${escape_html(selected_site)}.`

                });

            }

        } catch (error) {

            console.error('Time Sheet Submission Error:', error);

            frappe.msgprint({

                title: 'Submission Error',

                message: error.message || 'Unable to create Site TimeSheet records.',

                indicator: 'red'

            });

        } finally {

            button.prop('disabled', false);

            button.html(original_html);

        }

    });




    // // =====================================================
    // // SECTION 20: SUBMIT TIME SHEET
    // // =====================================================

    // $(page.body).on('click', '#est-submit-timesheet', async function() {

    //     const button = $(this);

    //     const selected_site = $('#est-site').val();

    // 	const selected_date = $('#est-date').val();

    //     if (!selected_site) {

    //         frappe.msgprint({
    //             title: 'Site Required',
    //             message: 'Please select a Site before submitting the Time Sheet.',
    //             indicator: 'orange'
    //         });

    //         return;
    //     }

    //     const rows = $('.est-row');

    //     if (!rows.length) {

    //         frappe.msgprint('No employee rows available to submit.');

    //         return;
    //     }

    //     // Confirmation
    //     const confirmed = await new Promise(resolve => {

    //         frappe.confirm(
    //             `Create Site TimeSheet records for ${rows.length} employees at ${selected_site}?`,
    //             () => resolve(true),
    //             () => resolve(false)
    //         );

    //     });

    //     if (!confirmed) return;

    //     button.prop('disabled', true);

    //     const original_html = button.html();

    //     button.html(
    //         '<i class="fa fa-spinner fa-spin"></i> Submitting...'
    //     );

    //     let created = 0;

    //     const errors = [];

    //     try {

    //         for (const element of rows.toArray()) {

    //             const row = $(element);

    //             const employee_id = row.attr('data-employee');

    //             const trade = row.find('.est-trade-value').text().trim();

    //             const civil_id = row.find('.est-civil-id-value').text().trim();

    //             // Site TimeSheet Document
    //             const doc = {

    //                 doctype: 'Site TimeSheet',


    // 				custom_date: selected_date,

    //                 custom_emp_name: employee_id,

    //                 custom_trade: trade === '-' ? '' : trade,

    //                 custom_civil_id: civil_id === '-' ? '' : civil_id,

    //                 custom_attendance: row.find('.est-attendance').val(),

    //                 custom_in_time: row.find('.est-in').val() || null,

    //                 custom_out_time: row.find('.est-out').val() || null,

    //                 custom_total_hrs: row.find('.est-total-value').text().trim(),

    //                 custom_break_hrs: row.find('.est-break').val() || '0',

    //                 custom_normal_hrs: row.find('.est-normal-value').text().trim(),

    //                 custom_current_site: selected_site

    //             };

    //             try {

    //                 await frappe.db.insert(doc);

    //                 created++;

    //             } catch (row_error) {

    //                 console.error(
    //                     'Site TimeSheet creation failed for',
    //                     employee_id,
    //                     row_error
    //                 );

    //                 errors.push(
    //                     `${employee_id}: ${row_error.message || 'Unknown error'}`
    //                 );

    //             }

    //         }

    //         if (errors.length) {

    //             frappe.msgprint({

    //                 title: 'Time Sheet Submission Completed with Errors',

    //                 indicator: 'orange',

    //                 message: `${created} record(s) created successfully.
    //                     <br><br>
    //                     Failed records:
    //                     <br>
    //                     ${errors.map(escape_html).join('<br>')}`

    //             });

    //         } else {

    //             frappe.msgprint({

    //                 title: 'Time Sheet Submitted',

    //                 indicator: 'green',

    //                 message: `${created} Site TimeSheet record(s) created successfully for ${escape_html(selected_site)}.`

    //             });

    //         }

    //     } catch (error) {

    //         console.error('Time Sheet Submission Error:', error);

    //         frappe.msgprint({

    //             title: 'Submission Error',

    //             message: error.message || 'Unable to create Site TimeSheet records.',

    //             indicator: 'red'

    //         });

    //     } finally {

    //         button.prop('disabled', false);

    //         button.html(original_html);

    //     }

    // });



    // =====================================================
    // SECTION 21: INITIAL PAGE LOAD
    // =====================================================

    async function initialize_page() {

        await load_sites();

        await load_employees();

    }

    initialize_page();

};
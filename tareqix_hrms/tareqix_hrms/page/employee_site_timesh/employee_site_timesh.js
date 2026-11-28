// // =====================================================
// // NEW: COMPLETE TIME SHEET
// // Fetch pending IN records for displayed employees.
// // =====================================================

// $(page.body).on(
//     'click',
//     '#est-complete-timesheet',
//     async function() {

//         const button = $(this);

//         const selected_site = $('#est-site').val();

//         if (!selected_site) {
//             frappe.msgprint('Please select a Site.');
//             return;
//         }

//         const employee_ids = get_selected_employee_ids();

//         if (!employee_ids.length) {
//             frappe.msgprint('No Employees available.');
//             return;
//         }

//         button.prop('disabled', true);

//         const original_html = button.html();

//         button.html(
//             '<i class="fa fa-spinner fa-spin"></i> Loading...'
//         );

//         try {

//             const pending = await call_api(
//                 'get_pending_in_records',
//                 {
//                     employee_ids: JSON.stringify(employee_ids)
//                 }
//             ) || {};

//             let matched_count = 0;

//             $('.est-row').each(function() {

//                 const row = $(this);

//                 const employee_id = row.attr('data-employee');

//                 const record = pending[employee_id];

//                 if (!record) {
//                     return;
//                 }

//                 // Store the original IN record ID.
//                 row.attr(
//                     'data-pending-in-record',
//                     record.name
//                 );

//                 // Set original IN time.
//                 set_est_time(
//                     row,
//                     'in',
//                     record.in_time
//                 );

//                 // Display original IN date and time.
//                 const display_date = record.date
//                     ? frappe.datetime.str_to_user(record.date)
//                     : '';

//                 const display_time = format_est_time_display(
//                     record.in_time,
//                     'in'
//                 );

//                 const in_button = row.find(
//                     '.est-time-picker-btn[data-time-type="in"]'
//                 );

//                 in_button.text(
//                     'IN - ' + display_date + ' ' + display_time
//                 );

//                 // Make original IN time non-editable.
//                 in_button.prop('disabled', true);

//                 matched_count++;

//                 // Update total preview.
//                 const total = calculate_total(
//                     record.in_time,
//                     row.find('.est-out').val(),
//                     row.find('.est-break').val()
//                 );

//                 row.find('.est-total-value').text(
//                     format_hours(total)
//                 );

//             });

//             update_summary();

//             frappe.show_alert({
//                 message: matched_count
//                     + ' pending IN record(s) found.',
//                 indicator: 'green'
//             });

//             if (!matched_count) {
//                 frappe.msgprint(
//                     'No pending IN records found for the listed employees.'
//                 );
//             }

//         } catch (error) {

//             console.error(
//                 'Complete Time Sheet Error:',
//                 error
//             );

//             frappe.msgprint({
//                 title: 'Complete Time Sheet Error',
//                 message: error.message,
//                 indicator: 'red'
//             });

//         } finally {

//             button.prop('disabled', false);
//             button.html(original_html);

//         }

//     }
// );



//     /* =========================================================
//        SECTION 18: COMPLETE BLACK & WHITE CLOCK TIME PICKER

//        Features:
//        1. Hour selection (1-12)
//        2. Minute selection (00-55, intervals of 5)
//        3. Automatic Hour to Minute switching
//        4. Click Hour / Minute input to switch clock
//        5. Manual hour and minute entry
//        6. AM / PM selection
//        7. Enhanced OK and CANCEL buttons
//        8. Saves time in HH:mm format
//        9. Automatically recalculates Total Hours
//     ========================================================= */


//     // =====================================================
//     // FORMAT TIME FOR BUTTON DISPLAY
//     // =====================================================

//     function format_est_time_display(value, type) {

//         if (!value) return '';

//         const parts = value.split(':');

//         if (['break', 'ot_day', 'ot_night'].includes(type)) {
//             return parts[0] + ':' + parts[1];
//         }

//         let hour = parseInt(parts[0], 10);

//         const minute = String(parts[1] || '00').padStart(2, '0');

//         const period = hour >= 12 ? 'PM' : 'AM';

//         hour = hour % 12 || 12;

//         return String(hour).padStart(2, '0') +
//             ':' + minute + ' ' + period;

//     }


//     // =====================================================
//     // SET TIME INTO INPUT AND BUTTON
//     // =====================================================

//     function set_est_time(row, type, value) {

//         const time = value ? value.substring(0, 5) : '';

//         row.find('.est-' + type).val(time);

//         const labels = {
//             in: 'IN',
//             out: 'OUT',
//             break: 'BREAK',
//             ot_day: 'OT DAY HRS',
//             ot_night: 'OT NIGHT HRS'
//         };

//         const label = labels[type] || type.toUpperCase();

//         row.find(
//             `.est-time-picker-btn[data-time-type="${type}"]`
//         ).text(
//             time ?
//             label + ' - ' + format_est_time_display(time, type) :
//             label + ' - Select'
//         );

//     }


//     // =====================================================
//     // OPEN CUSTOM CLOCK PICKER
//     // =====================================================

//     function open_est_time_picker($input, $btn, type) {

//         const is_break = ['break', 'ot_day', 'ot_night'].includes(type);

//         // Remove previously opened clock
//         $('.est-time-overlay').remove();

//         let hour = is_break ? 0 : 9;
//         let minute = 0;
//         let period = 'AM';
//         let selection_mode = 'hour';

//         // Load existing selected time
//         const existing = $input.val();

//         if (existing) {
//             const parts = existing.split(':');

//             const h = parseInt(parts[0], 10);
//             minute = parseInt(parts[1], 10) || 0;

//             if (is_break) {
//                 hour = h;
//             } else {
//                 period = h >= 12 ? 'PM' : 'AM';
//                 hour = h % 12 || 12;
//             }
//         }

//         // =================================================
//         // CLOCK HTML
//         // =================================================

//         const overlay = $(`

//         <div class="est-time-overlay">

//             <div class="est-time-dialog">

//                 <div class="est-time-title">
//                     SELECT HOUR
//                 </div>

//                 <div class="est-time-display">

//                     <input type="text"
//                         class="est-hour"
//                         inputmode="numeric"
//                         maxlength="2"
//                         autocomplete="off"
//                         value="${String(hour).padStart(2, '0')}">

//                     <span class="est-time-colon">:</span>

//                     <input type="text"
//                         class="est-minute"
//                         inputmode="numeric"
//                         maxlength="2"
//                         autocomplete="off"
//                         value="${String(minute).padStart(2, '0')}">

//                     <div class="est-period" style="${is_break ? 'display:none;' : ''}">

//                         <button type="button" class="est-am">AM</button>

//                         <button type="button" class="est-pm">PM</button>

//                     </div>

//                 </div>

//                 <div class="est-clock"></div>

//                 <div class="est-time-actions">

//                     <button type="button" class="est-cancel">
//                         <i class="fa fa-times"></i>
//                         CANCEL
//                     </button>

//                     <button type="button" class="est-ok">
//                         <i class="fa fa-check"></i>
//                         OK
//                     </button>

//                 </div>

//             </div>

//         </div>

//     `);


//         $('body').append(overlay);

//         const dialog = overlay.find('.est-time-dialog');


//         // OVERLAY DESIGN
//         overlay.css({

//             position: 'fixed',
//             inset: 0,
//             background: 'rgba(0,0,0,0.48)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             zIndex: 99999,
//             backdropFilter: 'blur(2px)'

//         });


//         // DIALOG DESIGN
//         dialog.css({

//             width: '360px',
//             maxWidth: '95vw',
//             background: '#ffffff',
//             color: '#111111',
//             padding: '22px',
//             border: '1px solid #dddddd',
//             borderRadius: '12px',
//             boxShadow: '0 12px 40px rgba(0,0,0,0.22)'

//         });


//         // TITLE DESIGN
//         overlay.find('.est-time-title').css({

//             fontSize: '11px',
//             color: '#777777',
//             marginBottom: '15px',
//             letterSpacing: '1px',
//             fontWeight: 'bold',
//             textAlign: 'center'

//         });


//         // TIME DISPLAY DESIGN
//         overlay.find('.est-time-display').css({

//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             gap: '7px',
//             marginBottom: '22px'

//         });


//         overlay.find('.est-hour, .est-minute').css({

//             width: '65px',
//             height: '52px',
//             fontSize: '27px',
//             textAlign: 'center',
//             background: '#f1f1f1',
//             color: '#111111',
//             border: '1px solid #d5d5d5',
//             borderRadius: '6px',
//             outline: 'none',
//             fontWeight: '500',
//             boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'

//         });


//         overlay.find('.est-hour, .est-minute').on('focus', function() {

//             $(this).css({

//                 background: '#ffffff',
//                 border: '2px solid #222222'

//             });

//         });


//         overlay.find('.est-hour, .est-minute').on('blur', function() {

//             $(this).css({

//                 background: '#f1f1f1',
//                 border: '1px solid #d5d5d5'

//             });

//         });


//         overlay.find('.est-time-colon').css({

//             fontSize: '28px',
//             fontWeight: 'bold'

//         });


//         // AM / PM DESIGN
//         overlay.find('.est-period').css({

//             display: is_break ? 'none' : 'flex',
//             flexDirection: 'column',
//             marginLeft: '5px',
//             gap: '2px'

//         });


//         overlay.find('.est-period button').css({

//             width: '43px',
//             height: '26px',
//             background: '#ffffff',
//             color: '#111111',
//             border: '1px solid #cccccc',
//             fontSize: '12px',
//             cursor: 'pointer',
//             transition: 'all 0.15s'

//         });


//         const update_period = () => {

//             overlay.find('.est-am, .est-pm').css({

//                 background: '#ffffff',
//                 color: '#111111',
//                 fontWeight: 'normal'

//             });

//             overlay.find('.est-' + period.toLowerCase()).css({

//                 background: '#222222',
//                 color: '#ffffff',
//                 fontWeight: 'bold'

//             });

//         };


//         update_period();


//         // CLOCK DESIGN
//         overlay.find('.est-clock').css({

//             width: '220px',
//             height: '220px',
//             maxWidth: '100%',
//             aspectRatio: '1',
//             position: 'relative',
//             margin: 'auto',
//             borderRadius: '50%',
//             background: '#f1f1f1',
//             border: '1px solid #d0d0d0',
//             boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)'

//         });


//         // =================================================
//         // RENDER HOUR / MINUTE CLOCK
//         // =================================================

//         const render_clock = () => {

//             const is_hour = selection_mode === 'hour';

//             overlay.find('.est-time-title').text(
//                 is_hour ? 'SELECT HOUR' : 'SELECT MINUTE'
//             );

//             let numbers = [];

//             const count = is_hour ?
//                 (is_break ? 24 : 12) :
//                 12;

//             for (let i = 0; i < count; i++) {

//                 const value = is_hour ?
//                     (is_break ? i : (i === 0 ? 12 : i)) :
//                     i * 5;

//                 const angle = ((is_break && is_hour ? i % 12 : i) * 30 - 90) * Math.PI / 180;

//                 const radius = is_break && is_hour ?
//                     (i < 12 ? 41 : 26) :
//                     40;

//                 const left = 50 + radius * Math.cos(angle);
//                 const top = 50 + radius * Math.sin(angle);

//                 const selected = is_hour ?
//                     hour === value :
//                     minute === value;

//                 const display_value = String(value).padStart(2, '0');

//                 const btn_size = (is_break && is_hour && i >= 12) ? 26 : 30;

//                 numbers.push(`
//             <button type="button"
//                 class="est-clock-number"
//                 data-value="${value}"
//                 style="
//                     position:absolute;
//                     left:${left}%;
//                     top:${top}%;
//                     transform:translate(-50%,-50%);
//                     width:${btn_size}px;
//                     height:${btn_size}px;
//                     border:none;
//                     border-radius:50%;
//                     background:${selected ? '#222222' : 'transparent'};
//                     color:${selected ? '#ffffff' : '#111111'};
//                     font-size:12px;
//                     font-weight:${selected ? 'bold' : 'normal'};
//                     cursor:pointer;
//                 ">
//                 ${display_value}
//             </button>
//         `);
//             }

//             overlay.find('.est-clock').html(
//                 numbers.join('') +
//                 `<div class="est-clock-center"></div>`
//             );

//             overlay.find('.est-clock-center').css({
//                 position: 'absolute',
//                 width: '7px',
//                 height: '7px',
//                 background: '#222222',
//                 borderRadius: '50%',
//                 left: '50%',
//                 top: '50%',
//                 transform: 'translate(-50%, -50%)'
//             });
//         };


//         // Initial clock display
//         render_clock();


//         // =================================================
//         // SELECT HOUR / MINUTE FROM CLOCK
//         // =================================================

//         overlay.on('click', '.est-clock-number', function() {

//             const value = parseInt($(this).attr('data-value'), 10);

//             if (selection_mode === 'hour') {

//                 // Set selected hour
//                 hour = value;

//                 overlay.find('.est-hour').val(
//                     String(hour).padStart(2, '0')
//                 );

//                 // Automatically switch to minute clock
//                 selection_mode = 'minute';

//                 render_clock();

//             } else {

//                 // Set selected minute
//                 minute = value;

//                 overlay.find('.est-minute').val(
//                     String(minute).padStart(2, '0')
//                 );

//                 // Keep minute clock visible
//                 selection_mode = 'minute';

//                 render_clock();

//             }

//         });


//         // CLICK HOUR INPUT TO SHOW HOUR CLOCK
//         overlay.on('click', '.est-hour', function() {

//             selection_mode = 'hour';

//             render_clock();

//         });


//         // CLICK MINUTE INPUT TO SHOW MINUTE CLOCK
//         overlay.on('click', '.est-minute', function() {

//             selection_mode = 'minute';

//             render_clock();

//         });


//         // MANUAL HOUR ENTRY
//         overlay.on('input', '.est-hour', function() {

//             const value = parseInt($(this).val(), 10);

//             if (Number.isInteger(value)) {

//                 hour = value;

//             }

//         });


//         // MANUAL MINUTE ENTRY
//         overlay.on('input', '.est-minute', function() {

//             const value = parseInt($(this).val(), 10);

//             if (Number.isInteger(value)) {

//                 minute = value;

//             }

//         });


//         // AM / PM SELECTION
//         overlay.on('click', '.est-am', function() {

//             period = 'AM';

//             update_period();

//         });


//         overlay.on('click', '.est-pm', function() {

//             period = 'PM';

//             update_period();

//         });


//         // CANCEL BUTTON
//         overlay.on('click', '.est-cancel', function() {

//             overlay.remove();

//         });


//         // =================================================
//         // OK / SAVE BUTTON
//         // =================================================

//         overlay.on('click', '.est-ok', function() {

//             hour = parseInt(overlay.find('.est-hour').val(), 10);

//             minute = parseInt(overlay.find('.est-minute').val(), 10);

//             // Validate time
//             const valid_hour = is_break ?
//                 (hour >= 0 && hour <= 23) :
//                 (hour >= 1 && hour <= 12);

//             if (
//                 !Number.isInteger(hour) ||
//                 !valid_hour ||
//                 !Number.isInteger(minute) ||
//                 minute < 0 ||
//                 minute > 59
//             ) {
//                 frappe.msgprint({
//                     title: 'Invalid Time',
//                     message: is_break ?
//                         'Enter a valid hour (00–23) and minute (00–59).' :
//                         'Enter a valid hour (1–12) and minute (0–59).',
//                     indicator: 'orange'
//                 });

//                 return;
//             }

//             // Convert to 24-hour format
//             let hour24;

//             if (is_break) {
//                 hour24 = hour;
//             } else {
//                 hour24 = hour % 12;

//                 if (period === 'PM') {
//                     hour24 += 12;
//                 }
//             }

//             const time24 =
//                 String(hour24).padStart(2, '0') +
//                 ':' +
//                 String(minute).padStart(2, '0');

//             // Save IN / OUT / BREAK / OT time
//             set_est_time(
//                 $btn.closest('.est-row'),
//                 type,
//                 time24
//             );

//             // Close clock
//             overlay.remove();

//             // RECALCULATE TOTAL HOURS
//             const row = $btn.closest('.est-row');

//             const total = calculate_total(
//                 row.find('.est-in').val(),
//                 row.find('.est-out').val(),
//                 row.find('.est-break').val()
//             );

//             row.find('.est-total-value').text(format_hours(total));

//             // Refresh summary cards
//             update_summary();

//         });


//         // =================================================
//         // OK / CANCEL BUTTON DESIGN
//         // =================================================

//         overlay.find('.est-time-actions').css({

//             display: 'flex',
//             justifyContent: 'flex-end',
//             alignItems: 'center',
//             gap: '10px',
//             marginTop: '24px',
//             paddingTop: '15px',
//             borderTop: '1px solid #eeeeee'

//         });


//         // CANCEL BUTTON DESIGN
//         overlay.find('.est-cancel').css({

//             background: '#ffffff',
//             color: '#555555',
//             border: '1px solid #d5d5d5',
//             borderRadius: '7px',
//             padding: '9px 18px',
//             fontSize: '12px',
//             fontWeight: '600',
//             letterSpacing: '0.4px',
//             cursor: 'pointer',
//             transition: 'all 0.2s'

//         });


//         // OK BUTTON DESIGN
//         overlay.find('.est-ok').css({

//             background: '#222222',
//             color: '#ffffff',
//             border: '1px solid #222222',
//             borderRadius: '7px',
//             padding: '9px 22px',
//             fontSize: '12px',
//             fontWeight: '600',
//             letterSpacing: '0.4px',
//             cursor: 'pointer',
//             transition: 'all 0.2s',
//             boxShadow: '0 2px 5px rgba(0,0,0,0.15)'

//         });


//         // CANCEL HOVER
//         overlay.find('.est-cancel').hover(

//             function() {

//                 $(this).css({

//                     background: '#f1f1f1',
//                     borderColor: '#aaaaaa'

//                 });

//             },

//             function() {

//                 $(this).css({

//                     background: '#ffffff',
//                     borderColor: '#d5d5d5'

//                 });

//             }

//         );


//         // OK HOVER
//         overlay.find('.est-ok').hover(

//             function() {

//                 $(this).css({

//                     background: '#444444',
//                     borderColor: '#444444'

//                 });

//             },

//             function() {

//                 $(this).css({

//                     background: '#222222',
//                     borderColor: '#222222'

//                 });

//             }

//         );

//     }


//     // =====================================================
//     // BIND IN / OUT / BREAK / OT CLOCK BUTTONS
//     // =====================================================

//     $(wrapper).off('click.estclock', '.est-time-picker-btn');

//     $(wrapper).on('click.estclock', '.est-time-picker-btn', function() {

//         const button = $(this);

//         const row = button.closest('.est-row');

//         const type = button.attr('data-time-type');

//         const input = row.find('.est-' + type);

//         open_est_time_picker(input, button, type);

//     });


//     // =====================================================
//     // SECTION 19: REFRESH PAGE DATA
//     // =====================================================

//     $(page.body).on(
//         'click',
//         '#est-refresh',
//         async function() {

//             const button = $(this);

//             if (button.prop('disabled')) {
//                 return;
//             }

//             button.prop('disabled', true);

//             button.html(`
//                 <i class="fa fa-spinner fa-spin"></i>
//                 <span>Refreshing...</span>
//             `);

//             try {

//                 // Refresh Site List

//                 await load_sites();

//                 // Refresh Employees and Shift

//                 await load_employees();

//                 frappe.show_alert({
//                     message: 'Page refreshed successfully',
//                     indicator: 'green'
//                 });

//             } catch (error) {

//                 console.error('Page Refresh Error:', error);

//             } finally {

//                 button.prop('disabled', false);

//                 button.html(`
//                     <i class="fa fa-refresh"></i>
//                     <span>Refresh</span>
//                 `);
//             }
//         }
//     );


//     // =====================================================
//     // SECTION 20: SUBMIT TIME SHEET (BACKEND)
//     // JS collects the row values and sends them in ONE call.
//     // The backend validates, recalculates the hours and
//     // creates the separate IN and OUT Site TimeSheet records.
//     // =====================================================

//     $(page.body).on('click', '#est-submit-timesheet', async function() {

//         const button = $(this);

//         const selected_site = $('#est-site').val();

//         const selected_date = $('#est-date').val();

//         if (!selected_site) {

//             frappe.msgprint({
//                 title: 'Site Required',
//                 message: 'Please select a Site before submitting the Time Sheet.',
//                 indicator: 'orange'
//             });

//             return;
//         }

//         const rows = $('.est-row');

//         if (!rows.length) {

//             frappe.msgprint('No employee rows available to submit.');

//             return;
//         }

//         // Confirmation

//         const confirmed = await new Promise(resolve => {

//             frappe.confirm(
//                 `Create Site TimeSheet records for ${rows.length} employees at ${selected_site}?`,
//                 () => resolve(true),
//                 () => resolve(false)
//             );

//         });

//         if (!confirmed) return;

//         button.prop('disabled', true);

//         const original_html = button.html();

//         button.html(
//             '<i class="fa fa-spinner fa-spin"></i> Submitting...'
//         );

//         // Collect row values (no calculation here)

//         const payload = rows.toArray().map(element => {

//             const row = $(element);

//             return {
//                 employee: row.attr('data-employee') || '',
//                 trade: row.find('.est-trade-value').text().trim(),
//                 civil_id: row.find('.est-civil-id-value').text().trim(),
//                 attendance: row.find('.est-attendance').val(),
//                 in_time: row.find('.est-in').val() || null,
//                 pending_in_record:row.attr('data-pending-in-record') || null,
//                 out_time: row.find('.est-out').val() || null,
//                 break_time: row.find('.est-break').val() || null,
//                 ot_day: row.find('.est-ot_day').val() || null,
//                 ot_night: row.find('.est-ot_night').val() || null
//             };

//         });

//         try {

//             const result = await call_api('submit_timesheet', {
//                 site: selected_site,
//                 date: selected_date,
//                 rows: JSON.stringify(payload)
//             }) || {};

//             const created = result.created || 0;

//             const errors = result.errors || [];

//             if (errors.length) {

//                 frappe.msgprint({

//                     title: 'Time Sheet Submission Completed with Errors',

//                     indicator: 'orange',

//                     message: `${created} record(s) created successfully.
//                         <br><br>
//                         Failed records:
//                         <br>
//                         ${errors.map(escape_html).join('<br>')}`

//                 });

//             } else {

//                 frappe.msgprint({

//                     title: 'Time Sheet Submitted',

//                     indicator: 'green',

//                     message: `${created} Site TimeSheet record(s) created successfully for ${escape_html(selected_site)}.`

//                 });

//             }

//         } catch (error) {

//             console.error('Time Sheet Submission Error:', error);

//             frappe.msgprint({

//                 title: 'Submission Error',

//                 message: error.message || 'Unable to create Site TimeSheet records.',

//                 indicator: 'red'

//             });

//         } finally {

//             button.prop('disabled', false);

//             button.html(original_html);

//         }

//     });


//     // =====================================================
//     // SECTION 21: INITIAL PAGE LOAD
//     // =====================================================

//     async function initialize_page() {

//         await load_sites();

//         await load_employees();

//     }

//     initialize_page();

// };


































// Updated UI 
























frappe.pages['employee-site-timesh'].on_page_load = function(wrapper) {

    // =====================================================
    // SECTION 0: BACKEND API CONFIGURATION
    // -----------------------------------------------------
    // JS only renders the UI and calls the backend.
    // All data loading, calculation, validation and record
    // creation happen in the Python script.
    //
    // Custom app  : set API_BASE to the dotted path of the
    //               Python file, e.g.
    //               'my_app.my_module.page.employee_site_timesh.employee_site_timesh'
    // Server Script API : set API_BASE = '' and create API
    //               scripts named exactly like the methods below.
    // =====================================================

    const API_BASE = 'tareqix_hrms.tareqix_hrms.page.employee_site_timesh.site_timesheet';

    function api_method(name) {
        return API_BASE ? API_BASE + '.' + name : name;
    }

    async function call_api(name, args) {

        const response = await frappe.call({
            method: api_method(name),
            args: args || {}
        });

        return response.message;
    }


    // =====================================================
    // SECTION 1: PAGE SETUP
    // =====================================================

    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Site timesheets',
        single_column: true
    });

    // UI ONLY: the new design has its own page heading,
    // so the default Frappe page header is hidden.
    $(wrapper).find('.page-head').hide();


    // =====================================================
    // SECTION 2: PAGE STYLING
    // =====================================================

    if (!document.getElementById('employee-site-timesh-font')) {

        $('head').append(`
            <link id="employee-site-timesh-font" rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap">
        `);
    }

    if (!document.getElementById('employee-site-timesh-css')) {

        $('head').append(`
            <style id="employee-site-timesh-css">

                .est-page {
                    --est-ink: #0f2742;
                    --est-muted: #6b7c93;
                    --est-line: #e6edf5;
                    --est-bg: #eef3f9;
                    --est-blue: #2563eb;
                    --est-blue-dark: #1d4ed8;
                    --est-sky: #e8f0ff;
                    --est-green: #12805c;
                    --est-green-bg: #e3f6ee;
                    --est-amber: #b45309;
                    --est-amber-bg: #fff3dc;
                    --est-red: #d92d4b;
                    --est-red-bg: #fde8ec;
                    --est-violet: #5b3fd1;
                    --est-violet-bg: #efeaff;

                    font-family: 'DM Sans', 'Inter', sans-serif;
                    color: var(--est-ink);
                    background: var(--est-bg);
                    background-image: radial-gradient(900px 300px at 85% -50px, #dbe8ff 0, transparent 70%);
                    padding: 24px 28px 30px;
                    border-radius: 14px;
                }

                .est-page * {
                    box-sizing: border-box;
                }


                /* ---------- PAGE HEADER ---------- */

                .est-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    flex-wrap: wrap;
                    margin-bottom: 18px;
                }

                .est-crumb {
                    font-size: 13px;
                    color: var(--est-muted);
                    margin-bottom: 6px;
                }

                .est-crumb b {
                    color: var(--est-blue);
                    font-weight: 600;
                }

                .est-title {
                    font-size: 30px;
                    font-weight: 700;
                    letter-spacing: -.6px;
                    margin: 0;
                    color: var(--est-ink);
                }

                .est-subtitle {
                    font-size: 14px;
                    color: var(--est-muted);
                    margin-top: 4px;
                }

                .est-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: #ffffff;
                    border: 1px solid var(--est-line);
                    border-radius: 12px;
                    padding: 10px 16px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--est-green);
                }

                .est-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #22c55e;
                    box-shadow: 0 0 0 4px rgba(34,197,94,.19);
                }


                /* ---------- FILTER + ACTION BAR ---------- */

                .est-toolbar {
                    display: flex;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    gap: 16px;
                    background: #ffffff;
                    border: 1px solid var(--est-line);
                    border-radius: 18px;
                    padding: 18px 22px;
                    box-shadow: 0 8px 24px -14px rgba(30,58,138,.3);
                }

                .est-filters {
                    display: flex;
                    gap: 16px;
                    align-items: flex-end;
                    flex-wrap: wrap;
                }

                .est-filter label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--est-muted);
                    margin-bottom: 7px;
                }

                .est-filter input,
                .est-filter select {
                    height: 46px;
                    min-width: 230px;
                    border: 1.5px solid var(--est-line);
                    border-radius: 12px;
                    padding: 0 14px 0 42px;
                    background-color: #f8fafd;
                    color: var(--est-ink);
                    font-family: inherit;
                    font-size: 15px;
                    font-weight: 600;
                    outline: none;
                    box-shadow: none;
                }

                .est-filter input:focus,
                .est-filter select:focus {
                    border-color: #93b4f5;
                    background-color: #ffffff;
                }

                #est-site {
                    -webkit-appearance: none;
                    appearance: none;
                    background-image:
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' stroke='%232563eb' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z'/%3E%3Ccircle cx='12' cy='10' r='2.5'/%3E%3C/svg%3E"),
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b7c93' stroke-width='2.4' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat, no-repeat;
                    background-position: 14px center, right 14px center;
                }

                #est-date {
                    background-image:
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' stroke='%232563eb' stroke-width='2' viewBox='0 0 24 24'%3E%3Crect x='3' y='5' width='18' height='16' rx='3'/%3E%3Cpath d='M3 10h18M8 3v4M16 3v4'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: 14px center;
                }

                .est-spacer {
                    flex: 1;
                }

                .est-btn {
                    height: 46px;
                    padding: 0 20px;
                    border: 0;
                    border-radius: 12px;
                    color: #ffffff;
                    font-family: inherit;
                    font-size: 14.5px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 9px;
                    cursor: pointer;
                    transition: transform .15s ease, filter .15s ease;
                }

                .est-btn:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.06);
                }

                .est-btn:disabled {
                    opacity: .6;
                    cursor: not-allowed;
                    transform: none;
                }

                .est-btn-blue {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    box-shadow: 0 8px 18px -8px #2563eb;
                }

                .est-btn-green {
                    background: linear-gradient(135deg, #16a37a, #0e7a58);
                    box-shadow: 0 8px 18px -8px #0e7a58;
                }

                .est-btn-teal {
                    background: linear-gradient(135deg, #34a98a, #12805c);
                    box-shadow: 0 8px 18px -8px #0e7a58;
                }

                .est-btn-outline {
                    background: #ffffff;
                    color: var(--est-blue);
                    border: 1.5px solid #c9dafc;
                    box-shadow: none;
                }

                .est-standard-shift-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .est-standard-shift-info {
                    display: none;
                }


                /* ---------- SUMMARY CARDS ---------- */

                .est-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin: 18px 0;
                }

                .est-stat {
                    background: #ffffff;
                    border: 1px solid var(--est-line);
                    border-radius: 18px;
                    padding: 18px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 8px 24px -14px rgba(30,58,138,.3);
                }

                .est-stat-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    flex: none;
                }

                .est-stat-icon.green  { background: var(--est-green-bg);  color: var(--est-green); }
                .est-stat-icon.blue   { background: var(--est-sky);       color: var(--est-blue); }
                .est-stat-icon.amber  { background: var(--est-amber-bg);  color: var(--est-amber); }
                .est-stat-icon.violet { background: var(--est-violet-bg); color: var(--est-violet); }

                .est-summary-value {
                    font-size: 30px;
                    font-weight: 700;
                    letter-spacing: -1px;
                    line-height: 1;
                    color: var(--est-ink);
                }

                .est-summary-value small {
                    font-size: 15px;
                    font-weight: 600;
                    letter-spacing: 0;
                    color: var(--est-muted);
                }

                .est-summary-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--est-muted);
                    margin-top: 6px;
                }

                .est-bar {
                    height: 5px;
                    width: 130px;
                    max-width: 100%;
                    background: #eef2f8;
                    border-radius: 9px;
                    margin-top: 9px;
                    overflow: hidden;
                }

                .est-bar i {
                    display: block;
                    height: 100%;
                    width: 0;
                    border-radius: 9px;
                    transition: width .3s ease;
                }


                /* ---------- TABLE CARD ---------- */

                .est-card {
                    background: #ffffff;
                    border: 1px solid var(--est-line);
                    border-radius: 20px;
                    box-shadow: 0 8px 24px -14px rgba(30,58,138,.3);
                    overflow: hidden;
                }

                .est-card-head {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 14px;
                    padding: 18px 22px;
                    border-bottom: 1px solid var(--est-line);
                }

                .est-info {
                    font-size: 17px;
                    font-weight: 700;
                    color: var(--est-ink);
                }

                .est-card-sub {
                    font-size: 13px;
                    color: var(--est-muted);
                    margin-top: 2px;
                }

                .est-search {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    height: 40px;
                    width: 260px;
                    padding: 0 13px;
                    border: 1.5px solid var(--est-line);
                    border-radius: 11px;
                    background: #f8fafd;
                    color: var(--est-muted);
                }

                .est-search input {
                    border: 0;
                    outline: none;
                    background: transparent;
                    width: 100%;
                    font-family: inherit;
                    font-size: 13.5px;
                    color: var(--est-ink);
                    box-shadow: none;
                    padding: 0;
                    height: 100%;
                }

                .est-add-row {
                    height: 40px;
                    padding: 0 16px;
                    font-size: 13.5px;
                    border-radius: 11px;
                }

                .est-table-wrapper {
                    overflow-x: auto;
                }

                .est-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                .est-table th {
                    padding: 13px 10px;
                    font-size: 12px;
                    font-weight: 600;
                    text-align: left;
                    color: var(--est-muted);
                    background: #f6f9fd;
                    border: 0;
                    white-space: nowrap;
                }

                .est-table th:first-child,
                .est-table td:first-child {
                    padding-left: 22px;
                }

                .est-table td {
                    padding: 13px 10px;
                    border-top: 1px solid var(--est-line);
                    white-space: nowrap;
                    vertical-align: middle;
                }

                .est-table tbody tr:hover td {
                    background: #f9fbff;
                }

                .est-worker {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .est-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 13px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 15px;
                    background: #dbe8ff;
                    color: #1d4ed8;
                    flex: none;
                }

                .est-avatar[data-tone="1"] { background: #fde8ec; color: #d92d4b; }
                .est-avatar[data-tone="2"] { background: #e3f6ee; color: #12805c; }
                .est-avatar[data-tone="3"] { background: #fff3dc; color: #b45309; }
                .est-avatar[data-tone="4"] { background: #efeaff; color: #5b3fd1; }

                .est-worker-name {
                    font-size: 14.5px;
                    font-weight: 700;
                    color: var(--est-ink);
                }

                .est-worker-id {
                    font-size: 12px;
                    color: var(--est-muted);
                    margin-top: 2px;
                }

                .est-chip {
                    display: inline-block;
                    padding: 6px 11px;
                    border-radius: 9px;
                    font-size: 13px;
                    font-weight: 600;
                    background: var(--est-sky);
                    color: var(--est-blue-dark);
                }

                .est-chip[data-tone="1"] { background: var(--est-amber-bg);  color: var(--est-amber); }
                .est-chip[data-tone="2"] { background: var(--est-violet-bg); color: var(--est-violet); }

                .est-civil-id-value {
                    color: var(--est-ink);
                }

                .est-input {
                    height: 40px;
                    border: 1.5px solid var(--est-line);
                    border-radius: 11px;
                    padding: 0 12px;
                    background: #ffffff;
                    color: var(--est-ink);
                    font-family: inherit;
                    font-size: 13.5px;
                    font-weight: 600;
                    outline: none;
                    box-shadow: none;
                }

                /* Attendance pill */

                .est-attendance {
                    --est-dot: #16a37a;
                    -webkit-appearance: none;
                    appearance: none;
                    min-width: 128px;
                    height: 38px;
                    padding: 0 30px 0 30px;
                    border: 0;
                    border-radius: 10px;
                    background-color: var(--est-green-bg);
                    color: var(--est-green);
                    background-image:
                        radial-gradient(circle at center, var(--est-dot) 0, var(--est-dot) 4px, transparent 4.5px),
                        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' fill='none' stroke='%236b7c93' stroke-width='2.6' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat, no-repeat;
                    background-position: 11px center, right 10px center;
                    background-size: 10px 10px, 13px 13px;
                    cursor: pointer;
                }

                .est-attendance[data-att="Absent"] {
                    --est-dot: #d92d4b;
                    background-color: var(--est-red-bg);
                    color: var(--est-red);
                }

                .est-attendance[data-att="Half Day"] {
                    --est-dot: #f59e0b;
                    background-color: var(--est-amber-bg);
                    color: var(--est-amber);
                }

                .est-attendance[data-att="Sick"] {
                    --est-dot: #f59e0b;
                    background-color: var(--est-amber-bg);
                    color: var(--est-amber);
                }

                .est-attendance[data-att="Leave"] {
                    --est-dot: #7c5cf0;
                    background-color: var(--est-violet-bg);
                    color: var(--est-violet);
                }

                /* Time buttons (IN / OUT / BREAK / OT) */

                .est-time-picker-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    height: 40px;
                    min-width: 98px;
                    padding: 0 12px;
                    border-radius: 11px;
                    border: 1.5px dashed var(--est-line);
                    background: #fafcff;
                    color: #8fa0b6;
                    font-family: inherit;
                    font-size: 13.5px;
                    font-weight: 500;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: border-color .15s ease, background .15s ease;
                }

                .est-time-picker-btn:hover {
                    border-color: #93b4f5;
                    background: #f1f6ff;
                }

                .est-time-picker-btn:disabled {
                    opacity: .85;
                    cursor: not-allowed;
                }

                .est-time-picker-btn.est-filled {
                    border-style: solid;
                    font-weight: 600;
                }

                .est-time-picker-btn.est-filled[data-time-type="in"],
                .est-time-picker-btn.est-filled[data-time-type="out"] {
                    background: var(--est-sky);
                    border-color: #c5d8fb;
                    color: var(--est-blue-dark);
                }

                .est-time-picker-btn.est-filled[data-time-type="break"] {
                    background: #ffffff;
                    border-color: var(--est-line);
                    color: var(--est-ink);
                }

                .est-time-picker-btn.est-filled[data-time-type="ot_day"] {
                    background: var(--est-amber-bg);
                    border-color: #f6dcaa;
                    color: var(--est-amber);
                }

                .est-time-picker-btn.est-filled[data-time-type="ot_night"] {
                    background: var(--est-violet-bg);
                    border-color: #d9d0fb;
                    color: var(--est-violet);
                }

                .est-row-off .est-time-picker-btn {
                    opacity: .45;
                }

                /* Totals */

                .est-total,
                .est-normal {
                    text-align: left;
                }

                .est-readonly {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 52px;
                    height: 38px;
                    padding: 0 8px;
                    border-radius: 10px;
                    background: #f1f5fa;
                    color: var(--est-ink);
                    font-size: 14.5px;
                    font-weight: 700;
                }

                .est-total-value.est-has {
                    background: var(--est-green-bg);
                    color: var(--est-green);
                }

                .est-remove-row {
                    width: 34px;
                    height: 34px;
                    border: 0;
                    border-radius: 10px;
                    background: var(--est-red-bg);
                    color: var(--est-red);
                    font-size: 20px;
                    font-weight: 700;
                    line-height: 1;
                    cursor: pointer;
                    transition: background .15s ease;
                }

                .est-remove-row:hover {
                    background: #f9cdd6;
                }

                .est-empty {
                    text-align: center;
                    padding: 30px !important;
                    color: var(--est-muted);
                }

                .est-card-foot {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 18px;
                    padding: 15px 22px;
                    border-top: 1px solid var(--est-line);
                    background: #fafcff;
                    font-size: 13px;
                    color: var(--est-muted);
                }

                .est-card-foot b {
                    color: var(--est-ink);
                }

                .est-legend {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                }

                .est-legend i {
                    width: 10px;
                    height: 10px;
                    border-radius: 3px;
                    display: inline-block;
                }

                @media(max-width: 1100px) {
                    .est-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media(max-width: 600px) {
                    .est-page {
                        padding: 16px;
                    }

                    .est-stats {
                        grid-template-columns: 1fr;
                    }

                    .est-search {
                        width: 100%;
                        margin-left: 0;
                    }
                }

            </style>
        `);
    }


    // =====================================================
    // SECTION 3: PAGE HTML
    // =====================================================

    $(page.body).html(`

        <div class="est-page">

            <!-- PAGE HEADER -->

            <div class="est-header">

                <div>
                    <div class="est-crumb">
                        Tareqix HRMS &nbsp;/&nbsp; Timesheets &nbsp;/&nbsp; <b>Site Timesheet</b>
                    </div>

                    <h1 class="est-title">Site Timesheet</h1>

                    <div class="est-subtitle">
                        Record attendance and working hours for every worker on site.
                    </div>
                </div>

                <div class="est-status">
                    <span class="est-status-dot"></span>
                    <span id="est-status-text">Draft · not submitted</span>
                </div>

            </div>


            <!-- FILTERS + ACTIONS -->

            <div class="est-toolbar">

                <div class="est-filters">

                    <div class="est-filter">
                        <label>Site</label>
                        <select id="est-site">
                            <option value="">Loading Sites...</option>
                        </select>
                    </div>

                    <div class="est-filter">
                        <label>Date</label>
                        <input type="date" id="est-date">
                    </div>

                    <button class="est-btn est-btn-outline" id="est-refresh">
                        <i class="fa fa-refresh"></i>
                        <span>Refresh</span>
                    </button>

                </div>

                <div class="est-spacer"></div>


                <!-- STANDARD SHIFT INFORMATION -->

                <div class="est-standard-shift-info" style="display:none;"></div>

                <div class="est-standard-shift-actions">

                    <button class="est-btn est-btn-blue" id="est-apply-shift">
                        <i class="fa fa-clock-o"></i>
                        Apply Standard Shift
                    </button>

                    <button class="est-btn est-btn-teal" id="est-complete-timesheet">
                        <i class="fa fa-check-circle"></i>
                        Complete Time Sheet
                    </button>

                    <button class="est-btn est-btn-green" id="est-submit-timesheet">
                        <i class="fa fa-paper-plane"></i>
                        Submit Time Sheet
                    </button>

                </div>

            </div>


            <!-- SUMMARY -->

            <div class="est-stats">

                <div class="est-stat">
                    <div class="est-stat-icon green"><i class="fa fa-check-circle"></i></div>
                    <div>
                        <div class="est-summary-value">
                            <span id="est-present">0</span>
                            <small>/ <span id="est-employees-of">0</span></small>
                        </div>
                        <div class="est-summary-label">Present today</div>
                        <div class="est-bar"><i id="est-bar-present" style="background:#16a37a;"></i></div>
                    </div>
                </div>

                <div class="est-stat">
                    <div class="est-stat-icon blue"><i class="fa fa-clock-o"></i></div>
                    <div>
                        <div class="est-summary-value">
                            <span id="est-total">0</span> <small>hrs</small>
                        </div>
                        <div class="est-summary-label">Total working hours</div>
                        <div class="est-bar"><i id="est-bar-total" style="background:#3b82f6;"></i></div>
                    </div>
                </div>

                <div class="est-stat">
                    <div class="est-stat-icon amber"><i class="fa fa-sun-o"></i></div>
                    <div>
                        <div class="est-summary-value">
                            <span id="est-normal">0</span> <small>hrs</small>
                        </div>
                        <div class="est-summary-label">Normal hours · OT <span id="est-ot">0</span></div>
                        <div class="est-bar"><i id="est-bar-normal" style="background:#f59e0b;"></i></div>
                    </div>
                </div>

                <div class="est-stat">
                    <div class="est-stat-icon violet"><i class="fa fa-users"></i></div>
                    <div>
                        <div class="est-summary-value" id="est-employees">0</div>
                        <div class="est-summary-label">Total employees</div>
                        <div class="est-bar"><i id="est-bar-employees" style="background:#7c5cf0;"></i></div>
                    </div>
                </div>

            </div>


            <!-- EMPLOYEE TABLE -->

            <div class="est-card">

                <div class="est-card-head">

                    <div>
                        <div class="est-info">Employee attendance and working hours</div>
                        <div class="est-card-sub" id="est-card-sub"></div>
                    </div>

                    <div class="est-search">
                        <i class="fa fa-search"></i>
                        <input type="text" id="est-search"
                            placeholder="Search worker or civil ID"
                            autocomplete="off">
                    </div>

                    <button type="button" class="est-btn est-btn-blue est-add-row">
                        <i class="fa fa-plus"></i>
                        Add worker
                    </button>

                </div>


                <div class="est-table-wrapper">

                    <table class="est-table">

                        <thead>
                            <tr>
                                <th style="min-width:240px;">Worker</th>
                                <th>Trade</th>
                                <th>Civil ID</th>
                                <th>Attendance</th>
                                <th>In</th>
                                <th>Out</th>
                                <th>Break</th>
                                <th>OT day</th>
                                <th>OT night</th>
                                <th>Total hrs</th>
                                <th>Normal</th>
                                <th style="width:70px;"></th>
                            </tr>
                        </thead>

                        <tbody id="est-employee-rows">
                            <tr>
                                <td colspan="12" class="est-empty">

                                </td>
                            </tr>
                        </tbody>

                    </table>

                </div>


                <div class="est-card-foot">

                    <span>Showing <b id="est-shown">0</b> of <b id="est-shown-total">0</b> employees</span>

                    <div class="est-spacer"></div>

                    <span class="est-legend"><i style="background:#3b82f6;"></i>In / Out</span>
                    <span class="est-legend"><i style="background:#f59e0b;"></i>OT day</span>
                    <span class="est-legend"><i style="background:#7c5cf0;"></i>OT night</span>
                    <span class="est-legend"><i style="background:#16a37a;"></i>Total hours</span>

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
    // SECTION 5: HELPER FUNCTIONS (DISPLAY ONLY)
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


    // UI ONLY: pick a stable colour tone (0..count-1) for avatars / trade chips
    function tone_of(text, count) {

        let hash = 0;

        String(text || '').split('').forEach(ch => {
            hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
        });

        return hash % count;
    }


    // UI ONLY: header status badge
    function set_status(text) {
        $('#est-status-text').text(text);
    }


    // UI ONLY: "Site · Weekday, Month Day, Year" under the table title
    function update_card_subtitle() {

        const site = $('#est-site').val() || '';
        const date_value = $('#est-date').val();

        let date_text = '';

        if (date_value) {
            date_text = new Date(date_value + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        $('#est-card-sub').text(
            [site, date_text].filter(Boolean).join(' · ')
        );
    }


    // =====================================================
    // SECTION 6: TOTAL HOURS (INSTANT ON-SCREEN PREVIEW)
    // The Python backend recalculates the same value
    // when the Time Sheet is submitted.
    // =====================================================

    // function calculate_total(in_time, out_time, break_time) {

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

    //     // Break is HH:mm
    //     const break_minutes = time_to_minutes(break_time) || 0;

    //     return Math.max(0, (minutes - break_minutes) / 60);
    // }


// =====================================================
// CALCULATE TOTAL WORKING HOURS
// Supports overnight and multi-day shifts
// =====================================================

function calculate_total(
    in_date,
    in_time,
    out_date,
    out_time,
    break_time
) {

    // Validate required values
    if (!in_date || !in_time || !out_date || !out_time) {
        return 0;
    }

    // Convert date and time into JavaScript Date objects
    const start = new Date(`${in_date}T${in_time}:00`);
    const end = new Date(`${out_date}T${out_time}:00`);

    if (
        isNaN(start.getTime()) ||
        isNaN(end.getTime())
    ) {
        return 0;
    }

    // Calculate actual duration in minutes
    let total_minutes = (end - start) / 60000;

    if (total_minutes <= 0) {
        return 0;
    }

    // Deduct break time
    const break_minutes = time_to_minutes(break_time) || 0;

    total_minutes -= break_minutes;

    return Math.max(0, total_minutes / 60);
}








// =====================================================
// CALCULATE TOTAL FOR AN EMPLOYEE ROW
// Uses original pending IN date when available
// =====================================================

function calculate_row_total(row) {

    const selected_date = $('#est-date').val() || '';

    const pending_record = row.attr('data-pending-in-record');

    // For pending records, preserve original IN date.
    // For new records, use the currently selected date.
    let in_date = row.attr('data-in-date') || selected_date;

    if (!pending_record) {
        in_date = selected_date;
        row.attr('data-in-date', in_date);
    }

    // OUT date is the currently selected date.
    const out_date = selected_date;

    row.attr('data-out-date', out_date);

    return calculate_total(
        in_date,
        row.find('.est-in').val(),
        out_date,
        row.find('.est-out').val(),
        row.find('.est-break').val()
    );
}

    // =====================================================
    // SECTION 7: LOAD UNIQUE SITE LIST (BACKEND)
    // =====================================================

    async function load_sites() {

        const site_field = $('#est-site');
        const selected_site = site_field.val();

        site_field.html(`
            <option value="">Loading Sites...</option>
        `);

        try {

            const unique_sites = await call_api('get_sites') || [];

            site_field.empty();

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
    // SECTION 8: LOAD SUPPLIER STANDARD SHIFT (BACKEND)
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

            const data = await call_api('get_standard_shift', {
                site: selected_site
            });

            if (!data || !data.supplier) {

                $('#est-supplier-name').text('No Supplier Found');
                $('#est-shift-time').text('Shift Time: --');

                return;
            }

            standard_shift = {
                supplier: data.supplier,
                in_time: data.in_time || '',
                out_time: data.out_time || ''
            };

            $('#est-supplier-name').text(standard_shift.supplier);

            if (standard_shift.in_time && standard_shift.out_time) {

                $('#est-shift-time').text(
                    `Shift Time: ${standard_shift.in_time} - ${standard_shift.out_time}`
                );

            } else {

                $('#est-shift-time').text(
                    'Shift Time: Not Configured'
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
    // SECTION 9: LOAD EMPLOYEES + SHIFT HOURS (BACKEND)
    // One backend call returns the employees of the selected
    // Site together with their normal shift hours.
    // =====================================================

    async function load_employees() {

        const tbody = $('#est-employee-rows');
        const selected_site = $('#est-site').val();
        const selected_date = $('#est-date').val();

        update_card_subtitle();

        set_status('Draft · not submitted');

        tbody.html(`
            <tr>
                <td colspan="12" class="est-empty">

                </td>
            </tr>
        `);

        try {

            const data = await call_api('get_site_employees', {
                site: selected_site,
                date: selected_date
            }) || {};

            employees = data.employees || [];

            employee_shift_map = data.shift_map || {};

            render_employees(employee_shift_map);

        } catch (error) {

            console.error('Employee Loading Error:', error);

            tbody.html(`
                <tr>
                    <td colspan="12" class="est-empty">
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
    // SECTION 10: LOAD SHIFT ASSIGNMENTS (BACKEND)
    // Used when the Date changes.
    // =====================================================

    async function load_shift_assignments() {

        const selected_date = $('#est-date').val();

        try {

            employee_shift_map = await call_api('get_shift_map', {
                date: selected_date,
                employee_ids: JSON.stringify(
                    employees.map(emp => emp.name)
                )
            }) || {};

            render_employees(employee_shift_map);

        } catch (error) {

            console.error('Shift Assignment Error:', error);

            frappe.msgprint(
                'Unable to load Shift Assignments. Please check the Shift Assignment records.'
            );
        }
    }


    // =====================================================
    // SECTION 11: RENDER EMPLOYEE TABLE
    // ADD / REMOVE EMPLOYEE ROWS
    // =====================================================

    function get_selected_employee_ids() {

        return $('.est-row')
            .map(function() {
                return $(this).attr('data-employee');
            })
            .get()
            .filter(Boolean);

    }


    function get_available_employees() {

        const selected_ids = get_selected_employee_ids();

        return employees.filter(emp =>
            !selected_ids.includes(emp.name)
        );

    }


    // =====================================================
    // CREATE EMPLOYEE ROW
    // =====================================================

    function create_employee_row(emp, shift_map) {

        const employee_name = emp
            ? (emp.employee_name || emp.name)
            : '';

        const trade = emp
            ? (emp.designation || '-')
            : '-';

        const civil_id = emp
            ? (emp.civil_id || '-')
            : '-';

        const normal_hours = emp
            ? (shift_map[emp.name] || 0)
            : 0;

        const employee_cell = emp ? `
            <div class="est-worker">

                <div class="est-avatar"
                    data-tone="${tone_of(employee_name, 5)}">
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
        ` : `
            <select class="est-input est-employee-select"
                style="min-width:220px;">

                <option value="">Select Employee</option>

                ${get_available_employees().map(employee => `
                    <option value="${escape_html(employee.name)}">
                        ${escape_html(employee.employee_name || employee.name)}
                        (${escape_html(employee.name)})
                    </option>
                `).join('')}

            </select>
        `;


        const row = $(`
             <tr class="est-row"
    data-employee="${emp ? escape_html(emp.name) : ''}"
    data-in-date=""
    data-out-date="${escape_html($('#est-date').val() || '')}">

                <td class="est-worker-cell">
                    ${employee_cell}
                </td>

                <td>
                    <span class="est-chip est-trade-value"
                        data-tone="${tone_of(trade, 3)}">${escape_html(trade)}</span>
                </td>

                <td>
                    <span class="est-civil-id-value">${escape_html(civil_id)}</span>
                </td>

                <td>
                    <select class="est-input est-attendance" data-att="Present">

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
                        Select
                    </button>
                </td>

                <td>
                    <input type="hidden" class="est-out">

                    <button type="button"
                        class="est-time-picker-btn"
                        data-time-type="out">
                        Select
                    </button>
                </td>

                <td>
                    <input type="hidden"
                        class="est-break"
                        value="00:00">

                    <button type="button"
                        class="est-time-picker-btn est-break-picker-btn"
                        data-time-type="break">
                        Select
                    </button>
                </td>

                <td>
                    <input type="hidden"
                        class="est-ot_day"
                        value="00:00">

                    <button type="button"
                        class="est-time-picker-btn"
                        data-time-type="ot_day">
                        Select
                    </button>
                </td>

                <td>
                    <input type="hidden"
                        class="est-ot_night"
                        value="00:00">

                    <button type="button"
                        class="est-time-picker-btn"
                        data-time-type="ot_night">
                        Select
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

                <td style="text-align:center;">

                    <button type="button"
                        class="est-remove-row"
                        title="Remove Employee">
                        −
                    </button>

                </td>

            </tr>
        `);

        return row;

    }


    // =====================================================
    // RENDER INITIAL EMPLOYEE ROWS
    // =====================================================

    function render_employees(shift_map) {

        const tbody = $('#est-employee-rows');

        tbody.empty();

        if (!employees.length) {

            tbody.html(`
                <tr>
                    <td colspan="12" class="est-empty">
                        No Employees found for the selected Site.
                    </td>
                </tr>
            `);

            update_summary();

            return;
        }

        // Build all rows first, then attach once (faster rendering)
        const fragment = employees.map(emp =>
            create_employee_row(emp, shift_map)
        );

        tbody.append(fragment);

        update_summary();

    }


    // =====================================================
    // ADD NEW EMPLOYEE ROW
    // =====================================================

    $(page.body).on('click', '.est-add-row', function() {

        const available = get_available_employees();

        if (!available.length) {

            frappe.msgprint({
                title: 'No Available Employees',
                message: 'All employees deployed to this Site are already selected.',
                indicator: 'orange'
            });

            return;
        }

        const new_row = create_employee_row(null, employee_shift_map);

        $('#est-employee-rows').append(new_row);

        update_summary();

    });


    // =====================================================
    // REMOVE EMPLOYEE ROW
    // =====================================================

    $(page.body).on('click', '.est-remove-row', function() {

        $(this).closest('.est-row').remove();

        // Refresh dropdown options in remaining new rows.
        refresh_employee_dropdowns();

        update_summary();

    });


    // =====================================================
    // EMPLOYEE SELECTION IN NEW ROW
    // =====================================================

    $(page.body).on('change', '.est-employee-select', function() {

        const select = $(this);

        const employee_id = select.val();

        const row = select.closest('.est-row');

        if (!employee_id) {
            return;
        }

        // Prevent duplicate employee selection.
        const already_selected = $('.est-row').filter(function() {

            return (
                $(this).attr('data-employee') === employee_id &&
                this !== row[0]
            );

        }).length;

        if (already_selected) {

            frappe.msgprint({
                title: 'Employee Already Selected',
                message: 'This employee is already available in another row.',
                indicator: 'orange'
            });

            select.val('');

            return;
        }

        const emp = employees.find(e => e.name === employee_id);

        if (!emp) {
            return;
        }

        const employee_name = emp.employee_name || emp.name;

        // Set selected employee.
        row.attr('data-employee', emp.name);

        // Replace dropdown with employee details.
        row.find('.est-worker-cell').html(`
            <div class="est-worker">

                <div class="est-avatar"
                    data-tone="${tone_of(employee_name, 5)}">
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
        `);

        // Populate employee details.
        row.find('.est-trade-value')
            .text(emp.designation || '-')
            .attr('data-tone', tone_of(emp.designation || '-', 3));

        row.find('.est-civil-id-value').text(
            emp.civil_id || '-'
        );

        row.find('.est-normal-value').text(
            format_hours(employee_shift_map[emp.name] || 0)
        );

        // Refresh remaining dropdown options.
        refresh_employee_dropdowns();

        update_summary();

    });


    // =====================================================
    // REFRESH AVAILABLE EMPLOYEES IN ALL NEW ROWS
    // =====================================================

    function refresh_employee_dropdowns() {

        $('.est-employee-select').each(function() {

            const select = $(this);

            const current_value = select.val();

            const selected_ids = get_selected_employee_ids();

            // Include employees selected in other pending dropdowns.
            $('.est-employee-select').not(this).each(function() {

                if ($(this).val()) {
                    selected_ids.push($(this).val());
                }

            });

            select.empty();

            select.append(
                new Option('Select Employee', '')
            );

            employees.forEach(emp => {

                if (
                    !selected_ids.includes(emp.name) ||
                    emp.name === current_value
                ) {

                    select.append(
                        new Option(
                            `${emp.employee_name || emp.name} (${emp.name})`,
                            emp.name
                        )
                    );

                }

            });

            if (current_value) {
                select.val(current_value);
            }

        });

    }


    // // =====================================================
    // // SECTION 12: INPUT CHANGE EVENTS
    // // TOTAL HOURS PREVIEW
    // // =====================================================

    // $(page.body).on(
    //     'change input',
    //     '.est-in, .est-out, .est-break',
    //     function() {

    //         const row = $(this).closest('.est-row');

    //         const total = calculate_total(
    //             row.find('.est-in').val(),
    //             row.find('.est-out').val(),
    //             row.find('.est-break').val()
    //         );

    //         row.find('.est-total-value').text(
    //             format_hours(total)
    //         );

    //         update_summary();
    //     }
    // );




    // =====================================================
// SECTION 12: INPUT CHANGE EVENTS
// TOTAL HOURS PREVIEW
// =====================================================

$(page.body).on(
    'change input',
    '.est-in, .est-out, .est-break',
    function() {

        const row = $(this).closest('.est-row');

        const total = calculate_row_total(row);

        row.find('.est-total-value').text(
            format_hours(total)
        );

        update_summary();
    }
);

    // =====================================================
    // SECTION 13: SUMMARY CALCULATION (DISPLAY)
    // =====================================================

    function update_summary() {

        let present = 0;
        let total_hours = 0;
        let normal_hours = 0;
        let ot_minutes = 0;
        let shown = 0;

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

            // DISPLAY ONLY: overtime shown on the Normal Hours card
            ot_minutes += (time_to_minutes(row.find('.est-ot_day').val()) || 0);
            ot_minutes += (time_to_minutes(row.find('.est-ot_night').val()) || 0);

            // DISPLAY ONLY: highlight the Total Hrs badge when hours exist
            row.find('.est-total-value').toggleClass('est-has', total > 0);

            if (row.css('display') !== 'none') {
                shown++;
            }
        });

        const employee_count = $('.est-row').length;

        $('#est-present').text(present);

        $('#est-total').text(format_hours(total_hours));

        $('#est-normal').text(format_hours(normal_hours));

        $('#est-employees').text(employee_count);

        // DISPLAY ONLY: extra labels and progress bars of the new design
        $('#est-employees-of').text(employee_count);

        $('#est-ot').text(format_hours(ot_minutes / 60));

        $('#est-shown').text(shown);

        $('#est-shown-total').text(employee_count);

        const pct = (value) => Math.max(0, Math.min(100, value)) + '%';

        $('#est-bar-present').css(
            'width',
            pct(employee_count ? (present / employee_count) * 100 : 0)
        );

        $('#est-bar-total').css(
            'width',
            pct(normal_hours > 0 ? (total_hours / normal_hours) * 100 : (total_hours > 0 ? 100 : 0))
        );

        $('#est-bar-normal').css(
            'width',
            pct(total_hours > 0 ? (normal_hours / total_hours) * 100 : (normal_hours > 0 ? 100 : 0))
        );

        $('#est-bar-employees').css('width', employee_count ? '100%' : '0%');
    }


    // =====================================================
    // SECTION 14: ATTENDANCE CHANGE EVENT
    // =====================================================

    $(page.body).on(
        'change',
        '.est-attendance',
        update_summary
    );

    // UI ONLY: attendance pill colour + dim time buttons for non-working status
    $(page.body).on('change', '.est-attendance', function() {

        const select = $(this);

        const value = select.val();

        select.attr('data-att', value);

        select.closest('.est-row').toggleClass(
            'est-row-off',
            ['Absent', 'Sick', 'Leave'].includes(value)
        );

    });


    // =====================================================
    // SECTION 15: SITE CHANGE EVENT
    // =====================================================

    $(page.body).on(
        'change',
        '#est-site',
        function() {

            load_employees();

        }
    );


    // =====================================================
    // SECTION 16: DATE CHANGE EVENT
    // =====================================================

    // $(page.body).on(
    //     'change',
    //     '#est-date',
    //     function() {

    //         update_card_subtitle();

    //         load_shift_assignments();

    //     }
    // );




    $(page.body).on(
    'change',
    '#est-date',
    function() {

        const selected_date = $(this).val();

        $('.est-row').each(function() {

            const row = $(this);

            row.attr('data-out-date', selected_date);

            // Update IN date only for new attendance rows.
            if (!row.attr('data-pending-in-record')) {
                row.attr('data-in-date', selected_date);
            }

            const total = calculate_row_total(row);

            row.find('.est-total-value').text(
                format_hours(total)
            );

        });

        update_card_subtitle();

        load_shift_assignments();

        update_summary();
    }
);


    // =====================================================
    // SECTION 16A: ROW SEARCH (UI ONLY)
    // Filters the rows already on screen. It does not touch
    // any data, calculation or backend call.
    // =====================================================

    $(page.body).on('input', '#est-search', function() {

        const term = String($(this).val() || '').trim().toLowerCase();

        $('.est-row').each(function() {

            const row = $(this);

            // Rows still waiting for an employee selection stay visible
            if (!row.attr('data-employee')) {
                row.show();
                return;
            }

            const text = (
                row.find('.est-worker-cell').text() + ' ' +
                row.find('.est-trade-value').text() + ' ' +
                row.find('.est-civil-id-value').text()
            ).toLowerCase();

            row.toggle(!term || text.indexOf(term) !== -1);

        });

        update_summary();

    });


    // =====================================================
    // SECTION 17: APPLY STANDARD SHIFT (BACKEND)
    // The backend matches Employee + Site against Deployments
    // and returns the IN / OUT times. JS only fills the rows.
    // =====================================================

    $(page.body).on('click', '#est-apply-shift', async function() {

        const selected_site = $('#est-site').val();

        if (!selected_site) {

            frappe.msgprint('Please select a Site.');

            return;
        }

        const rows = $('.est-row');

        if (!rows.length) {

            frappe.msgprint('No Employees available for the selected Site.');

            return;
        }

        const button = $(this);

        button.prop('disabled', true);

        try {

            const employee_ids = get_selected_employee_ids();

            const result = await call_api('get_deployment_shifts', {
                site: selected_site,
                employee_ids: JSON.stringify(employee_ids)
            }) || {};

            const shifts = result.shifts || {};

            const missing_employees = result.missing || [];

            let applied_count = 0;

            $('.est-row').each(function() {

                const row = $(this);

                const employee_id = row.attr('data-employee');

                if (!employee_id) {
                    return;
                }

                const shift = shifts[employee_id];

                if (!shift) {
                    return;
                }

                // set_est_time(row, 'in', shift.in_time);


                if (!row.attr('data-pending-in-record')) {
    set_est_time(row, 'in', shift.in_time);
}

                set_est_time(row, 'out', shift.out_time);

                // const total = calculate_total(
                //     shift.in_time,
                //     shift.out_time,
                //     row.find('.est-break').val()
                // );
                // Standard shift belongs to the selected date.
row.attr('data-in-date', $('#est-date').val());

const total = calculate_row_total(row);

                row.find('.est-total-value').text(
                    format_hours(total)
                );

                applied_count++;

            });

            update_summary();

            if (applied_count > 0) {

                frappe.show_alert({
                    message: 'Standard IN and OUT Shift Applied Successfully',
                    indicator: 'green'
                });

            }

            if (missing_employees.length) {

                frappe.msgprint({
                    title: 'Shift Not Available',
                    message:
                        'Deployment shift time is missing for: ' +
                        missing_employees.join(', '),
                    indicator: 'orange'
                });

            }

            if (!applied_count && !missing_employees.length) {

                frappe.msgprint('No employee rows available to update.');

            }

        } catch (error) {

            console.error('Deployment Shift Error:', error);

            frappe.msgprint({
                title: 'Deployment Shift Error',
                message: error.message,
                indicator: 'red'
            });

        } finally {

            button.prop('disabled', false);

        }

    });






// =====================================================
// NEW: COMPLETE TIME SHEET
// Fetch pending IN records for displayed employees.
// =====================================================

$(page.body).on(
    'click',
    '#est-complete-timesheet',
    async function() {

        const button = $(this);

        const selected_site = $('#est-site').val();

        if (!selected_site) {
            frappe.msgprint('Please select a Site.');
            return;
        }

        const employee_ids = get_selected_employee_ids();

        if (!employee_ids.length) {
            frappe.msgprint('No Employees available.');
            return;
        }

        button.prop('disabled', true);

        const original_html = button.html();

        button.html(
            '<i class="fa fa-spinner fa-spin"></i> Loading...'
        );

        try {

            const pending = await call_api(
                'get_pending_in_records',
                {
                    employee_ids: JSON.stringify(employee_ids)
                }
            ) || {};

            let matched_count = 0;

            $('.est-row').each(function() {

                const row = $(this);

                const employee_id = row.attr('data-employee');

                const record = pending[employee_id];

                if (!record) {
                    return;
                }

                // Store the original IN record ID.
                // row.attr(
                //     'data-pending-in-record',
                //     record.name
                // );


                // Store original IN record ID and original IN date.
row.attr('data-pending-in-record', record.name);
row.attr('data-in-date', record.date);
row.attr('data-out-date', $('#est-date').val());

                // Set original IN time.
                set_est_time(
                    row,
                    'in',
                    record.in_time
                );

                // Display original IN date and time.
                const display_date = record.date
                    ? frappe.datetime.str_to_user(record.date)
                    : '';

                const display_time = format_est_time_display(
                    record.in_time,
                    'in'
                );

                const in_button = row.find(
                    '.est-time-picker-btn[data-time-type="in"]'
                );

                in_button.html(
                    '<i class="fa fa-clock-o"></i> ' +
                    escape_html(display_date + ' ' + display_time)
                ).addClass('est-filled');

                // Make original IN time non-editable.
                in_button.prop('disabled', true);

                matched_count++;

                // Update total preview.
                // const total = calculate_total(
                //     record.in_time,
                //     row.find('.est-out').val(),
                //     row.find('.est-break').val()
                // );



                const total = calculate_row_total(row);

                row.find('.est-total-value').text(
                    format_hours(total)
                );

            });

            update_summary();

            frappe.show_alert({
                message: matched_count
                    + ' pending IN record(s) found.',
                indicator: 'green'
            });

            if (!matched_count) {
                frappe.msgprint(
                    'No pending IN records found for the listed employees.'
                );
            }

        } catch (error) {

            console.error(
                'Complete Time Sheet Error:',
                error
            );

            frappe.msgprint({
                title: 'Complete Time Sheet Error',
                message: error.message,
                indicator: 'red'
            });

        } finally {

            button.prop('disabled', false);
            button.html(original_html);

        }

    }
);



    /* =========================================================
       SECTION 18: COMPLETE BLACK & WHITE CLOCK TIME PICKER

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

        if (['break', 'ot_day', 'ot_night'].includes(type)) {
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
    // SET TIME INTO INPUT AND BUTTON
    // =====================================================

    function set_est_time(row, type, value) {

        const time = value ? value.substring(0, 5) : '';

        row.find('.est-' + type).val(time);

        // UI ONLY: icon shown inside the time chip
        const icons = {
            in: '<i class="fa fa-clock-o"></i> ',
            out: '<i class="fa fa-clock-o"></i> ',
            break: '<i class="fa fa-coffee"></i> ',
            ot_day: '',
            ot_night: ''
        };

        const button = row.find(
            `.est-time-picker-btn[data-time-type="${type}"]`
        );

        if (time) {

            button.html(
                (icons[type] || '') +
                escape_html(format_est_time_display(time, type))
            ).addClass('est-filled');

        } else {

            button.text('Select').removeClass('est-filled');

        }

    }


    // =====================================================
    // OPEN CUSTOM CLOCK PICKER
    // =====================================================

    function open_est_time_picker($input, $btn, type) {

        const is_break = ['break', 'ot_day', 'ot_night'].includes(type);

        // Remove previously opened clock
        $('.est-time-overlay').remove();

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


        // OVERLAY DESIGN
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


        // DIALOG DESIGN
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


        // TITLE DESIGN
        overlay.find('.est-time-title').css({

            fontSize: '11px',
            color: '#777777',
            marginBottom: '15px',
            letterSpacing: '1px',
            fontWeight: 'bold',
            textAlign: 'center'

        });


        // TIME DISPLAY DESIGN
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


        // AM / PM DESIGN
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


        // CLOCK DESIGN
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

                const display_value = String(value).padStart(2, '0');

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


        // CLICK HOUR INPUT TO SHOW HOUR CLOCK
        overlay.on('click', '.est-hour', function() {

            selection_mode = 'hour';

            render_clock();

        });


        // CLICK MINUTE INPUT TO SHOW MINUTE CLOCK
        overlay.on('click', '.est-minute', function() {

            selection_mode = 'minute';

            render_clock();

        });


        // MANUAL HOUR ENTRY
        overlay.on('input', '.est-hour', function() {

            const value = parseInt($(this).val(), 10);

            if (Number.isInteger(value)) {

                hour = value;

            }

        });


        // MANUAL MINUTE ENTRY
        overlay.on('input', '.est-minute', function() {

            const value = parseInt($(this).val(), 10);

            if (Number.isInteger(value)) {

                minute = value;

            }

        });


        // AM / PM SELECTION
        overlay.on('click', '.est-am', function() {

            period = 'AM';

            update_period();

        });


        overlay.on('click', '.est-pm', function() {

            period = 'PM';

            update_period();

        });


        // CANCEL BUTTON
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

            // Save IN / OUT / BREAK / OT time
            set_est_time(
                $btn.closest('.est-row'),
                type,
                time24
            );

            // Close clock
            overlay.remove();

            // RECALCULATE TOTAL HOURS
            const row = $btn.closest('.est-row');

            // const total = calculate_total(
            //     row.find('.est-in').val(),
            //     row.find('.est-out').val(),
            //     row.find('.est-break').val()
            // );
            const total = calculate_row_total(row);

            row.find('.est-total-value').text(format_hours(total));

            // Refresh summary cards
            update_summary();

        });


        // =================================================
        // OK / CANCEL BUTTON DESIGN
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
    // BIND IN / OUT / BREAK / OT CLOCK BUTTONS
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

                // Refresh Employees and Shift

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
    // SECTION 20: SUBMIT TIME SHEET (BACKEND)
    // JS collects the row values and sends them in ONE call.
    // The backend validates, recalculates the hours and
    // creates the separate IN and OUT Site TimeSheet records.
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

        // Collect row values (no calculation here)

        const payload = rows.toArray().map(element => {

            const row = $(element);

            return {
                employee: row.attr('data-employee') || '',
                trade: row.find('.est-trade-value').text().trim(),
                civil_id: row.find('.est-civil-id-value').text().trim(),
                attendance: row.find('.est-attendance').val(),
                in_time: row.find('.est-in').val() || null,
                pending_in_record:row.attr('data-pending-in-record') || null,
                out_time: row.find('.est-out').val() || null,
                break_time: row.find('.est-break').val() || null,
                ot_day: row.find('.est-ot_day').val() || null,
                ot_night: row.find('.est-ot_night').val() || null
            };

        });

        try {

            const result = await call_api('submit_timesheet', {
                site: selected_site,
                date: selected_date,
                rows: JSON.stringify(payload)
            }) || {};

            const created = result.created || 0;

            const errors = result.errors || [];

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

                // UI ONLY: header status badge
                set_status('Submitted');

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


    // =====================================================
    // SECTION 21: INITIAL PAGE LOAD
    // =====================================================

    async function initialize_page() {

        await load_sites();

        await load_employees();

    }

    initialize_page();

};
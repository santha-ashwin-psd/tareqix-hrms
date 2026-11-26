// Document Expiry Report - modern card view
// Full replacement for document_expiry_report.js (filters unchanged, UI only)

(function (g) {
  // Column fieldnames of your report. Change these if yours differ.
  var F = { id: 'record_id', name: 'candidate_name', stage: 'stage', doc: 'attachment_name', status: 'status', due: 'last_submission_date', days: 'days_left' };
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var ICON = '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var CHEV = '<svg class="dxr-cv" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
  var SEARCH = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmt(s) {
    if (!s) return '';
    var m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/), d, mo, y;
    if (m) { d = m[1]; mo = m[2]; y = m[3]; }
    else { m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return s; y = m[1]; mo = m[2]; d = m[3]; }
    return (+d) + ' ' + MON[+mo - 1] + ' ' + y;
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function countUp(el, to) {
    if (reduce || !to) { el.textContent = to; return; }
    var t0 = performance.now();
    (function step(t) {
      var p = Math.min(1, (t - t0) / 800);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function render(mount, raw, cfg) {
    cfg = cfg || {};
    var f = Object.assign({}, F, cfg.fields || {});
    var rows = raw.map(function (r) {
      var days = (r[f.days] === '' || r[f.days] == null) ? null : Number(r[f.days]);
      var missing = String(r[f.status] || '').toLowerCase() === 'missing';
      var cat = !missing ? 'done' : days == null ? 'none' : days < 0 ? 'overdue' : days <= 3 ? 'soon' : 'upcoming';
      return { id: r[f.id], name: r[f.name], stage: r[f.stage] || '-', doc: r[f.doc], status: r[f.status], due: fmt(r[f.due]), days: days, cat: cat };
    });
    var stages = [];
    rows.forEach(function (r) { if (stages.indexOf(r.stage) < 0) stages.push(r.stage); });
    var by = function (s) { return rows.filter(function (r) { return r.stage === s; }); };
    var cnt = function (c) { return rows.filter(function (r) { return r.cat === c; }).length; };
    var total = rows.length, done = cnt('done'), pct = total ? Math.round(done / total * 100) : 0;
    var curStage = stages.filter(function (s) { return by(s).some(function (r) { return r.cat !== 'done'; }); })[0];
    var first = rows[0] || {};
    var initials = String(first.name || '?').split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    var S = { q: '', cat: 'all', stage: null, shut: {}, first: true };

    mount.innerHTML =
      '<div class="dxr">' +
      '<div class="dxr-top">' +
        '<div class="dxr-ring"><svg viewBox="0 0 92 92"><circle class="bg" cx="46" cy="46" r="36"/><circle class="fg" cx="46" cy="46" r="36"/></svg><b><span data-pct>0</span>%</b></div>' +
        '<div class="dxr-who"><div class="dxr-av">' + esc(initials) + '</div><div><h2>' + esc(first.name || 'Document Expiry') + '</h2><span>' + esc(first.id || '') + '</span></div></div>' +
        '<div class="dxr-stats">' +
          '<div class="dxr-st"><b data-n="' + total + '">0</b><small>Documents</small></div>' +
          '<div class="dxr-st"><b data-n="' + (total - done) + '">0</b><small>Missing</small></div>' +
          '<div class="dxr-st bad"><b data-n="' + cnt('overdue') + '">0</b><small>Overdue</small></div>' +
          '<div class="dxr-st warn"><b data-n="' + cnt('soon') + '">0</b><small>Due within 3 days</small></div>' +
        '</div>' +
      '</div>' +
      '<div class="dxr-rail"></div>' +
      '<div class="dxr-tool"><label class="dxr-q">' + SEARCH + '<input type="search" placeholder="Search document or stage"></label><div class="dxr-chips"></div>' +
        (cfg.onTable ? '<button class="dxr-tbl" type="button">Table view</button>' : '') + '</div>' +
      '<div class="dxr-list"></div></div>';

    var $ = function (s) { return mount.querySelector(s); };
    mount.querySelectorAll('[data-n]').forEach(function (el) { countUp(el, +el.dataset.n); });
    countUp($('[data-pct]'), pct);
    requestAnimationFrame(function () { requestAnimationFrame(function () { $('.dxr-ring .fg').style.strokeDashoffset = 226.2 * (1 - pct / 100); }); });

    var rail = $('.dxr-rail');
    rail.innerHTML = stages.map(function (s, i) {
      var l = by(s), d = l.filter(function (r) { return r.cat === 'done'; }).length;
      return '<button class="dxr-sg' + (s === curStage ? ' cur' : '') + '" data-s="' + i + '"><div class="dxr-bar"><i data-w="' + (l.length ? d / l.length * 100 : 0) + '"></i></div><span class="dxr-sn">' + esc(s) + '</span><span class="dxr-sc">' + d + ' of ' + l.length + ' submitted</span></button>';
    }).join('');
    requestAnimationFrame(function () { requestAnimationFrame(function () { rail.querySelectorAll('[data-w]').forEach(function (b) { b.style.width = b.dataset.w + '%'; }); }); });
    rail.onclick = function (e) {
      var b = e.target.closest('.dxr-sg'); if (!b) return;
      var s = stages[+b.dataset.s]; S.stage = S.stage === s ? null : s;
      rail.querySelectorAll('.dxr-sg').forEach(function (x) { x.classList.toggle('on', stages[+x.dataset.s] === S.stage); });
      draw();
    };

    var chips = [['all', 'All'], ['overdue', 'Overdue'], ['soon', 'Due soon'], ['upcoming', 'Upcoming'], ['none', 'No deadline'], ['done', 'Submitted']];
    var chipBox = $('.dxr-chips');
    chipBox.innerHTML = chips.map(function (c) { return '<button class="dxr-chip' + (c[0] === 'all' ? ' on' : '') + '" data-c="' + c[0] + '">' + c[1] + '<em>' + (c[0] === 'all' ? total : cnt(c[0])) + '</em></button>'; }).join('');
    chipBox.onclick = function (e) {
      var b = e.target.closest('.dxr-chip'); if (!b) return;
      S.cat = b.dataset.c;
      chipBox.querySelectorAll('.dxr-chip').forEach(function (x) { x.classList.toggle('on', x === b); });
      draw();
    };
    $('.dxr-q input').oninput = function (e) { S.q = e.target.value.toLowerCase(); draw(); };
    if (cfg.onTable) $('.dxr-tbl').onclick = cfg.onTable;

    function tag(r) {
      if (r.cat === 'done') return '<span class="dxr-tag ok">Submitted</span>';
      if (r.cat === 'none') return '<span class="dxr-tag none">No deadline</span>';
      if (r.cat === 'overdue') return '<span class="dxr-tag late">' + plural(-r.days, 'day') + ' overdue</span>';
      if (r.cat === 'soon') return '<span class="dxr-tag soon">' + (r.days === 0 ? 'Due today' : plural(r.days, 'day') + ' left') + '</span>';
      return '<span class="dxr-tag fut">' + plural(r.days, 'day') + ' left</span>';
    }
    function draw() {
      var i = 0, html = '';
      stages.forEach(function (s) {
        if (S.stage && S.stage !== s) return;
        var all = by(s), d = all.filter(function (r) { return r.cat === 'done'; }).length;
        var list = all.filter(function (r) {
          return (S.cat === 'all' || r.cat === S.cat) && (!S.q || (r.doc + ' ' + r.stage).toLowerCase().indexOf(S.q) >= 0);
        });
        if (!list.length) return;
        html += '<section class="dxr-grp' + (S.shut[s] ? ' shut' : '') + '" data-g="' + esc(s) + '">' +
          '<button class="dxr-gh">' + CHEV + '<h3>' + esc(s) + '</h3><div class="dxr-gp"><i style="width:' + (all.length ? d / all.length * 100 : 0) + '%"></i></div><span class="dxr-gn">' + d + ' / ' + all.length + '</span></button>' +
          '<div class="dxr-gb"><div class="dxr-gbi">' +
          list.map(function (r) {
            return '<div class="dxr-row ' + (r.cat === 'overdue' ? 'bad' : r.cat === 'done' ? 'done' : '') + (S.first && i < 14 ? ' dxr-enter' : '') + '" style="--i:' + (i++) + '">' +
              '<div class="dxr-ic">' + (r.cat === 'done' ? CHECK : ICON) + '</div><div class="dxr-dn" title="' + esc(r.doc) + '">' + esc(r.doc) + '</div>' +
              '<div>' + (r.cat === 'done' ? '' : '<span class="dxr-tag miss">' + esc(r.status) + '</span>') + '</div>' +
              '<div class="dxr-due">' + esc(r.due || '') + '</div><div>' + tag(r) + '</div></div>';
          }).join('') + '</div></div></section>';
      });
      $('.dxr-list').innerHTML = html || '<div class="dxr-empty">No documents match these filters</div>';
      S.first = false;
    }
    $('.dxr-list').onclick = function (e) {
      var h = e.target.closest('.dxr-gh'); if (!h) return;
      var g2 = h.parentNode, k = g2.dataset.g; S.shut[k] = !S.shut[k]; g2.classList.toggle('shut', S.shut[k]);
    };
    draw();
  }
  g.DXR = { render: render, fields: F };
})(window);


(function () {
  var css = ".dxr{--ink:#16212E;--mute:#6B7889;--line:#E3E8EF;--bg:#EEF2F6;--card:#fff;--brand:#0E7C86;--tint:#E3F3F4;--bad:#D93F4E;--bad-t:#FDECEE;--warn:#B8660F;--warn-t:#FDF1E1;--ok:#2F9E6B;--ok-t:#E5F5ED;--info:#3B6FD4;--info-t:#E8EFFC;--grey-t:#EEF1F5;font-family:'Plus Jakarta Sans','Inter','Segoe UI',system-ui,sans-serif;color:var(--ink);background:var(--bg);padding:22px;border-radius:18px;font-size:13.5px;line-height:1.45}\n.dxr *{box-sizing:border-box}\n.dxr-top{background:var(--card);border-radius:16px;padding:22px 26px;display:grid;grid-template-columns:auto 1fr auto;gap:30px;align-items:center;box-shadow:0 1px 0 var(--line),0 8px 24px -16px rgba(22,33,46,.25)}\n.dxr-ring{position:relative;width:92px;height:92px}\n.dxr-ring svg{width:92px;height:92px;transform:rotate(-90deg)}\n.dxr-ring circle{fill:none;stroke-width:8;stroke-linecap:round}\n.dxr-ring .bg{stroke:var(--grey-t)}\n.dxr-ring .fg{stroke:var(--brand);stroke-dasharray:226.2;stroke-dashoffset:226.2;transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)}\n.dxr-ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;letter-spacing:-.02em}\n.dxr-who{display:flex;align-items:center;gap:14px;min-width:0}\n.dxr-av{width:46px;height:46px;border-radius:14px;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:700;font-size:16px;flex:none}\n.dxr-who h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.15}\n.dxr-who span{display:inline-block;margin-top:5px;padding:2px 10px;border-radius:99px;background:var(--tint);color:var(--brand);font-weight:700;font-size:12px;letter-spacing:.02em}\n.dxr-stats{display:flex;gap:0}\n.dxr-st{padding:0 26px;border-left:1px solid var(--line);min-width:112px}\n.dxr-st b{display:block;font-size:30px;font-weight:800;letter-spacing:-.03em;line-height:1.1;font-variant-numeric:tabular-nums}\n.dxr-st small{color:var(--mute);font-size:12px;font-weight:600}\n.dxr-st.bad b{color:var(--bad)}.dxr-st.warn b{color:var(--warn)}\n.dxr-rail{display:flex;gap:6px;margin:18px 2px 6px;overflow-x:auto;padding-bottom:6px}\n.dxr-sg{flex:1 0 118px;text-align:left;border:0;background:none;padding:0;cursor:pointer;font:inherit;color:inherit;opacity:.92}\n.dxr-sg:hover{opacity:1}\n.dxr-bar{height:7px;border-radius:9px;background:#D9E0EA;overflow:hidden;position:relative}\n.dxr-bar i{position:absolute;inset:0 auto 0 0;width:0;background:var(--ok);border-radius:9px;transition:width .9s cubic-bezier(.2,.8,.2,1)}\n.dxr-sg.cur .dxr-bar{background:#BFE3E6;box-shadow:0 0 0 0 rgba(14,124,134,.45);animation:dxr-pulse 2.4s ease-out 1.2s 2}\n.dxr-sg.cur .dxr-bar i{background:var(--brand)}\n.dxr-sg.on .dxr-sn{color:var(--brand)}\n.dxr-sn{display:block;margin-top:8px;font-weight:700;font-size:12px;line-height:1.3;min-height:32px;padding-right:8px}\n.dxr-sc{font-size:11.5px;color:var(--mute);font-weight:600}\n.dxr-sg.cur .dxr-sc{color:var(--brand)}\n.dxr-tool{display:flex;align-items:center;gap:12px;margin:14px 0 12px;flex-wrap:wrap}\n.dxr-q{position:relative;flex:0 1 280px}\n.dxr-q input{width:100%;height:38px;border:1px solid var(--line);border-radius:11px;padding:0 12px 0 36px;background:#fff;font:inherit;color:var(--ink);outline:none;transition:border-color .15s,box-shadow .15s}\n.dxr-q input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(14,124,134,.16)}\n.dxr-q svg{position:absolute;left:11px;top:11px;width:16px;height:16px;stroke:var(--mute);fill:none;stroke-width:2}\n.dxr-chips{display:flex;gap:6px;flex-wrap:wrap;flex:1}\n.dxr-chip{border:1px solid var(--line);background:#fff;border-radius:99px;padding:6px 13px;font:inherit;font-weight:600;color:var(--mute);cursor:pointer;transition:all .15s}\n.dxr-chip em{font-style:normal;margin-left:6px;opacity:.75}\n.dxr-chip:hover{color:var(--ink);border-color:#c9d2de}\n.dxr-chip.on{background:var(--ink);border-color:var(--ink);color:#fff}\n.dxr-tbl{border:1px solid var(--line);background:#fff;border-radius:11px;height:38px;padding:0 14px;font:inherit;font-weight:600;color:var(--ink);cursor:pointer}\n.dxr-tbl:hover{border-color:var(--brand);color:var(--brand)}\n.dxr-grp{background:var(--card);border-radius:16px;margin-bottom:12px;box-shadow:0 1px 0 var(--line);overflow:hidden}\n.dxr-gh{width:100%;display:flex;align-items:center;gap:14px;padding:15px 20px;border:0;background:none;font:inherit;color:inherit;cursor:pointer;text-align:left}\n.dxr-gh:hover{background:#FAFBFD}\n.dxr-gh h3{margin:0;font-size:14.5px;font-weight:800;letter-spacing:-.01em;flex:1}\n.dxr-gp{width:120px;height:6px;border-radius:9px;background:var(--grey-t);overflow:hidden}\n.dxr-gp i{display:block;height:100%;background:var(--ok);border-radius:9px}\n.dxr-gn{font-weight:700;color:var(--mute);min-width:62px;text-align:right;font-variant-numeric:tabular-nums}\n.dxr-cv{width:16px;height:16px;stroke:var(--mute);fill:none;stroke-width:2.2;transition:transform .25s}\n.dxr-grp.shut .dxr-cv{transform:rotate(-90deg)}\n.dxr-gb{display:grid;grid-template-rows:1fr;transition:grid-template-rows .3s ease}\n.dxr-grp.shut .dxr-gb{grid-template-rows:0fr}\n.dxr-gbi{overflow:hidden}\n.dxr-row{display:grid;grid-template-columns:34px 1fr 104px 118px 150px;gap:14px;align-items:center;padding:11px 20px;border-top:1px solid #EEF1F5;transition:background .15s}\n.dxr-row:hover{background:#F6FAFA}\n.dxr-ic{width:34px;height:34px;border-radius:10px;background:var(--grey-t);display:grid;place-items:center}\n.dxr-ic svg{width:17px;height:17px;stroke:var(--mute);fill:none;stroke-width:1.9}\n.dxr-row.bad .dxr-ic{background:var(--bad-t)}.dxr-row.bad .dxr-ic svg{stroke:var(--bad)}\n.dxr-row.done .dxr-ic{background:var(--ok-t)}.dxr-row.done .dxr-ic svg{stroke:var(--ok)}\n.dxr-dn{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.dxr-due{color:var(--mute);font-weight:600;font-variant-numeric:tabular-nums}\n.dxr-tag{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:99px;font-weight:700;font-size:12px;white-space:nowrap}\n.dxr-tag:before{content:\"\";width:6px;height:6px;border-radius:50%;background:currentColor}\n.dxr-tag.miss{background:var(--bad-t);color:var(--bad)}\n.dxr-tag.ok{background:var(--ok-t);color:var(--ok)}\n.dxr-tag.late{background:var(--bad);color:#fff}.dxr-tag.late:before{background:#fff}\n.dxr-tag.soon{background:var(--warn-t);color:var(--warn)}\n.dxr-tag.fut{background:var(--info-t);color:var(--info)}\n.dxr-tag.none{background:var(--grey-t);color:var(--mute)}\n.dxr-tag.none:before{display:none}\n.dxr-empty{padding:34px;text-align:center;color:var(--mute);font-weight:600;background:#fff;border-radius:16px}\n.dxr-enter{animation:dxr-in .45s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i)*28ms + 250ms)}\n@keyframes dxr-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}\n@keyframes dxr-pulse{70%{box-shadow:0 0 0 9px rgba(14,124,134,0)}100%{box-shadow:0 0 0 0 rgba(14,124,134,0)}}\n@media(max-width:900px){.dxr-top{grid-template-columns:1fr}.dxr-stats{flex-wrap:wrap;row-gap:12px}.dxr-st:first-child{border-left:0;padding-left:0}.dxr-row{grid-template-columns:34px 1fr 130px}.dxr-row .dxr-tag.miss,.dxr-row .dxr-tag.ok,.dxr-due{display:none}}\n@media(prefers-reduced-motion:reduce){.dxr *{animation:none!important;transition:none!important}}\n";
  if (!document.getElementById('dxr-style')) {
    var st = document.createElement('style'); st.id = 'dxr-style'; st.textContent = css +
      '.dxr-cards .datatable,.dxr-cards .dt-scrollable{display:none!important}.dxr-table .dxr-host{display:none}';
    document.head.appendChild(st);
  }
})();

window.dxr_apply = function (report) {
  var $w = report.$report; if (!$w || !$w.length) return;
  var cols = (report.columns || []).map(function (c) { return c.fieldname || c.id; });
  var rows = (report.data || []).map(function (r) {
    if (Array.isArray(r)) { var o = {}; cols.forEach(function (k, i) { o[k] = r[i]; }); return o; }
    return r;
  }).filter(function (r) { return r && typeof r === 'object' && r[DXR.fields.doc] != null; });
  $w.find('.dxr-host').remove();
  var host = $('<div class="dxr-host"></div>').prependTo($w);
  $w.addClass('dxr-cards').removeClass('dxr-table');
  DXR.render(host[0], rows, {
    onTable: function () { $w.removeClass('dxr-cards').addClass('dxr-table'); }
  });
  if (!report.__dxr_menu) {
    report.__dxr_menu = true;
    report.page.add_menu_item(__('Switch Card / Table View'), function () {
      $w.toggleClass('dxr-cards').toggleClass('dxr-table');
    });
  }
};

frappe.query_reports["Document Expiry Report"] = {
    filters: [
        {
            fieldname: "visa_and_pro",
            label: __("Visa and PRO"),
            fieldtype: "Link",
            options: "Visa and PRO",
            reqd: 0
        }
    ],

    after_datatable_render: function () {
        dxr_apply(frappe.query_report);
    }
};
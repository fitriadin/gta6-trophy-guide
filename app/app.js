// GTA 6 Trophy Guide & Tracker — offline, no build step, no network at run time.
// Data comes from data/trophies.json (same origin, fetched once at load).
// Progress and the spoiler setting live in localStorage; export/import move them as JSON.
(function () {
  'use strict';

  var PROGRESS_KEY = 'gta6-trophy-guide.progress.v1';
  var SPOILER_KEY = 'gta6-trophy-guide.spoiler.v1';
  var RING_CIRCUMFERENCE = 163.36;
  var DEFAULT_SELECTED_ID = 28; // Positive Mental Attitude: the one missable trophy.

  var KIND_LABELS = {
    story: 'Story', side: 'Side', collect: 'Collectibles', activity: 'Activities',
    crime: 'Crime', money: 'Money', explore: 'Exploration', oneoff: 'One-off', meta: 'Milestone'
  };
  var GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
  var GRADE_TOTALS = { platinum: 1, gold: 2, silver: 6, bronze: 46 };

  var trophies = [];
  var byId = {};
  var earned = new Set(loadProgress());
  var spoilerOn = loadSpoiler();
  var selectedId = DEFAULT_SELECTED_ID;
  var filters = { search: '', kind: 'all', grade: 'all', status: 'all', missableOnly: false };

  var els = {};
  ['trophy-list', 'detail-pane', 'empty-state', 'load-error', 'result-count',
   'progress-ring', 'progress-pct', 'progress-earned', 'grade-counts', 'next-up',
   'search-input', 'kind-filter', 'grade-filter', 'status-filter', 'missable-filter',
   'spoiler-toggle', 'export-btn', 'import-btn', 'import-file', 'reset-btn', 'toast'
  ].forEach(function (id) { els[id] = document.getElementById(id); });

  // ---------- persistence ----------

  function loadProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (id) { return Number.isInteger(id) && id >= 1 && id <= 55; });
    } catch (err) {
      return [];
    }
  }

  function saveProgress() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(earned).sort(numSort))); } catch (err) { /* storage full or blocked: progress still works for this session */ }
  }

  function loadSpoiler() {
    try { return localStorage.getItem(SPOILER_KEY) === '1'; } catch (err) { return false; }
  }

  function saveSpoiler() {
    try { localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0'); } catch (err) { /* ignore */ }
  }

  function numSort(a, b) { return a - b; }

  // ---------- helpers ----------

  function isMasked(trophy) {
    // Spoiler setting hides story trophies' names and descriptions until earned.
    return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.id);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function chip(text, extraClass) {
    return el('span', 'chip' + (extraClass ? ' ' + extraClass : ''), text);
  }

  function flag(text, kind) {
    return el('span', 'flag flag-' + kind, text);
  }

  function toast(message, isError) {
    els.toast.textContent = message;
    els.toast.classList.toggle('error', !!isError);
    els.toast.hidden = false;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () { els.toast.hidden = true; }, 4000);
  }

  function filteredTrophies() {
    var q = filters.search.trim().toLowerCase();
    return trophies.filter(function (t) {
      if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
      if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
      if (filters.status === 'earned' && !earned.has(t.id)) return false;
      if (filters.status === 'remaining' && earned.has(t.id)) return false;
      if (filters.missableOnly && !t.missable) return false;
      if (q && t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  // ---------- rendering ----------

  function renderProgress() {
    var count = earned.size;
    var pct = Math.round((count / trophies.length) * 100);
    els['progress-ring'].style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - count / trophies.length));
    els['progress-pct'].textContent = pct + '%';
    els['progress-earned'].textContent = String(count);

    var counts = el('span');
    GRADE_ORDER.forEach(function (grade, i) {
      var got = trophies.filter(function (t) { return t.grade === grade && earned.has(t.id); }).length;
      if (i > 0) counts.appendChild(document.createTextNode('  '));
      var dot = el('span', 'g-dot');
      dot.style.background = 'var(--color-grade-' + grade + ')';
      counts.appendChild(dot);
      counts.appendChild(document.createTextNode(' ' + grade.charAt(0).toUpperCase() + ' ' + got + '/' + GRADE_TOTALS[grade]));
    });
    els['grade-counts'].replaceChildren(counts);

    // Next up: the first remaining trophy you can actually work on now —
    // the platinum and 100% completion only land at the very end, so skip them.
    var next = trophies.find(function (t) { return !earned.has(t.id) && t.kind !== 'meta'; });
    if (els['next-up']) {
      if (!next) {
        els['next-up'].textContent = 'Platinum complete — every trophy earned.';
      } else if (isMasked(next)) {
        els['next-up'].textContent = 'Next up: a story trophy (hidden by the spoiler setting).';
      } else {
        els['next-up'].textContent = 'Next up: ' + next.name;
      }
    }
  }

  function trophyRow(trophy) {
    var masked = isMasked(trophy);
    var li = el('li', 'trophy-row' + (trophy.id === selectedId ? ' selected' : '') + (earned.has(trophy.id) ? ' earned' : ''));
    li.dataset.id = String(trophy.id);
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', masked ? 'Hidden story trophy ' + trophy.id : trophy.name);

    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.id);
    box.setAttribute('aria-label', masked ? 'Mark hidden story trophy earned' : 'Mark ' + trophy.name + ' earned');
    box.addEventListener('click', function (event) { event.stopPropagation(); });
    box.addEventListener('change', function () {
      toggleEarned(trophy.id);
    });
    li.appendChild(box);

    li.appendChild(el('span', 'grade-dot ' + trophy.grade));

    var body = el('div');
    var name = el('p', 'trophy-name', trophy.name);
    var desc = el('p', 'trophy-desc', trophy.description);
    if (masked) {
      name.classList.add('spoiler-masked');
      desc.classList.add('spoiler-masked');
      body.appendChild(name);
      body.appendChild(desc);
      body.appendChild(el('p', 'spoiler-note', 'Story trophy — hidden until earned'));
    } else {
      body.appendChild(name);
      body.appendChild(desc);
    }
    var meta = el('div', 'trophy-meta');
    meta.appendChild(chip(KIND_LABELS[trophy.kind] || trophy.kind));
    if (trophy.target !== null && trophy.target !== undefined) {
      meta.appendChild(chip('Target: ' + trophy.target.toLocaleString('en-US') + ' ' + trophy.targetUnit, 'chip-target'));
    }
    if (trophy.hidden) meta.appendChild(flag('Hidden', 'hidden'));
    if (trophy.missable) meta.appendChild(flag('Missable', 'missable'));
    if (trophy.unconfirmed) meta.appendChild(flag('Unconfirmed', 'unconfirmed'));
    body.appendChild(meta);
    li.appendChild(body);

    var tags = el('div', 'trophy-tags');
    tags.appendChild(el('span', 'trophy-num', '#' + String(trophy.id).padStart(2, '0')));
    if (earned.has(trophy.id)) tags.appendChild(flag('Earned', 'earned'));
    li.appendChild(tags);

    li.addEventListener('click', function () { selectTrophy(trophy.id); });
    li.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectTrophy(trophy.id); }
    });
    return li;
  }

  function renderList() {
    var list = filteredTrophies();
    els['trophy-list'].replaceChildren.apply(els['trophy-list'], list.map(trophyRow));
    els['empty-state'].hidden = list.length !== 0;
    els['trophy-list'].hidden = list.length === 0;
    els['result-count'].textContent = 'Showing ' + list.length + ' of ' + trophies.length;
  }

  function renderDetail() {
    var trophy = byId[selectedId];
    var pane = els['detail-pane'];
    if (!trophy) {
      pane.replaceChildren(el('p', 'detail-empty', 'Select a trophy from the list to read its guide.'));
      return;
    }
    var masked = isMasked(trophy);
    var wrap = document.createDocumentFragment();

    var head = el('div', 'detail-head');
    head.appendChild(el('span', 'grade-badge grade-' + trophy.grade, trophy.grade));
    if (trophy.missable) head.appendChild(flag('Potentially missable', 'missable'));
    if (trophy.unconfirmed) head.appendChild(flag('Unconfirmed at launch', 'unconfirmed'));
    wrap.appendChild(head);

    var name = el('h3', null, trophy.name);
    var desc = el('p', 'detail-desc', trophy.description);
    if (masked) {
      name.classList.add('spoiler-masked');
      desc.classList.add('spoiler-masked');
    }
    wrap.appendChild(name);
    wrap.appendChild(desc);
    if (masked) wrap.appendChild(el('p', 'spoiler-note', 'Story trophy — its name and description stay hidden until you earn it.'));

    var meta = el('div', 'detail-meta');
    meta.appendChild(chip('#' + trophy.id + ' of 55'));
    meta.appendChild(chip(KIND_LABELS[trophy.kind] || trophy.kind));
    if (trophy.hidden) meta.appendChild(chip('Hidden on PSN until earned'));
    if (trophy.target !== null && trophy.target !== undefined) {
      meta.appendChild(chip('PSN progress target: ' + trophy.target.toLocaleString('en-US') + ' ' + trophy.targetUnit, 'chip-target'));
    }
    wrap.appendChild(meta);

    if (trophy.missable) {
      var warn = el('div', 'detail-warn');
      var strong = el('strong', null, 'Potentially missable — ');
      warn.appendChild(strong);
      warn.appendChild(document.createTextNode('the only trophy on this list that can be missed. Do the Chapter 1 balcony meditation during Chapter 1 and keep a Chapter 1 save.'));
      wrap.appendChild(warn);
    }
    if (trophy.unconfirmed) {
      var warn2 = el('div', 'detail-warn');
      var strong2 = el('strong', null, 'Unconfirmed at launch — ');
      warn2.appendChild(strong2);
      warn2.appendChild(document.createTextNode('no verified unlock method exists yet. The guide below says only what the official description states, plus clearly-labelled reported hints.'));
      wrap.appendChild(warn2);
    }

    var guide = el('div', 'detail-guide');
    guide.appendChild(el('h4', null, 'Guide'));
    if (masked) {
      // A masked trophy's guide would give the story away too, so it stays
      // hidden with the name and description until the trophy is earned.
      guide.appendChild(el('p', null, 'Guide hidden while the spoiler setting is on. Earn this trophy — or turn the spoiler setting off — to read how to get it.'));
    } else {
      guide.appendChild(el('p', null, trophy.guide));
    }
    wrap.appendChild(guide);

    var sources = el('p', 'sources-line');
    sources.appendChild(el('strong', null, 'Sources: '));
    sources.appendChild(document.createTextNode(trophy.sources.join('; ')));
    wrap.appendChild(sources);

    var actions = el('div', 'detail-actions');
    var toggle = el('button', 'btn btn-primary', earned.has(trophy.id) ? 'Earned — mark as not earned' : 'Mark earned');
    toggle.type = 'button';
    toggle.addEventListener('click', function () { toggleEarned(trophy.id); });
    actions.appendChild(toggle);
    wrap.appendChild(actions);

    pane.replaceChildren(wrap);
  }

  function renderAll() {
    renderProgress();
    renderList();
    renderDetail();
  }

  // ---------- actions ----------

  function toggleEarned(id) {
    if (earned.has(id)) earned.delete(id);
    else earned.add(id);
    saveProgress();
    renderAll();
  }

  function selectTrophy(id) {
    selectedId = id;
    renderList();
    renderDetail();
  }

  function buildExport() {
    return {
      app: 'gta6-trophy-guide',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: Array.from(earned).sort(numSort)
    };
  }

  function downloadExport() {
    var blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Progress exported — ' + earned.size + ' of ' + trophies.length + ' earned.');
  }

  function parseImport(text) {
    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return { ok: false, error: 'That file is not valid JSON.' };
    }
    var list = Array.isArray(parsed) ? parsed : parsed && parsed.earned;
    if (!Array.isArray(list)) {
      return { ok: false, error: 'That file holds no progress: expected an "earned" list of trophy numbers.' };
    }
    var ids = [];
    for (var i = 0; i < list.length; i++) {
      var id = list[i];
      if (!Number.isInteger(id) || id < 1 || id > 55) {
        return { ok: false, error: 'That file holds an invalid trophy number: ' + JSON.stringify(id) + '. Numbers must run 1–55.' };
      }
      if (ids.indexOf(id) === -1) ids.push(id);
    }
    return { ok: true, earned: ids };
  }

  function applyImport(text) {
    var result = parseImport(text);
    if (!result.ok) {
      toast('Import failed: ' + result.error, true);
      return false;
    }
    earned = new Set(result.earned);
    saveProgress();
    renderAll();
    toast('Progress imported — ' + earned.size + ' of ' + trophies.length + ' earned.');
    return true;
  }

  // ---------- wiring ----------

  function wireControls() {
    els['search-input'].addEventListener('input', function () {
      filters.search = els['search-input'].value;
      renderList();
    });
    els['kind-filter'].addEventListener('change', function () {
      filters.kind = els['kind-filter'].value;
      renderList();
    });
    els['grade-filter'].addEventListener('change', function () {
      filters.grade = els['grade-filter'].value;
      renderList();
    });
    els['status-filter'].addEventListener('change', function () {
      filters.status = els['status-filter'].value;
      renderList();
    });
    els['missable-filter'].addEventListener('change', function () {
      filters.missableOnly = els['missable-filter'].checked;
      renderList();
    });
    els['spoiler-toggle'].checked = spoilerOn;
    els['spoiler-toggle'].addEventListener('change', function () {
      spoilerOn = els['spoiler-toggle'].checked;
      saveSpoiler();
      renderAll();
      toast(spoilerOn ? 'Spoilers hidden: story trophies stay masked until earned.' : 'Spoilers shown: story trophies are visible.');
    });
    els['export-btn'].addEventListener('click', downloadExport);
    els['import-btn'].addEventListener('click', function () { els['import-file'].click(); });
    els['import-file'].addEventListener('change', function () {
      var file = els['import-file'].files[0];
      els['import-file'].value = '';
      if (!file) return;
      file.text().then(applyImport).catch(function () {
        toast('Import failed: that file could not be read.', true);
      });
    });
    els['reset-btn'].addEventListener('click', function () {
      if (earned.size === 0) { toast('Nothing to reset — no trophies are marked earned.'); return; }
      if (window.confirm('Clear all ' + earned.size + ' earned trophies? This cannot be undone — export first if you want a copy.')) {
        earned = new Set();
        saveProgress();
        renderAll();
        toast('Progress cleared.');
      }
    });
    document.querySelectorAll('[data-select]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = Number(button.getAttribute('data-select'));
        filters = { search: '', kind: 'all', grade: 'all', status: 'all', missableOnly: false };
        els['search-input'].value = '';
        els['kind-filter'].value = 'all';
        els['grade-filter'].value = 'all';
        els['status-filter'].value = 'all';
        els['missable-filter'].checked = false;
        selectTrophy(id);
        document.getElementById('checklist').scrollIntoView();
        var row = els['trophy-list'].querySelector('[data-id="' + id + '"]');
        if (row) row.scrollIntoView({ block: 'center' });
      });
    });
  }

  // Small hooks for automated checks; the page itself needs none of them.
  window.TrophyGuide = {
    getState: function () {
      return { earned: Array.from(earned).sort(numSort), spoilerOn: spoilerOn, selectedId: selectedId, total: trophies.length };
    },
    exportData: buildExport,
    importData: applyImport,
    selectTrophy: selectTrophy
  };

  // ---------- boot ----------

  function boot() {
    wireControls();
    fetch('data/trophies.json')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (doc) {
        trophies = doc.trophies || doc;
        trophies.forEach(function (t) { byId[t.id] = t; });
        renderAll();
      })
      .catch(function () {
        els['load-error'].hidden = false;
        document.querySelector('.master-detail').hidden = true;
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

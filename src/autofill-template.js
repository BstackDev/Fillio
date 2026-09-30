/* =====================================================================
 * AutoFill Jurnal (DOM only) — v5-range
 *
 * Menambahkan TARGET_RANGE. Hanya tanggal dalam range yang diproses.
 * Jika range melintasi lebih dari satu minggu, jalankan script sekali
 * per minggu. Script akan memberi tahu kalau range belum selesai.
 * ===================================================================== */

(async function () {
  'use strict';

  /* ============================== CONFIG ============================== */
  const CONFIG = __CONFIG_PLACEHOLDER__;

  /* ============ MAPPING LABEL CONFIG → {group, itemName} DOM ============
   * 'zikir pagi' & 'zikir sore' (tanpa 'd') — sesuai DOM. */
  const SALAT_LABEL_TO_GROUP_ITEM = {
    'salat tahajud':                  { group: 'SALAT_MALAM',  itemName: 'salat tahajud' },
    'salat fardhu subuh':             { group: 'SALAT_SUBUH',  itemName: 'salat fardhu' },
    'salat fardhu berjamaah subuh':   { group: 'SALAT_SUBUH',  itemName: 'salat fardhu berjamaah' },
    'dzikir pagi':                    { group: 'ZIKIR_PAGI',   itemName: 'zikir pagi' },
    'salat fardhu dzuhur':            { group: 'SALAT_DZUHUR', itemName: 'salat fardhu' },
    'salat fardhu berjamaah dzuhur':  { group: 'SALAT_DZUHUR', itemName: 'salat fardhu berjamaah' },
    'salat fardhu ashar':             { group: 'SALAT_ASHAR',  itemName: 'salat fardhu' },
    'salat fardhu berjamaah ashar':   { group: 'SALAT_ASHAR',  itemName: 'salat fardhu berjamaah' },
    'dzikir sore':                    { group: 'ZIKIR_SORE',   itemName: 'zikir sore' },
    'salat fardhu magrib':            { group: 'SALAT_MAGRIB', itemName: 'salat fardhu' },
    'salat fardhu berjamaah magrib':  { group: 'SALAT_MAGRIB', itemName: 'salat fardhu berjamaah' },
    'salat fardhu isya':              { group: 'SALAT_ISYA',   itemName: 'salat fardhu' },
    'salat fardhu berjamaah isya':    { group: 'SALAT_ISYA',   itemName: 'salat fardhu berjamaah' }
  };

  const SALAT_GROUP_ORDER = [
    'SALAT_MALAM', 'SALAT_SUBUH', 'ZIKIR_PAGI',
    'SALAT_DZUHUR', 'SALAT_ASHAR', 'ZIKIR_SORE',
    'SALAT_MAGRIB', 'SALAT_ISYA'
  ];

  /* ============================== LOGGER ============================== */
  const tag = '[AutoFill]';
  const log   = (...a) => console.log(tag, ...a);
  const warn  = (...a) => console.warn(tag, ...a);
  const error = (...a) => console.error(tag, ...a);

  /* ============================== UTIL ================================ */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(pred, { timeout = 5000, interval = 60 } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try { const v = pred(); if (v) return v; } catch (_) {}
      await sleep(interval);
    }
    return null;
  }

  function isVisible(el) {
    if (!el) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
  }

  function normalize(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }

  function inRange(dateStr) {
    return dateStr >= CONFIG.TARGET_RANGE.from && dateStr <= CONFIG.TARGET_RANGE.to;
  }

  /* ============================ EDIT MODE ============================= */
  function isColumnEditable(date) {
    const cells = document.querySelectorAll(`td.column-daily-habit[data-date="${date}"]`);
    for (const c of cells) {
      if (c.classList.contains('hover-cell')) return true;
      const dd = c.querySelector(':scope > .dropdown');
      if (dd && !dd.classList.contains('d-none')) return true;
    }
    return false;
  }

  function getEditButton(date) {
    return document.querySelector(`.daily-habit-edit-button[data-date="${date}"]`);
  }

  function getHeaderSaveButton(date) {
    const eb = getEditButton(date);
    if (!eb) return null;
    const container = eb.closest('.d-flex');
    return container ? container.querySelector('.daily-habit-save-button') : null;
  }

  async function ensureEditMode(date) {
    if (isColumnEditable(date)) return true;
    const btn = getEditButton(date);
    if (!btn || !isVisible(btn)) { warn(`Edit button tidak tersedia untuk ${date}`); return false; }
    btn.click();
    const ok = await waitFor(() => isColumnEditable(date), { timeout: 3000 });
    if (!ok) { warn(`Gagal masuk edit mode untuk ${date}`); return false; }
    await sleep(CONFIG.DELAY_AFTER_EDIT);
    return true;
  }

  async function clickHeaderSave(date) {
    if (!isColumnEditable(date)) return false;
    const btn = getHeaderSaveButton(date);
    if (!btn || !isVisible(btn)) return false;
    btn.click();
    await sleep(400);
    return true;
  }

  /* ============================ CELL READERS ========================== */
  function readSalatCellState(cell) {
    const loader = cell.querySelector(':scope > .loading-habit');
    if (loader && isVisible(loader)) return { state: 'loading' };
    const dropdown = cell.querySelector(':scope > .dropdown');
    if (!dropdown) return { state: 'unknown', reason: 'dropdown tidak ditemukan' };
    const hasBlack1 = dropdown.classList.contains('black-1');
    const caption = cell.querySelector(':scope > .caption');
    const hasIcon = !!(caption && caption.querySelector('svg'));
    if (!hasBlack1) {
      if (hasIcon) return { state: 'unknown', reason: 'svg tanpa black-1' };
      return { state: 'empty', category: null };
    }
    const cat = normalize(dropdown.textContent);
    if (!cat || cat === 'Isi') return { state: 'unknown', reason: `teks="${cat}"` };
    return { state: 'filled', category: cat };
  }

  function readHabitCellState(cell) {
    const loader = cell.querySelector(':scope > .loading-habit');
    if (loader && isVisible(loader)) return { state: 'loading' };
    const caption = cell.querySelector(':scope > .caption');
    const hasIcon = !!(caption && caption.querySelector('svg'));
    if (!hasIcon) return { state: 'empty', category: null };
    return { state: 'filled-unknown', category: null };
  }

  /* ============================ FIND HELPERS ========================== */
  function findSalatCell(date, group, itemName) {
    const cells = document.querySelectorAll(
      `td.column-daily-habit[data-deedableid][data-group][data-date="${date}"]:not(.habbit)`
    );
    for (const cell of cells) {
      if (cell.dataset.group !== group) continue;
      const row = cell.closest('tr');
      if (!row) continue;
      const nameEl = row.querySelector('td:first-child .text-capitalize');
      if (!nameEl) continue;
      if (normalize(nameEl.textContent).toLowerCase() === itemName.toLowerCase()) return cell;
    }
    return null;
  }

  function findHabitCell(date, habitName) {
    const cells = document.querySelectorAll(
      `td.column-daily-habit.habbit[data-deadableid][data-aspect][data-date="${date}"]`
    );
    for (const cell of cells) {
      const row = cell.closest('tr');
      if (!row) continue;
      const firstCell = row.querySelector('td');
      if (!firstCell) continue;
      const flex = firstCell.querySelector('.d-flex.justify-content-between.align-items-center')
                || firstCell.querySelector('.d-flex');
      if (!flex) continue;
      if (normalize(flex.textContent) === habitName) return cell;
    }
    return null;
  }

  /* ============================== MODAL =============================== */
  function getVisibleModal() {
    const buttons = document.querySelectorAll('.create-salat-zikir');
    for (const b of buttons) {
      if (!isVisible(b)) continue;
      const modal = b.closest('.modal-content');
      if (modal) return modal;
    }
    return null;
  }

  async function closeModalIfAny() {
    const m = getVisibleModal();
    if (!m) return;
    const btn = m.querySelector('.close[data-dismiss="modal"]');
    if (btn) btn.click();
    await waitFor(() => !getVisibleModal(), { timeout: CONFIG.MODAL_CLOSE_TIMEOUT });
    await sleep(CONFIG.DELAY_AFTER_MODAL_CLOSE);
  }

  function modalHasDeedableIds(modal, ids) {
    if (!modal) return false;
    for (const id of ids) {
      if (modal.querySelector(`input[type="radio"][data-deedableid="${CSS.escape(id)}"]`)) return true;
    }
    return false;
  }

  async function ensureModalForGroup(group, openerCell, expectedIds) {
    let modal = getVisibleModal();
    if (modalHasDeedableIds(modal, expectedIds)) return modal;
    await closeModalIfAny();
    openerCell.click();
    modal = await waitFor(() => {
      const m = getVisibleModal();
      return modalHasDeedableIds(m, expectedIds) ? m : null;
    }, { timeout: CONFIG.MODAL_TIMEOUT });
    if (modal) await sleep(CONFIG.DELAY_AFTER_MODAL_OPEN);
    return modal;
  }

  function waitForSalatSaveComplete(saveBtn, { timeout = CONFIG.SAVE_COMPLETE_TIMEOUT } = {}) {
    return new Promise((resolve, reject) => {
      let sawDisabled = false, done = false;
      const start = Date.now();
      if (saveBtn.disabled || saveBtn.hasAttribute('disabled')) sawDisabled = true;
      const finish = () => { if (done) return; done = true; cleanup(); resolve('button-disabled-enabled'); };
      const failH = (msg) => { if (done) return; done = true; cleanup(); reject(new Error(msg)); };
      const check = () => {
        const d = saveBtn.disabled || saveBtn.hasAttribute('disabled');
        if (d) { sawDisabled = true; return; }
        if (sawDisabled && !d) finish();
      };
      const obs = new MutationObserver(() => check());
      obs.observe(saveBtn, { attributes: true, attributeFilter: ['disabled'] });
      const pollId = setInterval(() => { check(); if (Date.now() - start >= timeout) failH('timeout'); }, 50);
      const timeoutId = setTimeout(() => failH('timeout'), timeout);
      function cleanup() {
        try { obs.disconnect(); } catch (_) {}
        clearInterval(pollId); clearTimeout(timeoutId);
      }
    });
  }

  /* ======================= PLAN PER GROUP PER DATE ==================== */
  function planSalatGroupsForDate(date) {
    const byGroup = {};
    for (const [label, target] of Object.entries(CONFIG.SALAT_PLAN)) {
      const map = SALAT_LABEL_TO_GROUP_ITEM[label];
      if (!map) continue;
      const { group, itemName } = map;

      const cell = findSalatCell(date, group, itemName);
      if (!cell) { warn(`Cell tidak ditemukan: ${group} / ${itemName} @ ${date}`); continue; }
      const deedableId = cell.dataset.deedableid;
      if (!deedableId) { warn(`Cell tanpa data-deedableid: ${group} / ${itemName} @ ${date}`); continue; }

      const st = readSalatCellState(cell);
      if (st.state === 'loading') { warn(`Cell loading: ${group} / ${itemName} @ ${date}`); continue; }
      if (st.state === 'unknown') { warn(`State unknown (${st.reason}): ${group} / ${itemName} @ ${date}`); continue; }
      if (st.state === 'filled') {
        if (!CONFIG.OVERWRITE_EXISTING) continue;
        if (st.category === target) continue;
      }

      (byGroup[group] ||= []).push({ cell, deedableId, itemName, target, label });
    }
    return byGroup;
  }

  /* ============================ FILL GROUP ============================= */
  async function fillGroupForDate(date, group, items) {
    if (items.length === 0) return { status: 'noop', count: 0 };

    const expectedIds = items.map((it) => it.deedableId);
    const modal = await ensureModalForGroup(group, items[0].cell, expectedIds);

    if (!modal) {
      warn(`Modal ${group} @ ${date} tidak tersedia / tidak berisi radio yang diminta`);
      return { status: 'no-modal', count: 0 };
    }

    let clicked = 0;
    for (const item of items) {
      const radio = modal.querySelector(
        `input[type="radio"][data-deedableid="${CSS.escape(item.deedableId)}"][data-category="${CSS.escape(item.target)}"]`
      );
      if (!radio) {
        warn(`Radio tidak ditemukan: ${group} · ${item.itemName} → "${item.target}"`);
        continue;
      }
      const label = radio.id ? modal.querySelector(`label[for="${CSS.escape(radio.id)}"]`) : null;
      (label || radio).click();
      clicked++;
      await sleep(CONFIG.DELAY_AFTER_RADIO);
    }

    if (clicked === 0) {
      warn(`Tidak ada radio terpilih untuk ${group} @ ${date}`);
      return { status: 'no-radio', count: 0 };
    }

    const saveBtn = modal.querySelector('.create-salat-zikir');
    if (!saveBtn) {
      warn(`Tombol Save tidak ditemukan di modal ${group} @ ${date}`);
      return { status: 'no-save', count: clicked };
    }

    const waitP = waitForSalatSaveComplete(saveBtn);
    saveBtn.click();

    try { await waitP; }
    catch (e) { warn(`Save ${group} @ ${date} gagal: ${e.message}`); return { status: 'save-failed', count: clicked }; }

    await sleep(CONFIG.DELAY_AFTER_SAVE);
    return { status: 'ok', count: clicked };
  }

  /* ============================== HABIT ============================== */
  async function fillHabitCell(cell, target) {
    const dropdown = cell.querySelector(':scope > .dropdown');
    if (!dropdown) { warn('Dropdown habit tidak ditemukan'); return false; }
    if (dropdown.classList.contains('d-none')) {
      warn('Dropdown habit masih d-none (edit mode belum aktif?)');
      return false;
    }
    const trigger = dropdown.querySelector('[data-toggle="dropdown"]');
    if (!trigger) { warn('Trigger dropdown habit tidak ada'); return false; }

    trigger.click();

    const items = await waitFor(() => {
      const els = cell.querySelectorAll(':scope > .dropdown .dropdown-item-edit-habit');
      for (const el of els) if (isVisible(el)) return els;
      return null;
    }, { timeout: CONFIG.HABIT_MENU_TIMEOUT });
    if (!items) { warn('Menu habit tidak muncul'); return false; }

    let hit = null;
    for (const it of items) {
      if (normalize(it.textContent) === target) { hit = it; break; }
    }
    if (!hit) {
      const list = Array.from(items).map((i) => normalize(i.textContent)).join(' | ');
      warn(`Item habit "${target}" tidak ada. Tersedia: ${list}`);
      return false;
    }
    hit.click();
    await sleep(150);
    return true;
  }

  async function fillHabitsForDate(date) {
    let filled = 0, skipped = 0;
    for (const [habitName, target] of Object.entries(CONFIG.HABIT_PLAN)) {
      const cell = findHabitCell(date, habitName);
      if (!cell) { skipped++; continue; }
      const st = readHabitCellState(cell);
      if (st.state === 'loading') { skipped++; continue; }
      if (st.state === 'filled-unknown') { skipped++; continue; }
      if (st.state === 'empty') {
        const ok = await fillHabitCell(cell, target);
        if (ok) { filled++; log(`    habit "${habitName}" → "${target}"`); }
        else    { skipped++; }
        await sleep(CONFIG.DELAY_BETWEEN_HABITS);
      }
    }
    return { filled, skipped };
  }

  /* ============================== DATES =============================== */
  // Semua tanggal di DOM (tanpa filter), untuk info coverage.
  function allDomDates() {
    const set = new Set();
    document.querySelectorAll('td.column-daily-habit[data-date]').forEach((td) => {
      const d = td.dataset.date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) set.add(d);
    });
    return Array.from(set).sort();
  }

  // Tanggal di DOM yang masuk range.
  function listDates() {
    return allDomDates().filter(inRange);
  }

  async function advanceToNextWeek(previousDates) {
    const nextButton = document.querySelector('#next-week');
    if (!nextButton || !isVisible(nextButton)) {
      warn('Tombol Minggu Selanjutnya tidak ditemukan. Proses dihentikan.');
      return false;
    }
    if (nextButton.disabled || nextButton.getAttribute('aria-disabled') === 'true') {
      warn('Tombol Minggu Selanjutnya tidak aktif. Proses dihentikan.');
      return false;
    }

    const previousMaxDate = previousDates[previousDates.length - 1];
    const previousHref = location.href;
    const rangeLabel = document.querySelector('#range-week-habbit');
    const previousRangeLabel = rangeLabel ? normalize(rangeLabel.textContent) : '';
    nextButton.click();
    const navigationStarted = await waitFor(() => {
      const currentRangeLabel = document.querySelector('#range-week-habbit');
      const rangeChanged = currentRangeLabel && normalize(currentRangeLabel.textContent) !== previousRangeLabel;
      return location.href !== previousHref || rangeChanged || allDomDates().some((date) => date > previousMaxDate);
    }, { timeout: 10000, interval: 100 });

    if (!navigationStarted) {
      warn('Perpindahan minggu tidak terdeteksi setelah tombol diklik.');
      return false;
    }

    const nextDatesReady = await waitFor(
      () => allDomDates().some((date) => date > previousMaxDate),
      { timeout: 10000, interval: 100 }
    );
    if (!nextDatesReady) {
      warn('Tanggal minggu berikutnya belum muncul di DOM. Proses dihentikan untuk mencegah pengisian berulang.');
      return false;
    }

    await sleep(CONFIG.DELAY_AFTER_EDIT);
    log(`Minggu berikutnya siap: ${allDomDates()[0]} s/d ${allDomDates().at(-1)}`);
    return true;
  }

  /* ============================== MAIN =============================== */
  async function processDate(date) {
    log(`\n=== Tanggal ${date} ===`);

    const planByGroup = CONFIG.SKIP_SALAT ? {} : planSalatGroupsForDate(date);
    const groupsToFill = SALAT_GROUP_ORDER.filter((g) => (planByGroup[g] || []).length > 0);

    const totalItems = groupsToFill.reduce((a, g) => a + planByGroup[g].length, 0);
    log(`Rencana salat: ${totalItems} item dalam ${groupsToFill.length} group`);

    if (CONFIG.MODE === 'DRY_RUN') {
      for (const g of groupsToFill) {
        for (const it of planByGroup[g]) {
          log(`  [plan] ${g} · ${it.itemName} → "${it.target}"`);
        }
      }
      log('(DRY RUN — tidak ada DOM yang disentuh)');
      return;
    }

    if (totalItems === 0 && CONFIG.SKIP_HABIT) { log('Tidak ada yang perlu diisi.'); return; }

    const editOk = await ensureEditMode(date);
    if (!editOk) { warn(`Skip tanggal ${date}: edit mode gagal`); return; }

    for (const g of groupsToFill) {
      const items = planByGroup[g];
      log(`  group ${g}: ${items.length} item`);
      const res = await fillGroupForDate(date, g, items);
      log(`    → ${res.status} (${res.count} radio)`);
      await sleep(CONFIG.DELAY_BETWEEN_GROUPS);
    }

    await closeModalIfAny();

    if (!CONFIG.SKIP_HABIT) {
      log('  habit: memproses…');
      const h = await fillHabitsForDate(date);
      log(`    → ${h.filled} filled, ${h.skipped} skipped`);
    }

    await clickHeaderSave(date);
  }

  /* ============================== RUN ================================= */
  try {
    log('Mode:', CONFIG.MODE);
    log(`Range  : ${CONFIG.TARGET_RANGE.from} s/d ${CONFIG.TARGET_RANGE.to}`);

    let safetyCounter = 0;
    const processedDates = new Set();
    while (safetyCounter++ < 52) {
      const allDom = allDomDates();
      const target = listDates().filter((date) => !processedDates.has(date));
      log(`DOM    : ${allDom.length ? `${allDom[0]} s/d ${allDom[allDom.length - 1]}` : '(kosong)'}`);
      log(`Target : ${target.length ? target.join(', ') : '(tidak ada yang baru di DOM ini)'}`);

      for (const date of target) {
        await processDate(date);
        processedDates.add(date);
      }

      const currentDates = allDomDates();
      const minDom = currentDates[0];
      const maxDom = currentDates.at(-1);
      if (processedDates.size === 0 && minDom && minDom > CONFIG.TARGET_RANGE.from) {
        warn(`Range dimulai dari ${CONFIG.TARGET_RANGE.from}, tetapi DOM dimulai dari ${minDom}. ` +
             'Minggu sebelumnya perlu dibuka untuk memproses tanggal awal.');
        break;
      }
      if (maxDom && maxDom >= CONFIG.TARGET_RANGE.to) {
        log('Range selesai. Semua tanggal target sudah diproses.');
        break;
      }

      if (!maxDom) {
        warn('Tanggal tidak ditemukan di DOM. Proses dihentikan.');
        break;
      }

      log(`Range masih berlanjut setelah ${maxDom}; pindah ke minggu selanjutnya...`);
      if (!await advanceToNextWeek(currentDates)) break;
    }

    if (safetyCounter >= 52) warn('Batas 52 perpindahan minggu tercapai. Proses dihentikan.');
  } catch (e) {
    error('AutoFill gagal total:', e);
  }
})();

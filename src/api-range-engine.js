/* AutoFill Jurnal - API range engine */
(async function () {
  'use strict';

  const CONFIG = __CONFIG_PLACEHOLDER__;
  const HEADERS = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  const MIN_DURATION_PER_DAY_MS = Math.max(0, Number(CONFIG.MIN_DURATION_PER_DAY_MS ?? 15000));
  const log = (...args) => console.log('[AutoFill API]', ...args);
  const warn = (...args) => console.warn('[AutoFill API]', ...args);
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function csrfHeaders() {
    const meta = document.querySelector('meta[name="csrf-token"]')?.content;
    const globalToken = window.Laravel?.csrfToken
      || window.csrfToken
      || window.axios?.defaults?.headers?.common?.['X-CSRF-TOKEN']
      || '';
    const cookie = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
    const cookieToken = cookie ? decodeURIComponent(cookie) : '';
    const token = meta || globalToken || cookieToken;
    return token ? { 'X-CSRF-TOKEN': token, 'X-XSRF-TOKEN': token } : {};
  }

  const SALAT_MAP = {
    'salat tahajud': ['SALAT_MALAM', 'salat tahajud'],
    'salat fardhu subuh': ['SALAT_SUBUH', 'salat fardhu subuh'],
    'salat fardhu berjamaah subuh': ['SALAT_SUBUH', 'salat fardhu berjamaah subuh'],
    'dzikir pagi': ['ZIKIR_PAGI', 'dzikir pagi'],
    'salat fardhu dzuhur': ['SALAT_DZUHUR', 'salat fardhu dzuhur'],
    'salat fardhu berjamaah dzuhur': ['SALAT_DZUHUR', 'salat fardhu berjamaah dzuhur'],
    'salat fardhu ashar': ['SALAT_ASHAR', 'salat fardhu ashar'],
    'salat fardhu berjamaah ashar': ['SALAT_ASHAR', 'salat fardhu berjamaah ashar'],
    'dzikir sore': ['ZIKIR_SORE', 'dzikir sore'],
    'salat fardhu magrib': ['SALAT_MAGRIB', 'salat fardhu magrib'],
    'salat fardhu berjamaah magrib': ['SALAT_MAGRIB', 'salat fardhu berjamaah magrib'],
    'salat fardhu isya': ['SALAT_ISYA', 'salat fardhu isya'],
    'salat fardhu berjamaah isya': ['SALAT_ISYA', 'salat fardhu berjamaah isya']
  };

  const HABIT_ALIASES = {
    'Sholat Dhuha': 'Sholat Dhuha',
    'Mengaji atau tilawah Alquran': 'Mengaji atau tilawah Alquran',
    'Tidur sebelum pukul 22.00': 'Tidur sebelum pukul 22.00',
    'Bangun Sebelum Pukul 05.00': 'Bangun Sebelum Pukul 05.00',
    'Makan gizi seimbang (termasuk sayur dan buah)': 'Makan gizi seimbang (termasuk sayur dan buah)',
    'Minum Air Putih 1,5--2L Sehari': 'Minum Air Putih 1,5--2L Sehari',
    'Peregangan': 'Peregangan',
    'Grooming Diri': 'Grooming Diri',
    'Membawa Tumbler': 'Membawa Tumbler',
    'Membersihkan dan merapikan meja/area yang telah digunakan untuk belajar di sekolah dan di rumah': 'Membersihkan dan merapikan meja/area yang telah digunakan untuk belajar di sekolah dan di rumah',
    'Memilah sampah di sekolah dan di rumah': 'Memilah sampah di sekolah dan di rumah',
    'Aktif dalam Kelompok Belajar': 'Aktif dalam Kelompok Belajar',
    'Berbincang dengan Anggota Keluarga': 'Berbincang dengan Anggota Keluarga'
  };

  const normalize = value => String(value ?? '').toLowerCase().replace(/[\s\n\r\t]+/g, ' ').trim();
  const formatDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  function parseDate(value) {
    const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
  }

  function dateRange(from, to) {
    const dates = [];
    const cursor = new Date(from);
    while (cursor <= to) { dates.push(formatDate(cursor)); cursor.setDate(cursor.getDate() + 1); }
    return dates;
  }

  let progressPanel = null;

  function initProgress(totalDays) {
    document.getElementById('autofill-progress-panel')?.remove();
    progressPanel = document.createElement('aside');
    progressPanel.id = 'autofill-progress-panel';
    progressPanel.innerHTML = `
      <style>
        #autofill-progress-panel {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 2147483647;
          width: min(320px, calc(100vw - 32px));
          padding: 18px;
          border: 1px solid rgba(23, 42, 56, .14);
          border-radius: 12px;
          background: #fffdf9;
          color: #172a38;
          box-shadow: 0 14px 38px rgba(23, 42, 56, .2);
          font-family: Arial, sans-serif;
        }
        #autofill-progress-panel .autofill-progress-title {
          margin-bottom: 16px;
          font-size: 15px;
          font-weight: 700;
        }
        #autofill-progress-panel .autofill-progress-status {
          margin-bottom: 12px;
          color: #526573;
          font-size: 13px;
        }
        #autofill-progress-panel .autofill-progress-track {
          height: 9px;
          overflow: hidden;
          border-radius: 999px;
          background: #e6e5df;
        }
        #autofill-progress-panel .autofill-progress-bar {
          width: 0%;
          height: 100%;
          border-radius: inherit;
          background: #e86f51;
          transition: width .3s ease;
        }
        #autofill-progress-panel .autofill-progress-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 10px;
          color: #526573;
          font-size: 12px;
        }
        #autofill-progress-panel .autofill-progress-percent {
          color: #172a38;
          font-weight: 700;
        }
        #autofill-progress-panel.autofill-progress-complete .autofill-progress-bar {
          background: #5c9b70;
        }
        #autofill-progress-panel.autofill-progress-error .autofill-progress-bar {
          background: #c65345;
        }
        @media (max-width: 480px) {
          #autofill-progress-panel {
            top: 12px;
            right: 12px;
            width: calc(100vw - 24px);
          }
        }
      </style>
      <div class="autofill-progress-title">AutoFill Engine</div>
      <div class="autofill-progress-status">Memproses jurnal...</div>
      <div class="autofill-progress-track"><div class="autofill-progress-bar"></div></div>
      <div class="autofill-progress-meta">
        <span class="autofill-progress-days">0 / ${totalDays} hari</span>
        <span class="autofill-progress-percent">0%</span>
      </div>`;
    progressPanel.dataset.totalDays = String(totalDays);
    progressPanel.dataset.completedDays = '0';
    document.body.appendChild(progressPanel);
  }

  function updateProgress(completedDays, totalDays) {
    if (!progressPanel) return;
    progressPanel.dataset.completedDays = String(completedDays);
    progressPanel.dataset.totalDays = String(totalDays);
    const percent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 100;
    progressPanel.querySelector('.autofill-progress-bar').style.width = `${percent}%`;
    progressPanel.querySelector('.autofill-progress-days').textContent = `${completedDays} / ${totalDays} hari`;
    progressPanel.querySelector('.autofill-progress-percent').textContent = `${percent}%`;
  }

  function finishProgress() {
    if (!progressPanel) return;
    const totalDays = Number(progressPanel.dataset.totalDays || 0);
    updateProgress(totalDays, totalDays);
    progressPanel.querySelector('.autofill-progress-status').textContent = '✓ Selesai';
    progressPanel.classList.add('autofill-progress-complete');
  }

  function failProgress() {
    if (!progressPanel) return;
    progressPanel.querySelector('.autofill-progress-status').textContent = '✕ AutoFill gagal. Proses dihentikan.';
    progressPanel.classList.add('autofill-progress-error');
  }

  function startOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
    return result;
  }

  function resourceUrls() {
    return typeof performance?.getEntriesByType === 'function'
      ? performance.getEntriesByType('resource').map(entry => entry.name).filter(Boolean).reverse() : [];
  }

  function findCalendarId() {
    for (const value of [location.href, ...resourceUrls()]) {
      try { const id = new URL(value, location.href).searchParams.get('calendarId'); if (id) return id; } catch (_) {}
    }
    for (const element of document.querySelectorAll('[data-calendar-id], [data-calendar_id]')) {
      const id = element.getAttribute('data-calendar-id') || element.getAttribute('data-calendar_id');
      if (id) return id;
    }
    try { return sessionStorage.getItem('calendarId') || localStorage.getItem('calendarId'); } catch (_) { return null; }
  }

  async function getJson(url, label) {
    const response = await fetch(url, { headers: { ...HEADERS, ...csrfHeaders() }, credentials: 'same-origin' });
    const body = await response.text();
    if (!response.ok) throw new Error(`${label} gagal HTTP ${response.status}: ${body.slice(0, 180)}`);
    try { return JSON.parse(body); } catch (_) { throw new Error(`${label} mengembalikan JSON tidak valid.`); }
  }

  function addDeed(deeds, date, deedableId, deedId) {
    const key = String(date ?? '').split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    deeds[key] ??= {};
    deeds[key][deedableId] = deedId;
  }

  async function loadCatalog(from, to, calendarId) {
    const sz = await getJson(`/student/journal_salat_zikir/salat-zikir?weekStartDate=${from}&weekEndDate=${to}&calendarId=${encodeURIComponent(calendarId)}`, 'Salat/Zikir');
    const daily = await getJson(`/student/journal-daily/habituation?start_date=${from}&end_date=${to}&calendarId=${encodeURIComponent(calendarId)}`, 'Daily Habit');
    const catalog = { sz: {}, daily: {}, deeds: {} };
    for (const group of Object.values(sz || {})) for (const activity of group?.data || []) {
      catalog.sz[activity.id] = activity;
      for (const [date, deeds] of Object.entries(activity.deed || activity.deeds || {})) for (const deed of deeds || []) addDeed(catalog.deeds, deed.date || date, activity.id, deed.id);
    }
    for (const group of Object.values(daily?.data || {})) for (const activity of group || []) {
      catalog.daily[activity.id] = activity;
      for (const [date, deeds] of Object.entries(activity.deeds || {})) for (const deed of deeds || []) addDeed(catalog.deeds, deed.date || date, activity.id, deed.id);
    }
    return catalog;
  }

  function findActivity(items, field, value, group) {
    const wanted = normalize(value);
    return items.find(item => (!group || normalize(item.group) === normalize(group)) && (normalize(item[field]) === wanted || normalize(item[field]).includes(wanted) || wanted.includes(normalize(item[field]))));
  }

  function category(activity, choice) {
    const wanted = normalize(choice);
    const details = activity?.details || activity?.point_categories || [];
    const detail = details.find(item => normalize(item.category) === wanted);
    if (!detail) throw new Error(`Kategori "${choice}" tidak tersedia untuk "${activity.item || activity.habit}".`);
    return { category: detail.category, point: Number(detail.point), do: normalize(detail.category) !== 'tidak melaksanakan' };
  }

  function resolveSalat(catalog, label, choice) {
    const [group, item] = SALAT_MAP[label] || [];
    const activity = findActivity(Object.values(catalog.sz), 'item', item, group);
    if (!activity) throw new Error(`Aktivitas salat/zikir tidak ditemukan: ${label}`);
    return { deedable_id: activity.id, ...category(activity, choice), label };
  }

  function resolveHabit(catalog, label, choice) {
    const activity = findActivity(Object.values(catalog.daily), 'habit', HABIT_ALIASES[label] || label);
    if (!activity) throw new Error(`Aktivitas harian tidak ditemukan: ${label}`);
    return { deedable_id: activity.id, ...category(activity, choice), label };
  }

  function buildPlan(config, dates, catalog) {
    return dates.map(date => {
      const items = [];
      for (const [label, choice] of Object.entries(config.SALAT_PLAN || {})) items.push(resolveSalat(catalog, label, choice));
      for (const [label, choice] of Object.entries(config.HABIT_PLAN || {})) items.push({ ...resolveHabit(catalog, label, choice), daily: true });
      for (const item of items) item.deed_id = catalog.deeds[date]?.[item.deedable_id];
      return { date, items: config.OVERWRITE_EXISTING === false ? items.filter(item => !item.deed_id) : items };
    });
  }

  function makeForm(date, items, daily) {
    const form = new URLSearchParams();
    form.append('payloadHabit[date]', date);
    if (daily) form.append('payloadHabit[type]', 'HABIT');
    items.forEach((item, index) => {
      form.append(`payloadHabit[categories][${index}][category]`, item.category);
      form.append(`payloadHabit[categories][${index}][point]`, String(item.point));
      form.append(`payloadHabit[categories][${index}][do]`, String(item.do));
      form.append(`payloadHabit[categories][${index}][deedable_id]`, item.deedable_id);
      if (item.deed_id) form.append(`payloadHabit[categories][${index}][deed_id]`, item.deed_id);
    });
    return form;
  }

  async function send(date, items, daily, mode, updating) {
    if (!items.length) return;
    const endpoint = daily ? '/student/journal-daily/bulk-deed-habbit' : updating ? '/student/journal_salat_zikir/bulk-update' : '/student/journal_salat_zikir/bulk-create';
    const method = updating ? 'PATCH' : 'POST';
    const form = makeForm(date, items, daily);
    log(`${method} ${daily ? 'daily' : 'salat'} ${date}`, items.map(item => `${item.label}:${item.category}${item.deed_id ? ` [${item.deed_id}]` : ' [baru]'}`).join(' | '));
    if (mode === 'DRY_RUN') { log(`[DRY RUN] ${method} ${endpoint}`, date, items.map(item => item.label).join(', ')); return; }
    const response = await fetch(endpoint, { method, headers: { ...HEADERS, ...csrfHeaders(), 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, credentials: 'same-origin', body: form });
    if (!response.ok) {
      const body = (await response.text()).slice(0, 300);
      throw new Error(`${method} ${endpoint} gagal HTTP ${response.status}: ${body}`);
    }
  }

  async function run() {
    const from = parseDate(CONFIG.TARGET_RANGE?.from);
    const to = parseDate(CONFIG.TARGET_RANGE?.to);
    if (!from || !to || from > to) throw new Error('TARGET_RANGE tidak valid.');
    const calendarId = findCalendarId();
    if (!calendarId) throw new Error('calendarId tidak ditemukan di URL, DOM, storage, atau resource network.');
    const rangeDates = dateRange(from, to);
    initProgress(rangeDates.length);
    updateProgress(0, rangeDates.length);
    log(`Mulai API range ${formatDate(from)} s/d ${formatDate(to)}`);
    log('Halaman tidak akan dinavigasikan; proses berjalan lewat API.');
    if (CONFIG.MODE === 'RUN') {
      const estimatedMinutes = Math.ceil(rangeDates.length * MIN_DURATION_PER_DAY_MS / 60000);
      log(`Pacing aktif: minimal ${Math.ceil(MIN_DURATION_PER_DAY_MS / 1000)} detik per hari; estimasi ${estimatedMinutes} menit untuk ${rangeDates.length} hari.`);
    }

    let cursor = new Date(from);
    let totalDays = 0;
    while (cursor <= to) {
      const weekFromDate = startOfWeek(cursor);
      const weekEndDate = new Date(weekFromDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      const targetEnd = weekEndDate < to ? weekEndDate : to;
      const weekFrom = formatDate(weekFromDate);
      const weekTo = formatDate(weekEndDate);
      log(`Memuat katalog ${weekFrom} s/d ${weekTo}`);
      const catalog = await loadCatalog(weekFrom, weekTo, calendarId);
      const plan = buildPlan(CONFIG, dateRange(cursor, targetEnd), catalog);
      for (const day of plan) {
        const dayStartedAt = performance.now();
        const daily = day.items.filter(item => item.daily);
        const salat = day.items.filter(item => !item.daily);
        const dailyCreates = daily.filter(item => !item.deed_id);
        const dailyUpdates = daily.filter(item => item.deed_id);
        const salatCreates = salat.filter(item => !item.deed_id);
        const salatUpdates = salat.filter(item => item.deed_id);
        const actions = [
          { items: dailyCreates, daily: true, updating: false },
          { items: dailyUpdates, daily: true, updating: true },
          { items: salatCreates, daily: false, updating: false },
          { items: salatUpdates, daily: false, updating: true }
        ].filter(action => action.items.length);
        for (const [actionIndex, action] of actions.entries()) {
          await send(day.date, action.items, action.daily, CONFIG.MODE, action.updating);
          if (CONFIG.MODE === 'RUN') {
            const slotEnd = dayStartedAt + MIN_DURATION_PER_DAY_MS * ((actionIndex + 1) / actions.length);
            const remaining = slotEnd - performance.now();
            if (remaining > 0) {
              const seconds = Math.ceil(remaining / 1000);
              log(`${day.date}: slot ${actionIndex + 1}/${actions.length}, jeda ${seconds} detik.`);
              if (progressPanel) progressPanel.querySelector('.autofill-progress-status').textContent = `${day.date}: slot ${actionIndex + 1}/${actions.length} (${seconds}s)`;
              await sleep(remaining);
            }
          }
        }
        totalDays++;
        updateProgress(totalDays, rangeDates.length);
        log(`${day.date} selesai (${totalDays} hari)`);
      }
      cursor = new Date(targetEnd);
      cursor.setDate(cursor.getDate() + 1);
      await sleep(250);
    }
    log(`Selesai. ${totalDays} hari diproses tanpa pindah halaman.`);
    finishProgress();
    await sleep(1500);
    location.reload();
  }

  try { await run(); } catch (error) { console.error('[AutoFill API] Gagal:', error); failProgress(); }
})();

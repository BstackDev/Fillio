(function () {
    'use strict';

    const CONFIG = __CONFIG_PLACEHOLDER__;
    const TEST_MODE = true;
    const HEADERS = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };

    const Logger = {
        log(message, data) { console.log(`%c[AutoFill] ${message}`, 'color:#4f46e5;font-weight:700', data ?? ''); },
        ok(message, data) { console.log(`%c[AutoFill] OK ${message}`, 'color:#059669;font-weight:700', data ?? ''); },
        warn(message, data) { console.warn(`[AutoFill] WARN ${message}`, data ?? ''); },
        fail(message, error) { console.error(`[AutoFill] ERROR ${message}`, error ?? ''); }
    };

    const DAILY_NAMES = {
        makan_gizi: 'Makan gizi seimbang (termasuk sayur dan buah)', minum_air: 'Minum Air Putih 1,5--2L Sehari',
        peregangan: 'Peregangan', grooming: 'Grooming Diri', tumbler: 'Membawa Tumbler',
        meja_belajar: 'Membersihkan dan merapikan meja/area yang telah digunakan untuk belajar di sekolah dan di rumah',
        pilah_sampah: 'Memilah sampah di sekolah dan di rumah', kel_belajar: 'Aktif dalam Kelompok Belajar',
        bincang_kel: 'Berbincang dengan Anggota Keluarga', mengaji: 'Mengaji atau tilawah Alquran',
        tidur: 'Tidur sebelum pukul 22.00', bangun: 'Bangun Sebelum Pukul 05.00', dhuha: 'Sholat Dhuha'
    };

    const SZ_NAMES = {
        subuh_fardhu: ['SALAT_SUBUH', 'salat fardhu subuh'], subuh_berjamaah: ['SALAT_SUBUH', 'salat fardhu berjamaah subuh'],
        dzuhur_fardhu: ['SALAT_DZUHUR', 'salat fardhu dzuhur'], dzuhur_berjamaah: ['SALAT_DZUHUR', 'salat fardhu berjamaah dzuhur'],
        ashar_fardhu: ['SALAT_ASHAR', 'salat fardhu ashar'], ashar_berjamaah: ['SALAT_ASHAR', 'salat fardhu berjamaah ashar'],
        maghrib_fardhu: ['SALAT_MAGRIB', 'salat fardhu magrib'], maghrib_berjamaah: ['SALAT_MAGRIB', 'salat fardhu berjamaah magrib'],
        isya_fardhu: ['SALAT_ISYA', 'salat fardhu isya'], isya_berjamaah: ['SALAT_ISYA', 'salat fardhu berjamaah isya'],
        tahajud: ['SALAT_MALAM', 'salat tahajud'], zikir_pagi: ['ZIKIR_PAGI', 'dzikir pagi'], zikir_sore: ['ZIKIR_SORE', 'dzikir sore']
    };

    const normalize = value => String(value ?? '').toLowerCase().replace(/[\s\n\r\t]+/g, ' ').trim();
    const formatDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    function parseDate(value) {
        const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
    }

    function resourceUrls() {
        const entries = typeof performance?.getEntriesByType === 'function' ? performance.getEntriesByType('resource') : [];
        return entries.map(entry => entry.name).filter(Boolean).reverse();
    }

    function queryPeriod(value) {
        try {
            const url = new URL(value, location.href);
            const start = url.searchParams.get('weekStartDate') || url.searchParams.get('start_date');
            const end = url.searchParams.get('weekEndDate') || url.searchParams.get('end_date');
            return start && end ? { start, end, source: url.pathname } : null;
        } catch (error) { return null; }
    }

    function resolvePeriod() {
        for (const value of [location.href, ...resourceUrls()]) {
            const period = queryPeriod(value);
            const start = parseDate(period?.start);
            const end = parseDate(period?.end);
            if (!start || !end || start > end) continue;
            const dates = [];
            for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) dates.push(formatDate(cursor));
            Logger.ok(`Periode ${dates[0]} sampai ${dates[dates.length - 1]} (${dates.length} hari)`, period.source);
            return { dates, start: dates[0], end: dates[dates.length - 1] };
        }
        const domDates = [...document.querySelectorAll('[data-date]')].map(element => element.getAttribute('data-date')).filter(value => parseDate(value));
        if (domDates.length) {
            const dates = [...new Set(domDates)].sort();
            Logger.ok(`Periode DOM ${dates[0]} sampai ${dates[dates.length - 1]}`);
            return { dates, start: dates[0], end: dates[dates.length - 1] };
        }
        throw new Error('Periode aktif tidak ditemukan. Buka halaman jurnal Kejar dan muat ulang.');
    }

    function resolveCalendarId() {
        const direct = new URL(location.href).searchParams.get('calendarId');
        if (direct) return direct;
        for (const element of document.querySelectorAll('[data-calendar-id], [data-calendar_id]')) {
            const value = element.getAttribute('data-calendar-id') || element.getAttribute('data-calendar_id');
            if (value) return value;
        }
        try {
            const stored = sessionStorage.getItem('calendarId') || localStorage.getItem('calendarId');
            if (stored) return stored;
        } catch (error) {}
        for (const value of [location.href, ...resourceUrls()]) {
            try {
                const id = new URL(value, location.href).searchParams.get('calendarId');
                if (id) return id;
            } catch (error) {}
        }
        throw new Error('calendarId tidak ditemukan di URL, DOM, storage, atau resource network.');
    }

    async function getJson(url, label) {
        Logger.log(`GET ${label}`, url);
        const response = await fetch(url, { headers: HEADERS, credentials: 'same-origin' });
        const body = await response.text();
        if (!response.ok) throw new Error(`${label} gagal HTTP ${response.status}: ${body.slice(0, 160)}`);
        try { return JSON.parse(body); } catch (error) { throw new Error(`${label} mengembalikan JSON tidak valid.`); }
    }

    function addDeed(deeds, date, deedableId, deedId) {
        const value = String(date ?? '').split('T')[0];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
        deeds[value] ??= {};
        deeds[value][deedableId] = deedId;
    }

    async function loadCatalog(period, calendarId) {
        const sz = await getJson(`/student/journal_salat_zikir/salat-zikir?weekStartDate=${period.start}&weekEndDate=${period.end}&calendarId=${calendarId}`, 'Salat/Zikir');
        const daily = await getJson(`/student/journal-daily/habituation?start_date=${period.start}&end_date=${period.end}&calendarId=${calendarId}`, 'Daily Habit');
        const catalog = { sz: {}, daily: {}, deeds: {} };
        for (const groupData of Object.values(sz || {})) for (const activity of groupData?.data || []) {
            catalog.sz[activity.id] = activity;
            for (const [date, deeds] of Object.entries(activity.deed || {})) for (const deed of deeds || []) addDeed(catalog.deeds, deed.date || date, activity.id, deed.id);
        }
        for (const group of Object.values(daily?.data || {})) for (const activity of group || []) {
            catalog.daily[activity.id] = activity;
            for (const [date, deeds] of Object.entries(activity.deeds || {})) for (const deed of deeds || []) addDeed(catalog.deeds, deed.date || date, activity.id, deed.id);
        }
        Logger.ok(`Katalog siap: ${Object.keys(catalog.sz).length} salat/zikir, ${Object.keys(catalog.daily).length} daily`);
        return catalog;
    }

    function findActivity(items, field, value, group) {
        const wanted = normalize(value);
        return items.find(item => (!group || normalize(item.group) === normalize(group)) && (normalize(item[field]) === wanted || normalize(item[field]).includes(wanted) || wanted.includes(normalize(item[field]))));
    }

    function choose(details, choice) {
        const wanted = normalize(choice);
        if (['tidak', 'tidak melaksanakan', 'belum'].includes(wanted)) {
            const zero = details.find(detail => Number(detail.point) === 0);
            if (zero) return zero;
        }
        const match = details.find(detail => normalize(detail.category) === wanted || normalize(detail.category).includes(wanted) || wanted.includes(normalize(detail.category)));
        if (!match) throw new Error(`Kategori "${choice}" tidak tersedia.`);
        return match;
    }

    function resolveCategory(activity, choice) {
        const detail = choose(activity?.details || activity?.point_categories || [], choice);
        return { category: detail.category, point: Number(detail.point), do: Number(detail.point) > 0 };
    }

    function resolveSz(catalog, key, choice) {
        const [group, item] = SZ_NAMES[key];
        const activity = findActivity(Object.values(catalog.sz), 'item', item, group);
        if (!activity) throw new Error(`Aktivitas tidak ditemukan: ${key}`);
        return { deedable_id: activity.id, ...resolveCategory(activity, choice) };
    }

    function resolveDaily(catalog, key, choice) {
        const wanted = DAILY_NAMES[key];
        const activity = findActivity(Object.values(catalog.daily), 'habit', wanted);
        if (!activity) throw new Error(`Aktivitas daily tidak ditemukan: ${key}`);
        return { deedable_id: activity.id, ...resolveCategory(activity, choice) };
    }

    function buildPlan(config, period, catalog) {
        return period.dates.map(date => {
            const categories = [];
            for (const [prayer, choices] of Object.entries(config.SALAT_WAJIB || {})) {
                if (choices?.melaksanakan != null) categories.push({ ...resolveSz(catalog, `${prayer}_fardhu`, choices.melaksanakan === 'Ya' ? 'Melaksanakan' : 'Tidak'), label: `${prayer} fardhu` });
                if (choices?.berjamaah != null) categories.push({ ...resolveSz(catalog, `${prayer}_berjamaah`, choices.berjamaah), label: `${prayer} berjamaah` });
            }
            if (config.SALAT_SUNNAH?.tahajud != null) categories.push({ ...resolveSz(catalog, 'tahajud', config.SALAT_SUNNAH.tahajud), label: 'tahajud' });
            if (config.SALAT_SUNNAH?.dhuha != null) categories.push({ ...resolveDaily(catalog, 'dhuha', config.SALAT_SUNNAH.dhuha), label: 'dhuha', daily: true });
            for (const [key, choice] of Object.entries(config.ZIKIR || {})) if (choice != null) categories.push({ ...resolveSz(catalog, key, choice === 'Mendengar' ? 'Mendengarkan' : choice), label: key });
            for (const [key, choice] of Object.entries(config.DAILY || {})) if (choice != null) categories.push({ ...resolveDaily(catalog, key, choice), label: key, daily: true });
            for (const item of categories) item.deed_id = catalog.deeds[date]?.[item.deedable_id];
            return { date, categories };
        });
    }

    function buildPayload(date, categories, daily) {
        const form = new URLSearchParams();
        form.append('payloadHabit[date]', date);
        if (daily) form.append('payloadHabit[type]', 'HABIT');
        categories.forEach((item, index) => {
            form.append(`payloadHabit[categories][${index}][category]`, item.category);
            form.append(`payloadHabit[categories][${index}][point]`, String(item.point));
            form.append(`payloadHabit[categories][${index}][do]`, String(item.do));
            form.append(`payloadHabit[categories][${index}][deedable_id]`, item.deedable_id);
            if (item.deed_id) form.append(`payloadHabit[categories][${index}][deed_id]`, item.deed_id);
        });
        return form;
    }

    async function execute(date, categories, daily) {
        const updating = categories.some(item => item.deed_id);
        const endpoint = daily ? '/student/journal-daily/bulk-deed-habbit' : updating ? '/student/journal_salat_zikir/bulk-update' : '/student/journal_salat_zikir/bulk-create';
        const method = updating ? 'PATCH' : 'POST';
        const form = buildPayload(date, categories, daily);
        if (TEST_MODE) {
            Logger.log(`TEST ${method} ${endpoint}`, categories.map(item => item.label).join(', '));
            Logger.log(form.toString());
            return;
        }
        const response = await fetch(endpoint, { method, headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, credentials: 'same-origin', body: form });
        if (!response.ok) throw new Error(`${method} ${endpoint} gagal HTTP ${response.status}`);
    }

    async function run() {
        Logger.log('Memulai engine runtime | TEST_MODE=true');
        try {
            const period = resolvePeriod();
            const calendarId = resolveCalendarId();
            Logger.ok(`calendarId ditemukan: ${calendarId}`);
            const catalog = await loadCatalog(period, calendarId);
            const plan = buildPlan(CONFIG, period, catalog);
            Logger.ok(`Rencana siap: ${plan.length} hari`);
            for (const day of plan) {
                const daily = day.categories.filter(item => item.daily);
                const sz = day.categories.filter(item => !item.daily);
                for (const group of [daily, sz]) {
                    const creates = group.filter(item => !item.deed_id);
                    const updates = group.filter(item => item.deed_id);
                    if (creates.length) await execute(day.date, creates, group === daily);
                    if (updates.length) await execute(day.date, updates, group === daily);
                }
            }
            Logger.ok(`Selesai: ${plan.length} hari dianalisis; tidak ada perubahan dikirim.`);
        } catch (error) {
            Logger.fail(error.message, error);
        }
    }

    run();
})();
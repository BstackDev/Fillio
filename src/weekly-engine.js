/* =====================================================================
 * AutoFill Jurnal Mingguan — API only (multi-MEB)
 * Dijalankan di Console halaman /student/journal-weekly
 *
 * Fix penting:
 *   - payloadDeed[category] dikirim lowercase (sesuai payload manual server)
 *   - findExistingDeed: cari deed PER-MINGGU (range.from..range.to)
 *   - findDetail: case-insensitive + trim
 *   - Kategori "Tidak melaksanakan" / "Tidak ada kegiatan" → tanpa witness
 *   - GENDER: 'A' cowok / 'B' cewek — habit beda gender di-skip tanpa warning
 * ===================================================================== */

(async function () {
    'use strict';

    const CONFIG = __CONFIG_PLACEHOLDER__;
    const CFG = Object.assign({
        MODE: 'RUN',
        GENDER: 'A',
        MEB_RANGES: null,
        TARGET_RANGE: null,
        WEEK_OFFSET: 0,
        CALENDAR_ID: null,
        OVERWRITE_EXISTING: false,
        RELOAD_AFTER_RUN: true,
        WEEKLY_PLAN: {},
        MIN_DURATION_PER_RANGE_MS: 120000,
        DELAY_MS: 400,
        SHOW_UI: true
    }, CONFIG || {});

    const log  = (...a) => console.log('[Weekly]', ...a);
    const warn = (...a) => console.warn('[Weekly]', ...a);

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const DAY_MAP = { Sn: 0, Sl: 1, Rb: 2, Km: 3, Jm: 4, Sb: 5, Mg: 6 };
    const NO_DETAIL_CATEGORIES = new Set(['tidak melaksanakan', 'tidak ada kegiatan']);

    // Mapping gender per habit
    const HABIT_GENDER = {
        'e4c7dfac-2fc8-4e25-af5a-6834df7b69f5': 'A',   // Sholat Jumat
        'cfdd32de-e59c-4d43-a2ec-db6f290a16f0': 'B',   // Keputrian
        '73985f09-c695-4c36-aa8e-cdd44212c4db': 'B'    // Tablet Tambah Darah
    };

    const GENDER = String(CFG.GENDER || 'A').toUpperCase();

    function genderMatches(habitId) {
        const hg = HABIT_GENDER[habitId];
        if (!hg) return true;
        return hg === GENDER;
    }

    const fmt = d =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const norm = s => String(s || '').trim().toLowerCase();

    // ---------- Range / calendar ----------
    function mondayOf(date) {
        const r = new Date(date);
        const day = r.getDay();
        r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
        r.setHours(0, 0, 0, 0);
        return r;
    }

    function weekRangeFromOffset(offset) {
        const start = mondayOf(new Date());
        start.setDate(start.getDate() + Number(offset || 0) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { from: fmt(start), to: fmt(end) };
    }

    function resolveRanges() {
        if (Array.isArray(CFG.MEB_RANGES) && CFG.MEB_RANGES.length) {
            return CFG.MEB_RANGES.map(r => ({ meb: r.meb, from: r.from, to: r.to }));
        }
        if (CFG.TARGET_RANGE && CFG.TARGET_RANGE.from && CFG.TARGET_RANGE.to) {
            return [{ meb: null, from: CFG.TARGET_RANGE.from, to: CFG.TARGET_RANGE.to }];
        }
        try {
            const url = new URL(location.href);
            const ws = url.searchParams.get('weekStartDate');
            const we = url.searchParams.get('weekEndDate');
            if (ws && we) return [{ meb: null, from: ws, to: we }];
        } catch (_) { /* noop */ }
        return [{ meb: null, ...weekRangeFromOffset(CFG.WEEK_OFFSET) }];
    }

    function detectCalendarId() {
        if (CFG.CALENDAR_ID) return CFG.CALENDAR_ID;
        const resources = (performance && performance.getEntriesByType)
            ? performance.getEntriesByType('resource').map(e => e.name).reverse()
            : [];
        for (const value of [location.href, ...resources]) {
            try {
                const id = new URL(value, location.href).searchParams.get('calendarId');
                if (id) return id;
            } catch (_) { /* noop */ }
        }
        const el = document.querySelector('[data-calendar-id]');
        return el ? el.getAttribute('data-calendar-id') : null;
    }

    // ---------- HTTP ----------
    function csrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]')?.content;
        if (meta) return meta;
        const cookie = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
        if (cookie) return decodeURIComponent(cookie);
        return window.Laravel?.csrfToken || window.csrfToken || '';
    }

    function headers(extra) {
        const base = {
            'Accept': 'application/json, text/plain, */*',
            'X-Requested-With': 'XMLHttpRequest'
        };
        const token = csrfToken();
        if (token) {
            base['X-CSRF-TOKEN'] = token;
            base['X-XSRF-TOKEN'] = token;
        }
        return Object.assign(base, extra || {});
    }

    async function getJSON(url) {
        const res = await fetch(url, { credentials: 'include', headers: headers() });
        const text = await res.text();
        if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}: ${text.slice(0, 200)}`);
        try { return JSON.parse(text); }
        catch (_) { throw new Error(`Response bukan JSON: ${text.slice(0, 200)}`); }
    }

    async function sendDeed(payload) {
        const body = new URLSearchParams();
        for (const [k, v] of Object.entries(payload)) body.append(k, String(v ?? ''));

        const res = await fetch('/student/journal-weekly/deed-habbit', {
            method: 'POST',
            credentials: 'include',
            headers: headers({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }),
            body: body.toString()
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`POST deed → HTTP ${res.status}: ${text.slice(0, 200)}`);
        return text;
    }

    // ---------- Data helpers ----------
    function flattenHabits(response) {
        const list = [];
        for (const arr of Object.values(response?.data || {})) {
            if (Array.isArray(arr)) list.push(...arr);
        }
        return list;
    }

    function findDetail(habit, categoryName) {
        const want = norm(categoryName);
        return (habit.details || []).find(d => norm(d.category) === want);
    }

    function findExistingDeed(habit, range) {
        for (const list of Object.values(habit.deeds || {})) {
            for (const deed of list || []) {
                const d = String(deed.date || '').slice(0, 10);
                if (d >= range.from && d <= range.to) return deed;
            }
        }
        return null;
    }

    function dateForDay(day, range) {
        if (!(day in DAY_MAP)) return null;
        const start = new Date(range.from + 'T00:00:00');
        start.setDate(start.getDate() + DAY_MAP[day]);
        return fmt(start);
    }

    // ---------- Progress UI ----------
    let panel = null;

    function initProgress(totalWeeks, totalHabits) {
        document.getElementById('weekly-progress')?.remove();
        panel = document.createElement('aside');
        panel.id = 'weekly-progress';
        panel.style.cssText = `
            position:fixed;top:18px;right:18px;z-index:2147483647;
            width:min(340px,calc(100vw - 36px));padding:16px;border-radius:10px;
            background:#172a38;color:#fff;font:13px Arial,sans-serif;
            box-shadow:0 14px 38px rgba(0,0,0,.25)`;
        panel.innerHTML = `
            <strong>Weekly API</strong>
            <div class="wp-week" style="margin-top:8px;font-size:12px;opacity:.7">Menyiapkan...</div>
            <div class="wp-status" style="margin-top:6px;opacity:.9">-</div>
            <div style="height:7px;margin-top:12px;border-radius:9px;background:#405260;overflow:hidden">
                <div class="wp-bar" style="width:0;height:100%;background:#e86f51;transition:width .25s"></div>
            </div>
            <div class="wp-count" style="margin-top:8px;opacity:.75">0 / ${totalWeeks} MEB · 0 / ${totalHabits} habit</div>`;
        document.body.appendChild(panel);
    }

    function updateProgress(weekDone, totalWeeks, habitDone, totalHabits, weekLabel, status) {
        if (!panel) return;
        if (weekLabel) panel.querySelector('.wp-week').textContent = weekLabel;
        if (status !== undefined) panel.querySelector('.wp-status').textContent = status || '-';
        panel.querySelector('.wp-count').textContent = `${weekDone} / ${totalWeeks} MEB · ${habitDone} / ${totalHabits} habit`;
        const total = totalWeeks * totalHabits || 1;
        const doneWeeks = Math.max(0, weekDone - 1);
        const done = doneWeeks * totalHabits + Math.min(habitDone, totalHabits);
        panel.querySelector('.wp-bar').style.width = `${Math.round(done / total * 100)}%`;
    }

    function finishProgress(created, updated, skipped, failed) {
        if (!panel) return;
        panel.querySelector('.wp-bar').style.background = '#5c9b70';
        panel.querySelector('.wp-status').textContent =
            `Selesai — create:${created} update:${updated} skip:${skipped} gagal:${failed}`;
        setTimeout(() => panel && panel.remove(), 6000);
    }

    // ---------- Proses satu MEB ----------
    async function processOneRange(range, planEntries, counters) {
        const { meb, from, to } = range;
        const rangeStartedAt = Date.now();
        const label = meb != null ? `MEB ${meb} (${from} → ${to})` : `${from} → ${to}`;
        log(`\n=== ${label} ===`);
        if (CFG.MODE === 'RUN') log(`Pacing aktif: target minimal ${Math.ceil(CFG.MIN_DURATION_PER_RANGE_MS / 1000)} detik untuk rentang ini.`);

        // Filter habit sesuai gender (skip tanpa warning)
        const filteredEntries = planEntries.filter(([habitId]) => {
            const ok = genderMatches(habitId);
            if (!ok) log(`Skip (beda gender): ${habitId.slice(0, 8)}…`);
            return ok;
        });

        const totalHabits = filteredEntries.length;

        const waitForHabitSlot = async index => {
            if (CFG.MODE !== 'RUN') {
                await sleep(CFG.DELAY_MS);
                return;
            }
            const slotEnd = rangeStartedAt + CFG.MIN_DURATION_PER_RANGE_MS * ((index + 1) / totalHabits);
            await sleep(Math.max(CFG.DELAY_MS, slotEnd - Date.now()));
        };

        const url = `/student/journal-weekly/habituation?start_date=${from}&end_date=${to}`
                  + `&subtype=HABIT&calendarId=${encodeURIComponent(counters.calId)}`;
        const json = await getJSON(url);
        const weeklyHabits = new Map(flattenHabits(json).map(h => [h.id, h]));

        let habitDone = 0;
        for (const [planIndex, [habitId, plan]] of filteredEntries.entries()) {
            try {
                const habit = weeklyHabits.get(habitId);
                if (!habit) {
                    warn(`Habit tidak ditemukan: ${habitId}`);
                    counters.failed++;
                    habitDone++;
                    if (CFG.SHOW_UI) updateProgress(counters.weekDone + 1, counters.totalWeeks, habitDone, totalHabits, label, `Skip (not found): ${habitId.slice(0, 8)}…`);
                    await waitForHabitSlot(planIndex);
                    continue;
                }

                const detail = findDetail(habit, plan.category);
                if (!detail) {
                    warn(`Kategori "${plan.category}" tidak ada di "${habit.habit}". Tersedia: ${(habit.details || []).map(d => d.category).join(' | ')}`);
                    counters.failed++;
                    habitDone++;
                    if (CFG.SHOW_UI) updateProgress(counters.weekDone + 1, counters.totalWeeks, habitDone, totalHabits, label, `Skip (kategori): ${habit.habit}`);
                    await waitForHabitSlot(planIndex);
                    continue;
                }

                const isNoDetail = NO_DETAIL_CATEGORIES.has(norm(plan.category));

                let targetDate = null;
                if (plan.day && DAY_MAP[plan.day] !== undefined) {
                    targetDate = dateForDay(plan.day, range);
                } else if (plan.date) {
                    targetDate = plan.date;
                } else {
                    targetDate = range.from;
                }

                if (!targetDate) {
                    counters.failed++;
                    habitDone++;
                    if (CFG.SHOW_UI) updateProgress(counters.weekDone + 1, counters.totalWeeks, habitDone, totalHabits, label, `Skip (tanpa tanggal): ${habit.habit || habitId.slice(0, 8)}`);
                    await waitForHabitSlot(planIndex);
                    continue;
                }

                const existing = findExistingDeed(habit, range);

                if (existing && !CFG.OVERWRITE_EXISTING) {
                    counters.skipped++;
                    habitDone++;
                    if (CFG.SHOW_UI) updateProgress(counters.weekDone + 1, counters.totalWeeks, habitDone, totalHabits, label, `Skip (sudah ada): ${habit.habit}`);
                    await waitForHabitSlot(planIndex);
                    continue;
                }

                // ✅ payloadDeed[category] di-lowercase (sesuai payload manual server)
                const payload = {
                    'payloadDeed[habit_id]':      habit.id,
                    'payloadDeed[category]':      String(detail.category || '').toLowerCase(),
                    'payloadDeed[point]':         detail.point,
                    'payloadDeed[date]':          targetDate,
                    'payloadDeed[deedable_type]': 'HABIT',
                    'payloadDeed[subtype]':       'HABIT'
                };

                if (!isNoDetail) {
                    payload['payloadDeed[witnessType]'] = plan.witnessType || 'PARENT';
                    payload['payloadDeed[witnessName]'] = plan.witnessName || '-';
                }

                if (existing) payload['payloadDeed[deed_id]'] = existing.id;

                if (CFG.MODE === 'RUN') {
                    await sendDeed(payload);
                } else {
                    log(`[DRY_RUN] ${label} · ${targetDate}${isNoDetail ? ' (no-detail)' : ''}${existing ? ' (update)' : ' (create)'}`, payload);
                }

                if (existing) counters.updated++; else counters.created++;
                if (CFG.SHOW_UI) {
                    const tag = existing ? 'UPDATE' : (isNoDetail ? 'NO-DETAIL' : 'CREATE');
                    updateProgress(counters.weekDone + 1, counters.totalWeeks, habitDone + 1, totalHabits, label, `${tag}: ${habit.habit}`);
                }
                habitDone++;
            } catch (err) {
                counters.failed++;
                habitDone++;
                warn(`Gagal ${habitId} @ ${label}: ${err.message}`);
                if (CFG.SHOW_UI) updateProgress(counters.weekDone + 1, counters.totalWeeks, habitDone, totalHabits, label, `Error: ${err.message.slice(0, 60)}`);
            }
            await waitForHabitSlot(planIndex);
        }
    }

    // ---------- Main ----------
    async function run() {
        const ranges = resolveRanges();
        const calId = detectCalendarId();
        if (!calId) throw new Error('calendarId tidak ditemukan di URL / DOM / resource.');

        const planEntries = Object.entries(CFG.WEEKLY_PLAN || {})
            .filter(([, p]) => p && p.category && p.category !== '-- skip --');
        if (!planEntries.length) {
            warn('WEEKLY_PLAN kosong / semua skip.');
            return;
        }

        log(`Mode: ${CFG.MODE}`);
        log(`Gender: ${GENDER}`);
        log(`Calendar: ${calId}`);
        log(`Total MEB: ${ranges.length}`);
        log(`Plan: ${planEntries.length} kegiatan`);
        if (CFG.MODE === 'RUN') {
            const estimatedMinutes = Math.ceil(ranges.length * CFG.MIN_DURATION_PER_RANGE_MS / 60000);
            log(`Pacing aktif: minimal ${Math.ceil(CFG.MIN_DURATION_PER_RANGE_MS / 1000)} detik per rentang; estimasi ${estimatedMinutes} menit total.`);
        }

        if (CFG.SHOW_UI) initProgress(ranges.length, planEntries.length);

        const counters = {
            calId,
            totalWeeks: ranges.length,
            weekDone: 0,
            created: 0, updated: 0, skipped: 0, failed: 0
        };

        for (const range of ranges) {
            try {
                await processOneRange(range, planEntries, counters);
            } catch (err) {
                warn(`MEB gagal: ${err.message}`);
                counters.failed++;
            }
            counters.weekDone++;
            if (CFG.SHOW_UI) updateProgress(counters.weekDone, ranges.length, planEntries.length, planEntries.length, '', '');
            await sleep(250);
        }

        log(`\nSelesai. create=${counters.created} update=${counters.updated} skip=${counters.skipped} gagal=${counters.failed}`);
        if (CFG.SHOW_UI) finishProgress(counters.created, counters.updated, counters.skipped, counters.failed);

        if (CFG.MODE === 'RUN' && CFG.RELOAD_AFTER_RUN && ranges.length) {
            const first = ranges[0];
            let targetUrl;
            try {
                const u = new URL(location.href);
                u.searchParams.set('weekStartDate', first.from);
                u.searchParams.set('weekEndDate', first.to);
                if (!u.searchParams.get('calendarId') && calId) {
                    u.searchParams.set('calendarId', calId);
                }
                targetUrl = u.toString();
            } catch (_) {
                targetUrl = `/student/journal-weekly?weekStartDate=${first.from}&weekEndDate=${first.to}&calendarId=${encodeURIComponent(calId)}`;
            }
            log(`Navigasi ke ${targetUrl} dalam 1.5s…`);
            setTimeout(() => { location.href = targetUrl; }, 1500);
        }
    }

    try {
        await run();
    } catch (err) {
        console.error('[Weekly] Fatal:', err);
    }
})();
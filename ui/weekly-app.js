// ui/weekly-app.js
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ============================================
    // MEB anchor — MEB 1 = 3 Agustus 2026 (Senin)
    // ============================================
    const MEB_ANCHOR = new Date(2026, 7, 3); // 7 = Agustus (0-index)
    const MEB_MAX = 36;

    function fmtDate(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function computeMebRange(meb) {
        const start = new Date(MEB_ANCHOR);
        start.setDate(start.getDate() + (meb - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { from: fmtDate(start), to: fmtDate(end) };
    }

    // ============================================
    // SCHEMA HABIT MINGGUAN
    // ============================================
    const HABITS = [
        // SPIRIT
        { id: 'e4c7dfac-2fc8-4e25-af5a-6834df7b69f5', name: 'Sholat Jumat', aspect: 'SPIRIT',
          categories: ['Melaksanakan', 'Tidak melaksanakan', 'Tidak ada kegiatan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Jm', defaultWitness: 'Teman', defaultName: 'Tubagus' },

        { id: '399469c2-610f-446e-8232-c1fd9fb407e7', name: 'Melaksanakan Puasa Sunnah', aspect: 'SPIRIT',
          categories: ['Melaksanakan 2 hari (Senin Kamis)', 'Melaksanakan salah satu hari', 'Tidak melaksanakan', 'Tidak ada kegiatan'],
          defaultCategory: 'Tidak ada kegiatan', defaultDay: 'kosong', defaultWitness: 'kosong', defaultName: '' },

        { id: 'de9d7085-d555-46b3-b677-589fb71ea085', name: 'Tadabur Alquran', aspect: 'SPIRIT',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Km', defaultWitness: 'Teman', defaultName: 'Sidqi' },

        { id: '7f151dfc-6f86-451b-89a4-24932d68683a', name: 'Berinfaq dari Uang Saku', aspect: 'SPIRIT',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Jm', defaultWitness: 'Teman', defaultName: 'Tubagus' },

        // BODY
        { id: '33396f2a-97f1-4f13-8b1e-27b8cd66ab6c', name: 'Aktivitas Fisik (min. 15 menit)', aspect: 'BODY',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Sb', defaultWitness: 'Orang Tua', defaultName: '' },

        { id: 'e66a5f41-9619-481d-a023-38a4a2ef46a8', name: 'Kuku, Telinga, dan Bercukur', aspect: 'BODY',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Mg', defaultWitness: 'Orang Tua', defaultName: '' },

        { id: 'd65e1c23-0548-404d-902d-980eba88c027', name: 'Sarapan Gizi Seimbang', aspect: 'BODY',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Jm', defaultWitness: 'Teman', defaultName: 'Tubagus' },

        // MIND
        { id: 'ae245657-fd91-470b-ac0c-d25f62ffe550', name: 'Mengikuti Ekstrakurikuler', aspect: 'MIND',
          categories: ['Hadir tepat waktu', 'Hadir tidak tepat waktu', 'Tidak hadir (alpa)', 'Tidak ada kegiatan'],
          defaultCategory: 'Hadir tepat waktu', defaultDay: 'Rb', defaultWitness: 'Teman', defaultName: 'Manu' },

        { id: 'aef9f818-ff68-4d91-b192-9ddf2eb13038', name: 'Mengikuti Seni Budaya', aspect: 'MIND',
          categories: ['Hadir tepat waktu', 'Hadir tidak tepat waktu', 'Tidak hadir ekskul (alpa)', 'Tidak ada kegiatan'],
          defaultCategory: 'Hadir tepat waktu', defaultDay: 'Sl', defaultWitness: 'Teman', defaultName: 'Aurel' },

        { id: '5a13bfad-8e8b-4090-9719-d3b10f972008', name: 'Latihan Literasi (AKM/TKA)', aspect: 'MIND',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Tidak melaksanakan', defaultDay: 'kosong', defaultWitness: 'kosong', defaultName: '' },

        { id: 'd3f76749-ccec-4152-b55e-6536852cd60b', name: 'Latihan Numerasi (AKM/TKA)', aspect: 'MIND',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Tidak melaksanakan', defaultDay: 'kosong', defaultWitness: 'kosong', defaultName: '' },

        { id: '642f84c9-81ae-4444-ac4c-e98d05f60d57', name: 'Latihan B. Inggris (TOEIC/TKA)', aspect: 'MIND',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Rb', defaultWitness: 'Teman', defaultName: 'Tubagus' },

        { id: '861303b1-f7e8-4ee5-b288-d68bfb75edc6', name: 'Diskusi Bimbingan Konseling', aspect: 'MIND',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Sl', defaultWitness: 'Teman', defaultName: 'Tubagus' },

        { id: '90c20cba-34bc-47f8-9978-0debd400fdaa', name: 'Mencuci Baju', aspect: 'MIND',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Sb', defaultWitness: 'Orang Tua', defaultName: '' },

        { id: '5b96d786-21c4-4ad9-b97b-402cb768374a', name: 'Membantu Memasak', aspect: 'MIND',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Jm', defaultWitness: 'Orang Tua', defaultName: '' },

        { id: '56da8df9-b4c7-4564-aa77-b4a5c9c01bb1', name: 'Membersihkan Rumah', aspect: 'MIND',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Sb', defaultWitness: 'Orang Tua', defaultName: '' },

        // ENVIRONMENT
        { id: '935e284e-e287-4961-8bb1-e498dfb4f14d', name: 'Membawa Bahan Daur Ulang', aspect: 'ENVIRONMENT',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Tidak melaksanakan', defaultDay: 'kosong', defaultWitness: 'kosong', defaultName: '' },

        // CITIZENSHIP
        { id: '68703138-063c-4786-8652-89d12e66d999', name: 'Mengikuti Kumpul Rayon', aspect: 'CITIZENSHIP',
          categories: ['Hadir tepat waktu', 'Hadir tidak tepat waktu', 'Tidak hadir (sakit/izin/alpa)', 'Tidak ada kegiatan'],
          defaultCategory: 'Hadir tepat waktu', defaultDay: 'Jm', defaultWitness: 'Teman', defaultName: 'Daffa' },

        { id: '79f05520-b2e4-4302-919b-e71272870370', name: 'Aktif dalam Kel. Leadership', aspect: 'CITIZENSHIP',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Sn', defaultWitness: 'Teman', defaultName: 'Sidqi' },

        { id: '711dcd99-be3f-4e74-a87c-8481058cab49', name: 'Piket Rayon', aspect: 'CITIZENSHIP',
          categories: ['Melaksanakan', 'Tidak melaksanakan'],
          defaultCategory: 'Melaksanakan', defaultDay: 'Sl', defaultWitness: 'Guru', defaultName: 'pak dede' }
    ];

    const DAYS = ['kosong', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];
    const WITNESSES = ['kosong', 'Guru', 'Teman', 'Orang Tua', 'Lainnya'];
    const WITNESS_MAP = { Guru: 'TEACHER', Teman: 'FRIEND', 'Orang Tua': 'PARENT', Lainnya: 'OTHER' };

    // ============================================
    // DOM refs
    // ============================================
    const els = {
        mode:       document.getElementById('weekly-mode'),
        mebFrom:    document.getElementById('weekly-meb-from'),
        mebTo:      document.getElementById('weekly-meb-to'),
        overwrite:  document.getElementById('weekly-overwrite'),
        reload:     document.getElementById('weekly-reload'),
        rangeInfo:  document.getElementById('weekly-range-info'),
        list:       document.getElementById('weekly-plan-list'),
        error:      document.getElementById('weekly-error'),
        generate:   document.getElementById('weekly-generate'),
        reset:      document.getElementById('weekly-reset'),
        copy:       document.getElementById('weekly-copy'),
        outputArea: document.getElementById('weekly-output-area'),
        output:     document.getElementById('weekly-output')
    };
    for (const [k, el] of Object.entries(els)) {
        if (!el) console.error(`[Weekly-App] Elemen tidak ditemukan: ${k}`);
    }

    // ============================================
    // MEB select — populate
    // ============================================
    function fillMebOptions(selectEl, selected) {
        selectEl.innerHTML = '';
        for (let i = 1; i <= MEB_MAX; i++) {
            const r = computeMebRange(i);
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `MEB ${i} — ${r.from} s/d ${r.to}`;
            if (i === selected) opt.selected = true;
            selectEl.appendChild(opt);
        }
    }

    function populateMebSelects() {
        let detected = 1;
        try {
            const url = new URL(location.href);
            const ws = url.searchParams.get('weekStartDate');
            if (ws) {
                for (let i = 1; i <= MEB_MAX; i++) {
                    if (computeMebRange(i).from === ws) { detected = i; break; }
                }
            }
        } catch (_) { /* noop */ }

        fillMebOptions(els.mebFrom, detected);
        fillMebOptions(els.mebTo, detected);
        updateRangeInfo();
    }

    function getSelectedMebRange() {
        let from = Number(els.mebFrom.value) || 1;
        let to   = Number(els.mebTo.value) || 1;
        if (to < from) { const t = from; from = to; to = t; }
        return { from, to };
    }

    function updateRangeInfo() {
        if (!els.rangeInfo) return;
        const { from, to } = getSelectedMebRange();
        const rFrom = computeMebRange(from);
        const rTo   = computeMebRange(to);
        const totalWeeks = to - from + 1;
        if (totalWeeks === 1) {
            els.rangeInfo.textContent = `📅 MEB ${from} · ${rFrom.from} s/d ${rFrom.to} (1 minggu)`;
        } else {
            els.rangeInfo.textContent = `📅 MEB ${from} s/d MEB ${to} · ${rFrom.from} s/d ${rTo.to} (${totalWeeks} minggu)`;
        }
    }

    // ============================================
    // RENDER
    // ============================================
    function renderRow(habit) {
        const catOpts = ['-- skip --', ...habit.categories];
        const catSel = habit.defaultCategory;
        const daySel = habit.defaultDay;
        const witSel = habit.defaultWitness;
        const nameVal = habit.defaultName || '';
        const nameDisabled = (witSel === 'kosong' || witSel === 'Orang Tua');

        return `<div class="weekly-plan-row" data-habit-id="${habit.id}" data-aspect="${habit.aspect}">
            <strong title="${habit.id}">${habit.name}</strong>
            <select data-field="category">
                ${catOpts.map(v => `<option ${v === catSel ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
            <select data-field="day">
                ${DAYS.map(v => `<option ${v === daySel ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
            <select data-field="witness">
                ${WITNESSES.map(v => `<option ${v === witSel ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
            <input data-field="name" type="text" value="${nameVal}" placeholder="Nama saksi" ${nameDisabled ? 'disabled' : ''}>
        </div>`;
    }

    function render() {
        let lastAspect = null;
        let html = '';
        for (const habit of HABITS) {
            if (habit.aspect !== lastAspect) {
                html += `<div class="weekly-plan-aspect">${habit.aspect}</div>`;
                lastAspect = habit.aspect;
            }
            html += renderRow(habit);
        }
        els.list.innerHTML = html;

        els.list.querySelectorAll('.weekly-plan-row').forEach(row => {
            const wit = row.querySelector('[data-field="witness"]');
            const name = row.querySelector('[data-field="name"]');
            wit.addEventListener('change', () => {
                const off = (wit.value === 'kosong' || wit.value === 'Orang Tua');
                name.disabled = off;
                if (off) name.value = '';
            });
        });
    }

    // ============================================
    // READ PLAN
    // ============================================
    function readPlan() {
        const plan = {};
        els.list.querySelectorAll('.weekly-plan-row').forEach(row => {
            const get = f => row.querySelector(`[data-field="${f}"]`).value;
            const category = get('category');
            if (category === '-- skip --') return;

            const witness = get('witness');
            const nameRaw = get('name').trim();

            plan[row.dataset.habitId] = {
                category,
                day: get('day'),
                witnessType: WITNESS_MAP[witness] || 'PARENT',
                witnessName: (witness === 'kosong') ? '-' : (nameRaw || '-')
            };
        });
        return plan;
    }

    // ============================================
    // GENERATE
    // ============================================
    async function generate() {
        els.error.hidden = true;
        els.outputArea.hidden = true;
        els.copy.hidden = true;

        const plan = readPlan();
        if (Object.keys(plan).length === 0) {
            els.error.textContent = '⚠️ Minimal pilih satu kegiatan (jangan semua "-- skip --").';
            els.error.hidden = false;
            return;
        }

        const { from, to } = getSelectedMebRange();
        const ranges = [];
        for (let i = from; i <= to; i++) {
            ranges.push({ meb: i, ...computeMebRange(i) });
        }

        const config = {
            MODE: els.mode.value,
            MEB_RANGES: ranges,
            MIN_DURATION_PER_RANGE_MS: 100000,
            OVERWRITE_EXISTING: els.overwrite.checked,
            RELOAD_AFTER_RUN: els.reload.checked,
            WEEKLY_PLAN: plan
        };

        // ✅ LOG DI SINI
        console.log(`[Weekly-App] Mode: ${config.MODE}, Reload: ${config.RELOAD_AFTER_RUN}, MEB: ${ranges.length} minggu`);

        try {
            const res = await fetch(`../src/weekly-engine.js?t=${Date.now()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const src = await res.text();
            if (!src.includes('__CONFIG_PLACEHOLDER__')) {
                throw new Error('Placeholder __CONFIG_PLACEHOLDER__ tidak ditemukan di weekly-engine.js');
            }
            els.output.value = src.replace('__CONFIG_PLACEHOLDER__', JSON.stringify(config, null, 2));
            els.outputArea.hidden = false;
            els.copy.hidden = false;
            els.output.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
            els.error.textContent = '❌ ' + err.message;
            els.error.hidden = false;
        }
    }

    // ============================================
    // RESET
    // ============================================
    function reset() {
        els.mode.value = 'DRY_RUN';
        populateMebSelects();
        els.overwrite.checked = false;
        els.reload.checked = true;
        els.error.hidden = true;
        els.outputArea.hidden = true;
        els.copy.hidden = true;
        els.output.value = '';
        render();
    }

    // ============================================
    // EVENTS
    // ============================================
    els.mebFrom.addEventListener('change', () => {
        if (Number(els.mebTo.value) < Number(els.mebFrom.value)) {
            els.mebTo.value = els.mebFrom.value;
        }
        updateRangeInfo();
    });
    els.mebTo.addEventListener('change', () => {
        if (Number(els.mebTo.value) < Number(els.mebFrom.value)) {
            els.mebFrom.value = els.mebTo.value;
        }
        updateRangeInfo();
    });
    els.generate.addEventListener('click', generate);
    els.reset.addEventListener('click', reset);
    els.copy.addEventListener('click', () => {
        els.output.select();
        document.execCommand('copy');
        els.copy.textContent = 'Tersalin!';
        setTimeout(() => { els.copy.textContent = 'Salin script'; }, 2000);
    });

    populateMebSelects();
    render();
});
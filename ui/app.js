// ui/app.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded, initializing...');
    
    // ==========================================
    // 1. STATE & SCHEMA
    // ==========================================
    const SCHEMA = {
        salatWajib: ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
        salatSunnah: [{ key: 'tahajud', label: 'Tahajud' }, { key: 'dhuha', label: 'Dhuha' }],
        zikir: [{ key: 'zikir_pagi', label: 'Zikir Pagi' }, { key: 'zikir_sore', label: 'Zikir Sore' }],
        daily: [
            { key: 'makan_gizi', label: 'Makan gizi seimbang' }, { key: 'minum_air', label: 'Minum Air Putih' },
            { key: 'peregangan', label: 'Peregangan' }, { key: 'grooming', label: 'Grooming Diri' },
            { key: 'tumbler', label: 'Membawa Tumbler' }, { key: 'meja_belajar', label: 'Merapikan meja belajar' },
            { key: 'pilah_sampah', label: 'Memilah sampah' }, { key: 'kel_belajar', label: 'Aktif Kelompok Belajar' },
            { key: 'bincang_kel', label: 'Berbincang dengan Keluarga' }, { key: 'mengaji', label: 'Mengaji/tilawah' }
        ],
        tidurBangun: [{ key: 'tidur', label: 'Tidur' }, { key: 'bangun', label: 'Bangun' }]
    };

    const WEEKLY_ACTIVITIES = [
        ['399469c2-610f-446e-8232-c1fd9fb407e7', 'Melaksanakan Puasa Sunnah', 'Tidak ada kegiatan', 'kosong', 'kosong'],
        ['de9d7085-d555-46b3-b677-589fb71ea085', 'Tadabur Alquran', 'Melaksanakan', 'Km', 'Orang Tua'],
        ['7f151dfc-6f86-451b-89a4-24932d68683a', 'Berinfaq dari Uang Saku', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['73985f09-c695-4c36-aa8e-cdd44212c4db', 'Mengonsumsi Tablet Tambah Darah/Vitamin', 'Tidak ada kegiatan', 'kosong', 'kosong'],
        ['33396f2a-97f1-4f13-8b1e-27b8cd66ab6c', 'Aktivitas Fisik (min. 15 menit)', 'Melaksanakan', 'Sb', 'Orang Tua'],
        ['e66a5f41-9619-481d-a023-38a4a2ef46a8', 'Kuku, Telinga, dan Bercukur', 'Melaksanakan', 'Mg', 'Orang Tua'],
        ['d65e1c23-0548-404d-902d-980eba88c027', 'Sarapan Gizi Seimbang', 'Melaksanakan', 'Mg', 'Orang Tua'],
        ['ae245657-fd91-470c-ac0c-d25f62ffe550', 'Mengikuti Ekstrakurikuler', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['aef9f818-ff68-4d91-b192-9ddf2eb13038', 'Mengikuti Seni Budaya', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['5a13bfad-8e8b-4090-9719-d3b10f972008', 'Latihan Literasi (AKM/TKA)', 'Melaksanakan', 'Sb', 'Orang Tua'],
        ['d3f76749-ccec-4152-b55e-6536852cd60b', 'Latihan Numerasi (AKM/TKA)', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['642f84c9-81ae-4444-ac4c-e98d05f60d57', 'Latihan B. Inggris (TOEIC/TKA)', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['861303b1-f7e8-4ee5-b288-d68bfb75edc6', 'Diskusi Bimbingan Konseling', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['cfdd442de-e59c-4d43-a2ec-db6f290a16f0', 'Keputrian', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['90c20cba-34bc-47f8-9978-0debd400fdaa', 'Mencuci Baju', 'Melaksanakan', 'Km', 'Orang Tua'],
        ['5b96d786-21c4-4ad9-b97b-402cb768374a', 'Membantu Memasak', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['56da8df9-b4c7-4561-aa77-b4a5c9c01bb1', 'Membersihkan Rumah', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['935e284e-e287-4961-8bb1-e498dfb4f14d', 'Membawa Bahan Daur Ulang', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['68703138-063c-4786-8652-89d12e66d999', 'Mengikuti Kumpul Rayon', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['79f05520-b2e4-4302-919b-e71272870370', 'Aktif dalam Kel. Leadership', 'Melaksanakan', 'Jm', 'Orang Tua'],
        ['711dcd99-be3f-4e74-a87c-8481058cab49', 'Piket Rayon', 'Melaksanakan', 'Jm', 'Orang Tua']
    ];

    function createDefaultState() {
        return {
            startDate: '', endDate: '', dates: [],
            salat: Object.fromEntries(SCHEMA.salatWajib.map(p => [p, { melaksanakan: 'Ya', berjamaah: 'Ya' }])) ,
            sunnah: { tahajud: 'Tidak', dhuha: '4 Rakaat' },
            zikir: { zikir_pagi: 'Membaca', zikir_sore: 'Membaca' },
            daily: Object.fromEntries(SCHEMA.daily.map(d => [d.key, 'Melaksanakan'])),
            tidurBangun: { tidur: 'Sebelum pukul 22.00', bangun: 'Sebelum pukul 05.00' }
        };
    }

    let state = createDefaultState();

    console.log('[App] State initialized:', state);

    // ==========================================
    // 2. DOM ELEMENTS (dengan validasi)
    // ==========================================
    const els = {
        startDate: document.getElementById('start-date'),
        endDate: document.getElementById('end-date'),
        dateInfo: document.getElementById('date-info'),
        salatWajib: document.getElementById('salat-wajib-container'),
        salatSunnah: document.getElementById('salat-sunnah-container'),
        zikir: document.getElementById('zikir-container'),
        daily: document.getElementById('daily-container'),
        tidurBangun: document.getElementById('tidur-bangun-container'),
        previewBox: document.getElementById('preview-box'),
        errorBox: document.getElementById('error-box'),
        generateBtn: document.getElementById('generate-btn'),
        resetBtn: document.getElementById('reset-btn'),
        testMode: document.getElementById('test-mode'),
        outputArea: document.getElementById('output-area'),
        outputScript: document.getElementById('output-script'),
        copyBtn: document.getElementById('copy-btn'),
        weeklyPanel: document.getElementById('weekly-panel'),
        weeklyMode: document.getElementById('weekly-mode'),
        weeklyOffset: document.getElementById('weekly-offset'),
        weeklyOverwrite: document.getElementById('weekly-overwrite'),
        weeklyPlanList: document.getElementById('weekly-plan-list'),
        weeklyError: document.getElementById('weekly-error'),
        weeklyGenerate: document.getElementById('weekly-generate'),
        weeklyReset: document.getElementById('weekly-reset'),
        weeklyOutputArea: document.getElementById('weekly-output-area'),
        weeklyOutput: document.getElementById('weekly-output'),
        weeklyCopy: document.getElementById('weekly-copy')
    };

    // Validasi semua element ada
    for (const [key, el] of Object.entries(els)) {
        if (!el) {
            console.error(`[App] Element tidak ditemukan: ${key}`);
        }
    }

    // ==========================================
    // 3. UTILITIES & RENDERING
    // ==========================================
    function getDatesInRange(start, end) {
        const dates = [];
        const currentDate = new Date(start + 'T00:00:00');
        const endDateObj = new Date(end + 'T00:00:00');
        while (currentDate <= endDateObj) {
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const d = String(currentDate.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }

    function formatDateIndo(dateStr) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const d = new Date(dateStr + 'T00:00:00');
        return `${d.getDate()} ${months[d.getMonth()]}`;
    }

    function renderSelectOptions(options, selected) {
        let html = '';
        if (selected === null || selected === undefined) {
            html += `<option value="" selected disabled>-- Pilih --</option>`;
        }
        html += options.map(opt => `<option value="${opt}" ${opt === selected ? 'selected' : ''}>${opt}</option>`).join('');
        return html;
    }

    function renderSalatWajib() {
        console.log('[App] Rendering Salat Wajib...');
        const prayers = SCHEMA.salatWajib;
        const names = { subuh: 'Subuh', dzuhur: 'Dzuhur', ashar: 'Ashar', maghrib: 'Maghrib', isya: 'Isya' };
        let html = `<table class="compact-table"><thead><tr><th>Salat</th><th>Dilaksanakan</th><th>Berjamaah</th></tr></thead><tbody>`;
        prayers.forEach(p => {
            html += `<tr>
                <td class="label-col">${names[p]}</td>
                <td><select data-group="salat" data-key="${p}" data-field="melaksanakan">${renderSelectOptions(['Ya', 'Tidak'], state.salat[p].melaksanakan)}</select></td>
                <td><select data-group="salat" data-key="${p}" data-field="berjamaah">${renderSelectOptions(['Ya', 'Ya, Masbuk', 'Tidak'], state.salat[p].berjamaah)}</select></td>
            </tr>`;
        });
        html += `</tbody></table>`;
        els.salatWajib.innerHTML = html;
        console.log('[App] Salat Wajib rendered');
    }

    function renderCompactSection(container, items, stateGroup, options, isTidurBangun = false) {
        console.log(`[App] Rendering ${stateGroup}...`);
        let html = `<div class="compact-grid">`;
        items.forEach(item => {
            const key = item.key || item;
            const label = item.label || key;
            let opts = options;
            if (isTidurBangun && key === 'bangun') opts = ['Sebelum pukul 05.00', 'Setelah pukul 05.00'];
            else if (isTidurBangun && key === 'tidur') opts = ['Sebelum pukul 22.00', 'Setelah pukul 22.00'];
            
            const val = state[stateGroup][key];
            html += `<div class="compact-item">
                <label>${label}</label>
                <select data-group="${stateGroup}" data-key="${key}" data-field="single">${renderSelectOptions(opts, val)}</select>
            </div>`;
        });
        html += `</div>`;
        container.innerHTML = html;
        console.log(`[App] ${stateGroup} rendered`);
    }

    function refreshUI() {
        console.log('[App] refreshUI() called');
        try {
            renderSalatWajib();
            renderCompactSection(els.salatSunnah, SCHEMA.salatSunnah, 'sunnah', ['Tidak', '2 Rakaat', '4 Rakaat', '8 Rakaat']);
            renderCompactSection(els.zikir, SCHEMA.zikir, 'zikir', ['Membaca', 'Mendengar', 'Tidak melaksanakan']);
            renderCompactSection(els.daily, SCHEMA.daily, 'daily', ['Melaksanakan', 'Tidak melaksanakan']);
            renderCompactSection(els.tidurBangun, SCHEMA.tidurBangun, 'tidurBangun', [], true);
            attachEvents();
            updatePreview();
            console.log('[App] refreshUI() complete');
        } catch (err) {
            console.error('[App] refreshUI() error:', err);
        }
    }

    function attachEvents() {
        document.querySelectorAll('select').forEach(sel => {
            sel.onchange = (e) => {
                const { group, key, field } = e.target.dataset;
                const val = e.target.value;
                if (field === 'single') state[group][key] = val;
                else state[group][key][field] = val;
                updatePreview();
            };
        });
    }

    function handleDates() {
        state.startDate = els.startDate.value;
        state.endDate = els.endDate.value;
        state.dates = [];
        
        if (state.startDate && state.endDate) {
            const start = new Date(state.startDate + 'T00:00:00');
            const end = new Date(state.endDate + 'T00:00:00');
            if (end < start) {
                els.dateInfo.innerHTML = `<span class="error">️ Tanggal selesai tidak boleh sebelum tanggal mulai</span>`;
            } else {
                state.dates = getDatesInRange(state.startDate, state.endDate);
                const count = state.dates.length;
                const dateText = count === 1 ? formatDateIndo(state.startDate) : `${formatDateIndo(state.startDate)} — ${formatDateIndo(state.endDate)}`;
                els.dateInfo.innerHTML = `<span class="success">📅 ${count} hari<br>${dateText}</span>`;
            }
        } else {
            els.dateInfo.innerHTML = `<span>Pilih rentang tanggal</span>`;
        }
        updatePreview();
    }

    function updatePreview() {
        if (state.dates.length === 0) {
            els.previewBox.innerHTML = `<div class="empty-preview">Belum ada tanggal yang dipilih.</div>`;
            return;
        }
        const salatCount = Object.values(state.salat).filter(s => s.melaksanakan || s.berjamaah).length * 2;
        const sunnahCount = Object.values(state.sunnah).filter(s => s !== null).length;
        const zikirCount = Object.values(state.zikir).filter(s => s !== null).length;
        const dailyCount = Object.values(state.daily).filter(s => s !== null).length + Object.values(state.tidurBangun).filter(s => s !== null).length;

        els.previewBox.innerHTML = `
            <div class="preview-item"><span class="preview-icon">📅</span><div><strong>${state.dates.length} Hari</strong><small>${formatDateIndo(state.dates[0])}${state.dates.length > 1 ? ' — ' + formatDateIndo(state.dates[state.dates.length-1]) : ''}</small></div></div>
            <div class="preview-item"><span class="preview-icon">🕌</span><div><strong>${salatCount + sunnahCount}</strong><small>Salat</small></div></div>
            <div class="preview-item"><span class="preview-icon">📿</span><div><strong>${zikirCount}</strong><small>Zikir</small></div></div>
            <div class="preview-item"><span class="preview-icon">🌱</span><div><strong>${dailyCount}</strong><small>Harian</small></div></div>
        `;
    }

    function buildDomConfig() {
        const salatPlan = {};
        const salatNames = { subuh: 'subuh', dzuhur: 'dzuhur', ashar: 'ashar', maghrib: 'magrib', isya: 'isya' };

        for (const [key, name] of Object.entries(salatNames)) {
            const prayer = state.salat[key];
            if (prayer.melaksanakan) salatPlan[`salat fardhu ${name}`] = prayer.melaksanakan === 'Ya' ? 'Melaksanakan' : 'Tidak Melaksanakan';
            if (prayer.berjamaah) salatPlan[`salat fardhu berjamaah ${name}`] = prayer.berjamaah;
        }

        if (state.sunnah.tahajud) {
            salatPlan['salat tahajud'] = state.sunnah.tahajud === 'Tidak' ? 'Tidak Melaksanakan' : state.sunnah.tahajud;
        }
        if (state.zikir.zikir_pagi) salatPlan['dzikir pagi'] = state.zikir.zikir_pagi;
        if (state.zikir.zikir_sore) salatPlan['dzikir sore'] = state.zikir.zikir_sore;

        const habitNames = {
            dhuha: 'Sholat Dhuha', mengaji: 'Mengaji atau tilawah Alquran', tidur: 'Tidur sebelum pukul 22.00',
            bangun: 'Bangun Sebelum Pukul 05.00', makan_gizi: 'Makan gizi seimbang (termasuk sayur dan buah)',
            minum_air: 'Minum Air Putih 1,5--2L Sehari', peregangan: 'Peregangan', grooming: 'Grooming Diri',
            tumbler: 'Membawa Tumbler', meja_belajar: 'Membersihkan dan merapikan meja/area yang telah digunakan untuk belajar di sekolah dan di rumah',
            pilah_sampah: 'Memilah sampah di sekolah dan di rumah', kel_belajar: 'Aktif dalam Kelompok Belajar',
            bincang_kel: 'Berbincang dengan Anggota Keluarga'
        };
        const habitPlan = {};
        const selectedHabits = { ...state.daily, ...state.tidurBangun, dhuha: state.sunnah.dhuha };
        for (const [key, value] of Object.entries(selectedHabits)) {
            if (value) habitPlan[habitNames[key]] = key === 'dhuha' ? `Mlaksanakan ${value}` : value;
        }

        return {
            MODE: 'RUN', OVERWRITE_EXISTING: true, SKIP_SALAT: false, SKIP_HABIT: false,
            TARGET_RANGE: { from: state.startDate, to: state.endDate },
            DELAY_AFTER_EDIT: 300, DELAY_AFTER_MODAL_OPEN: 300, DELAY_AFTER_RADIO: 150,
            DELAY_AFTER_SAVE: 300, DELAY_BETWEEN_GROUPS: 250, DELAY_BETWEEN_HABITS: 200,
            DELAY_AFTER_MODAL_CLOSE: 300, MODAL_TIMEOUT: 6000, MODAL_CLOSE_TIMEOUT: 3000,
            SAVE_COMPLETE_TIMEOUT: 8000, HABIT_MENU_TIMEOUT: 2000,
            SALAT_PLAN: salatPlan, HABIT_PLAN: habitPlan
        };
    }

    function renderWeeklyPlan() {
        const statuses = ['Melaksanakan', 'Tidak melaksanakan', 'Tidak ada kegiatan'];
        const days = ['kosong', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];
        const witnesses = ['kosong', 'Guru', 'Teman', 'Orang Tua', 'Lainnya'];
        els.weeklyPlanList.innerHTML = WEEKLY_ACTIVITIES.map(([id, name, status, day, witness]) => `<div class="weekly-plan-row" data-habit-id="${id}">
            <strong>${name}</strong>
            <select data-weekly-field="status">${statuses.map(value => `<option ${value === status ? 'selected' : ''}>${value}</option>`).join('')}</select>
            <select data-weekly-field="day">${days.map(value => `<option ${value === day ? 'selected' : ''}>${value}</option>`).join('')}</select>
            <select data-weekly-field="witness">${witnesses.map(value => `<option ${value === witness ? 'selected' : ''}>${value}</option>`).join('')}</select>
            <input data-weekly-field="name" type="text" value="${witness === 'kosong' ? '' : 'Orang Tua'}" placeholder="Nama saksi">
        </div>`).join('');
    }

    function readWeeklyPlan() {
        const plan = {};
        els.weeklyPlanList.querySelectorAll('.weekly-plan-row').forEach(row => {
            const value = field => row.querySelector(`[data-weekly-field="${field}"]`).value;
            plan[row.dataset.habitId] = {
                detailType: value('status') === 'Melaksanakan' ? 'doing' : value('status') === 'Tidak ada kegiatan' ? 'no_activity' : 'undone',
                day: value('day'), witnessType: { Guru: 'TEACHER', Teman: 'FRIEND', 'Orang Tua': 'PARENT', Lainnya: 'OTHER' }[value('witness')] || 'PARENT',
                witnessName: value('name') || '-'
            };
        });
        return plan;
    }

    async function generateScript() {
        els.errorBox.style.display = 'none';
        els.outputArea.style.display = 'none';

        const hasSelection = Object.values(state.salat).some(s => s.melaksanakan || s.berjamaah) ||
            Object.values(state.sunnah).some(s => s !== null) ||
            Object.values(state.zikir).some(s => s !== null) ||
            Object.values(state.daily).some(s => s !== null) ||
            Object.values(state.tidurBangun).some(s => s !== null);

        if (!hasSelection) {
            els.errorBox.textContent = '⚠️ Minimal pilih satu aktivitas.';
            els.errorBox.style.display = 'block'; return;
        }

        if (window.location.protocol === 'file:') {
            els.errorBox.innerHTML = '❌ <strong>ERROR PROTOKOL:</strong> Buka via http://localhost:3000';
            els.errorBox.style.display = 'block';
            return;
        }

        const config = buildDomConfig();

        try {
            const response = await fetch(`/src/api-range-engine.js?t=${Date.now()}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const engineCode = await response.text();
            if (!engineCode.includes('__CONFIG_PLACEHOLDER__')) throw new Error('Placeholder tidak ditemukan');
            const finalCode = engineCode.replace('__CONFIG_PLACEHOLDER__', JSON.stringify(config, null, 4));
            els.outputScript.value = finalCode;
            els.outputArea.style.display = 'block';
        } catch (err) {
            els.errorBox.textContent = '❌ ' + err.message;
            els.errorBox.style.display = 'block';
        }
    }

    async function generateWeeklyScript() {
        els.weeklyError.hidden = true;
        els.weeklyOutputArea.hidden = true;
        const habitPlan = readWeeklyPlan();

        const config = {
            MODE: els.weeklyMode.value,
            WEEK_OFFSET: Number(els.weeklyOffset.value) || 0,
            OVERWRITE_EXISTING: els.weeklyOverwrite.checked,
            HABIT_PLAN: habitPlan
        };

        try {
            const response = await fetch(`/src/weekly-engine.js?t=${Date.now()}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const engineCode = await response.text();
            if (!engineCode.includes('__CONFIG_PLACEHOLDER__')) throw new Error('Placeholder weekly tidak ditemukan.');
            els.weeklyOutput.value = engineCode.replace('__CONFIG_PLACEHOLDER__', JSON.stringify(config, null, 2));
            els.weeklyOutputArea.hidden = false;
        } catch (error) {
            els.weeklyError.textContent = `Gagal membuat script weekly: ${error.message}`;
            els.weeklyError.hidden = false;
        }
    }

    function resetWeekly() {
        els.weeklyMode.value = 'DRY_RUN';
        els.weeklyOffset.value = '0';
        els.weeklyOverwrite.checked = false;
        renderWeeklyPlan();
        els.weeklyError.hidden = true;
        els.weeklyOutputArea.hidden = true;
        els.weeklyOutput.value = '';
    }

    function setMode(mode) {
        const dailyParts = [document.querySelector('.date-panel'), document.querySelector('.section-heading'), document.querySelector('.activity-grid'), document.querySelector('.action-panel')];
        const weekly = mode === 'weekly';
        dailyParts.forEach(element => { if (element) element.hidden = weekly; });
        els.weeklyPanel.hidden = !weekly;
        document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
    }

    function resetApp() {
        state = createDefaultState();
        els.startDate.value = ''; els.endDate.value = '';
        els.dateInfo.innerHTML = `<span>Pilih rentang tanggal</span>`;
        els.errorBox.style.display = 'none';
        els.outputArea.style.display = 'none';
        els.outputScript.value = '';
        refreshUI();
    }

    // ==========================================
    // 4. INITIALIZATION
    // ==========================================
    els.startDate.addEventListener('change', handleDates);
    els.endDate.addEventListener('change', handleDates);
    els.generateBtn.addEventListener('click', generateScript);
    els.resetBtn.addEventListener('click', resetApp);
    els.copyBtn.addEventListener('click', () => {
        els.outputScript.select();
        document.execCommand('copy');
        els.copyBtn.textContent = 'Tersalin!';
        setTimeout(() => els.copyBtn.textContent = 'Salin', 2000);
    });
    document.querySelectorAll('.mode-tab').forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
    els.weeklyGenerate.addEventListener('click', generateWeeklyScript);
    els.weeklyReset.addEventListener('click', resetWeekly);
    els.weeklyCopy.addEventListener('click', () => {
        els.weeklyOutput.select();
        document.execCommand('copy');
        els.weeklyCopy.textContent = 'Tersalin!';
        setTimeout(() => els.weeklyCopy.textContent = 'Salin script', 2000);
    });

    refreshUI();
    renderWeeklyPlan();
});
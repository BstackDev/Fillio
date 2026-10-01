// Fungsi ini mengembalikan string script siap-paste ke Console app.kejar.id
window.buildKejarInjector = function buildKejarInjector(presetSlug) {
  const preset = presetSlug || '';
  return `window.__KEJAR_PRESET_SLUG__ = '${preset}';
(async () => {
  document.getElementById('__kj_panel')?.remove();
  document.getElementById('__kj_style')?.remove();

  const PRESET_SLUG = window.__KEJAR_PRESET_SLUG__ || null;
  const CONCURRENCY = 4;
  const DELAY_MS = 30;
  const ROUND_GAP = 200;
  const FINISH_GAP = 200;

  const style = document.createElement('style');
  style.id = '__kj_style';
  style.textContent = \`
    #__kj_panel{position:fixed;top:16px;right:16px;z-index:2147483647;background:#0f1115;color:#e4e6eb;font:13px -apple-system,system-ui,sans-serif;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.6);width:460px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden}
    #__kj_panel .kj-head{padding:14px 16px;border-bottom:1px solid #1f2229;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none}
    #__kj_panel .kj-title{font-weight:700;font-size:13px;color:#fff}
    #__kj_panel .kj-title span{color:#4ade80}
    #__kj_panel .kj-close{background:transparent;border:none;color:#666;cursor:pointer;font-size:20px;padding:0 6px;border-radius:6px}
    #__kj_panel .kj-close:hover{background:#1f2229;color:#fff}
    #__kj_panel .kj-body{padding:16px;overflow-y:auto;flex:1}
    #__kj_panel .kj-label{font-size:10px;text-transform:uppercase;color:#7a7e88;letter-spacing:.6px;margin-bottom:6px;font-weight:700}
    #__kj_panel .kj-field{margin-bottom:14px}
    #__kj_panel select{width:100%;background:#1a1d23;color:#e4e6eb;border:1px solid #2a2e36;border-radius:8px;padding:9px 10px;font:inherit;outline:none}
    #__kj_panel select:disabled{opacity:.6}
    #__kj_panel .kj-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    #__kj_panel .kj-check{display:flex;align-items:center;gap:8px;font-size:12px;color:#aab;cursor:pointer}
    #__kj_panel .kj-check input{accent-color:#4ade80}
    #__kj_panel .kj-btn{width:100%;background:#4ade80;color:#0f1115;border:none;border-radius:8px;padding:11px;font:inherit;font-weight:700;cursor:pointer}
    #__kj_panel .kj-btn:disabled{opacity:.35;cursor:not-allowed}
    #__kj_panel .kj-btn.kj-secondary{background:#2a2e36;color:#e4e6eb;margin-top:8px}
    #__kj_panel .kj-info{font-size:11px;color:#7a7e88;margin-top:8px;text-align:center}
    #__kj_panel .kj-progress{background:#1a1d23;border-radius:6px;overflow:hidden;height:6px;margin:4px 0 12px}
    #__kj_panel .kj-progress-bar{background:#4ade80;height:100%;transition:width .3s;width:0%}
    #__kj_panel .kj-status{font:11px/1.6 ui-monospace,Menlo,monospace;color:#aab;white-space:pre-wrap;word-break:break-word}
    #__kj_panel .kj-log{margin-top:10px;font:11px/1.5 ui-monospace,Menlo,monospace;max-height:340px;overflow-y:auto;background:#0a0c10;border-radius:6px;padding:8px}
    #__kj_panel .kj-log div{padding:2px 0;color:#888;white-space:pre-wrap;word-break:break-word}
    #__kj_panel .kj-log .ok{color:#4ade80}
    #__kj_panel .kj-log .err{color:#f87171}
    #__kj_panel .kj-log .warn{color:#fbbf24}
    #__kj_panel .kj-log .skip{color:#7a7e88}
    #__kj_panel .kj-log .info{color:#60a5fa}
    #__kj_panel .kj-error{margin-top:12px;padding:10px 12px;background:#2a1414;border:1px solid #4a1d1d;color:#f87171;border-radius:8px;font:11px/1.5 ui-monospace,monospace;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow-y:auto}
    #__kj_panel .kj-footer{padding:0 16px 16px}
  \`;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = '__kj_panel';
  panel.innerHTML = \`
    <div class="kj-head" id="__kj_head">
      <div class="kj-title">KEJAR <span>AUTO</span></div>
      <button class="kj-close" id="__kj_close">×</button>
    </div>
    <div class="kj-body" id="__kj_body"><div class="kj-status">Memuat…</div></div>
    <div class="kj-footer" id="__kj_footer" style="display:none">
      <button class="kj-btn" id="__kj_run" disabled>Jalankan</button>
    </div>
  \`;
  document.body.appendChild(panel);

  (() => {
    const head = panel.querySelector('#__kj_head');
    let d=false,sx=0,sy=0,ox=0,oy=0;
    head.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      d=true;
      const r=panel.getBoundingClientRect();
      sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top;
      panel.style.left=r.left+'px'; panel.style.top=r.top+'px';
      panel.style.right='auto'; panel.style.bottom='auto';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if(!d) return;
      panel.style.left=(ox+e.clientX-sx)+'px';
      panel.style.top =(oy+e.clientY-sy)+'px';
    });
    document.addEventListener('mouseup', () => d=false);
  })();

  const bodyEl = panel.querySelector('#__kj_body');
  const footerEl = panel.querySelector('#__kj_footer');
  const runBtn = panel.querySelector('#__kj_run');
  panel.querySelector('#__kj_close').addEventListener('click', () => { panel.remove(); style.remove(); });

  const showError = (title, err) => {
    const box = document.createElement('div');
    box.className = 'kj-error';
    const msg = err && (err.stack || err.message) || String(err);
    box.textContent = '⚠ ' + title + '\\n\\n' + msg;
    bodyEl.appendChild(box);
  };

  try {
    const token = document.querySelector('meta[name="csrf-token"]')?.content
                || document.querySelector('input[name="_token"]')?.value;
    if (!token) throw new Error('csrf-token tidak ditemukan. Paste di halaman app.kejar.id yang sudah login.');

    const GAMES = [
      { slug: 'toeic_reading_preparation', label: 'TOEIC Reading Preparations' },
      { slug: 'toeicwords', label: 'TOEIC Words' },
      { slug: 'obr', label: 'Operasi Bilangan Riil' },
      { slug: 'katabaku', label: 'Kata Baku' },
      { slug: 'vocabulary', label: 'Vocabulary' },
      { slug: 'menulisefektif', label: 'Menulis Efektif' }
    ];

    const urlMatch = location.pathname.match(/\\/games\\/([^/]+)\\//);
    const urlSlug = urlMatch ? urlMatch[1] : null;
    const preselect = PRESET_SLUG || urlSlug;
    const initialGame = GAMES.find(g => g.slug === preselect) || GAMES[0];

    const H = { 'X-Requested-With':'XMLHttpRequest', 'X-CSRF-TOKEN':token, 'Accept':'application/json' };
    const Hpost = Object.assign({ 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8' }, H);
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const getJson = async (url) => {
      const r = await fetch(url, { headers:H, credentials:'same-origin' });
      if (!r.ok) throw new Error('GET ' + url + ' → HTTP ' + r.status);
      return r.json();
    };

    const gamesOptions = GAMES.map(g => '<option value="' + g.slug + '"' + (g.slug===initialGame.slug?' selected':'') + '>' + g.label + '</option>').join('');

    bodyEl.innerHTML = \`
      <div class="kj-field">
        <div class="kj-label">Pilih Materi</div>
        <select id="__kj_game">\${gamesOptions}</select>
      </div>
      <div class="kj-field" id="__kj_range_wrap" style="display:none">
        <div class="kj-label" id="__kj_count">Memuat ronde…</div>
      </div>
      <div class="kj-row">
        <div class="kj-field">
          <div class="kj-label">Mulai dari</div>
          <select id="__kj_from"></select>
        </div>
        <div class="kj-field">
          <div class="kj-label">Sampai</div>
          <select id="__kj_to"></select>
        </div>
      </div>
      <div class="kj-field">
        <label class="kj-check"><input type="checkbox" id="__kj_skip" checked> Lewati ronde yang sudah skor 100</label>
      </div>
      <div class="kj-info" id="__kj_info">—</div>
    \`;

    const gameEl = bodyEl.querySelector('#__kj_game');
    const fromEl = bodyEl.querySelector('#__kj_from');
    const toEl   = bodyEl.querySelector('#__kj_to');
    const skipEl = bodyEl.querySelector('#__kj_skip');
    const infoEl = bodyEl.querySelector('#__kj_info');
    const countEl = bodyEl.querySelector('#__kj_count');
    const rangeWrap = bodyEl.querySelector('#__kj_range_wrap');

    let stages = [];

    const updateInfo = () => {
      const a = +fromEl.value, b = +toEl.value;
      if (b < a) { infoEl.textContent = '⚠ Ronde akhir harus ≥ awal'; runBtn.disabled = true; return; }
      infoEl.textContent = 'Akan memproses ' + (b - a + 1) + ' ronde';
      runBtn.disabled = false;
    };

    const loadStages = async (slug) => {
      countEl.textContent = 'Memuat ronde…';
      infoEl.textContent = '';
      const j = await getJson('/student/games/api/' + slug + '/stages');
      stages = (j.data || []).sort((a,b) => a.order - b.order);
      if (!stages.length) throw new Error('Slug "' + slug + '" tidak punya stage.');

      const urlSid = (location.pathname.match(/\\/stages\\/([^/]+)/) || [])[1];
      const curIdx = urlSid ? stages.findIndex(s => s.id === urlSid) : -1;
      const start = curIdx >= 0 ? curIdx : 0;

      fromEl.innerHTML = stages.map((s,i) => '<option value="' + i + '"' + (i===start?' selected':'') + '>#' + s.order + ' ' + s.title + '</option>').join('');
      toEl.innerHTML = stages.map((s,i) => '<option value="' + i + '"' + (i===Math.min(start+1, stages.length-1)?' selected':'') + '>#' + s.order + ' ' + s.title + '</option>').join('');

      countEl.textContent = 'Terdeteksi ' + stages.length + ' ronde';
      rangeWrap.style.display = 'block';
      updateInfo();
    };

    fromEl.addEventListener('change', updateInfo);
    toEl.addEventListener('change', updateInfo);

    gameEl.addEventListener('change', async () => {
      runBtn.disabled = true;
      try { await loadStages(gameEl.value); }
      catch (e) { showError('Gagal load ronde', e); }
    });

    try {
      await loadStages(gameEl.value);
      footerEl.style.display = 'block';
    } catch (e) {
      showError('Gagal memuat daftar ronde', e);
      footerEl.style.display = 'block';
      runBtn.disabled = true;
    }

    const postForm = async (url, fields, tk, tries = 3) => {
      const headers = tk ? Object.assign({}, Hpost, { 'X-CSRF-TOKEN': tk }) : Hpost;
      let lastErr;
      for (let i = 0; i < tries; i++) {
        try {
          const r = await fetch(url, { method:'POST', headers, credentials:'same-origin', body:new URLSearchParams(fields) });
          if (r.status === 429) { await sleep(500 * (i + 1)); lastErr = new Error('HTTP 429'); continue; }
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const t = await r.text();
          if (!t || !t.trim()) { lastErr = new Error('empty body'); await sleep(300 * (i + 1)); continue; }
          try { return JSON.parse(t); } catch (_) { lastErr = new Error('bad json'); continue; }
        } catch (e) {
          lastErr = e;
          if (i === tries - 1) throw e;
          await sleep(300 * (i + 1));
        }
      }
      throw lastErr || new Error('post failed');
    };

    const runBatch = async (items, worker, onProgress) => {
      const results = new Array(items.length);
      let idx = 0, done = 0;
      const n = Math.min(CONCURRENCY, items.length);
      const runners = Array.from({ length: n }, async () => {
        while (true) {
          const i = idx++;
          if (i >= items.length) return;
          try { results[i] = await worker(items[i], i); }
          catch (e) { results[i] = { ok: false, error: e.message }; }
          done++;
          if (onProgress) onProgress(done, items.length, results[i]);
          await sleep(DELAY_MS);
        }
      });
      await Promise.all(runners);
      return results;
    };

    const buildVariants = (rawAnswer) => {
      const set = new Set();
      const push = (s) => {
        if (typeof s !== 'string') return;
        const raw = s;
        const trimmed = raw.trim().replace(/\\s+/g, ' ');
        if (!trimmed) return;
        set.add(raw);
        set.add(trimmed);
        set.add(trimmed.toLowerCase());
        set.add(trimmed.toUpperCase());
        set.add(trimmed.replace(/[.!?]+$/, '').trim());
        if (raw.includes('/')) {
          raw.split('/').forEach(p => {
            const t = p.trim();
            if (t) { set.add(t); set.add(t.toLowerCase()); set.add(t.toUpperCase()); }
          });
        }
      };
      if (Array.isArray(rawAnswer)) rawAnswer.forEach(push);
      else if (typeof rawAnswer === 'string') push(rawAnswer);
      return Array.from(set).filter(x => x.length > 0);
    };

    const parseExams = (html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (doc.querySelector('.question-group')) {
        const dm = html.match(/var dataTask\\s*=\\s*(\\{[\\s\\S]*?\\});/);
        if (!dm) throw new Error('dataTask tidak ditemukan');
        const dataTask = JSON.parse(dm[1]);
        const tk = doc.querySelector('meta[name="csrf-token"]')?.content;
        const items = Array.from(doc.querySelectorAll('.question-group')).map(qg => ({
          id: qg.dataset.id,
          type: qg.dataset.type || 'pilihan_ganda',
          prompt: (qg.querySelector('.question p, ._pilihan_ganda_question p') || {}).innerText || '(?)',
          needsType: true
        }));
        return { kind: 'pilihan_ganda', taskId: dataTask.id, token: tk, items };
      }
      const form = doc.querySelector('form.question-list');
      if (form) {
        const items = Array.from(doc.querySelectorAll('.question-item')).map(qi => ({
          id: qi.dataset.id,
          type: form.dataset.type,
          prompt: qi.querySelector('.question-text')?.innerText.trim() || '(?)',
          needsType: false
        }));
        return {
          kind: form.dataset.type || 'vocabulary',
          taskId: form.dataset.task,
          checkUrl: form.dataset.check,
          token: doc.querySelector('input[name="_token"]')?.value,
          items
        };
      }
      throw new Error('Tipe soal tidak dikenal.');
    };

    runBtn.addEventListener('click', async () => {
      if (!stages.length) { showError('Ronde belum dimuat', new Error('Tunggu load selesai')); return; }
      const slug = gameEl.value;
      const a = +fromEl.value, b = +toEl.value, skip = skipEl.checked;
      const todo = stages.slice(a, b + 1);
      const apiBase = '/student/games/api/' + slug;
      const htmlBase = '/student/games/' + slug;

      bodyEl.innerHTML = \`
        <div class="kj-progress"><div class="kj-progress-bar" id="__kj_bar"></div></div>
        <div class="kj-status" id="__kj_stat">Memulai…</div>
        <div class="kj-log" id="__kj_log"></div>
      \`;
      footerEl.innerHTML = '<button class="kj-btn kj-secondary" id="__kj_stop">Hentikan</button>';
      let stopFlag = false;
      panel.querySelector('#__kj_stop').addEventListener('click', () => stopFlag = true);

      const barEl  = panel.querySelector('#__kj_bar');
      const statEl = panel.querySelector('#__kj_stat');
      const logEl  = panel.querySelector('#__kj_log');
      const addLog = (t, cls) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; };

      addLog('Materi: ' + slug, 'info');
      addLog('Rentang: ' + (a+1) + '–' + (b+1) + ' (' + todo.length + ' ronde)', 'info');

      let totalStages = 0, totalRounds = 0, totalPerfect = 0, grandOk = 0, grandFail = 0;
      const t0 = Date.now();

      for (let si = 0; si < todo.length; si++) {
        if (stopFlag) break;
        const stage = todo[si];
        const sLabel = '[' + (si+1) + '/' + todo.length + '] #' + stage.order + ' ' + stage.title;
        statEl.textContent = sLabel + '\\nmemuat babak…';
        addLog('\\n▶ ' + sLabel, 'ok');

        let rounds = [];
        try {
          const rr = await getJson(apiBase + '/stages/' + stage.id + '/rounds');
          rounds = (rr.data || []).sort((x,y) => x.order - y.order);
          addLog('  ' + rounds.length + ' babak ditemukan');
          totalStages++;
        } catch (e) { addLog('  ❌ ' + e.message, 'err'); continue; }

        for (let ri = 0; ri < rounds.length; ri++) {
          if (stopFlag) break;
          const round = rounds[ri];
          const rLabel = 'babak ' + (ri+1) + '/' + rounds.length + ': ' + round.title;

          if (skip) {
            const tasks = Array.isArray(round.task) ? round.task : [];
            const perfect = tasks.some(t => t.finish_time && parseFloat(t.score) >= 100);
            if (perfect) { addLog('  ⏭ ' + rLabel + ' (sudah 100)', 'skip'); continue; }
          }

          statEl.textContent = sLabel + '\\n' + rLabel + '\\nfetch /exams…';
          addLog('\\n  ▸ ' + rLabel, 'info');

          try {
            const examsUrl = htmlBase + '/stages/' + stage.id + '/rounds/' + round.id + '/exams';
            const r = await fetch(examsUrl, { credentials:'same-origin' });
            addLog('    HTTP ' + r.status);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const html = await r.text();
            const parsed = parseExams(html);
            addLog('    tipe="' + parsed.kind + '" soal=' + parsed.items.length, 'ok');
            if (parsed.items.length === 0) { addLog('    ⚠ 0 soal', 'warn'); continue; }

            const tk = parsed.token || token;
            const checkUrl = parsed.checkUrl || (htmlBase + '/stages/' + stage.id + '/rounds/' + round.id + '/check');
            const finishUrl = htmlBase + '/stages/' + stage.id + '/rounds/' + round.id + '/' + parsed.taskId + '/finishes';

            const worker = async (item) => {
              const preFields = { _token: tk, id: item.id, task_id: parsed.taskId, answer: 'zzz', repeatance: 'false' };
              if (item.needsType && item.type) preFields.type = item.type;
              const pre = await postForm(checkUrl, preFields, tk);
              if (!pre || !pre.answer) throw new Error('no-answer');
              const variants = buildVariants(pre.answer);
              for (const v of variants) {
                for (const rep of [false, true]) {
                  const sf = { _token: tk, id: item.id, task_id: parsed.taskId, answer: v, repeatance: rep ? 'true' : 'false' };
                  if (item.needsType && item.type) sf.type = item.type;
                  try {
                    const sub = await postForm(checkUrl, sf, tk);
                    if (sub && (sub.status === true || sub.status === 'true')) return { ok: true };
                  } catch (_) {}
                }
              }
              throw new Error('all-variants-failed');
            };

            let ok = 0, fail = 0;
            await runBatch(parsed.items, worker, (done, total, res) => {
              if (res.ok) ok++; else fail++;
              statEl.textContent = sLabel + '\\n' + rLabel + '\\nsoal ' + done + '/' + total + ' — ok=' + ok + ' fail=' + fail;
            });

            addLog('    hasil: ok=' + ok + ' fail=' + fail, fail > 0 ? 'warn' : 'ok');

            try { await postForm(finishUrl, { _token: tk }, tk); } catch (_) {}
            await sleep(FINISH_GAP);

            let score = null;
            try {
              const rj = await getJson(apiBase + '/stages/' + stage.id + '/rounds');
              const r2 = (rj.data || []).find(x => x.id === round.id);
              const t2 = r2 && r2.task && r2.task.find(t => t.id === parsed.taskId);
              if (t2) score = t2.score;
            } catch (_) {}

            totalRounds++;
            grandOk += ok; grandFail += fail;
            if (parseFloat(score) >= 100) totalPerfect++;
            addLog('    ' + (fail > 0 ? '⚠' : '✅') + ' selesai: ok=' + ok + ' fail=' + fail + ' score=' + (score ?? '-'), fail > 0 ? 'warn' : 'ok');
          } catch (e) { addLog('    ❌ ' + rLabel + ': ' + e.message, 'err'); }
          await sleep(ROUND_GAP);
        }
        barEl.style.width = ((si+1)/todo.length*100) + '%';
        await sleep(ROUND_GAP);
      }

      const dur = ((Date.now() - t0) / 1000).toFixed(1);
      statEl.innerHTML = '<b>' + (stopFlag ? '⏹ Dihentikan' : '✅ Selesai') + '</b>\\nRonde (stage): ' + totalStages + '\\nBabak: ' + totalRounds + ' (perfect: ' + totalPerfect + ')\\nSoal: ok=' + grandOk + ' fail=' + grandFail + '\\nDurasi: ' + dur + 's';
      barEl.style.background = grandFail > 0 ? '#fbbf24' : (stopFlag ? '#f87171' : '#4ade80');
    });

  } catch (fatal) {
    showError('FATAL', fatal);
  }
})();`;
};
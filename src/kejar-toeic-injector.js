// ═══════════════════════════════════════════════════════════════
//  KEJAR TOEIC — Injector Script Builder
//  Support: toeicwords (Words) + toeic_reading_preparation (Reading)
// ═══════════════════════════════════════════════════════════════

window.buildKejarInjectorScript = function (gameId) {
  const game = window.KEJAR_TOEIC_GAMES?.[gameId];
  if (!game) throw new Error('Game tidak dikenal: ' + gameId);

  switch (gameId) {
    case 'words':   return buildWordsScript(game.slug);
    case 'reading': return buildReadingScript(game.slug);
    default:        throw new Error('Injector belum ada untuk: ' + gameId);
  }
};

// ═══════════════════════════════════════════════════════════════
//  TOEIC WORDS
//  - Soal input teks (typing)
//  - Panel pilih ronde + rentang babak
// ═══════════════════════════════════════════════════════════════
function buildWordsScript(slug) {
  return `(async () => {
  document.getElementById('__tw_panel')?.remove();
  document.getElementById('__tw_style')?.remove();

  const AUTO_RELOAD = true;
  const DELAY_MS = 300;
  const WAIT_ROUND_MS = 800;
  const GAME = '${slug}';
  const API_BASE  = '/student/games/api/' + GAME;
  const HTML_BASE = '/student/games/' + GAME;

  const style = document.createElement('style');
  style.id = '__tw_style';
  style.textContent = \`
    #__tw_panel{position:fixed;top:16px;right:16px;z-index:2147483647;background:#0f1115;color:#e4e6eb;font:13px -apple-system,system-ui,sans-serif;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06);width:400px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden}
    #__tw_panel .tw-head{padding:14px 16px;border-bottom:1px solid #1f2229;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none}
    #__tw_panel .tw-title{font-weight:700;font-size:13px;color:#fff}
    #__tw_panel .tw-title span{color:#4ade80}
    #__tw_panel .tw-close{background:transparent;border:none;color:#666;cursor:pointer;font-size:20px;padding:0 6px;border-radius:6px}
    #__tw_panel .tw-close:hover{background:#1f2229;color:#fff}
    #__tw_panel .tw-body{padding:16px;overflow-y:auto;flex:1}
    #__tw_panel .tw-label{font-size:10px;text-transform:uppercase;color:#7a7e88;letter-spacing:.6px;margin-bottom:6px;font-weight:700}
    #__tw_panel select{width:100%;background:#1a1d23;color:#e4e6eb;border:1px solid #2a2e36;border-radius:8px;padding:9px 10px;font:inherit;outline:none}
    #__tw_panel .tw-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
    #__tw_panel .tw-check{display:flex;align-items:center;gap:8px;font-size:12px;color:#aab;cursor:pointer;margin-bottom:12px}
    #__tw_panel .tw-check input{accent-color:#4ade80;cursor:pointer}
    #__tw_panel .tw-info{font-size:11px;color:#7a7e88;text-align:center;margin-bottom:12px}
    #__tw_panel .tw-list{border:1px solid #1f2229;border-radius:8px;max-height:180px;overflow-y:auto;margin-bottom:14px}
    #__tw_panel .tw-item{padding:8px 12px;border-bottom:1px solid #1f2229;font-size:11.5px;display:flex;align-items:center;gap:8px}
    #__tw_panel .tw-item:last-child{border-bottom:none}
    #__tw_panel .tw-item .tw-num{color:#7a7e88;font:10px ui-monospace,monospace;min-width:22px}
    #__tw_panel .tw-item .tw-name{flex:1;color:#e4e6eb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #__tw_panel .tw-item .tw-badge{font:9px ui-monospace,monospace;padding:2px 6px;border-radius:4px;background:#1a1d23;color:#7a7e88}
    #__tw_panel .tw-item .tw-badge.done{background:rgba(74,222,128,.1);color:#4ade80}
    #__tw_panel .tw-progress{background:#1a1d23;border-radius:6px;overflow:hidden;height:6px;margin:6px 0 12px}
    #__tw_panel .tw-bar{background:#4ade80;height:100%;transition:width .3s;width:0%}
    #__tw_panel .tw-status{font:11px/1.5 ui-monospace,monospace;color:#aab;white-space:pre-wrap;margin-bottom:10px;min-height:36px}
    #__tw_panel .tw-log{font:11px/1.5 ui-monospace,monospace;max-height:160px;overflow-y:auto;border-top:1px solid #1f2229;padding-top:10px}
    #__tw_panel .tw-log div{padding:2px 0;color:#666}
    #__tw_panel .tw-log .ok{color:#4ade80}
    #__tw_panel .tw-log .err{color:#f87171}
    #__tw_panel .tw-log .warn{color:#fbbf24}
    #__tw_panel .tw-log .info{color:#60a5fa}
    #__tw_panel .tw-footer{padding:0 16px 16px;display:flex;gap:8px}
    #__tw_panel .tw-btn{flex:1;background:#4ade80;color:#0f1115;border:none;border-radius:8px;padding:11px;font:inherit;font-weight:700;cursor:pointer}
    #__tw_panel .tw-btn:disabled{opacity:.35;cursor:not-allowed}
  \`;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = '__tw_panel';
  panel.innerHTML = \`
    <div class="tw-head">
      <div class="tw-title">TOEIC <span>WORDS</span></div>
      <button class="tw-close">×</button>
    </div>
    <div class="tw-body"><div class="tw-status">Memuat ronde…</div></div>
    <div class="tw-footer" style="display:none">
      <button class="tw-btn" id="__tw_run" disabled>Jalankan</button>
    </div>
  \`;
  document.body.appendChild(panel);

  (() => {
    const h = panel.querySelector('.tw-head');
    let drag=false,sx,sy,ox,oy;
    h.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      drag=true;
      const r = panel.getBoundingClientRect();
      sx=e.clientX;sy=e.clientY;ox=r.left;oy=r.top;
      panel.style.left=r.left+'px';panel.style.top=r.top+'px';
      panel.style.right='auto';panel.style.bottom='auto';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if(!drag)return;
      panel.style.left=(ox+e.clientX-sx)+'px';
      panel.style.top=(oy+e.clientY-sy)+'px';
    });
    document.addEventListener('mouseup',()=>drag=false);
  })();

  panel.querySelector('.tw-close').onclick = () => { panel.remove(); style.remove(); };

  const bodyEl = panel.querySelector('.tw-body');
  const footerEl = panel.querySelector('.tw-footer');
  const runBtn = panel.querySelector('#__tw_run');

  const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
  if (!csrf) { bodyEl.innerHTML = '<div class="tw-status" style="color:#f87171">❌ CSRF tidak ada</div>'; return; }

  const H = { 'X-Requested-With':'XMLHttpRequest', 'X-CSRF-TOKEN':csrf, 'Accept':'application/json' };
  const Hpost = { 'X-Requested-With':'XMLHttpRequest', 'X-CSRF-TOKEN':csrf, 'Accept':'*/*', 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8' };

  const getJson = async (url) => {
    const r = await fetch(url, { headers: H, credentials:'same-origin' });
    if (!r.ok) throw new Error('GET ' + r.status);
    return r.json();
  };
  const post = async (url, data) => {
    const r = await fetch(url, { method:'POST', headers: Hpost, credentials:'same-origin', body: new URLSearchParams(data) });
    const t = await r.text();
    try { return JSON.parse(t); } catch (_) { return { _raw: t.slice(0,200) }; }
  };

  const sr = await getJson(API_BASE + '/stages');
  const rondes = (sr.data || []).sort((a,b) => a.order - b.order);
  if (!rondes.length) { bodyEl.innerHTML = '<div class="tw-status">❌ Nggak ada ronde</div>'; return; }

  const urlStageId = location.pathname.match(/stages\\/([^\\/]+)/)?.[1];
  let currentRonde = rondes.find(r => r.id === urlStageId) || rondes[0];

  async function renderRonde(rondeId) {
    bodyEl.innerHTML = '<div class="tw-status">Memuat babak…</div>';
    footerEl.style.display = 'none';

    const rr = await getJson(API_BASE + '/stages/' + rondeId + '/rounds');
    const rounds = (rr.data || []).sort((a,b) => a.order - b.order);

    const rondeOptions = rondes.map(r =>
      \`<option value="\${r.id}" \${r.id === rondeId ? 'selected' : ''}>#\${r.order} \${r.title}</option>\`
    ).join('');

    if (!rounds.length) {
      bodyEl.innerHTML = \`<div class="tw-label">Ronde</div><select id="__tw_ronde">\${rondeOptions}</select><div class="tw-status" style="margin-top:14px">⚠ Ronde ini nggak punya babak</div>\`;
      panel.querySelector('#__tw_ronde').onchange = e => renderRonde(e.target.value);
      return;
    }

    const listHtml = rounds.map((r, i) => {
      const tasks = Array.isArray(r.task) ? r.task : [];
      const perfect = tasks.some(t => t.finish_time && parseFloat(t.score) >= 100);
      return \`<div class="tw-item"><span class="tw-num">#\${r.order}</span><span class="tw-name">\${r.title}</span><span class="tw-badge \${perfect ? 'done' : ''}">\${perfect ? '100' : '—'}</span></div>\`;
    }).join('');

    const opts = rounds.map((r, i) => \`<option value="\${i}">#\${r.order} \${r.title}</option>\`).join('');

    let lastNotPerfect = rounds.length - 1;
    for (let i = rounds.length - 1; i >= 0; i--) {
      const tasks = Array.isArray(rounds[i].task) ? rounds[i].task : [];
      const perfect = tasks.some(t => t.finish_time && parseFloat(t.score) >= 100);
      if (!perfect) { lastNotPerfect = i; break; }
    }

    bodyEl.innerHTML = \`
      <div class="tw-label">Ronde</div>
      <select id="__tw_ronde" style="margin-bottom:14px">\${rondeOptions}</select>

      <div class="tw-label">Rentang babak</div>
      <div class="tw-row2">
        <div>
          <div style="font-size:10px;color:#7a7e88;margin-bottom:4px;text-transform:uppercase">Dari</div>
          <select id="__tw_from">\${opts}</select>
        </div>
        <div>
          <div style="font-size:10px;color:#7a7e88;margin-bottom:4px;text-transform:uppercase">Sampai</div>
          <select id="__tw_to">\${opts}</select>
        </div>
      </div>

      <label class="tw-check">
        <input type="checkbox" id="__tw_skip" checked>
        <span>Lewati babak yang sudah skor 100</span>
      </label>

      <div class="tw-info" id="__tw_info">—</div>
      <div class="tw-label">Daftar babak (\${rounds.length})</div>
      <div class="tw-list">\${listHtml}</div>
      <div class="tw-progress"><div class="tw-bar"></div></div>
      <div class="tw-status">Siap dijalankan.</div>
      <div class="tw-log"></div>
    \`;

    const rondeEl = panel.querySelector('#__tw_ronde');
    const fromEl  = panel.querySelector('#__tw_from');
    const toEl    = panel.querySelector('#__tw_to');
    const skipEl  = panel.querySelector('#__tw_skip');
    const infoEl  = panel.querySelector('#__tw_info');
    const barEl   = panel.querySelector('.tw-bar');
    const logEl   = panel.querySelector('.tw-log');
    const statEl  = panel.querySelector('.tw-status');

    fromEl.value = '0';
    toEl.value = String(lastNotPerfect);

    const updateInfo = () => {
      const a = +fromEl.value, b = +toEl.value;
      if (b < a) { infoEl.innerHTML = '<span style="color:#f87171">⚠ Babak akhir harus ≥ awal</span>'; runBtn.disabled = true; return; }
      const selected = rounds.slice(a, b + 1);
      let toRun = selected.length;
      if (skipEl.checked) {
        toRun = selected.filter(r => {
          const tasks = Array.isArray(r.task) ? r.task : [];
          return !tasks.some(t => t.finish_time && parseFloat(t.score) >= 100);
        }).length;
      }
      infoEl.textContent = \`Akan memproses \${toRun} babak (dari \${selected.length} dipilih)\`;
      runBtn.disabled = toRun === 0;
    };

    rondeEl.onchange = e => renderRonde(e.target.value);
    fromEl.onchange = updateInfo;
    toEl.onchange = updateInfo;
    skipEl.onchange = updateInfo;
    updateInfo();
    footerEl.style.display = 'flex';

    runBtn.onclick = async () => {
      const a = +fromEl.value, b = +toEl.value;
      if (b < a) return;
      let selected = rounds.slice(a, b + 1);
      if (skipEl.checked) {
        selected = selected.filter(r => {
          const tasks = Array.isArray(r.task) ? r.task : [];
          return !tasks.some(t => t.finish_time && parseFloat(t.score) >= 100);
        });
      }
      if (!selected.length) { statEl.textContent = '⚠ Nggak ada babak untuk dijalankan'; return; }

      runBtn.disabled = true;
      runBtn.textContent = 'Menjalankan…';
      logEl.innerHTML = '';

      const addLog = (t, c) => {
        const d = document.createElement('div');
        if (c) d.className = c;
        d.textContent = t;
        logEl.appendChild(d);
        logEl.scrollTop = logEl.scrollHeight;
      };

      let totalOk = 0, totalFail = 0, doneRounds = 0;

      for (let ri = 0; ri < selected.length; ri++) {
        const round = selected[ri];
        const label = \`[\${ri+1}/\${selected.length}] #\${round.order} \${round.title}\`;
        statEl.textContent = label + '\\nmemuat soal…';
        addLog('▶ ' + label, 'info');

        try {
          const examsUrl = HTML_BASE + '/stages/' + rondeId + '/rounds/' + round.id + '/exams';
          const html = await fetch(examsUrl, { credentials:'same-origin' }).then(r => r.text());
          const doc = new DOMParser().parseFromString(html, 'text/html');

          const dm = html.match(/var dataTask\\s*=\\s*(\\{[\\s\\S]*?\\});/);
          if (!dm) throw new Error('dataTask tidak ada');
          const dataTask = JSON.parse(dm[1]);
          const taskId = dataTask.id;

          const ids = [...doc.querySelectorAll('.question-item[data-repeatance="0"]')].map(el => el.dataset.id).filter(Boolean);
          if (!ids.length) { addLog('  ⚠ 0 soal', 'warn'); continue; }
          addLog('  ' + ids.length + ' soal', 'ok');

          const checkUrl  = HTML_BASE + '/stages/' + rondeId + '/rounds/' + round.id + '/check';
          const finishUrl = HTML_BASE + '/stages/' + rondeId + '/rounds/' + round.id + '/' + taskId + '/finishes';

          let ok = 0, fail = 0;
          for (let i = 0; i < ids.length; i++) {
            const qid = ids[i];
            statEl.textContent = label + '\\nsoal ' + (i+1) + '/' + ids.length + ' — ok=' + ok + ' fail=' + fail;
            try {
              const pre = await post(checkUrl, { id: qid, task_id: taskId, answer: 'x', repeatance: 'false', type: 'TEXT', _token: csrf });
              const correct = pre.answer || pre.correct_answer || pre.correct;
              if (!correct) { fail++; continue; }

              await new Promise(r => setTimeout(r, 120));
              const sub = await post(checkUrl, { id: qid, task_id: taskId, answer: correct, repeatance: 'false', type: 'TEXT', _token: csrf });
              if (sub.status === true || sub.is_correct === true) ok++;
              else fail++;
            } catch (_) { fail++; }
            await new Promise(r => setTimeout(r, DELAY_MS));
          }

          try { await post(finishUrl, { _token: csrf }); } catch (_) {}
          addLog('  ✅ ok=' + ok + ' fail=' + fail, 'ok');
          totalOk += ok; totalFail += fail; doneRounds++;
        } catch (e) {
          addLog('  ❌ ' + e.message, 'err');
          totalFail++;
        }
        barEl.style.width = Math.round(((ri+1)/selected.length)*100) + '%';
        await new Promise(r => setTimeout(r, WAIT_ROUND_MS));
      }

      statEl.innerHTML = '<b>✅ Selesai</b>\\nBabak: ' + doneRounds + '\\nSoal: ok=' + totalOk + ' fail=' + totalFail;
      barEl.style.background = totalFail === 0 ? '#4ade80' : '#fbbf24';
      runBtn.disabled = false;
      runBtn.textContent = 'Jalankan lagi';

      if (AUTO_RELOAD) {
        addLog('🔄 Reload 3s…', 'info');
        setTimeout(() => location.reload(), 3000);
      }
    };
  }

  await renderRonde(currentRonde.id);
})();`;
}

// ═══════════════════════════════════════════════════════════════
//  TOEIC READING PREPARATIONS
//  - Soal pilihan ganda (.question-group)
//  - Panel pilih rentang ronde
// ═══════════════════════════════════════════════════════════════
function buildReadingScript(slug) {
  return `(async () => {
  document.getElementById('__kejar_panel')?.remove();
  document.getElementById('__kejar_style')?.remove();

  const style = document.createElement('style');
  style.id = '__kejar_style';
  style.textContent = \`
    #__kejar_panel{position:fixed;top:16px;right:16px;z-index:2147483647;background:#0f1115;color:#e4e6eb;font:13px -apple-system,system-ui,sans-serif;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06);width:380px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden}
    #__kejar_panel .kp-head{padding:14px 16px;border-bottom:1px solid #1f2229;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none}
    #__kejar_panel .kp-title{font-weight:700;font-size:13px;color:#fff}
    #__kejar_panel .kp-title span{color:#4ade80}
    #__kejar_panel .kp-close{background:transparent;border:none;color:#666;cursor:pointer;font-size:20px;padding:0 6px;border-radius:6px}
    #__kejar_panel .kp-close:hover{background:#1f2229;color:#fff}
    #__kejar_panel .kp-body{padding:16px;overflow-y:auto;flex:1}
    #__kejar_panel .kp-label{font-size:10px;text-transform:uppercase;color:#7a7e88;letter-spacing:.6px;margin-bottom:6px;font-weight:700}
    #__kejar_panel .kp-field{margin-bottom:14px}
    #__kejar_panel select{width:100%;background:#1a1d23;color:#e4e6eb;border:1px solid #2a2e36;border-radius:8px;padding:9px 10px;font:inherit;outline:none}
    #__kejar_panel .kp-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    #__kejar_panel .kp-check{display:flex;align-items:center;gap:8px;font-size:12px;color:#aab;cursor:pointer}
    #__kejar_panel .kp-check input{accent-color:#4ade80}
    #__kejar_panel .kp-btn{width:100%;background:#4ade80;color:#0f1115;border:none;border-radius:8px;padding:11px;font:inherit;font-weight:700;cursor:pointer}
    #__kejar_panel .kp-btn:disabled{opacity:.35;cursor:not-allowed}
    #__kejar_panel .kp-btn.kp-secondary{background:#2a2e36;color:#e4e6eb;margin-top:8px}
    #__kejar_panel .kp-info{font-size:11px;color:#7a7e88;margin-top:8px;text-align:center}
    #__kejar_panel .kp-progress{background:#1a1d23;border-radius:6px;overflow:hidden;height:6px;margin:4px 0 12px}
    #__kejar_panel .kp-progress-bar{background:#4ade80;height:100%;transition:width .3s;width:0%}
    #__kejar_panel .kp-status{font:11px/1.6 ui-monospace,Menlo,monospace;color:#aab;white-space:pre-wrap;word-break:break-word}
    #__kejar_panel .kp-log{margin-top:10px;font:11px/1.5 ui-monospace,Menlo,monospace;max-height:200px;overflow-y:auto}
    #__kejar_panel .kp-log div{padding:2px 0;color:#666}
    #__kejar_panel .kp-log .ok{color:#4ade80}
    #__kejar_panel .kp-log .err{color:#f87171}
    #__kejar_panel .kp-log .skip{color:#7a7e88}
    #__kejar_panel .kp-footer{padding:0 16px 16px}
  \`;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = '__kejar_panel';
  panel.innerHTML = \`
    <div class="kp-head" id="__kp_head">
      <div class="kp-title">KEJAR <span>TOEIC</span></div>
      <button class="kp-close" id="__kp_close">×</button>
    </div>
    <div class="kp-body" id="__kp_body">
      <div class="kp-status" id="__kp_init">Memuat daftar ronde…</div>
    </div>
    <div class="kp-footer" id="__kp_footer" style="display:none">
      <button class="kp-btn" id="__kp_run" disabled>Jalankan</button>
    </div>
  \`;
  document.body.appendChild(panel);

  (() => {
    const head = panel.querySelector('#__kp_head');
    let dragging=false, sx=0, sy=0, ox=0, oy=0;
    head.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      dragging=true;
      const r = panel.getBoundingClientRect();
      sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top;
      panel.style.left=r.left+'px'; panel.style.top=r.top+'px';
      panel.style.right='auto'; panel.style.bottom='auto';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      panel.style.left=(ox+e.clientX-sx)+'px';
      panel.style.top =(oy+e.clientY-sy)+'px';
    });
    document.addEventListener('mouseup', () => dragging=false);
  })();

  const closeBtn = panel.querySelector('#__kp_close');
  const bodyEl   = panel.querySelector('#__kp_body');
  const footerEl = panel.querySelector('#__kp_footer');
  const runBtn   = panel.querySelector('#__kp_run');
  const initEl   = panel.querySelector('#__kp_init');
  closeBtn.addEventListener('click', () => { panel.remove(); style.remove(); });

  try {
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!token) throw new Error('csrf-token tidak ditemukan');

    const GAME = '${slug}';
    const API_BASE = '/student/games/api/' + GAME;
    const HTML_BASE = '/student/games/' + GAME;

    const H = { 'X-Requested-With':'XMLHttpRequest', 'X-CSRF-TOKEN':token, 'Accept':'application/json' };
    const Hpost = Object.assign({ 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8' }, H);
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const getJson = async (url) => {
      const r = await fetch(url, { headers:H, credentials:'same-origin' });
      if (!r.ok) throw new Error('GET ' + r.status);
      return r.json();
    };
    const postForm = async (url, fields, tk) => {
      const headers = tk ? Object.assign({}, Hpost, { 'X-CSRF-TOKEN': tk }) : Hpost;
      const r = await fetch(url, { method:'POST', headers, credentials:'same-origin', body:new URLSearchParams(fields) });
      if (!r.ok) throw new Error('POST ' + r.status);
      const t = await r.text();
      try { return JSON.parse(t); } catch (_) { return { _raw: t }; }
    };

    const stagesRes = await getJson(API_BASE + '/stages');
    const stages = (stagesRes.data || []).sort((a,b) => a.order - b.order);
    if (stages.length === 0) throw new Error('Tidak ada ronde.');

    const urlMatch = location.pathname.match(/stages\\/([^/]+)/);
    const curIdx = urlMatch ? stages.findIndex(s => s.id === urlMatch[1]) : -1;
    const startDefault = curIdx >= 0 ? curIdx : 0;

    bodyEl.innerHTML = \`
      <div class="kp-field"><div class="kp-label">Terdeteksi \${stages.length} ronde</div></div>
      <div class="kp-row">
        <div class="kp-field">
          <div class="kp-label">Mulai dari</div>
          <select id="__kp_from">
            \${stages.map((s,i) => \`<option value="\${i}" \${i===startDefault?'selected':''}>#\${s.order} \${s.title}</option>\`).join('')}
          </select>
        </div>
        <div class="kp-field">
          <div class="kp-label">Sampai</div>
          <select id="__kp_to">
            \${stages.map((s,i) => \`<option value="\${i}" \${i===Math.min(startDefault+1,stages.length-1)?'selected':''}>#\${s.order} \${s.title}</option>\`).join('')}
          </select>
        </div>
      </div>
      <div class="kp-field">
        <label class="kp-check"><input type="checkbox" id="__kp_skip" checked> Lewati yang sudah skor 100</label>
      </div>
      <div class="kp-info" id="__kp_info">—</div>
    \`;

    const fromEl = bodyEl.querySelector('#__kp_from');
    const toEl   = bodyEl.querySelector('#__kp_to');
    const skipEl = bodyEl.querySelector('#__kp_skip');
    const infoEl = bodyEl.querySelector('#__kp_info');

    const updateInfo = () => {
      const a = +fromEl.value, b = +toEl.value;
      if (b < a) { infoEl.textContent = '⚠ Ronde akhir harus ≥ awal'; runBtn.disabled = true; return; }
      infoEl.textContent = \`Akan memproses \${b - a + 1} ronde\`;
      runBtn.disabled = false;
    };
    fromEl.addEventListener('change', updateInfo);
    toEl.addEventListener('change', updateInfo);
    updateInfo();
    footerEl.style.display = 'block';
    initEl.remove();

    runBtn.addEventListener('click', async () => {
      const a = +fromEl.value, b = +toEl.value, skip = skipEl.checked;
      const todo = stages.slice(a, b + 1);

      bodyEl.innerHTML = \`
        <div class="kp-progress"><div class="kp-progress-bar" id="__kp_bar"></div></div>
        <div class="kp-status" id="__kp_stat">Memulai…</div>
        <div class="kp-log" id="__kp_log"></div>
      \`;
      footerEl.innerHTML = \`<button class="kp-btn kp-secondary" id="__kp_stop">Hentikan</button>\`;
      let stopFlag = false;
      panel.querySelector('#__kp_stop').addEventListener('click', () => stopFlag = true);

      const barEl  = panel.querySelector('#__kp_bar');
      const statEl = panel.querySelector('#__kp_stat');
      const logEl  = panel.querySelector('#__kp_log');
      const addLog = (t, cls) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; };

      let grandOk = 0, grandFail = 0, totalRounds = 0, totalPerfect = 0;

      for (let si = 0; si < todo.length; si++) {
        if (stopFlag) break;
        const stage = todo[si];
        const label = \`[\${si+1}/\${todo.length}] #\${stage.order} \${stage.title}\`;
        statEl.textContent = \`\${label}\\nmemuat babak…\`;

        try {
          const rr = await getJson(API_BASE + '/stages/' + stage.id + '/rounds');
          const rounds = (rr.data || []).sort((a,b) => a.order - b.order);
          addLog(\`▶ \${label}\`, 'ok');

          for (let ri = 0; ri < rounds.length; ri++) {
            if (stopFlag) break;
            const round = rounds[ri];
            const rlabel = \`babak \${ri+1}/\${rounds.length}: \${round.title}\`;

            if (skip) {
              const tasks = Array.isArray(round.task) ? round.task : [];
              const perfect = tasks.some(t => t.finish_time && parseFloat(t.score) >= 100);
              if (perfect) { addLog(\`  ⏭ \${rlabel}\`, 'skip'); continue; }
            }

            statEl.textContent = \`\${label}\\n\${rlabel}\\nmenyiapkan…\`;
            try {
              const examsUrl = \`\${HTML_BASE}/stages/\${stage.id}/rounds/\${round.id}/exams\`;
              const html = await fetch(examsUrl, { credentials:'same-origin' }).then(r => r.text());
              const doc = new DOMParser().parseFromString(html, 'text/html');
              const dm = html.match(/var dataTask\\s*=\\s*(\\{[\\s\\S]*?\\});/);
              if (!dm) throw new Error('dataTask tidak ada');
              const dataTask = JSON.parse(dm[1]);
              const taskId = dataTask.id;
              const tk2 = doc.querySelector('meta[name="csrf-token"]')?.content || token;
              const groups = Array.from(doc.querySelectorAll('.question-group'));
              if (groups.length === 0) { addLog(\`  ⚠ \${rlabel}: 0 soal\`, 'err'); continue; }

              const checkUrl  = \`\${HTML_BASE}/stages/\${stage.id}/rounds/\${round.id}/check\`;
              const finishUrl = \`\${HTML_BASE}/stages/\${stage.id}/rounds/\${round.id}/\${taskId}/finishes\`;

              let ok = 0, fail = 0;
              for (let qi = 0; qi < groups.length; qi++) {
                if (stopFlag) break;
                const qg = groups[qi];
                const qid = qg.dataset.id, qtype = qg.dataset.type;
                statEl.textContent = \`\${label}\\n\${rlabel}\\nsoal \${qi+1}/\${groups.length} — ok=\${ok} fail=\${fail}\`;
                try {
                  const pre = await postForm(checkUrl, { id:qid, task_id:taskId, answer:'A', repeatance:'false', type:qtype, _token:tk2 }, tk2);
                  if (!pre || !pre.answer) { fail++; continue; }
                  const sub = await postForm(checkUrl, { id:qid, task_id:taskId, answer:pre.answer, repeatance:'false', type:qtype, _token:tk2 }, tk2);
                  if (sub.status) ok++; else fail++;
                } catch (_) { fail++; }
                await sleep(150);
              }

              try { await postForm(finishUrl, { _token: tk2 }, tk2); } catch (_) {}
              await sleep(400);
              let score = null;
              try {
                const rj = await getJson(API_BASE + '/stages/' + stage.id + '/rounds');
                const r2 = (rj.data || []).find(x => x.id === round.id);
                const t2 = r2 && r2.task && r2.task.find(t => t.id === taskId);
                if (t2) score = t2.score;
              } catch (_) {}

              grandOk += ok; grandFail += fail; totalRounds++;
              if (parseFloat(score) >= 100) totalPerfect++;
              addLog(\`  ✅ \${rlabel}: ok=\${ok} fail=\${fail} score=\${score ?? '-'}\`, 'ok');
            } catch (e) {
              addLog(\`  ❌ \${rlabel}: \${e.message}\`, 'err');
            }
            await sleep(300);
          }
        } catch (e) { addLog(\`❌ \${label}: \${e.message}\`, 'err'); }
        barEl.style.width = \`\${((si+1)/todo.length)*100}%\`;
        await sleep(600);
      }

      statEl.innerHTML = \`<b>\${stopFlag ? '⏹ Dihentikan' : '✅ Selesai'}</b>\\nRonde: \${todo.length}\\nBabak: \${totalRounds} (perfect: \${totalPerfect})\\nSoal: ok=\${grandOk} fail=\${grandFail}\`;
      barEl.style.background = stopFlag ? '#f87171' : '#4ade80';
    });

  } catch (e) {
    initEl.innerHTML = \`<span style="color:#f87171">Error: \${e.message}</span>\`;
  }
})();`;
}
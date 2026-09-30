window.openKejarToeic = function (gameId) {
  const game = window.KEJAR_TOEIC_GAMES?.[gameId];
  if (!game) { alert('Game tidak dikenal: ' + gameId); return; }

  let script;
  try {
    script = window.buildKejarInjectorScript(gameId);   // ← FIX: pakai gameId, bukan slug
  } catch (e) {
    alert('Injector error: ' + e.message);
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = '__kj_modal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:#0f1115;color:#e4e6eb;font:14px system-ui,sans-serif;border-radius:14px;max-width:720px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.7);overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid #1f2229;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:#7a7e88;font-weight:700">Kejar TOEIC</div>
          <div style="font-size:17px;font-weight:700;margin-top:2px">${game.label}</div>
          <div style="font-size:12px;color:#7a7e88;margin-top:4px">${game.tagline}</div>
        </div>
        <button id="__kj_close" style="background:transparent;border:none;color:#666;font-size:24px;cursor:pointer;padding:0 8px">×</button>
      </div>
      <div style="padding:20px 24px">
        <ol style="margin:0 0 14px 0;padding-left:18px;font-size:13px;line-height:1.9;color:#aab">
          <li>Klik <b style="color:#fff">Buka Kejar.id</b> — tab baru terbuka. Login kalau diminta.</li>
          <li>Buka browser DevTools (<b style="color:#fff">F12</b>) → tab Console.</li>
          <li>Klik <b style="color:#fff">Copy Script</b> di bawah, paste ke Console, tekan Enter.</li>
          <li>Panel muncul — pilih ronde & babak, klik <b style="color:#fff">Jalankan</b>.</li>
        </ol>
        <div style="display:flex;gap:10px;margin-bottom:14px">
          <button id="__kj_open" style="flex:1;background:#2a2e36;color:#e4e6eb;border:none;border-radius:8px;padding:11px;font:inherit;font-weight:600;cursor:pointer">
            Buka Kejar.id ↗
          </button>
          <button id="__kj_copy" style="flex:1;background:#4ade80;color:#0f1115;border:none;border-radius:8px;padding:11px;font:inherit;font-weight:700;cursor:pointer">
            Copy Script
          </button>
        </div>
        <details style="margin-top:8px">
          <summary style="cursor:pointer;color:#7a7e88;font-size:12px;user-select:none">Lihat script (klik untuk expand)</summary>
          <textarea id="__kj_ta" readonly style="margin-top:10px;width:100%;height:180px;background:#1a1d23;color:#aab;border:1px solid #2a2e36;border-radius:8px;padding:10px;font:11px/1.4 ui-monospace,monospace;resize:vertical">${script.replace(/</g, '&lt;')}</textarea>
        </details>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#__kj_close').onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };

  overlay.querySelector('#__kj_open').onclick = () => {
    window.open(`https://app.kejar.id/student/games/${game.slug}/${game.path}`, '_blank');
  };

  overlay.querySelector('#__kj_copy').onclick = async () => {
    const btn = overlay.querySelector('#__kj_copy');
    try {
      await navigator.clipboard.writeText(script);
      btn.textContent = '✓ Tersalin!';
      setTimeout(() => btn.textContent = 'Copy Script', 1500);
    } catch (_) {
      const ta = overlay.querySelector('#__kj_ta');
      ta.style.display = 'block';
      ta.select();
      document.execCommand('copy');
      btn.textContent = '✓ Tersalin!';
      setTimeout(() => btn.textContent = 'Copy Script', 1500);
    }
  };
};
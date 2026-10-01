// Render section TOEIC + Matrikulasi
(function () {
  const GAMES = window.KEJAR_GAMES || { toeic: [], matrikulasi: [] };

  function renderSection(containerId, games) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = games.map((game, index) => `
      <button class="kartu-game" type="button" data-slug="${game.slug}">
        <span class="game-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="game-copy">
          <span class="game-title">${game.label}</span>
          <span class="game-tagline">${game.tagline || ''}</span>
        </span>
        <span class="game-arrow" aria-hidden="true">↗</span>
      </button>
    `).join('');

    // Wire klik
    el.querySelectorAll('.kartu-game').forEach(card => {
      card.addEventListener('click', () => {
        const slug = card.dataset.slug;
        openKejarModal(slug);
      });
    });
  }

  function openKejarModal(slug) {
    const game = window.findKejarGame(slug);
    if (!game) return alert('Game tidak dikenal: ' + slug);

    document.getElementById('__km_modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = '__km_modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';
    overlay.innerHTML = `
      <div style="background:#0f1115;color:#e4e6eb;font:14px system-ui,sans-serif;border-radius:14px;max-width:740px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.7);overflow:hidden;max-height:90vh;display:flex;flex-direction:column">
        <div style="padding:20px 24px;border-bottom:1px solid #1f2229;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:#7a7e88;font-weight:700">Kejar</div>
            <div style="font-size:17px;font-weight:700;margin-top:2px">${game.label}</div>
          </div>
          <button id="__km_close" style="background:transparent;border:none;color:#666;font-size:24px;cursor:pointer;padding:0 8px">×</button>
        </div>
        <div style="padding:20px 24px;overflow-y:auto">
          <ol style="margin:0 0 16px 0;padding-left:20px;font-size:13px;line-height:1.9;color:#aab">
            <li>Klik <b style="color:#fff">Buka Kejar.id</b> — tab baru terbuka. Login kalau diminta.</li>
            <li>Buka browser DevTools (<b style="color:#fff">F12</b>) → tab Console.</li>
            <li>Klik <b style="color:#fff">Copy Script</b>, paste ke Console, tekan Enter.</li>
            <li>Panel muncul di pojok kanan atas — pilih rentang ronde → klik <b style="color:#fff">Jalankan</b>.</li>
          </ol>
          <div style="display:flex;gap:10px;margin-bottom:14px">
            <button id="__km_open" style="flex:1;background:#2a2e36;color:#e4e6eb;border:none;border-radius:8px;padding:12px;font:inherit;font-weight:600;cursor:pointer">
              Buka Kejar.id ↗
            </button>
            <button id="__km_copy" style="flex:1;background:#4ade80;color:#0f1115;border:none;border-radius:8px;padding:12px;font:inherit;font-weight:700;cursor:pointer">
              Copy Script
            </button>
          </div>
          <details style="margin-top:8px">
            <summary style="cursor:pointer;color:#7a7e88;font-size:12px;user-select:none">Lihat script</summary>
            <textarea id="__km_ta" readonly style="margin-top:10px;width:100%;height:200px;background:#1a1d23;color:#aab;border:1px solid #2a2e36;border-radius:8px;padding:10px;font:11px/1.4 ui-monospace,monospace;resize:vertical;box-sizing:border-box"></textarea>
          </details>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const fullScript = window.buildKejarInjector(slug);
    overlay.querySelector('#__km_ta').value = fullScript;

    const close = () => overlay.remove();
    overlay.querySelector('#__km_close').onclick = close;
    overlay.onclick = e => { if (e.target === overlay) close(); };

    overlay.querySelector('#__km_open').onclick = () => {
      window.open('https://app.kejar.id/student/games/' + slug + '/stages', '_blank');
    };

    overlay.querySelector('#__km_copy').onclick = async () => {
      const btn = overlay.querySelector('#__km_copy');
      try {
        await navigator.clipboard.writeText(fullScript);
        btn.textContent = '✓ Tersalin!';
      } catch (_) {
        const ta = overlay.querySelector('#__km_ta');
        ta.select();
        document.execCommand('copy');
        btn.textContent = '✓ Tersalin!';
      }
      setTimeout(() => btn.textContent = 'Copy Script', 1500);
    };
  }

  // Expose ke global
  window.openKejarModal = openKejarModal;

  // Render saat halaman siap
  function init() {
    renderSection('kejar-toeic-grid', GAMES.toeic);
    renderSection('kejar-matrikulasi-grid', GAMES.matrikulasi);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
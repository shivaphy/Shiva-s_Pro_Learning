/* ════════════════════════════════════
   BriskLearn — PWA & Offline Support
   ════════════════════════════════════ */

window.PWA = (() => {
  let deferredPrompt = null;

  function init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.info('[PWA] Service Worker registered:', reg.scope);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                toast('🔄 App updated! Refresh to get the latest version.', 'info');
              }
            });
          });
        })
        .catch(err => console.error('[PWA] SW registration failed:', err));

      // Listen for SW messages
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data?.type === 'SYNC_START') {
          toast('🔄 Syncing offline data...', 'info');
        }
      });
    }

    // Online/Offline detection
    window.addEventListener('online', () => {
      document.getElementById('offline-banner').style.display = 'none';
      toast('✅ Back online — syncing data...', 'success');
      syncPendingData();
    });
    window.addEventListener('offline', () => {
      document.getElementById('offline-banner').style.display = 'block';
    });
    if (!navigator.onLine) {
      document.getElementById('offline-banner').style.display = 'block';
    }

    // Capture install prompt
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      toast('✅ BriskLearn installed as an app!', 'success');
    });
  }

  function showInstallBanner() {
    if (document.getElementById('install-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.style.cssText = `
      position:fixed;bottom:0;left:0;right:0;
      background:#1E40AF;color:#fff;padding:12px 16px;
      display:flex;align-items:center;justify-content:space-between;
      z-index:9997;font-size:13px;font-weight:500;
    `;
    banner.innerHTML = `
      <span>📱 Install BriskLearn as an app for offline access</span>
      <div style="display:flex;gap:8px">
        <button onclick="PWA.installApp()" style="background:#fff;color:#1E40AF;border:none;padding:6px 14px;border-radius:6px;font-weight:700;cursor:pointer;font-size:13px">Install</button>
        <button onclick="this.closest('#install-banner').remove()" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px">Later</button>
      </div>
    `;
    document.body.appendChild(banner);
  }

  async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      document.getElementById('install-banner')?.remove();
    }
    deferredPrompt = null;
  }

  async function syncPendingData() {
    const pending = await DB.getAll(DB.STORES.pendingSync);
    if (!pending.length) return;
    let synced = 0;
    for (const item of pending) {
      try {
        // In a real app, POST to your backend here
        // For demo: just clear them
        await DB.del(DB.STORES.pendingSync, item.id);
        synced++;
      } catch (err) {
        console.error('[Sync] Failed:', err);
      }
    }
    if (synced > 0) toast(`✅ Synced ${synced} offline item(s)`, 'success');
  }

  return { init, installApp, syncPendingData };
})();

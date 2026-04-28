/* Shared admin client utilities */
(function () {
  'use strict';

  window.AdminAPI = {
    async get(url) {
      const r = await fetch(url, { credentials: 'same-origin' });
      if (r.status === 401) {
        window.location.replace('/admin/login.html');
        throw new Error('unauthorized');
      }
      if (!r.ok) throw new Error('Request failed: ' + r.status);
      return r.json();
    },
    async send(url, method, body) {
      const r = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: body == null ? undefined : JSON.stringify(body),
      });
      if (r.status === 401) {
        window.location.replace('/admin/login.html');
        throw new Error('unauthorized');
      }
      if (r.status === 204) return null;
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || ('Request failed: ' + r.status));
      return data;
    },
    post(url, body) { return this.send(url, 'POST', body); },
    patch(url, body) { return this.send(url, 'PATCH', body); },
    del(url) { return this.send(url, 'DELETE'); },
    async logout() {
      try { await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }); } catch {}
      window.location.replace('/admin/login.html');
    },
  };

  window.toast = function (msg, kind) {
    const el = document.createElement('div');
    el.className = 'toast' + (kind === 'error' ? ' error' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 250);
    }, 3000);
  };

  window.fmtDate = function (iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  window.fmtMoney = function (n) {
    if (n == null) return '';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  };

  // Logout button handler
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.matches && t.matches('[data-logout]')) {
      e.preventDefault();
      window.AdminAPI.logout();
    }
  });

  // Auth gate (everything except login.html)
  if (!window.location.pathname.endsWith('/admin/login.html')) {
    fetch('/api/admin/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.isAdmin) window.location.replace('/admin/login.html');
      })
      .catch(() => window.location.replace('/admin/login.html'));
  }
})();

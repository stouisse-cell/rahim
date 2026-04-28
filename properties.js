/* Property listings client — works for /properties.html, /fr/properties.html, /ar/properties.html */
(function () {
  'use strict';

  const lang = (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);

  const I18N = {
    en: {
      results: (n) => `${n} ${n === 1 ? 'property' : 'properties'}`,
      from: 'from',
      bd: 'bd', ba: 'ba', sqm: 'm²',
      featured: 'Featured',
      offplan: 'Off-plan',
      ready: 'Ready',
      sold: 'Sold',
      rented: 'Rented',
      details: 'View details',
      loading: 'Loading…',
      error: 'Could not load properties. Please try again.',
    },
    fr: {
      results: (n) => `${n} ${n === 1 ? 'bien' : 'biens'}`,
      from: 'à partir de',
      bd: 'ch', ba: 'sdb', sqm: 'm²',
      featured: 'En vedette',
      offplan: 'Sur plan',
      ready: 'Prêt',
      sold: 'Vendu',
      rented: 'Loué',
      details: 'Voir le détail',
      loading: 'Chargement…',
      error: 'Impossible de charger les biens. Réessayez.',
    },
    ar: {
      results: (n) => `${n} ${n === 1 ? 'عقار' : 'عقارات'}`,
      from: 'ابتداءً من',
      bd: 'غرف', ba: 'حمام', sqm: 'م²',
      featured: 'مميّز',
      offplan: 'قيد الإنشاء',
      ready: 'جاهز',
      sold: 'مباع',
      rented: 'مؤجر',
      details: 'عرض التفاصيل',
      loading: 'جارٍ التحميل…',
      error: 'تعذّر تحميل العقارات. حاول من جديد.',
    },
  };
  const t = I18N[lang] || I18N.en;

  const localeTag = lang === 'ar' ? 'ar-MA' : (lang === 'fr' ? 'fr-MA' : 'en-US');
  const fmtPrice = new Intl.NumberFormat(localeTag, { maximumFractionDigits: 0 });

  const grid = document.getElementById('listings-grid');
  const empty = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');
  const filtersForm = document.getElementById('filters');
  const resetBtn = document.getElementById('reset-filters');

  const propertyHref = lang === 'en' ? 'property.html' : `${lang}/property.html`;
  // When this page is itself under /fr or /ar, links are relative to the same folder
  const path = window.location.pathname;
  const isLocalized = /\/(fr|ar)\//.test(path);
  const detailHref = isLocalized ? 'property.html' : 'property.html';

  resultsCount.textContent = t.loading;

  function statusLabel(s) {
    if (s === 'off-plan') return t.offplan;
    if (s === 'ready') return t.ready;
    if (s === 'sold') return t.sold;
    if (s === 'rented') return t.rented;
    return s;
  }

  function pickTitle(p) {
    if (lang === 'fr' && p.titleFr) return p.titleFr;
    if (lang === 'ar' && p.titleAr) return p.titleAr;
    return p.title;
  }

  function placeholderImg() {
    return '';
  }

  function render(rows) {
    grid.innerHTML = '';
    if (!rows.length) {
      empty.hidden = false;
      resultsCount.textContent = t.results(0);
      return;
    }
    empty.hidden = true;
    resultsCount.textContent = t.results(rows.length);

    const frag = document.createDocumentFragment();
    rows.forEach((p) => {
      const card = document.createElement('article');
      card.className = 'property-card';

      const link = document.createElement('a');
      link.className = 'card-link';
      link.href = `${detailHref}?slug=${encodeURIComponent(p.slug)}`;
      link.setAttribute('aria-label', `${pickTitle(p)} — ${t.details}`);

      const imgWrap = document.createElement('div');
      imgWrap.className = 'img-wrap';
      const firstImg = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;
      if (firstImg) {
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = pickTitle(p);
        img.src = firstImg;
        imgWrap.appendChild(img);
      }
      if (p.featured) {
        const b = document.createElement('span');
        b.className = 'badge featured';
        b.textContent = t.featured;
        imgWrap.appendChild(b);
      } else if (p.status && p.status !== 'ready') {
        const b = document.createElement('span');
        b.className = 'badge';
        b.textContent = statusLabel(p.status);
        imgWrap.appendChild(b);
      }
      link.appendChild(imgWrap);

      const body = document.createElement('div');
      body.className = 'body';
      const cityLine = [p.city, p.neighborhood].filter(Boolean).join(' · ');
      body.innerHTML = `
        <div class="city">${cityLine}</div>
        <h3>${pickTitle(p)}</h3>
        <div class="price">${fmtPrice.format(p.price)} <span style="font-size:.7em;opacity:.6;">MAD</span></div>
        <div class="specs">
          ${p.bedrooms ? `<span><strong>${p.bedrooms}</strong> ${t.bd}</span>` : ''}
          ${p.bathrooms ? `<span><strong>${p.bathrooms}</strong> ${t.ba}</span>` : ''}
          ${p.areaSqm ? `<span><strong>${p.areaSqm}</strong> ${t.sqm}</span>` : ''}
        </div>
      `;
      link.appendChild(body);
      card.appendChild(link);
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  async function loadFacets() {
    try {
      const r = await fetch('/api/properties/facets');
      if (!r.ok) return;
      const data = await r.json();
      const cityEl = document.getElementById('f-city');
      const typeEl = document.getElementById('f-type');
      (data.cities || []).forEach((c) => {
        const o = document.createElement('option');
        o.value = c; o.textContent = c;
        cityEl.appendChild(o);
      });
      (data.propertyTypes || []).forEach((c) => {
        const o = document.createElement('option');
        o.value = c; o.textContent = c;
        typeEl.appendChild(o);
      });
    } catch {}
  }

  async function loadList() {
    const fd = new FormData(filtersForm);
    const params = new URLSearchParams();
    for (const [k, v] of fd.entries()) {
      if (v !== '' && v != null) params.set(k, String(v));
    }
    resultsCount.textContent = t.loading;
    try {
      const r = await fetch('/api/properties?' + params.toString());
      if (!r.ok) throw new Error('Failed');
      const rows = await r.json();
      render(rows);
    } catch {
      resultsCount.textContent = t.error;
      grid.innerHTML = '';
    }
  }

  filtersForm.addEventListener('change', loadList);
  filtersForm.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT') {
      clearTimeout(window.__listingsDebounce);
      window.__listingsDebounce = setTimeout(loadList, 350);
    }
  });
  resetBtn.addEventListener('click', () => {
    filtersForm.reset();
    loadList();
  });

  loadFacets().then(loadList);
})();

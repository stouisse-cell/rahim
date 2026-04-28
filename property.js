/* Single property detail */
(function () {
  'use strict';

  const lang = (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const I18N = {
    en: {
      bd: 'Bedrooms', ba: 'Bathrooms', sqm: 'Area', area: 'm²',
      year: 'Year', type: 'Type', status: 'Status', city: 'Location',
      featured: 'Featured', offplan: 'Off-plan', ready: 'Ready', sold: 'Sold', rented: 'Rented',
      about: 'About this property', features: 'Features',
      enquireTitle: 'Interested in this property?',
      enquireText: 'Tell us a bit about your timeline and we will respond with a tailored introduction, comparable listings, and next steps.',
      yourName: 'Your name', email: 'Email', phone: 'Phone (optional)',
      message: 'Tell us what you want to know',
      send: 'Send enquiry', sending: 'Sending…',
      success: 'Thank you. We will be in touch shortly.',
      error: 'Could not send. Please email contact@RahimInternational.com',
      notFound: 'This property is no longer available.',
    },
    fr: {
      bd: 'Chambres', ba: 'Salles de bain', sqm: 'Superficie', area: 'm²',
      year: 'Année', type: 'Type', status: 'Statut', city: 'Localisation',
      featured: 'En vedette', offplan: 'Sur plan', ready: 'Prêt', sold: 'Vendu', rented: 'Loué',
      about: 'À propos du bien', features: 'Caractéristiques',
      enquireTitle: 'Ce bien vous intéresse ?',
      enquireText: 'Dites-nous votre calendrier et nous reviendrons vers vous avec une présentation, des biens comparables et les prochaines étapes.',
      yourName: 'Votre nom', email: 'Email', phone: 'Téléphone (optionnel)',
      message: 'Que souhaitez-vous savoir ?',
      send: 'Envoyer', sending: 'Envoi…',
      success: 'Merci. Nous reviendrons vers vous rapidement.',
      error: 'Erreur. Écrivez à contact@RahimInternational.com',
      notFound: "Ce bien n'est plus disponible.",
    },
    ar: {
      bd: 'غرف النوم', ba: 'الحمامات', sqm: 'المساحة', area: 'م²',
      year: 'السنة', type: 'النوع', status: 'الحالة', city: 'الموقع',
      featured: 'مميّز', offplan: 'قيد الإنشاء', ready: 'جاهز', sold: 'مباع', rented: 'مؤجر',
      about: 'عن العقار', features: 'الميزات',
      enquireTitle: 'مهتم بهذا العقار؟',
      enquireText: 'أخبرنا بإطارك الزمني وسنعود إليك بعرض مفصّل وعقارات مماثلة وخطوات تالية.',
      yourName: 'اسمك', email: 'البريد الإلكتروني', phone: 'الهاتف (اختياري)',
      message: 'ماذا تودّ أن تعرف؟',
      send: 'إرسال', sending: 'جارٍ الإرسال…',
      success: 'شكرًا. سنتواصل معك قريبًا.',
      error: 'تعذّر الإرسال. راسلنا على contact@RahimInternational.com',
      notFound: 'لم يعد هذا العقار متاحًا.',
    },
  };
  const t = I18N[lang] || I18N.en;
  const localeTag = lang === 'ar' ? 'ar-MA' : (lang === 'fr' ? 'fr-MA' : 'en-US');
  const fmt = new Intl.NumberFormat(localeTag, { maximumFractionDigits: 0 });

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const root = document.getElementById('pd-content');

  function statusLabel(s) {
    return ({ 'off-plan': t.offplan, ready: t.ready, sold: t.sold, rented: t.rented })[s] || s;
  }
  function pick(p, key) {
    const fr = p[key + 'Fr'], ar = p[key + 'Ar'];
    if (lang === 'fr' && fr) return fr;
    if (lang === 'ar' && ar) return ar;
    return p[key];
  }

  if (!slug) {
    root.className = 'pd-error';
    root.textContent = t.notFound;
    return;
  }

  fetch('/api/properties/' + encodeURIComponent(slug))
    .then((r) => {
      if (r.status === 404) throw new Error('not_found');
      if (!r.ok) throw new Error('server');
      return r.json();
    })
    .then((p) => render(p))
    .catch((err) => {
      root.className = 'pd-error';
      root.textContent = t.notFound;
    });

  function render(p) {
    document.title = `${pick(p, 'title')} | Rahim International`;
    const cityLine = [p.city, p.neighborhood].filter(Boolean).join(' · ');
    const images = Array.isArray(p.images) ? p.images : [];
    const main = images[0] || '';
    const thumbs = images.slice(0, 5);

    root.className = '';
    root.innerHTML = `
      <header class="pd-header">
        <div class="pd-city">${cityLine}</div>
        <h1 class="pd-title">${pick(p, 'title')}</h1>
        <div class="pd-subhead">
          <span class="pd-price">${fmt.format(p.price)} <small>MAD</small></span>
          ${p.featured
            ? `<span class="pd-status featured">${t.featured}</span>`
            : (p.status && p.status !== 'ready'
                ? `<span class="pd-status">${statusLabel(p.status)}</span>` : '')}
        </div>
      </header>

      ${images.length ? `
        <div class="pd-gallery">
          <img class="pd-main" id="pd-main-img" src="${main}" alt="${pick(p, 'title')}">
          ${images.length > 1 ? `
          <div class="pd-side">
            ${[1, 2].map((i) => images[i] ? `<img src="${images[i]}" alt="" data-full="${images[i]}">` : '<div></div>').join('')}
          </div>` : ''}
        </div>
        ${thumbs.length > 1 ? `<div class="pd-thumbs">
          ${thumbs.map((src, i) => `<img src="${src}" alt="" data-full="${src}" class="${i === 0 ? 'active' : ''}">`).join('')}
        </div>` : ''}
      ` : ''}

      <div class="pd-grid">
        <div>
          <div class="pd-specs">
            ${p.bedrooms ? `<div class="pd-spec"><div class="v">${p.bedrooms}</div><div class="l">${t.bd}</div></div>` : ''}
            ${p.bathrooms ? `<div class="pd-spec"><div class="v">${p.bathrooms}</div><div class="l">${t.ba}</div></div>` : ''}
            ${p.areaSqm ? `<div class="pd-spec"><div class="v">${p.areaSqm}</div><div class="l">${t.sqm} (${t.area})</div></div>` : ''}
            ${p.yearBuilt ? `<div class="pd-spec"><div class="v">${p.yearBuilt}</div><div class="l">${t.year}</div></div>` : ''}
            <div class="pd-spec"><div class="v" style="font-size:1rem;text-transform:capitalize;">${p.propertyType}</div><div class="l">${t.type}</div></div>
          </div>
          <section class="pd-section">
            <h2>${t.about}</h2>
            <p class="pd-desc">${escapeHtml(pick(p, 'description'))}</p>
          </section>
          ${p.features && p.features.length ? `
          <section class="pd-section">
            <h2>${t.features}</h2>
            <ul class="pd-features">
              ${p.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
            </ul>
          </section>` : ''}
        </div>

        <aside class="pd-aside">
          <h3>${t.enquireTitle}</h3>
          <p>${t.enquireText}</p>
          <form id="property-enquiry" class="contact-form" novalidate>
            <input type="hidden" name="property_slug" value="${p.slug}">
            <input type="hidden" name="property_title" value="${escapeAttr(pick(p, 'title'))}">
            <div class="form-group">
              <label class="form-label" for="pe-name">${t.yourName}</label>
              <input id="pe-name" name="name" type="text" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="pe-email">${t.email}</label>
              <input id="pe-email" name="email" type="email" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="pe-phone">${t.phone}</label>
              <input id="pe-phone" name="phone" type="tel" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label" for="pe-msg">${t.message}</label>
              <textarea id="pe-msg" name="message" class="form-textarea" rows="3"></textarea>
            </div>
            <p id="pe-status" class="form-status" aria-live="polite"></p>
            <button type="submit" class="form-submit">${t.send}</button>
          </form>
        </aside>
      </div>
    `;

    // Lightbox
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    document.getElementById('lightbox-close').addEventListener('click', () => lb.classList.remove('is-open'));
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('is-open'); });

    const mainImg = document.getElementById('pd-main-img');
    if (mainImg) {
      mainImg.addEventListener('click', () => {
        lbImg.src = mainImg.src;
        lb.classList.add('is-open');
      });
    }
    document.querySelectorAll('.pd-side img, .pd-thumbs img').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const full = thumb.getAttribute('data-full');
        if (mainImg && full) {
          mainImg.src = full;
          document.querySelectorAll('.pd-thumbs img').forEach((x) => x.classList.toggle('active', x === thumb));
        } else if (full) {
          lbImg.src = full;
          lb.classList.add('is-open');
        }
      });
    });

    // Enquiry form -> /api/leads only (no Formspree dependency)
    const form = document.getElementById('property-enquiry');
    const status = document.getElementById('pe-status');
    const btn = form.querySelector('.form-submit');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const original = btn.textContent;
      btn.textContent = t.sending; btn.disabled = true;
      status.textContent = ''; status.className = 'form-status';
      try {
        const fd = new FormData(form);
        const payload = {
          name: (fd.get('name') || '').toString(),
          email: (fd.get('email') || '').toString(),
          phone: (fd.get('phone') || '').toString() || null,
          message: `[Property: ${fd.get('property_title')} (${fd.get('property_slug')})]\n${fd.get('message') || ''}`,
          sourcePage: window.location.pathname + window.location.search,
          sourceLang: lang,
        };
        const r = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error('Failed');
        form.reset();
        status.textContent = t.success;
        status.classList.add('is-success');
      } catch {
        status.textContent = t.error;
        status.classList.add('is-error');
      } finally {
        btn.textContent = original;
        btn.disabled = false;
      }
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }
})();

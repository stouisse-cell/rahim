/* ============================================================
   RAHIM INTERNATIONAL — SHARED JAVASCRIPT
   ============================================================ */

(function() {
  'use strict';

  // ---- Progress Bar ----
  const progressBar = document.getElementById('progress-bar');
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = progress + '%';
  }

  // ---- Back to Top ----
  const backTop = document.querySelector('.btn-back-top');
  function updateBackTop() {
    if (!backTop) return;
    if (window.scrollY > 400) {
      backTop.classList.add('visible');
    } else {
      backTop.classList.remove('visible');
    }
  }
  if (backTop) {
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  window.addEventListener('scroll', () => {
    updateProgress();
    updateBackTop();
  }, { passive: true });

  // ---- Mobile Nav Toggle ----
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('#nav-links');

  function setNavOpen(open) {
    if (!navToggle || !navLinks) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navLinks.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setNavOpen(!isOpen);
    });
    // Close after clicking a link or a dropdown item
    navLinks.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        setNavOpen(false);
      }
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        !e.target.closest('.site-nav') &&
        navLinks.classList.contains('is-open')
      ) {
        setNavOpen(false);
      }
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        setNavOpen(false);
      }
    });
    // Reset state when crossing back to desktop layout
    const resetOnResize = () => {
      if (
        window.innerWidth > 1024 &&
        navLinks.classList.contains('is-open')
      ) {
        setNavOpen(false);
      }
    };
    window.addEventListener('resize', resetOnResize);
  }

  // ---- Reveal on scroll ----
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-scale');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // ---- Gallery ----
  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const slides = Array.from(gallery.querySelectorAll('.gallery-slide'));
    const dots = Array.from(gallery.querySelectorAll('.gallery-dot'));
    const prev = gallery.querySelector('.gallery-prev');
    const next = gallery.querySelector('.gallery-next');
    if (!slides.length) return;
    let activeIndex = 0;
    let autoTimer;

    const showSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === activeIndex));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === activeIndex));
    };

    const startAuto = () => {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => showSlide(activeIndex + 1), 5000);
    };

    if (prev) prev.addEventListener('click', () => { showSlide(activeIndex - 1); startAuto(); });
    if (next) next.addEventListener('click', () => { showSlide(activeIndex + 1); startAuto(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { showSlide(i); startAuto(); }));

    // Keyboard nav
    gallery.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { showSlide(activeIndex - 1); startAuto(); }
      if (e.key === 'ArrowRight') { showSlide(activeIndex + 1); startAuto(); }
    });

    // Touch swipe nav (mobile)
    // In RTL pages a left-swipe should still feel like "next" visually,
    // so we mirror the direction when the page is RTL.
    const isRTL = document.documentElement.dir === 'rtl';
    const SWIPE_THRESHOLD = 40;
    const SWIPE_MAX_VERTICAL = 60;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchActive = false;

    gallery.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchActive = true;
      clearInterval(autoTimer);
    }, { passive: true });

    gallery.addEventListener('touchend', (e) => {
      if (!touchActive) return;
      touchActive = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      // Ignore taps and mostly-vertical scrolls
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_MAX_VERTICAL) {
        if (slides.length > 1) startAuto();
        return;
      }
      const goNext = isRTL ? dx > 0 : dx < 0;
      showSlide(activeIndex + (goNext ? 1 : -1));
      startAuto();
    }, { passive: true });

    gallery.addEventListener('touchcancel', () => {
      touchActive = false;
      if (slides.length > 1) startAuto();
    }, { passive: true });

    if (slides.length > 1) startAuto();
  });

  // ---- Contact Form ----
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('.form-submit');
      const status = form.querySelector('#form-status');
      const original = btn.textContent;
      const sendingTxt = form.dataset.sending || 'Sending…';
      const successTxt = form.dataset.success || 'Message sent. We will be in touch shortly.';
      const errorTxt = form.dataset.error || 'Something went wrong. Please email contact@RahimInternational.com directly.';
      btn.textContent = sendingTxt;
      btn.disabled = true;
      if (status) { status.textContent = ''; status.className = 'form-status'; }

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error('Failed');
        form.reset();
        if (status) {
          status.textContent = successTxt;
          status.classList.add('is-success');
        }
      } catch {
        if (status) {
          status.textContent = errorTxt;
          status.classList.add('is-error');
        }
      } finally {
        btn.textContent = original;
        btn.disabled = false;
      }
    });
  }

  // ---- FAQ Accordion ----
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('is-open');
      // Close all
      document.querySelectorAll('.faq-item.is-open').forEach(el => el.classList.remove('is-open'));
      if (!isOpen) item.classList.add('is-open');
    });
  });

  // ---- Mortgage / Daam Sakani Calculator ----
  function getDaamSakaniGrant(price) {
    if (price <= 0) return 0;
    if (price <= 300000) return 100000;
    if (price <= 700000) return 70000;
    return 0;
  }

  document.querySelectorAll('[data-mortgage-calc]').forEach((calc) => {
    const locale = calc.dataset.locale || 'en';
    const localeTag = locale === 'ar' ? 'ar-MA' : (locale === 'fr' ? 'fr-MA' : 'en-US');
    const fmt = new Intl.NumberFormat(localeTag, { maximumFractionDigits: 0 });

    const inputs = {
      price:   calc.querySelector('[data-input="price"]'),
      daam:    calc.querySelector('[data-input="daam"]'),
      downPct: calc.querySelector('[data-input="down-pct"]'),
      term:    calc.querySelector('[data-input="term"]'),
      rate:    calc.querySelector('[data-input="rate"]'),
    };
    const outputs = {
      grant:         calc.querySelector('[data-output="grant"]'),
      downAmount:    calc.querySelector('[data-output="down-amount"]'),
      loan:          calc.querySelector('[data-output="loan"]'),
      monthly:       calc.querySelector('[data-output="monthly"]'),
      totalInterest: calc.querySelector('[data-output="total-interest"]'),
      grantNote:     calc.querySelector('[data-output="grant-note"]'),
    };

    const grantNoteText = {
      en: { tier1: 'Tier 1 — social housing band', tier2: 'Tier 2 — middle market band', none: 'Above the 700,000 MAD ceiling' },
      fr: { tier1: 'Palier 1 — logement social', tier2: 'Palier 2 — gamme intermédiaire', none: 'Au-dessus du plafond de 700 000 MAD' },
      ar: { tier1: 'الشريحة 1 — السكن الاجتماعي', tier2: 'الشريحة 2 — السوق المتوسط', none: 'فوق سقف 700,000 درهم' },
    }[locale] || { tier1: '', tier2: '', none: '' };

    function recalc() {
      const price   = Math.max(0, Number(inputs.price.value) || 0);
      const daamOn  = inputs.daam ? inputs.daam.checked : false;
      const grant   = daamOn ? getDaamSakaniGrant(price) : 0;
      const downPct = Math.min(100, Math.max(0, Number(inputs.downPct.value) || 0));
      const downAmt = Math.round(price * downPct / 100);
      const term    = Math.max(1, Number(inputs.term.value) || 20);
      const rate    = Math.max(0, Number(inputs.rate.value) || 0) / 100;

      const loan = Math.max(0, price - grant - downAmt);
      const months = term * 12;
      const monthlyRate = rate / 12;
      let monthly = 0;
      if (loan > 0 && months > 0) {
        monthly = monthlyRate === 0
          ? loan / months
          : (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
      }
      const totalCost = monthly * months;
      const totalInterest = totalCost - loan;

      if (outputs.grant)         outputs.grant.textContent         = fmt.format(grant);
      if (outputs.downAmount)    outputs.downAmount.textContent    = fmt.format(downAmt);
      if (outputs.loan)          outputs.loan.textContent          = fmt.format(loan);
      if (outputs.monthly)       outputs.monthly.textContent       = fmt.format(Math.round(monthly));
      if (outputs.totalInterest) outputs.totalInterest.textContent = fmt.format(Math.round(totalInterest));
      if (outputs.grantNote) {
        if (!daamOn) outputs.grantNote.textContent = '';
        else if (price <= 300000) outputs.grantNote.textContent = grantNoteText.tier1;
        else if (price <= 700000) outputs.grantNote.textContent = grantNoteText.tier2;
        else outputs.grantNote.textContent = grantNoteText.none;
      }
    }

    Object.values(inputs).forEach((el) => {
      if (!el) return;
      el.addEventListener('input', recalc);
      el.addEventListener('change', recalc);
    });
    recalc();
  });

})();

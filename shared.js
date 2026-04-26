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
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.setAttribute('aria-label', !isOpen ? 'Close menu' : 'Open menu');
      navLinks.classList.toggle('is-open', !isOpen);
    });
    navLinks.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
        navLinks.classList.remove('is-open');
      }
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.site-nav') && navLinks.classList.contains('is-open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
        navLinks.classList.remove('is-open');
      }
    });
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

})();

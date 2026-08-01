/**
 * Admission Navigate Theme — Main JavaScript
 * Mobile menu toggle, mobile submenu toggle, FAQ accordion, form enhancements
 */

document.addEventListener('DOMContentLoaded', function() {

  // Unified Mobile Navigation Toggle Control
  const menuBtn = document.getElementById('menuBtn') || document.querySelector('.mobile-toggle');
  const mobileMenu = document.getElementById('mobileMenu') || document.querySelector('.mobile-menu');
  const menuOverlay = document.getElementById('mobileMenuOverlay');

  function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    menuOverlay?.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    const icon = menuBtn.querySelector('i');
    if (icon) icon.className = 'fas fa-bars';
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isActive = mobileMenu.classList.toggle('active');
      menuOverlay?.classList.toggle('active', isActive);

      // Sync accessibility attributes
      menuBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');

      // Lock background scroll while the drawer is open
      document.body.style.overflow = isActive ? 'hidden' : '';

      // Handle Font Awesome hamburger icon vs close "X" symbol
      const icon = menuBtn.querySelector('i');
      if (icon) {
        icon.className = isActive ? 'fas fa-times' : 'fas fa-bars';
      }
    });

    // Tapping the dimmed backdrop closes the drawer
    menuOverlay?.addEventListener('click', closeMobileMenu);

    // Close menu instantly when clicking a link that has no children
    // (links inside items with a submenu-toggle are handled separately below,
    // so tapping the parent link itself still navigates/closes as expected)
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  // Mobile submenu (dropdown) toggle — for nav items with children
  mobileMenu?.querySelectorAll('.submenu-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const li = btn.closest('li');
      if (!li) return;
      const isOpen = li.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // FAQ accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-q');
    if (q) {
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(fi => fi.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    }
  });

  // College filter auto-submit (if select changes, auto-submit form)
  const filterForm = document.querySelector('.filter-bar form');
  if (filterForm) {
    filterForm.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', () => filterForm.submit());
    });
  }

  // Save college toggle (AJAX)
  document.querySelectorAll('.btn-save-college').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const collegeId = this.dataset.collegeId;
      if (!collegeId) return;

      fetch(typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=an_save_college&college_id=' + collegeId + '&nonce=' + (typeof anAjax !== 'undefined' ? anAjax.nonce : '')
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          this.classList.toggle('saved', data.data.saved);
          this.textContent = data.data.saved ? '✓ Saved' : 'Save to Shortlist';
        } else if (data.data?.message === 'login_required') {
          window.location.href = '/login/';
        }
      })
      .catch(err => console.error('Save college error:', err));
    });
  });

  // ── Google reCAPTCHA v3 (invisible) ──
  // Forms marked with .an-recaptcha-form get a fresh token fetched right
  // before submit (v3 tokens expire after ~2 minutes so we never pre-fetch).
  document.querySelectorAll('form.an-recaptcha-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (typeof window.anRecaptcha === 'undefined' || !window.anRecaptcha.siteKey || typeof grecaptcha === 'undefined') {
        return; // reCAPTCHA not configured — let the form submit normally.
      }
      if (form.dataset.recaptchaVerified === '1') return; // token already attached, let it go through.

      e.preventDefault();
      var action = form.dataset.recaptchaAction || 'submit';
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      grecaptcha.ready(function () {
        grecaptcha.execute(window.anRecaptcha.siteKey, { action: action }).then(function (token) {
          var field = form.querySelector('input[name="g-recaptcha-response"]');
          if (!field) {
            field = document.createElement('input');
            field.type = 'hidden';
            field.name = 'g-recaptcha-response';
            form.appendChild(field);
          }
          field.value = token;
          form.dataset.recaptchaVerified = '1';
          form.submit();
        }).catch(function () {
          if (submitBtn) submitBtn.disabled = false;
          form.submit(); // fail open — server-side check still enforces the score.
        });
      });
    });
  });

  // ── Hero stat counters ──
  // Isolated in its own function so a missing/empty .an-counter set on
  // other pages can never short-circuit anything registered above.
  initStatCounters();
  initHeaderScrollState();
  initScrollReveal();
  initTimelinePathway();
  initButtonRipple();
  initScrollProgress();
  initHeroParallax();
  initSectionReveal();
  initAboutCarousel();
});

// ── About Us — auto-advancing image carousel with dots + hover pause ──
function initAboutCarousel() {
  const carousel = document.getElementById('aboutCarousel');
  if (!carousel) return;
  const slides = carousel.querySelectorAll('.carousel-slide');
  const dots = carousel.querySelectorAll('.carousel-dot');
  if (!slides.length) return;

  let current = 0;
  let timer = null;
  const intervalMs = 4200;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }

  function next() { goTo(current + 1); }

  function start() {
    stop();
    timer = window.setInterval(next, intervalMs);
  }
  function stop() {
    if (timer) { window.clearInterval(timer); timer = null; }
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index, 10));
      start();
    });
  });

  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);

  start();
}

// ── Whole-section reveal — each part of the page fades/slides in as it scrolls into view ──
function initSectionReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const sections = document.querySelectorAll('main > section:not(.hero)');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('section-in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -80px 0px' });

  sections.forEach(sec => observer.observe(sec));
}

// ── Scroll progress — thin gold bar fills across the top as you scroll ──
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

// ── Hero parallax — decorative orbs drift gently as you scroll past ──
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let ticking = false;
  function update() {
    ticking = false;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const offset = rect.top * -0.12;
    hero.style.setProperty('--parallax-shift', offset + 'px');
  }
  function onScroll() {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ── Buttons — click ripple for tactile, "worth clicking" feedback ──
function initButtonRipple() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  document.querySelectorAll('.btn, .wa-btn, .top-strip-cta').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      const size = Math.max(rect.width, rect.height) * 1.4;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

// ── Header — add shadow/shrink state once the page has scrolled ──
function initHeaderScrollState() {
  const header = document.querySelector('.header');
  if (!header) return;
  const toggle = () => header.classList.toggle('scrolled', window.scrollY > 12);
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
}

// ── Generic scroll-reveal for cards, sections, and images ──
function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // Auto-tag common homepage elements so no template markup has to change.
  const groupSelectors = ['.features-grid', '.srv-grid', '.canada-grid', '.testi-grid'];
  groupSelectors.forEach(sel => document.querySelector(sel)?.classList.add('reveal-group'));

  const singleSelectors = ['.sec-title', '.tl-item', '.faq-item', '.cta-banner', '.map-section', '#contact .feat-card', '.hero-form-ribbon', '.foot-col'];
  singleSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add('reveal'));
  });
  document.querySelector('.an-logo-marquee-wrap .sec-title')?.classList.add('reveal');
  document.querySelector('.split-img')?.classList.add('reveal', 'reveal-left');
  document.querySelector('.split-text')?.classList.add('reveal', 'reveal-right');

  const targets = document.querySelectorAll('.reveal, .reveal-group');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => observer.observe(el));
}

// ── Admission Timeline — fills the connecting line as you scroll past it ──
function initTimelinePathway() {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let ticking = false;
  function updateFill() {
    ticking = false;
    const rect = timeline.getBoundingClientRect();
    const viewportH = window.innerHeight;
    // Progress from 0 (top of timeline at bottom of viewport) to 1 (bottom of timeline at top of viewport)
    const total = rect.height + viewportH * 0.6;
    const scrolled = viewportH * 0.85 - rect.top;
    const pct = Math.min(1, Math.max(0, scrolled / total));
    timeline.style.setProperty('--tl-fill', (pct * 100) + '%');
  }
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateFill);
      ticking = true;
    }
  }
  updateFill();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}
function initStatCounters() {
  const counters = document.querySelectorAll('.an-counter');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target   = parseFloat(el.dataset.target) || 0;
    const suffix   = el.dataset.suffix || '';
    const isFloat  = el.dataset.target.includes('.');
    const duration = 1600;
    let startTime  = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current  = target * eased;

      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
      }
    }
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((el) => observer.observe(el));
}

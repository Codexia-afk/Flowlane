/* ═══════════════════════════════════════════════════════════
   FLOWLANE — script.js
   Modules: Nav scroll, Mobile menu, Scroll reveal,
            Testimonial carousel, Stat counters, Billing toggle
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Utility: run after DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMobileMenu();
  initScrollReveal();
  initCarousel();
  initStatCounters();
  initBillingToggle();
  initSmoothScroll();
});

/* ════════════════════════════════════════════
   NAV — sticky scroll effect
════════════════════════════════════════════ */
function initNav() {
  const header = document.getElementById('nav-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ════════════════════════════════════════════
   MOBILE MENU — hamburger toggle
════════════════════════════════════════════ */
function initMobileMenu() {
  const hamburger = document.getElementById('nav-hamburger');
  const menu      = document.getElementById('nav-mobile-menu');
  if (!hamburger || !menu) return;

  let isOpen = false;

  const toggle = () => {
    isOpen = !isOpen;
    hamburger.classList.toggle('open', isOpen);
    menu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    hamburger.classList.remove('open');
    menu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', toggle);

  // Close on link click
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', close);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (isOpen && !menu.contains(e.target) && !hamburger.contains(e.target)) {
      close();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* ════════════════════════════════════════════
   SCROLL REVEAL — IntersectionObserver
════════════════════════════════════════════ */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-up');
  if (!elements.length) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════════
   TESTIMONIAL CAROUSEL
════════════════════════════════════════════ */
function initCarousel() {
  const track     = document.getElementById('carousel-track');
  const dotsWrap  = document.getElementById('carousel-dots');
  const prevBtn   = document.getElementById('carousel-prev');
  const nextBtn   = document.getElementById('carousel-next');
  if (!track || !dotsWrap || !prevBtn || !nextBtn) return;

  const cards     = Array.from(track.querySelectorAll('.testimonial-card'));
  const total     = cards.length;
  let current     = 0;
  let autoTimer   = null;
  let isDragging  = false;
  let dragStartX  = 0;
  let dragDeltaX  = 0;

  /* Build dots */
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    dot.setAttribute('aria-selected', String(i === 0));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot'));

  /* Core navigation */
  function goTo(index, animate = true) {
    current = ((index % total) + total) % total;

    if (!animate) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    }

    track.style.transform = `translateX(-${current * 100}%)`;

    // Update dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-selected', String(i === current));
    });

    // Update card aria
    cards.forEach((card, i) => {
      card.setAttribute('aria-hidden', String(i !== current));
    });

    // Re-enable transition after instant jump
    if (!animate) {
      requestAnimationFrame(() => {
        track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    }
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* Auto-advance */
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, 5000);
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  /* Button listeners */
  nextBtn.addEventListener('click', () => { next(); stopAuto(); startAuto(); });
  prevBtn.addEventListener('click', () => { prev(); stopAuto(); startAuto(); });

  /* Keyboard navigation */
  const carousel = document.getElementById('carousel');
  if (carousel) {
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { prev(); stopAuto(); startAuto(); }
      if (e.key === 'ArrowRight') { next(); stopAuto(); startAuto(); }
    });
  }

  /* Touch / drag swipe */
  track.addEventListener('pointerdown', (e) => {
    isDragging  = true;
    dragStartX  = e.clientX;
    dragDeltaX  = 0;
    track.style.transition = 'none';
    track.setPointerCapture(e.pointerId);
    stopAuto();
  });

  track.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    dragDeltaX = e.clientX - dragStartX;
    const base = -current * 100;
    const drag = (dragDeltaX / track.offsetWidth) * 100;
    track.style.transform = `translateX(calc(${base}% + ${dragDeltaX}px))`;
  });

  track.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';

    const threshold = track.offsetWidth * 0.2;
    if (dragDeltaX < -threshold) {
      next();
    } else if (dragDeltaX > threshold) {
      prev();
    } else {
      goTo(current); // snap back
    }
    startAuto();
  });

  track.addEventListener('pointercancel', () => {
    isDragging = false;
    goTo(current);
    startAuto();
  });

  // Prevent click-through on drag
  track.addEventListener('click', (e) => {
    if (Math.abs(dragDeltaX) > 5) e.preventDefault();
  });

  /* Pause on hover */
  const wrapper = document.querySelector('.carousel-wrapper');
  if (wrapper) {
    wrapper.addEventListener('mouseenter', stopAuto);
    wrapper.addEventListener('mouseleave', startAuto);
    wrapper.addEventListener('focusin',    stopAuto);
    wrapper.addEventListener('focusout',   startAuto);
  }

  /* Init */
  goTo(0, false);
  startAuto();
}

/* ════════════════════════════════════════════
   STAT COUNTERS — animated number roll-up
════════════════════════════════════════════ */
function initStatCounters() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (!statNumbers.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    statNumbers.forEach(el => {
      el.textContent = Number(el.dataset.target).toLocaleString();
    });
    return;
  }

  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start    = performance.now();

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutQuart(progress);
      const value    = Math.round(eased * target);

      el.textContent = value.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString();
      }
    };

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════════
   BILLING TOGGLE — monthly / annual pricing
════════════════════════════════════════════ */
function initBillingToggle() {
  const toggle       = document.getElementById('billing-toggle');
  const priceAmounts = document.querySelectorAll('.price-amount[data-monthly]');
  if (!toggle || !priceAmounts.length) return;

  let isAnnual = false;

  const update = () => {
    priceAmounts.forEach(el => {
      const monthly = el.dataset.monthly;
      const annual  = el.dataset.annual;
      const target  = isAnnual ? annual : monthly;

      // Animate the number change
      el.style.transform = 'translateY(-6px)';
      el.style.opacity   = '0';

      setTimeout(() => {
        el.textContent     = target;
        el.style.transform = 'translateY(6px)';

        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease';
          el.style.transform  = 'translateY(0)';
          el.style.opacity    = '1';
        });
      }, 150);
    });

    toggle.setAttribute('aria-checked', String(isAnnual));
  };

  toggle.addEventListener('click', () => {
    isAnnual = !isAnnual;
    update();
  });

  // Keyboard support
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      isAnnual = !isAnnual;
      update();
    }
  });
}

/* ════════════════════════════════════════════
   SMOOTH SCROLL — for anchor links
════════════════════════════════════════════ */
function initSmoothScroll() {
  const NAV_HEIGHT = 68;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 16;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth',
      });
    });
  });
}

/* ════════════════════════════════════════════
   FEATURE DEMO — tab switcher in feature card
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const demoBtns = document.querySelectorAll('.demo-btn');
  demoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const toolbar = btn.closest('.demo-toolbar');
      if (!toolbar) return;
      toolbar.querySelectorAll('.demo-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});

/* ════════════════════════════════════════════
   LOGO TRACK — pause on hover
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.logos-inner');
  if (!track) return;

  track.addEventListener('mouseenter', () => {
    track.style.animationPlayState = 'paused';
  });
  track.addEventListener('mouseleave', () => {
    track.style.animationPlayState = 'running';
  });
});

/* ════════════════════════════════════════════
   INTEGRATION EMOJI — tooltip on hover
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const integrationSpans = document.querySelectorAll('.integration-logos span[title]');

  integrationSpans.forEach(span => {
    span.setAttribute('tabindex', '0');
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', span.getAttribute('title'));
  });
});
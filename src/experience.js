(() => {
  'use strict';

  const header = document.getElementById('site-header');
  const progressBar = document.getElementById('reading-progress-bar');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNavigation = document.getElementById('mobile-navigation');
  const canvas = document.getElementById('ambient-canvas');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const navLinks = [...document.querySelectorAll('.desktop-nav .nav-link')];
  let scrollQueued = false;
  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.45;
  let canvasFrame = 0;
  let canvasContext;
  let particles = [];
  let canvasWidth = 0;
  let canvasHeight = 0;
  let pixelRatio = 1;

  function closeMenu(restoreFocus = false) {
    if (!menuToggle || !mobileNavigation) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    mobileNavigation.classList.remove('is-open');
    mobileNavigation.inert = true;
    mobileNavigation.style.opacity = '0';
    mobileNavigation.style.visibility = 'hidden';
    mobileNavigation.style.clipPath = 'inset(0 0 100% 0)';
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuToggle.focus();
  }

  if (menuToggle && mobileNavigation) {
    menuToggle.addEventListener('click', () => {
      const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(opening));
      menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
      mobileNavigation.classList.toggle('is-open', opening);
      mobileNavigation.inert = !opening;
      mobileNavigation.style.opacity = opening ? '1' : '0';
      mobileNavigation.style.visibility = opening ? 'visible' : 'hidden';
      mobileNavigation.style.clipPath = opening ? 'inset(0)' : 'inset(0 0 100% 0)';
      document.body.classList.toggle('menu-open', opening);
      if (opening) mobileNavigation.querySelector('a')?.focus({ preventScroll: true });
    });

    mobileNavigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu(true);
      }
      if (event.key === 'Tab' && menuToggle.getAttribute('aria-expanded') === 'true') {
        const links = [...mobileNavigation.querySelectorAll('a')];
        const first = links[0];
        const last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) closeMenu();
    }, { passive: true });
  }

  function updateScrollState() {
    scrollQueued = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 28);
  }

  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollState);
  }, { passive: true });
  updateScrollState();

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal-up').forEach((element) => revealObserver.observe(element));
  } else {
    document.querySelectorAll('.reveal-up').forEach((element) => element.classList.add('is-visible'));
  }

  if ('IntersectionObserver' in window && navLinks.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const current = navLinks.find((link) => link.hash === `#${entry.target.id}`);
        if (!current) return;
        navLinks.forEach((link) => {
          const active = link === current;
          link.classList.toggle('is-current', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { threshold: 0, rootMargin: '-28% 0px -62% 0px' });
    navLinks.forEach((link) => {
      const section = document.querySelector(link.hash);
      if (section) sectionObserver.observe(section);
    });
  }

  function bindMagneticElements() {
    if (!finePointer.matches || reducedMotion.matches) return;
    document.querySelectorAll('.magnetic-link, .magnetic-button').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const bounds = element.getBoundingClientRect();
        const dx = (event.clientX - bounds.left - bounds.width / 2) * 0.08;
        const dy = (event.clientY - bounds.top - bounds.height / 2) * 0.08;
        element.style.setProperty('--magnetic-x', `${dx.toFixed(1)}px`);
        element.style.setProperty('--magnetic-y', `${dy.toFixed(1)}px`);
        element.classList.add('is-magnetic');
      });
      element.addEventListener('pointerleave', () => {
        element.classList.remove('is-magnetic');
        element.style.removeProperty('--magnetic-x');
        element.style.removeProperty('--magnetic-y');
      });
    });
  }
  bindMagneticElements();

  if (!canvas || !canvas.getContext || reducedMotion.matches) return;
  canvasContext = canvas.getContext('2d', { alpha: true });
  if (!canvasContext) return;

  function resizeCanvas() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = Math.round(canvasWidth * pixelRatio);
    canvas.height = Math.round(canvasHeight * pixelRatio);
    canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const count = Math.min(34, Math.max(14, Math.round((canvasWidth * canvasHeight) / 55000)));
    particles = Array.from({ length: count }, (_, index) => ({
      x: ((index * 67 + 13) % 100) / 100 * canvasWidth,
      y: ((index * 43 + 17) % 100) / 100 * canvasHeight,
      phase: index * 1.83,
      radius: index % 5 === 0 ? 1.2 : 0.65
    }));
  }

  function drawAmbient(time) {
    canvasFrame = 0;
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    const pointerOffsetX = (pointerX / Math.max(canvasWidth, 1) - 0.5) * 14;
    const pointerOffsetY = (pointerY / Math.max(canvasHeight, 1) - 0.5) * 12;
    const glow = canvasContext.createRadialGradient(
      canvasWidth * 0.72 + pointerOffsetX,
      canvasHeight * 0.35 + pointerOffsetY,
      0,
      canvasWidth * 0.72 + pointerOffsetX,
      canvasHeight * 0.35 + pointerOffsetY,
      Math.min(canvasWidth, canvasHeight) * 0.54
    );
    glow.addColorStop(0, 'rgba(118, 94, 180, 0.075)');
    glow.addColorStop(0.55, 'rgba(72, 59, 111, 0.025)');
    glow.addColorStop(1, 'rgba(5, 5, 7, 0)');
    canvasContext.fillStyle = glow;
    canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

    particles.forEach((particle) => {
      const drift = reducedMotion.matches ? 0 : Math.sin(time * 0.00022 + particle.phase) * 3;
      const dx = pointerX - particle.x;
      const dy = pointerY - particle.y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const influence = finePointer.matches ? Math.max(0, 1 - distance / 280) : 0;
      const x = particle.x + pointerOffsetX * influence * 0.22;
      const y = particle.y + drift + pointerOffsetY * influence * 0.22;
      canvasContext.beginPath();
      canvasContext.arc(x, y, particle.radius, 0, Math.PI * 2);
      canvasContext.fillStyle = `rgba(194, 182, 227, ${0.1 + influence * 0.2})`;
      canvasContext.fill();
    });
    canvasFrame = window.requestAnimationFrame(drawAmbient);
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && canvasFrame) {
      window.cancelAnimationFrame(canvasFrame);
      canvasFrame = 0;
    } else if (!document.hidden && !canvasFrame) {
      canvasFrame = window.requestAnimationFrame(drawAmbient);
    }
  });
  resizeCanvas();
  canvasFrame = window.requestAnimationFrame(drawAmbient);
})();
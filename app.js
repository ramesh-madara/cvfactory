(function () {
  'use strict';

  const STORAGE_KEY = 'cvfactory-theme';

  let activeView = 'cvs';
  let isAnimating = false;

  const html = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const navPill = document.getElementById('nav-pill');
  const navCvs = document.getElementById('nav-cvs');
  const navFeedbacks = document.getElementById('nav-feedbacks');
  const cvSection = document.getElementById('cv-section');
  const feedbackSection = document.getElementById('feedback-section');
  const cvGalleryGrid = document.getElementById('cv-gallery-grid');
  const feedbackGrid = document.getElementById('feedback-grid');

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    html.classList.toggle('dark', isDark);
    themeIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggleTheme() {
    const nextTheme = html.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(nextTheme);
    updateNavLabels(activeView);
  }

  function getPillOffset(view) {
    if (view !== 'feedbacks') return 0;
    return navCvs.offsetWidth;
  }

  function setPillPosition(view) {
    const offset = getPillOffset(view);
    navPill.style.transform = `translateX(${offset}px)`;
    navPill.style.setProperty('--pill-from', `${offset}px`);
    navPill.style.setProperty('--pill-to', `${offset}px`);
  }

  function updateNavLabels(view) {
    const showCvs = view === 'cvs';
    const isDark = html.classList.contains('dark');

    navCvs.setAttribute('aria-selected', String(showCvs));
    navFeedbacks.setAttribute('aria-selected', String(!showCvs));

    navCvs.className =
      'relative z-10 flex h-full min-h-[44px] flex-1 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors duration-200 ' +
      (showCvs ? (isDark ? 'text-neutral-100' : 'text-neutral-900') : 'text-neutral-500');

    navFeedbacks.className =
      'relative z-10 flex h-full min-h-[44px] flex-1 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors duration-200 ' +
      (!showCvs ? (isDark ? 'text-neutral-100' : 'text-neutral-900') : 'text-neutral-500');
  }

  function switchView(view) {
    if (view === activeView || isAnimating) return;

    isAnimating = true;

    const fromOffset = getPillOffset(activeView);
    const toOffset = getPillOffset(view);

    navPill.style.setProperty('--pill-from', `${fromOffset}px`);
    navPill.style.setProperty('--pill-to', `${toOffset}px`);
    navPill.classList.add('squish');

    setTimeout(() => {
      navPill.classList.remove('squish');
      activeView = view;
      setPillPosition(view);

      cvSection.classList.toggle('hidden', view !== 'cvs');
      feedbackSection.classList.toggle('hidden', view !== 'feedbacks');
      updateNavLabels(view);

      isAnimating = false;
    }, 450);
  }

  function createGlassCard(innerHTML) {
    const card = document.createElement('article');
    card.className =
      'glass-panel group overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1';
    card.innerHTML = innerHTML;
    return card;
  }

  function renderCVGallery() {
    cvGalleryGrid.innerHTML = '';

    for (let i = CV_CONFIG.totalCVs; i >= 1; i -= 1) {
      const src = `${CV_CONFIG.cvFolder}${i}${CV_CONFIG.cvExt}`;
      const card = createGlassCard(`
        <div class="relative aspect-[3/4] overflow-hidden bg-neutral-200/30 dark:bg-neutral-800/30">
          <img
            src="${src}"
            alt="Resume layout ${i}"
            loading="lazy"
            class="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent p-4">
            <p class="text-sm font-medium text-neutral-100">Layout ${String(i).padStart(2, '0')}</p>
            <p class="text-xs text-neutral-300/80">Premium CV Design</p>
          </div>
        </div>
      `);
      cvGalleryGrid.appendChild(card);
    }
  }

  function renderFeedbacks() {
    feedbackGrid.innerHTML = '';

    for (let i = CV_CONFIG.totalFeedbacks; i >= 1; i -= 1) {
      const src = `${CV_CONFIG.feedbackFolder}${i}${CV_CONFIG.feedbackExt}`;
      const card = createGlassCard(`
        <div class="relative aspect-[3/4] overflow-hidden bg-neutral-200/30 dark:bg-neutral-800/30">
          <img
            src="${src}"
            alt="Client feedback ${i}"
            loading="lazy"
            class="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent p-4">
            <p class="text-sm font-medium text-neutral-100">Feedback ${String(i).padStart(2, '0')}</p>
            <p class="text-xs text-neutral-300/80">Client Review</p>
          </div>
        </div>
      `);
      feedbackGrid.appendChild(card);
    }
  }

  function bindEvents() {
    themeToggle.addEventListener('click', toggleTheme);

    navCvs.addEventListener('click', () => switchView('cvs'));
    navFeedbacks.addEventListener('click', () => switchView('feedbacks'));

    navCvs.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        switchView('cvs');
      }
    });

    navFeedbacks.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        switchView('feedbacks');
      }
    });

    window.addEventListener('resize', () => {
      setPillPosition(activeView);
    });
  }

  function init() {
    applyTheme(getPreferredTheme());
    setPillPosition(activeView);
    updateNavLabels(activeView);
    renderCVGallery();
    renderFeedbacks();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

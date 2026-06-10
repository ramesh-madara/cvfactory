(function () {
  'use strict';

  const STORAGE_KEY = 'cvfactory-theme';
  const GRID_STORAGE_KEY = 'cvfactory-grid-cols';
  const GRID_MANUAL_KEY = 'cvfactory-grid-manual';

  const GRID_CLASSES = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const DESKTOP_MQ = window.matchMedia('(min-width: 1024px)');

  let activeView = 'cvs';
  let isAnimating = false;
  let gridCols = 1;
  let openDropdown = null;
  let cvGallery = [];
  let feedbackGallery = [];
  let modalGallery = [];
  let modalIndex = 0;
  let touchStartX = 0;
  let touchDeltaX = 0;
  let isModalDragging = false;

  const html = document.documentElement;
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const navIsland = document.getElementById('nav-island');
  const navPill = document.getElementById('nav-pill');
  const navCvs = document.getElementById('nav-cvs');
  const navFeedbacks = document.getElementById('nav-feedbacks');
  const cvSection = document.getElementById('cv-section');
  const feedbackSection = document.getElementById('feedback-section');
  const cvGalleryGrid = document.getElementById('cv-gallery-grid');
  const feedbackGrid = document.getElementById('feedback-grid');
  const imageModal = document.getElementById('image-modal');
  const modalTrack = document.getElementById('modal-track');
  const modalViewport = document.querySelector('.modal-viewport');
  const modalCaption = document.getElementById('modal-caption');
  const modalCounter = document.getElementById('modal-counter');
  const modalFilmstrip = document.getElementById('modal-filmstrip');
  const modalClose = document.getElementById('modal-close');
  const modalPrev = document.getElementById('modal-prev');
  const modalNext = document.getElementById('modal-next');
  const gridDropdownMounts = document.querySelectorAll('[data-grid-dropdown-mount]');
  const galleryGrids = document.querySelectorAll('.gallery-grid');

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function isDesktop() {
    return DESKTOP_MQ.matches;
  }

  function getDefaultGridCols() {
    if (!isDesktop()) return 2;

    const width = window.innerWidth;
    if (width >= 1536) return 5;
    if (width >= 1280) return 4;
    return 3;
  }

  function getGridRange() {
    if (isDesktop()) {
      return { min: 3, max: 6 };
    }
    return { min: 1, max: 3 };
  }

  function clampGridCols(cols) {
    const { min, max } = getGridRange();
    return Math.min(max, Math.max(min, cols));
  }

  function hasManualGridPreference() {
    return localStorage.getItem(GRID_MANUAL_KEY) === 'true';
  }

  function getActiveGridCols() {
    if (hasManualGridPreference()) {
      const stored = Number(localStorage.getItem(GRID_STORAGE_KEY));
      if (!Number.isNaN(stored) && stored >= 1 && stored <= 6) {
        return clampGridCols(stored);
      }
    }
    return getDefaultGridCols();
  }

  function createGridPreview(cols, rows) {
    const preview = document.createElement('span');
    preview.className = 'grid-preview';
    preview.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    preview.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    preview.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < cols * rows; i += 1) {
      preview.appendChild(document.createElement('span'));
    }

    return preview;
  }

  function buildGridDropdown() {
    const wrap = document.createElement('div');
    wrap.className = 'grid-dropdown relative shrink-0';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className =
      'grid-dropdown-trigger glass-panel flex h-10 items-center gap-2.5 rounded-xl border border-neutral-200/60 px-3 text-neutral-700 transition-colors hover:bg-white/60 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-neutral-900/50';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Grid layout');

    const triggerIcon = document.createElement('span');
    triggerIcon.className = 'grid-dropdown-trigger-icon flex items-center';
    triggerIcon.appendChild(createGridPreview(gridCols, 2));

    const triggerChevron = document.createElement('i');
    triggerChevron.className = 'fa-solid fa-chevron-down text-[10px] text-neutral-400 transition-transform duration-200';

    trigger.appendChild(triggerIcon);
    trigger.appendChild(triggerChevron);

    const menu = document.createElement('div');
    menu.className =
      'grid-dropdown-menu glass-panel absolute right-0 top-[calc(100%+0.5rem)] z-40 hidden min-w-[3.25rem] overflow-hidden rounded-xl border border-neutral-200/60 p-1 shadow-xl dark:border-white/10';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', 'Grid layout options');

    wrap.appendChild(trigger);
    wrap.appendChild(menu);

    return { wrap, trigger, triggerIcon, triggerChevron, menu };
  }

  function getGridOptions() {
    const { min, max } = getGridRange();
    const options = [];
    for (let i = min; i <= max; i += 1) {
      options.push(i);
    }
    return options;
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.grid-dropdown-menu.open').forEach((menu) => {
      menu.classList.remove('open');
      menu.classList.add('hidden');
    });
    document.querySelectorAll('.grid-dropdown-trigger').forEach((trigger) => {
      trigger.setAttribute('aria-expanded', 'false');
      const chevron = trigger.querySelector('.fa-chevron-down');
      if (chevron) chevron.classList.remove('rotate-180');
    });
    openDropdown = null;
  }

  function openGridDropdown(dropdown) {
    if (openDropdown === dropdown) {
      closeAllDropdowns();
      return;
    }

    closeAllDropdowns();
    dropdown.menu.classList.remove('hidden');
    requestAnimationFrame(() => {
      dropdown.menu.classList.add('open');
    });
    dropdown.trigger.setAttribute('aria-expanded', 'true');
    dropdown.triggerChevron.classList.add('rotate-180');
    openDropdown = dropdown;
  }

  function refreshDropdownMenus() {
    const options = getGridOptions();

    document.querySelectorAll('.grid-dropdown').forEach((dropdownEl) => {
      const menu = dropdownEl.querySelector('.grid-dropdown-menu');
      const triggerIcon = dropdownEl.querySelector('.grid-dropdown-trigger-icon');
      if (!menu || !triggerIcon) return;

      menu.innerHTML = '';

      options.forEach((cols) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className =
          'grid-dropdown-option flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-neutral-700 transition-colors hover:bg-neutral-100/80 dark:text-neutral-200 dark:hover:bg-neutral-800/60';
        option.setAttribute('role', 'option');
        option.dataset.cols = String(cols);
        option.setAttribute('aria-label', `Grid with ${cols} columns`);

        if (cols === gridCols) {
          option.classList.add('active');
          option.setAttribute('aria-selected', 'true');
        } else {
          option.setAttribute('aria-selected', 'false');
        }

        option.appendChild(createGridPreview(cols, 2));
        menu.appendChild(option);
      });

      triggerIcon.innerHTML = '';
      triggerIcon.appendChild(createGridPreview(gridCols, 2));
    });
  }

  function initGridDropdowns() {
    gridDropdownMounts.forEach((mount) => {
      const dropdown = buildGridDropdown();
      mount.appendChild(dropdown.wrap);

      dropdown.trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        openGridDropdown(dropdown);
      });

      dropdown.menu.addEventListener('click', (event) => {
        const option = event.target.closest('.grid-dropdown-option');
        if (!option) return;
        event.stopPropagation();
        applyGridCols(Number(option.dataset.cols), true);
        closeAllDropdowns();
      });
    });

    refreshDropdownMenus();
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
    return view === 'feedbacks' ? '100%' : '0%';
  }

  function setPillPosition(view) {
    const offset = getPillOffset(view);
    navPill.style.transform = `translateX(${offset})`;
    navPill.style.setProperty('--pill-from', offset);
    navPill.style.setProperty('--pill-to', offset);
  }

  function updateNavLabels(view) {
    const showCvs = view === 'cvs';
    const isDark = html.classList.contains('dark');

    navCvs.setAttribute('aria-selected', String(showCvs));
    navFeedbacks.setAttribute('aria-selected', String(!showCvs));

    navCvs.className =
      'pointer-events-none relative z-10 flex h-9 flex-1 items-center justify-center rounded-full px-2 text-xs font-medium transition-colors duration-200 sm:px-4 sm:text-sm ' +
      (showCvs ? (isDark ? 'text-neutral-100' : 'text-neutral-900') : 'text-neutral-500');

    navFeedbacks.className =
      'pointer-events-none relative z-10 flex h-9 flex-1 items-center justify-center rounded-full px-2 text-xs font-medium transition-colors duration-200 sm:px-4 sm:text-sm ' +
      (!showCvs ? (isDark ? 'text-neutral-100' : 'text-neutral-900') : 'text-neutral-500');
  }

  function switchView(view) {
    if (view === activeView || isAnimating) return;

    isAnimating = true;

    const fromOffset = getPillOffset(activeView);
    const toOffset = getPillOffset(view);

    navPill.style.setProperty('--pill-from', fromOffset);
    navPill.style.setProperty('--pill-to', toOffset);
    navPill.style.setProperty('--pill-mid', fromOffset === toOffset ? fromOffset : '50%');
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

  function toggleNavView() {
    switchView(activeView === 'cvs' ? 'feedbacks' : 'cvs');
  }

  function applyGridCols(cols, persist) {
    const clamped = clampGridCols(cols);
    gridCols = clamped;

    if (persist) {
      localStorage.setItem(GRID_STORAGE_KEY, String(clamped));
      localStorage.setItem(GRID_MANUAL_KEY, 'true');
    }

    galleryGrids.forEach((grid) => {
      grid.className = `gallery-grid grid gap-4 sm:gap-5 lg:gap-6 ${GRID_CLASSES[clamped]}`;
    });

    refreshDropdownMenus();
  }

  function applyResponsiveGrid() {
    applyGridCols(getActiveGridCols(), false);
  }

  function buildGalleryItems(folder, total, ext, labelPrefix, subtitle) {
    const items = [];
    for (let i = total; i >= 1; i -= 1) {
      items.push({
        src: `${folder}${i}${ext}`,
        caption: `${labelPrefix} ${String(i).padStart(2, '0')}`,
        alt: `${labelPrefix.trim()} ${i}`,
        subtitle,
      });
    }
    return items;
  }

  function wrapIndex(index, length) {
    if (length === 0) return 0;
    return ((index % length) + length) % length;
  }

  function preloadModalImages(index) {
    if (modalGallery.length === 0) return;
    [index - 1, index + 1].forEach((i) => {
      const item = modalGallery[wrapIndex(i, modalGallery.length)];
      if (item) {
        const img = new Image();
        img.src = item.src;
      }
    });
  }

  function buildModalSlides() {
    modalTrack.innerHTML = modalGallery
      .map(
        (item) => `
        <div class="modal-slide flex h-full items-center justify-center px-2">
          <img
            src="${item.src}"
            alt="${item.alt}"
            draggable="false"
            class="max-h-[calc(100vh-13rem)] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      `
      )
      .join('');
  }

  function buildModalFilmstrip() {
    modalFilmstrip.innerHTML = modalGallery
      .map(
        (item, index) => `
        <button
          type="button"
          class="modal-thumb h-14 w-10 overflow-hidden rounded-md sm:h-16 sm:w-12 ${index === modalIndex ? 'active' : ''}"
          data-index="${index}"
          aria-label="View ${item.alt}"
          aria-current="${index === modalIndex ? 'true' : 'false'}"
        >
          <img src="${item.src}" alt="" draggable="false" class="h-full w-full object-cover object-top" loading="lazy" />
        </button>
      `
      )
      .join('');
  }

  function scrollFilmstripToActive() {
    const activeThumb = modalFilmstrip.querySelector('.modal-thumb.active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  function updateModalPosition(animate) {
    if (animate === false) {
      modalTrack.classList.add('dragging');
    } else {
      modalTrack.classList.remove('dragging');
    }
    modalTrack.style.transform = `translateX(-${modalIndex * 100}%)`;
  }

  function updateModalUI() {
    const item = modalGallery[modalIndex];
    if (!item) return;

    modalCaption.textContent = item.caption;
    modalCounter.textContent = `${modalIndex + 1} / ${modalGallery.length}`;

    modalFilmstrip.querySelectorAll('.modal-thumb').forEach((thumb, index) => {
      const isActive = index === modalIndex;
      thumb.classList.toggle('active', isActive);
      thumb.setAttribute('aria-current', String(isActive));
    });

    scrollFilmstripToActive();
    preloadModalImages(modalIndex);
  }

  function goToModalIndex(index, animate) {
    if (modalGallery.length === 0) return;
    modalIndex = wrapIndex(index, modalGallery.length);
    updateModalPosition(animate);
    updateModalUI();
  }

  function goToModalNext() {
    goToModalIndex(modalIndex + 1);
  }

  function goToModalPrev() {
    goToModalIndex(modalIndex - 1);
  }

  function openModal(gallery, startIndex) {
    if (!gallery.length) return;

    modalGallery = gallery;
    modalIndex = Math.min(Math.max(startIndex, 0), gallery.length - 1);

    buildModalSlides();
    buildModalFilmstrip();
    updateModalPosition(true);
    updateModalUI();

    imageModal.classList.remove('hidden');
    imageModal.classList.add('flex');
    body.classList.add('modal-open');
    modalClose.focus();
  }

  function closeModal() {
    imageModal.classList.add('hidden');
    imageModal.classList.remove('flex');
    body.classList.remove('modal-open');
    modalTrack.innerHTML = '';
    modalFilmstrip.innerHTML = '';
    modalGallery = [];
    modalIndex = 0;
  }

  function isModalOpen() {
    return imageModal.classList.contains('flex');
  }

  function bindModalSwipe() {
    modalViewport.addEventListener(
      'touchstart',
      (event) => {
        if (!isModalOpen() || modalGallery.length <= 1) return;
        touchStartX = event.touches[0].clientX;
        touchDeltaX = 0;
        isModalDragging = true;
        modalTrack.classList.add('dragging');
      },
      { passive: true }
    );

    modalViewport.addEventListener(
      'touchmove',
      (event) => {
        if (!isModalDragging) return;
        touchDeltaX = event.touches[0].clientX - touchStartX;
        const width = modalViewport.clientWidth || 1;
        const offset = -modalIndex * 100 + (touchDeltaX / width) * 100;
        modalTrack.style.transform = `translateX(${offset}%)`;
      },
      { passive: true }
    );

    modalViewport.addEventListener(
      'touchend',
      () => {
        if (!isModalDragging) return;
        isModalDragging = false;
        modalTrack.classList.remove('dragging');

        if (Math.abs(touchDeltaX) > 50) {
          if (touchDeltaX < 0) goToModalNext();
          else goToModalPrev();
        } else {
          updateModalPosition(true);
        }

        touchDeltaX = 0;
      },
      { passive: true }
    );
  }

  function createGlassCard(innerHTML) {
    const card = document.createElement('article');
    card.className =
      'glass-panel group overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1';
    card.innerHTML = innerHTML;
    return card;
  }

  function renderImageCard(folder, index, ext, alt, label, subtitle) {
    const src = `${folder}${index}${ext}`;
    return `
      <button
        type="button"
        class="gallery-card relative block w-full cursor-pointer overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-neutral-950"
        data-src="${src}"
        data-caption="${label}"
        data-alt="${alt}"
        aria-label="View ${alt} fullscreen"
      >
        <div class="relative aspect-[3/4] overflow-hidden bg-neutral-200/30 dark:bg-neutral-800/30">
          <img
            src="${src}"
            alt="${alt}"
            loading="lazy"
            draggable="false"
            class="pointer-events-none h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent p-4">
            <p class="text-sm font-medium text-neutral-100">${label}</p>
            <p class="text-xs text-neutral-300/80">${subtitle}</p>
          </div>
        </div>
      </button>
    `;
  }

  function bindGalleryClicks(grid, gallery) {
    grid.querySelectorAll('.gallery-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        openModal(gallery, index);
      });
    });
  }

  function renderCVGallery() {
    cvGallery = buildGalleryItems(
      CV_CONFIG.cvFolder,
      CV_CONFIG.totalCVs,
      CV_CONFIG.cvExt,
      'Layout',
      'Premium CV Design'
    );
    cvGalleryGrid.innerHTML = '';

    cvGallery.forEach((item, index) => {
      const num = CV_CONFIG.totalCVs - index;
      const card = createGlassCard(
        renderImageCard(
          CV_CONFIG.cvFolder,
          num,
          CV_CONFIG.cvExt,
          item.alt,
          item.caption,
          item.subtitle
        )
      );
      cvGalleryGrid.appendChild(card);
    });

    bindGalleryClicks(cvGalleryGrid, cvGallery);
  }

  function renderFeedbacks() {
    feedbackGallery = buildGalleryItems(
      CV_CONFIG.feedbackFolder,
      CV_CONFIG.totalFeedbacks,
      CV_CONFIG.feedbackExt,
      'Feedback',
      'Client Review'
    );
    feedbackGrid.innerHTML = '';

    feedbackGallery.forEach((item, index) => {
      const num = CV_CONFIG.totalFeedbacks - index;
      const card = createGlassCard(
        renderImageCard(
          CV_CONFIG.feedbackFolder,
          num,
          CV_CONFIG.feedbackExt,
          item.alt,
          item.caption,
          item.subtitle
        )
      );
      feedbackGrid.appendChild(card);
    });

    bindGalleryClicks(feedbackGrid, feedbackGallery);
  }

  function bindEvents() {
    themeToggle.addEventListener('click', toggleTheme);

    navIsland.addEventListener('click', toggleNavView);

    document.addEventListener('click', () => {
      closeAllDropdowns();
    });

    modalClose.addEventListener('click', closeModal);
    modalPrev.addEventListener('click', (event) => {
      event.stopPropagation();
      goToModalPrev();
    });
    modalNext.addEventListener('click', (event) => {
      event.stopPropagation();
      goToModalNext();
    });

    modalFilmstrip.addEventListener('click', (event) => {
      const thumb = event.target.closest('.modal-thumb');
      if (!thumb) return;
      event.stopPropagation();
      goToModalIndex(Number(thumb.dataset.index));
    });

    bindModalSwipe();

    imageModal.addEventListener('click', (event) => {
      if (event.target === imageModal) closeModal();
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (openDropdown) {
          closeAllDropdowns();
          return;
        }
        if (isModalOpen()) {
          closeModal();
        }
        return;
      }

      if (!isModalOpen() || modalGallery.length <= 1) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToModalNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToModalPrev();
      }
    });

    DESKTOP_MQ.addEventListener('change', applyResponsiveGrid);

    window.addEventListener('resize', () => {
      setPillPosition(activeView);
      applyResponsiveGrid();
    });
  }

  function init() {
    applyTheme(getPreferredTheme());
    setPillPosition(activeView);
    updateNavLabels(activeView);
    initGridDropdowns();
    applyResponsiveGrid();
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

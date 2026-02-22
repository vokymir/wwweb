/**
 * main.js — Site interactivity
 *
 * Q8 — Deferred script loading
 * ─────────────────────────────────────────────────────────────────────
 * In HTML: <script src="js/main.js" defer></script>
 *
 * defer vs async vs none:
 *
 *   None (default):
 *     HTML parsing STOPS, script downloads + executes, then parsing resumes.
 *     Never do this for non-critical scripts. Blocks the page.
 *
 *   async:
 *     Script downloads in parallel. Executes IMMEDIATELY when downloaded,
 *     which interrupts HTML parsing whenever the download finishes.
 *     Use for: completely independent scripts (analytics, ads) that don't
 *     need the DOM to be ready. Order of execution is NOT guaranteed.
 *
 *   defer:
 *     Script downloads in parallel. Executes AFTER HTML parsing is complete
 *     (before DOMContentLoaded fires). Order of execution IS preserved.
 *     Use for: everything else. The default choice.
 *
 *   type="module":
 *     Implies defer automatically. Enables ES module syntax (import/export).
 *     Strict mode by default. Scoped to the module (no global pollution).
 *     Recommended for modern projects.
 *
 * This file uses a plain IIFE (Immediately Invoked Function Expression)
 * to avoid polluting the global scope, without requiring a bundler.
 * For a real project: use <script type="module"> and import/export.
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // THEME TOGGLE (light / dark)
  // Q11 — minimal JS for theme switching
  // ═══════════════════════════════════════════════════════════════════

  /**
   * On first load, restore the saved theme preference.
   * This runs here (in the deferred JS) rather than in a <head> script,
   * which means there CAN be a brief flash on page load if the saved
   * preference differs from the OS default.
   *
   * To eliminate the flash entirely, put JUST this block inline in <head>:
   *   <script>
   *     const saved = localStorage.getItem('theme');
   *     if (saved) document.documentElement.dataset.theme = saved;
   *   </script>
   * That 3-line inline script is the one exception to "no inline scripts".
   */
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  }

  const themeToggle = document.querySelector('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const root = document.documentElement;
      const isDark = root.dataset.theme === 'dark'
        || (!root.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);

      const newTheme = isDark ? 'light' : 'dark';
      root.dataset.theme = newTheme;
      localStorage.setItem('theme', newTheme);

      // Update aria-label to reflect current state
      themeToggle.setAttribute('aria-label',
        newTheme === 'dark' ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv'
      );
    });
  }


  // ═══════════════════════════════════════════════════════════════════
  // MOBILE NAVIGATION (hamburger toggle)
  // ═══════════════════════════════════════════════════════════════════

  const hamburger = document.querySelector('[data-hamburger]');
  const siteNav   = document.querySelector('.site-nav');

  if (hamburger && siteNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = siteNav.getAttribute('aria-hidden') === 'false';
      const newState = !isOpen;

      // The CSS hook: site-nav[aria-hidden="false"] shows the panel
      siteNav.setAttribute('aria-hidden', String(!newState));
      hamburger.setAttribute('aria-expanded', String(newState));
      hamburger.setAttribute('aria-label',
        newState ? 'Zavřít navigaci' : 'Otevřít navigaci'
      );

      // Prevent body scroll when nav is open
      document.body.style.overflow = newState ? 'hidden' : '';
    });

    // Close when clicking outside the nav (the ::before overlay)
    siteNav.addEventListener('click', (e) => {
      // The ::before pseudo-element handles clicks on the overlay.
      // We detect clicks on the nav itself (outside the nav list)
      if (e.target === siteNav) {
        closeNav();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.getAttribute('aria-hidden') === 'false') {
        closeNav();
        hamburger.focus(); // return focus to trigger
      }
    });

    // Close when a nav link is clicked (navigate away)
    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    function closeNav() {
      siteNav.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Otevřít navigaci');
      document.body.style.overflow = '';
    }
  }


  // ═══════════════════════════════════════════════════════════════════
  // DROPDOWN MENUS (<details>/<summary> pattern)
  // ═══════════════════════════════════════════════════════════════════

  // Close all <details> dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    document.querySelectorAll('details[open]').forEach(details => {
      if (!details.contains(e.target)) {
        details.removeAttribute('open');
      }
    });
  });

  // Close all <details> on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('details[open]').forEach(details => {
        details.removeAttribute('open');
        // Return focus to the summary trigger
        details.querySelector('summary')?.focus();
      });
    }
  });

  // Close other dropdowns when one opens (accordion behaviour)
  document.querySelectorAll('.site-nav details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (details.open) {
        document.querySelectorAll('.site-nav details[open]').forEach(other => {
          if (other !== details) other.removeAttribute('open');
        });
      }
    });
  });


  // ═══════════════════════════════════════════════════════════════════
  // SEARCH DIALOG (<dialog> element)
  // Q7 — minimal JS: just open/close. Everything else is native.
  // ═══════════════════════════════════════════════════════════════════

  const searchDialog  = document.querySelector('.search-dialog');
  const searchTrigger = document.querySelector('[data-search-trigger]');
  const searchClose   = document.querySelector('.search-dialog__close');
  const searchInput   = document.querySelector('.search-dialog__input');

  if (searchDialog && searchTrigger) {

    // Open
    searchTrigger.addEventListener('click', () => {
      searchDialog.showModal();
      // showModal() — native method that:
      //   1. Makes dialog visible with display:block
      //   2. Adds [open] attribute (our CSS hook)
      //   3. Traps focus inside the dialog
      //   4. Shows the ::backdrop
      //   5. Allows Escape to close natively

      // Focus the search input when dialog opens
      // setTimeout(0) pushes this to the next tick, after the dialog animation starts
      setTimeout(() => searchInput?.focus(), 50);
    });

    // Close via close button
    searchClose?.addEventListener('click', closeSearch);

    // Close via backdrop click
    searchDialog.addEventListener('click', (e) => {
      // dialog.getBoundingClientRect() only covers the dialog box itself.
      // A click ON the ::backdrop has coordinates outside that box.
      const rect = searchDialog.getBoundingClientRect();
      const clickedBackdrop =
        e.clientX < rect.left  || e.clientX > rect.right ||
        e.clientY < rect.top   || e.clientY > rect.bottom;

      if (clickedBackdrop) closeSearch();
    });

    // Native Escape handling
    searchDialog.addEventListener('cancel', (e) => {
      // 'cancel' fires when user presses Escape on a <dialog>
      // We intercept to add exit animation before close
      e.preventDefault();
      closeSearch();
    });

    // Handle quick-search hints
    document.querySelectorAll('.search-dialog__hint').forEach(hint => {
      hint.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = hint.textContent.trim();
          searchInput.focus();
        }
      });
    });

    function closeSearch() {
      // Add [data-closing] attribute — CSS uses this to trigger exit animation
      searchDialog.dataset.closing = '';

      searchDialog.addEventListener('animationend', () => {
        delete searchDialog.dataset.closing;
        searchDialog.close(); // native method — removes [open], hides backdrop
        // focus returns to the trigger automatically (native <dialog> behaviour)
      }, { once: true });

      // If @starting-style / animations aren't supported, close immediately
      // Use a fallback timeout matching the transition duration
      setTimeout(() => {
        if (searchDialog.open) {
          delete searchDialog.dataset.closing;
          searchDialog.close();
        }
      }, 300);
    }
  }


  // ═══════════════════════════════════════════════════════════════════
  // SKIP LINK — ensure <main> can receive focus
  // ═══════════════════════════════════════════════════════════════════
  // Q2 — The skip link's href="#main" targets <main id="main">.
  // tabindex="-1" on <main> allows programmatic focus without
  // adding it to the natural tab order.
  // This JS just adds a small scroll offset so the heading isn't
  // hidden behind the sticky header.
  const skipLink = document.querySelector('.skip-link');
  const mainEl   = document.querySelector('main');

  if (skipLink && mainEl) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Scroll so the top of main is below the sticky header
      const headerH = document.querySelector('.site-header')?.offsetHeight ?? 0;
      const top     = mainEl.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
      mainEl.focus({ preventScroll: true });
    });
  }

})(); // end IIFE

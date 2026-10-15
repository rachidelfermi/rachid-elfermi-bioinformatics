/*
 * Static portfolio enhancements. All content and navigation remain usable
 * without JavaScript; filters and clipboard controls are enabled here.
 * HTML contract: data-theme="dark|light", #theme-toggle, #menu-toggle,
 * #primary-navigation, .filter-button[data-filter],
 * .project-card[data-categories], #project-count, and #project-empty.
 * The mobile navigation uses .is-open at widths below 1100px.
 * Optional motion hooks: .scroll-reveal.is-revealed,
 * .experience-entry.is-in-view, .project-card.filter-enter, and
 * .site-header.is-scrolled. CSS must keep their base states fully visible.
 * Theme storage is failure-safe. No content is hidden for entrance animations,
 * and no JavaScript scrolling or animation overrides reduced-motion preferences.
 */

(() => {
  "use strict";

  const THEME_KEY = "rachid-portfolio-theme";
  const EMAIL = "rachid.elfermi@gmail.com";
  const isFrench = document.documentElement.lang === "fr";
  const labels = isFrench ? {
    light: "Activer le thème clair", dark: "Activer le thème sombre",
    open: "Ouvrir la navigation", close: "Fermer la navigation",
    copied: "Adresse copiée", copyFailed: "Utilisez le lien de contact"
  } : {
    light: "Switch to light theme", dark: "Switch to dark theme",
    open: "Open navigation", close: "Close navigation",
    copied: "Email copied", copyFailed: "Use the email link"
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function onMotionPreferenceChange(listener) {
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", listener);
    } else {
      reducedMotion.addListener(listener);
    }
  }

  function initTheme() {
    const root = document.documentElement;
    const toggle = document.getElementById("theme-toggle");

    function applyTheme(theme) {
      root.dataset.theme = theme;

      if (toggle) {
        const label =
          theme === "dark" ? labels.light : labels.dark;
        toggle.setAttribute("aria-label", label);
        toggle.setAttribute("aria-pressed", String(theme === "dark"));
        toggle.title = label;
      }
    }

    let theme = root.dataset.theme;

    if (theme !== "dark" && theme !== "light") {
      theme = "light";
      try {
        const savedTheme = window.localStorage.getItem(THEME_KEY);
        if (savedTheme === "dark" || savedTheme === "light") {
          theme = savedTheme;
        }
      } catch {
        // Storage may be blocked or unavailable, including on some file URLs.
      }
    }

    applyTheme(theme);

    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        try {
          window.localStorage.setItem(THEME_KEY, nextTheme);
        } catch {
          // The theme still changes for this page when persistence is blocked.
        }
      });
    }

    window.addEventListener("storage", (event) => {
      if (
        event.key === THEME_KEY &&
        (event.newValue === "dark" || event.newValue === "light")
      ) {
        applyTheme(event.newValue);
      }
    });
  }

  function initNavigation() {
    const navigation = document.getElementById("primary-navigation");
    const toggle = document.getElementById("menu-toggle");
    if (!navigation || !toggle) return;

    const desktop = window.matchMedia("(min-width: 1100px)");

    function setMenuOpen(open) {
      const isOpen = Boolean(open) && !desktop.matches;
      navigation.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute(
        "aria-label",
        isOpen ? labels.close : labels.open,
      );

      // Never leave keyboard focus inside navigation that has become hidden.
      if (
        !isOpen &&
        !desktop.matches &&
        navigation.contains(document.activeElement)
      ) {
        toggle.focus();
      }
    }

    toggle.hidden = false;
    setMenuOpen(false);

    toggle.addEventListener("click", (event) => {
      const opening = toggle.getAttribute("aria-expanded") !== "true";
      setMenuOpen(opening);
      if (opening && !desktop.matches && event.detail === 0) {
        // The toggle follows the navigation in source order. Move a keyboard
        // user to the first link instead of requiring backwards tabbing.
        const firstLink = navigation.querySelector("a");
        if (firstLink) firstLink.focus();
      }
    });

    navigation.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;
      const wasOpen = toggle.getAttribute("aria-expanded") === "true";
      setMenuOpen(false);

      if (
        !wasOpen ||
        link.pathname !== window.location.pathname ||
        !link.hash ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const section = document.getElementById(link.hash.slice(1));
      if (!section) return;
      const heading = document.getElementById(
        section.getAttribute("aria-labelledby"),
      );
      const destination = heading || section;

      // Let the native anchor update the URL and scroll first. Focus the
      // destination without a second scroll, so the next Tab continues there.
      window.requestAnimationFrame(() => {
        if (!destination.hasAttribute("tabindex")) {
          destination.setAttribute("tabindex", "-1");
          destination.addEventListener(
            "blur",
            () => {
              destination.removeAttribute("tabindex");
            },
            { once: true },
          );
        }
        destination.focus({ preventScroll: true });
      });
    });

    document.addEventListener("click", (event) => {
      if (
        !navigation.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true"
      ) {
        setMenuOpen(false);
        toggle.focus();
      }
    });

    function onViewportChange() {
      setMenuOpen(false);
    }

    if (typeof desktop.addEventListener === "function") {
      desktop.addEventListener("change", onViewportChange);
    } else {
      // Older Safari versions use the original MediaQueryList API.
      desktop.addListener(onViewportChange);
    }
  }

  function initSectionTracking() {
    const navigation = document.getElementById("primary-navigation");
    const progress = document.getElementById("scroll-progress");
    const header = document.querySelector(".site-header");
    const links = navigation
      ? Array.from(navigation.querySelectorAll('a[href^="#"]'))
      : [];
    const sections = links
      .map((link) => document.getElementById(link.hash.slice(1)))
      .filter(Boolean);

    function setCurrentSection(id) {
      links.forEach((link) => {
        if (link.hash === `#${id}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    const initialSection = sections.find(
      (section) => `#${section.id}` === window.location.hash,
    );
    if (sections.length) setCurrentSection((initialSection || sections[0]).id);

    links.forEach((link) => {
      link.addEventListener("click", () =>
        setCurrentSection(link.hash.slice(1)),
      );
    });

    window.addEventListener("hashchange", () => {
      const section = sections.find(
        (item) => `#${item.id}` === window.location.hash,
      );
      if (section) setCurrentSection(section.id);
    });

    const supportsObserver = "IntersectionObserver" in window;

    if (supportsObserver && sections.length) {
      const visibleSections = new Set();
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSections.add(entry.target);
            } else {
              visibleSections.delete(entry.target);
            }
          });

          const visible = Array.from(visibleSections).sort(
            (a, b) =>
              a.getBoundingClientRect().top - b.getBoundingClientRect().top,
          );
          if (visible.length) setCurrentSection(visible[0].id);
        },
        {
          // Observe a band below the sticky header instead of requiring a tall
          // research section to occupy a large percentage of the viewport.
          rootMargin: "-15% 0px -60% 0px",
          threshold: 0,
        },
      );

      sections.forEach((section) => observer.observe(section));
    }

    let framePending = false;

    function updateScrollState() {
      framePending = false;

      if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);

      if (progress) {
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const percent =
          scrollableHeight > 0
            ? Math.min(
                100,
                Math.max(0, (window.scrollY / scrollableHeight) * 100),
              )
            : 0;
        progress.style.transform = `scaleX(${(percent / 100).toFixed(4)})`;
      }

      if (!supportsObserver && sections.length) {
        const readingLine = window.innerHeight * 0.3;
        let currentSection = sections[0];
        sections.forEach((section) => {
          if (section.getBoundingClientRect().top <= readingLine)
            currentSection = section;
        });
        setCurrentSection(currentSection.id);
      }
    }

    function scheduleUpdate() {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(updateScrollState);
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    updateScrollState();
  }

  function initProjectFilters() {
    const filters = Array.from(
      document.querySelectorAll(".filter-button[data-filter]"),
    );
    const cards = Array.from(
      document.querySelectorAll(".project-card[data-categories]"),
    );
    const count = document.getElementById("project-count");
    const empty = document.getElementById("project-empty");
    const emptyMessage =
      empty && (empty.querySelector("[data-empty-message]") || empty);
    const emptyMessages = {
      all: "No research projects are currently listed. Verified project details can be added here.",
      human:
        "No human genomics projects are currently listed. Explore the human genomics research domain above.",
      environmental:
        "No environmental genomics projects are currently listed. Explore the environmental genomics research domain above.",
      microbiome:
        "No microbiome or metagenomics projects are currently listed. Explore the research domains above.",
      software:
        "No bioinformatics software projects are currently listed. Explore the bioinformatics engineering research domain above.",
    };

    if (!filters.length) return;

    let animationFrame;

    function clearFilterAnimation() {
      window.cancelAnimationFrame(animationFrame);
      cards.forEach((card) => card.classList.remove("filter-enter"));
    }

    function applyFilter(filter, animate = false) {
      clearFilterAnimation();
      let visibleCount = 0;
      const visibleCards = [];

      cards.forEach((card) => {
        const categories = card.dataset.categories.trim().split(/\s+/);
        const visible = filter === "all" || categories.includes(filter);
        card.hidden = !visible;
        if (visible) {
          visibleCount += 1;
          visibleCards.push(card);
        }
      });

      filters.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === filter),
        );
      });

      if (count) {
        count.textContent = isFrench
          ? `${visibleCount} projet${visibleCount === 1 ? "" : "s"} affiché${visibleCount === 1 ? "" : "s"} sur ${cards.length}`
          : `${visibleCount} of ${cards.length} ${cards.length === 1 ? "project" : "projects"} shown`;
      }

      if (empty) {
        empty.hidden = visibleCount > 0;
        emptyMessage.textContent = isFrench ? "Aucun projet documenté dans cette catégorie pour le moment." : (emptyMessages[filter] || emptyMessages.all);
      }

      // Visibility and accessible status update immediately. Wait for the
      // removed animation class to paint before starting a brief CSS entrance;
      // rapid filter changes cancel the pending frames without forced layout.
      if (animate && !reducedMotion.matches && visibleCards.length) {
        animationFrame = window.requestAnimationFrame(() => {
          animationFrame = window.requestAnimationFrame(() => {
            if (reducedMotion.matches) return;
            visibleCards.forEach((card) => card.classList.add("filter-enter"));
          });
        });
      }
    }

    filters.forEach((button) => {
      button.addEventListener("click", () =>
        applyFilter(button.dataset.filter, true),
      );
    });

    applyFilter("all");
    document.querySelectorAll(".project-filters").forEach((container) => {
      container.hidden = false;
    });

    onMotionPreferenceChange((event) => {
      if (event.matches) clearFilterAnimation();
    });
  }

  function initScrollReveals() {
    if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

    const items = Array.from(
      document.querySelectorAll(".scroll-reveal, .experience-entry"),
    );
    if (!items.length) return;

    function reveal(item) {
      if (item.classList.contains("scroll-reveal")) {
        item.classList.add("is-revealed");
      }
      if (item.classList.contains("experience-entry")) {
        item.classList.add("is-in-view");
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0 },
    );

    items.forEach((item) => observer.observe(item));

    onMotionPreferenceChange((event) => {
      if (!event.matches) return;
      observer.disconnect();
      // A preference change completes every optional visual state. Content was
      // visible throughout, and CSS disables motion in the reduced mode.
      items.forEach(reveal);
    });
  }

  function initClipboard() {
    const button = document.getElementById("copy-email");
    if (
      !button ||
      !window.isSecureContext ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    )
      return;

    const label = button.querySelector("[data-copy-label]") || button;
    const initialLabel = label.textContent;
    let restoreTimer;
    button.hidden = false;

    button.addEventListener("click", async () => {
      window.clearTimeout(restoreTimer);
      button.disabled = true;
      try {
        await navigator.clipboard.writeText(EMAIL);
        label.textContent = labels.copied;
      } catch {
        label.textContent = labels.copyFailed;
      } finally {
        button.disabled = false;
        restoreTimer = window.setTimeout(() => {
          label.textContent = initialLabel;
        }, 2500);
      }
    });
  }

  function init() {
    document.documentElement.classList.add("js-enabled");
    document.documentElement.classList.remove("js-pending");
    initTheme();
    initNavigation();
    initSectionTracking();
    initProjectFilters();
    initScrollReveals();
    initClipboard();

    const year = document.getElementById("current-year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

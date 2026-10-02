(() => {
  const visuals = document.querySelectorAll('.hero-card, .connect-visual');
  if (!visuals.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let loaded = false;
  let observer;

  function loadVisuals() {
    if (loaded || reducedMotion.matches) return;
    loaded = true;
    observer?.disconnect();
    import('/assets/js/visuals.bundle.js').catch(() => {
      // Static CSS artwork remains visible if the module cannot load.
    });
  }

  function watchVisuals() {
    if (loaded || reducedMotion.matches) return;
    if (!('IntersectionObserver' in window)) {
      loadVisuals();
      return;
    }
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadVisuals();
    }, { rootMargin: '160px' });
    visuals.forEach((visual) => observer.observe(visual));
  }

  reducedMotion.addEventListener('change', watchVisuals);
  watchVisuals();
})();

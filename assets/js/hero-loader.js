(() => {
  const card = document.querySelector('.hero-card');
  if (!card) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let loaded = false;
  let observer;

  function loadScene() {
    if (loaded || reducedMotion.matches) return;
    loaded = true;
    observer?.disconnect();
    import('/assets/js/hero-wireframe.bundle.js').catch(() => {
      // The CSS rings remain visible if the module cannot load.
    });
  }

  function watchCard() {
    if (loaded || reducedMotion.matches) return;
    if (!('IntersectionObserver' in window)) {
      loadScene();
      return;
    }
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadScene();
    }, { rootMargin: '160px' });
    observer.observe(card);
  }

  reducedMotion.addEventListener('change', watchCard);
  watchCard();
})();

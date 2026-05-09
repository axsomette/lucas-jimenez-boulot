/**
 * animations.ts — Scroll reveal avec Motion (motion.dev)
 * Utilise inView() + stagger() selon les guidelines du skill Motion
 * Fallback natif si Motion n'est pas disponible
 * Respecte prefers-reduced-motion
 */

/** Wrapper prefers-reduced-motion selon le skill Motion */
function getReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Révèle tous les éléments .reveal immédiatement (sans animation) */
function revealAll(): void {
  document.querySelectorAll<HTMLElement>('.reveal').forEach(el => {
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}

export async function initAnimations(): Promise<void> {
  if (getReducedMotion()) {
    revealAll();
    return;
  }

  /*
   * Timeout de sécurité — si motion met plus de 600 ms à charger
   * (première visite, réseau lent, CDN lent…), on révèle tout
   * immédiatement pour éviter la page noire. Le timeout est annulé
   * dès que motion est prêt.
   */
  const safetyTimer = setTimeout(revealAll, 600);

  try {
    const { animate, inView, stagger } = await import('motion');
    clearTimeout(safetyTimer); // Motion chargé à temps — on annule le fallback

    // Éléments individuels (headers, bios, etc.)
    const singles = document.querySelectorAll<HTMLElement>(
      '.reveal:not(.projects__grid):not(.about__values):not(.contact__grid)'
    );

    inView(singles, ({ target }) => {
      animate(
        target,
        { opacity: [0, 1], y: [18, 0] },
        { duration: 0.55, easing: [0.16, 1, 0.3, 1] }
      );
    }, { amount: 0.15 });

    // Grille de projets — stagger sur les enfants <li>
    const projectGrids = document.querySelectorAll<HTMLElement>('.projects__grid');
    projectGrids.forEach(grid => {
      const items = grid.querySelectorAll<HTMLElement>('li');
      inView(grid, () => {
        animate(
          items,
          { opacity: [0, 1], y: [20, 0] },
          { duration: 0.5, easing: 'ease-out', delay: stagger(0.08) }
        );
      }, { amount: 0.1 });
    });

    // Valeurs About — stagger sur les <li>
    const valuesLists = document.querySelectorAll<HTMLElement>('.about__values');
    valuesLists.forEach(list => {
      const items = list.querySelectorAll<HTMLElement>('li');
      inView(list, () => {
        animate(
          items,
          { opacity: [0, 1], y: [12, 0] },
          { duration: 0.45, easing: 'ease-out', delay: stagger(0.1) }
        );
      }, { amount: 0.1 });
    });

    // Grille contact — stagger sur les cards
    const contactGrids = document.querySelectorAll<HTMLElement>('.contact__grid');
    contactGrids.forEach(grid => {
      const cards = grid.querySelectorAll<HTMLElement>('.contact__card');
      inView(grid, () => {
        animate(
          cards,
          { opacity: [0, 1], y: [16, 0] },
          { duration: 0.5, easing: 'ease-out', delay: stagger(0.12) }
        );
      }, { amount: 0.1 });
    });

  } catch {
    clearTimeout(safetyTimer);
    // Fallback : IntersectionObserver natif si Motion n'est pas disponible
    fallback();
  }
}

function fallback(): void {
  const els = document.querySelectorAll<HTMLElement>('.reveal');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      el.style.transition = 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1';
      el.style.transform = 'none';
      obs.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
}

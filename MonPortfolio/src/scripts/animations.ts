/**
 * animations.ts — Scroll reveal avec Motion (motion.dev)
 *
 * Stratégie robuste :
 *  1. CSS `.js .reveal { opacity: 0 }` — masque via classe injectée en <head>
 *  2. Safety timer 600ms — si Motion tarde (réseau lent), révèle tout et abandonne
 *  3. Flag `animationsActive` — si le timer a tiré avant que Motion charge,
 *     Motion ne remet PAS les éléments à opacity:0 (évite le "div coupée en 2")
 *  4. Pré-masquage JS des <li> staggerés seulement si Motion charge À TEMPS
 */

function getReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Révèle TOUS les éléments animables immédiatement */
function revealAll(): void {
  document.querySelectorAll<HTMLElement>('.reveal').forEach(el => {
    el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    el.style.opacity    = '1';
    el.style.transform  = 'none';
  });
  // Les <li> staggerés (projects, about) n'ont pas .reveal en CSS
  // mais peuvent avoir été cachés en JS — on les révèle aussi
  document.querySelectorAll<HTMLElement>(
    '.projects__grid li, .about__values li'
  ).forEach(el => {
    el.style.opacity   = '1';
    el.style.transform = 'none';
  });
}

export async function initAnimations(): Promise<void> {
  if (getReducedMotion()) {
    revealAll();
    return;
  }

  let animationsActive = true;

  const safetyTimer = setTimeout(() => {
    animationsActive = false;
    revealAll();
  }, 600);

  try {
    const { animate, inView, stagger } = await import('motion');
    clearTimeout(safetyTimer);

    // Le timer a déjà révélé tout → on ne relance PAS les animations
    // (sinon Motion mettrait les items à opacity:0 puis les ré-animerait)
    if (!animationsActive) return;

    // ── Éléments .reveal individuels ──────────────────────────────
    const singles = document.querySelectorAll<HTMLElement>(
      '.reveal:not(.projects__grid):not(.about__values)'
    );
    inView(singles, ({ target }) => {
      animate(target, { opacity: [0, 1], y: [18, 0] },
        { duration: 0.55, easing: [0.16, 1, 0.3, 1] });
    }, { amount: 0.15 });

    // ── Grille projets — stagger <li> ──────────────────────────────
    document.querySelectorAll<HTMLElement>('.projects__grid').forEach(grid => {
      const items = grid.querySelectorAll<HTMLElement>('li');
      // Pré-masquer ICI (Motion charge à temps, l'utilisateur n'a pas encore scrollé)
      items.forEach(el => { el.style.opacity = '0'; });
      inView(grid, () => {
        animate(items, { opacity: [0, 1], y: [20, 0] },
          { duration: 0.5, easing: 'ease-out', delay: stagger(0.08) });
      }, { amount: 0.1 });
    });

    // ── Valeurs About — stagger <li> ───────────────────────────────
    document.querySelectorAll<HTMLElement>('.about__values').forEach(list => {
      const items = list.querySelectorAll<HTMLElement>('li');
      items.forEach(el => { el.style.opacity = '0'; });
      inView(list, () => {
        animate(items, { opacity: [0, 1], y: [12, 0] },
          { duration: 0.45, easing: 'ease-out', delay: stagger(0.1) });
      }, { amount: 0.1 });
    });

  } catch {
    clearTimeout(safetyTimer);
    if (animationsActive) fallback();
  }
}

function fallback(): void {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      el.style.transition = 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity    = '1';
      el.style.transform  = 'none';
      obs.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll<HTMLElement>('.reveal').forEach(el => obs.observe(el));
}

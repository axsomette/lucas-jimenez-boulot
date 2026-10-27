/**
 * Formatage partagé par les sections et le blog.
 * Tout est calculé au build : aucune de ces fonctions ne tourne dans le navigateur.
 */

/** Préfixe un chemin du dossier public/ avec la base du site (GitHub Pages). */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** Temps de lecture arrondi à la minute supérieure, 200 mots par minute. */
export function readingTime(body: string): number {
  return Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
}

/** « 24 août 2026 », ou avec le mois abrégé : « 10 avr. 2026 ». */
export function formatDate(date: Date, month: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month, year: 'numeric' }).format(date);
}

/** Plage de dates d'un poste. Demi-cadratin (–) et non cadratin (—) : c'est le caractère des plages. */
export function formatPeriod(start: Date, end?: Date, current = false): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  const from = start.toLocaleDateString('fr-FR', opts);
  const to = current ? "aujourd'hui" : end ? end.toLocaleDateString('fr-FR', opts) : '';
  return `${from} – ${to}`;
}

/** Durée lisible : « 2 ans 7 mois ». */
export function durationLabel(start: Date, end?: Date): string {
  const to = end ?? new Date();
  const months = (to.getFullYear() - start.getFullYear()) * 12 + (to.getMonth() - start.getMonth());
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} an${y > 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} mois`);
  return parts.join(' ');
}

/** Un nom saisi tout en capitales (« KANEVA ») s'affiche « Kaneva » dans le texte courant. */
export function displayName(name: string): string {
  return name === name.toUpperCase() ? name.charAt(0) + name.slice(1).toLowerCase() : name;
}

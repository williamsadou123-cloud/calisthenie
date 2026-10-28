export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmtPlage(plage, type) {
  const u = type === 'tenue' ? ' s' : '';
  return plage.min === plage.max ? `${plage.max}${u}` : `${plage.min}-${plage.max}${u}`;
}

export const LIEUX = { maison: 'Maison', street: 'Street' };
export const NOMS_JOURS = { lun: 'Lundi', mar: 'Mardi', mer: 'Mercredi', jeu: 'Jeudi', ven: 'Vendredi', sam: 'Samedi', dim: 'Dimanche' };

export function parExercice(exercices) {
  return Object.fromEntries(exercices.map((e) => [e.id, e]));
}

// Place le corps dans le décor : sur le sol, ou accroché à une barre. Pur, sans three.js.

function decale(fk, d) {
  const out = {};
  for (const [nom, n] of Object.entries(fk)) out[nom] = { pos: [n.pos[0] + d[0], n.pos[1] + d[1], n.pos[2] + d[2]], rot: n.rot };
  return out;
}

// ancrage: { type: 'sol', appui?: 'main' | 'pointe' | ..., hauteur?: m } | { type: 'barre', y, z }
// `hauteur`: le point le plus bas est placé à cette hauteur (corps allongé: ~0,11 m, la moitié de son épaisseur).
// `appui` fixe aussi x et z: le milieu des deux points `<appui>_g` / `<appui>_d` est placé en (0, 0).
export function ancrer(fk, ancrage) {
  if (ancrage.type === 'barre') {
    const g = fk.main_g.pos;
    const d = fk.main_d.pos;
    return decale(fk, [-(g[0] + d[0]) / 2, ancrage.y - (g[1] + d[1]) / 2, ancrage.z - (g[2] + d[2]) / 2]);
  }
  const bas = Math.min(...Object.values(fk).map((n) => n.pos[1])) - (ancrage.hauteur || 0);
  if (ancrage.appui) {
    const g = fk[`${ancrage.appui}_g`].pos;
    const d = fk[`${ancrage.appui}_d`].pos;
    return decale(fk, [-(g[0] + d[0]) / 2, -bas, -(g[2] + d[2]) / 2]);
  }
  return decale(fk, [0, -bas, 0]);
}

// Soulève tout le corps de `dy` mètres (pose posée sur un support surélevé, ex. un banc).
export function lifter(fk, dy) {
  return dy ? decale(fk, [0, dy, 0]) : fk;
}

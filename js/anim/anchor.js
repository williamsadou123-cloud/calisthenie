// Place le corps dans le décor : sur le sol, ou accroché à une barre. Pur, sans three.js.

function decale(fk, d) {
  const out = {};
  for (const [nom, n] of Object.entries(fk)) out[nom] = { pos: [n.pos[0] + d[0], n.pos[1] + d[1], n.pos[2] + d[2]], rot: n.rot };
  return out;
}

// ancrage: { type: 'sol' } | { type: 'barre', y, z }
export function ancrer(fk, ancrage) {
  if (ancrage.type === 'barre') {
    const g = fk.main_g.pos;
    const d = fk.main_d.pos;
    return decale(fk, [-(g[0] + d[0]) / 2, ancrage.y - (g[1] + d[1]) / 2, ancrage.z - (g[2] + d[2]) / 2]);
  }
  const bas = Math.min(...Object.values(fk).map((n) => n.pos[1]));
  return decale(fk, [0, -bas, 0]);
}

// Silhouettes simples en traits (SVG inline). Couleur = currentColor, donc elles suivent le thème.
const tete = (x, y, r = 9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;
const ligne = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const poly = (...pts) => `<polyline points="${pts.map((p) => p.join(',')).join(' ')}"/>`;
const sol = (y = 106) => `<g class="sol" opacity=".35">${ligne(10, y, 190, y)}</g>`;
const barre = (x1, y, x2) => `<g class="barre">${ligne(x1, y, x2, y)}</g>`;

export const ILLUSTRATIONS = {
  pompe: sol(104) + tete(33, 62) + poly([46, 72], [160, 98]) + ligne(46, 72, 46, 102),
  'pompe-pike': sol(104) + tete(60, 76) + poly([40, 102], [100, 40], [165, 102]),
  'traction-australienne': sol(108) + barre(30, 48, 72) + tete(44, 68) + poly([54, 62], [172, 104]) + ligne(54, 62, 50, 48),
  traction: barre(45, 14, 155) + ligne(70, 14, 86, 46) + ligne(130, 14, 114, 46) + tete(100, 32) + poly([100, 46], [100, 88]) + poly([100, 88], [90, 110]) + poly([100, 88], [110, 110]),
  dip: barre(46, 66, 84) + barre(116, 66, 154) + tete(100, 24) + poly([100, 36], [100, 72]) + poly([100, 42], [84, 66]) + poly([100, 42], [116, 66]) + poly([100, 72], [94, 100]),
  squat: sol(106) + tete(90, 26) + poly([84, 40], [68, 72]) + poly([68, 72], [106, 78], [106, 104]) + ligne(84, 44, 128, 48),
  fente: sol(106) + tete(100, 22) + poly([100, 33], [100, 66]) + poly([100, 66], [130, 76], [130, 104]) + poly([100, 66], [76, 94], [58, 104]),
  pont: sol(106) + tete(26, 98, 8) + poly([38, 98], [96, 60], [130, 72], [130, 104]),
  planche: sol(104) + tete(40, 62) + poly([54, 72], [162, 98]) + poly([54, 72], [54, 98], [30, 98]),
  'gainage-lateral': sol(104) + tete(52, 52) + poly([66, 74], [165, 100]) + poly([66, 74], [66, 100], [40, 100]) + ligne(66, 74, 66, 40),
  hollow: sol(106) + tete(36, 70, 8) + `<path d="M44 82 Q100 106 168 78"/>` + ligne(44, 82, 22, 70),
  cardio: tete(100, 24) + poly([100, 35], [100, 72]) + poly([100, 44], [62, 22]) + poly([100, 44], [138, 22]) + poly([100, 72], [76, 106]) + poly([100, 72], [124, 106]),
  'l-sit': sol(106) + tete(100, 20) + poly([100, 32], [100, 66]) + ligne(100, 106, 100, 66) + poly([100, 66], [168, 66]),
  handstand: sol(106) + tete(112, 86, 8) + poly([100, 106], [100, 66]) + poly([100, 66], [100, 10]),
  drapeau: `<g opacity=".6">${ligne(34, 8, 34, 108)}</g>` + tete(66, 34) + poly([46, 24], [60, 46]) + poly([46, 64], [60, 46]) + poly([60, 46], [172, 46]),
  'front-lever': barre(16, 18, 60) + ligne(38, 18, 38, 56) + tete(28, 60) + poly([38, 56], [172, 56]),
  'muscle-up': barre(54, 64, 146) + tete(100, 18) + poly([100, 30], [100, 62]) + poly([100, 36], [80, 62]) + poly([100, 36], [120, 62]) + poly([100, 62], [94, 100]) + poly([100, 62], [106, 100]) + `<path d="M164 90 L164 40 M154 50 L164 38 L174 50"/>`,
  'planche-fig': sol(106) + tete(36, 56) + ligne(52, 106, 52, 62) + poly([52, 62], [176, 62]),
  suspension: barre(50, 12, 150) + ligne(84, 12, 100, 46) + ligne(116, 12, 100, 46) + tete(100, 34) + poly([100, 48], [100, 90]) + poly([100, 90], [92, 110]) + poly([100, 90], [108, 110]),
  releve: barre(50, 12, 150) + ligne(84, 12, 100, 46) + ligne(116, 12, 100, 46) + tete(100, 34) + poly([100, 48], [100, 78]) + poly([100, 78], [150, 78]),
  superman: sol(106) + tete(20, 80, 8) + `<path d="M30 86 L100 98 L180 84"/>`,
  mur: `<g opacity=".6">${ligne(168, 8, 168, 108)}</g>` + sol(106) + tete(154, 26) + poly([156, 40], [156, 72]) + poly([156, 72], [116, 72], [116, 104]),
  'wall-walk': `<g opacity=".6">${ligne(172, 8, 172, 108)}</g>` + sol(106) + tete(60, 80, 8) + poly([76, 106], [76, 74], [130, 44], [172, 40]),
  chandelle: sol(106) + tete(30, 98, 8) + poly([42, 98], [96, 98]) + poly([60, 98], [74, 56], [74, 12]),
  etirement: sol(106) + tete(122, 60, 8) + poly([60, 104], [168, 104]) + poly([60, 104], [112, 72]) + poly([112, 72], [152, 86]),
  mobilite: tete(100, 24) + poly([100, 35], [100, 74]) + poly([100, 44], [58, 44]) + poly([100, 44], [142, 44]) + poly([100, 74], [88, 106]) + poly([100, 74], [112, 106]) + `<path d="M52 60 Q40 44 52 28" opacity=".5"/>`,
};

const NEUTRE = tete(100, 24) + poly([100, 35], [100, 74]) + poly([100, 74], [88, 106]) + poly([100, 74], [112, 106]) + poly([100, 44], [76, 64]) + poly([100, 44], [124, 64]) + '<g opacity=".4">' + ligne(60, 8, 140, 8) + '</g>';

export function illustration(id) {
  const corps = ILLUSTRATIONS[id] ?? NEUTRE;
  return `<svg class="svg-illu" viewBox="0 0 200 120" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true">${corps}</svg>`;
}

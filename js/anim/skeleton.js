// Squelette du mannequin et cinématique directe : pure, sans three.js ni DOM.
// Repère : y vers le haut, z vers l'avant du personnage, x vers sa gauche.
// Angles en degrés [rx, ry, rz], rotation Rz·Ry·Rx dans le repère du parent.
// Les articulations « _d » sont en miroir : mêmes angles = pose symétrique.

export const JOINTS = [
  'bassin', 'abdomen', 'poitrine', 'cou', 'tete',
  'epaule_g', 'coude_g', 'poignet_g', 'epaule_d', 'coude_d', 'poignet_d',
  'hanche_g', 'genou_g', 'cheville_g', 'hanche_d', 'genou_d', 'cheville_d',
];

export const ZONES_MUSCLES = [
  'pectoraux', 'epaules', 'biceps', 'triceps', 'dos',
  'abdominaux', 'fessiers', 'quadriceps', 'ischios', 'mollets',
];

// Mètres, pour une taille de 1,75 m.
export const PROPORTIONS = {
  abdomen: 0.21, poitrine: 0.26, cou: 0.10, tete: 0.23,
  demiEpaules: 0.19, hauteurEpaule: 0.24, demiBassin: 0.10,
  bras: 0.32, avantBras: 0.27, main: 0.10, doigts: 0.19, // main = centre de la paume, doigts = bout de la main
  cuisse: 0.45, tibia: 0.42, cheville: 0.08, piedAvant: 0.17, piedArriere: 0.08,
};

const rad = (d) => (d * Math.PI) / 180;

const mul = (a, b) => {
  const o = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return o;
};
const apply = (m, v) => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

function euler([rx, ry, rz], miroir) {
  const [x, y, z] = [rad(rx), rad(miroir ? -ry : ry), rad(miroir ? -rz : rz)];
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(x), Math.sin(x), Math.cos(y), Math.sin(y), Math.cos(z), Math.sin(z)];
  const Rx = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const Rz = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  return mul(Rz, mul(Ry, Rx));
}

const IDENTITE = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const P = PROPORTIONS;

export function computeFK(joints) {
  const fk = {};
  const rot = (nom) => euler(joints[nom] || [0, 0, 0], nom.endsWith('_d'));
  // Pose un nœud enfant: position = parent + rot_parent·décalage, orientation = rot_parent·rotation propre.
  const noeud = (nom, parent, decalage) => {
    const base = parent ? fk[parent] : { pos: [0, 0, 0], rot: IDENTITE };
    fk[nom] = { pos: add(base.pos, apply(base.rot, decalage)), rot: mul(base.rot, rot(nom)) };
  };
  const point = (nom, parent, decalage) => {
    fk[nom] = { pos: add(fk[parent].pos, apply(fk[parent].rot, decalage)), rot: fk[parent].rot };
  };

  noeud('bassin', null, [0, 0, 0]);
  noeud('abdomen', 'bassin', [0, 0, 0]);
  noeud('poitrine', 'abdomen', [0, P.abdomen, 0]);
  noeud('cou', 'poitrine', [0, P.poitrine, 0]);
  noeud('tete', 'cou', [0, P.cou, 0]);
  point('sommet_tete', 'tete', [0, P.tete, 0]);

  for (const c of ['g', 'd']) {
    const s = c === 'g' ? 1 : -1;
    noeud(`epaule_${c}`, 'poitrine', [s * P.demiEpaules, P.hauteurEpaule, 0]);
    noeud(`coude_${c}`, `epaule_${c}`, [0, -P.bras, 0]);
    noeud(`poignet_${c}`, `coude_${c}`, [0, -P.avantBras, 0]);
    point(`main_${c}`, `poignet_${c}`, [0, -P.main, 0]);
    point(`doigts_${c}`, `poignet_${c}`, [0, -P.doigts, 0]);

    noeud(`hanche_${c}`, 'bassin', [s * P.demiBassin, 0, 0]);
    noeud(`genou_${c}`, `hanche_${c}`, [0, -P.cuisse, 0]);
    noeud(`cheville_${c}`, `genou_${c}`, [0, -P.tibia, 0]);
    point(`pied_${c}`, `cheville_${c}`, [0, -P.cheville, -P.piedArriere]);
    point(`pointe_${c}`, `cheville_${c}`, [0, -P.cheville, P.piedAvant]);
  }
  return fk;
}

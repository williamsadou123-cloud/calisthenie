// Mannequin humain 3D construit en code. Ne fait que placer des maillages d'après le FK
// calculé par skeleton.js (les os et les angles ne sont pas décidés ici).
import * as THREE from '../../vendor/three/three.module.min.js';
import { PROPORTIONS as P, JOINTS } from './skeleton.js';

const PEAU = 0xcfc8c0;
const MUSCLE = 0xc3bab0; // un peu plus sombre que la peau: relief discret
const ACCENT = 0xff9f43; // couleur d'accent de l'appli (muscles travaillés)

// Volume de révolution le long de +y (0 → longueur), rayon qui varie. Extrémités droites par défaut:
// les boules d'articulation les recouvrent, et des bouts arrondis creuseraient des rainures sombres.
function volume(longueur, r0, r1, bombe = 0, bombeEn = 0.4, arrondi = false) {
  const pts = [new THREE.Vector2(0, 0)];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let r = r0 + (r1 - r0) * t + bombe * Math.exp(-((t - bombeEn) ** 2) / 0.05);
    const bord = Math.min(t, 1 - t) / 0.12;
    if (arrondi && bord < 1) r *= Math.sqrt(Math.max(0, 1 - (1 - bord) ** 2));
    pts.push(new THREE.Vector2(Math.max(r, 0.001), t * longueur));
  }
  pts.push(new THREE.Vector2(0, longueur));
  return new THREE.LatheGeometry(pts, 24);
}

export function creerMannequin() {
  const groupe = new THREE.Group();
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const peau = new THREE.MeshStandardMaterial({ color: PEAU, roughness: 0.62, metalness: 0 });
  const matZones = {};
  const zone = (nom) => (matZones[nom] ||= new THREE.MeshStandardMaterial({ color: MUSCLE, roughness: 0.55, metalness: 0 }));
  const frames = {};
  for (const j of JOINTS) {
    const g = new THREE.Group();
    g.matrixAutoUpdate = false;
    frames[j] = g;
    groupe.add(g);
  }

  // Ajoute un maillage dans le repère d'une articulation.
  const ajouter = (joint, geom, mat, { pos = [0, 0, 0], echelle = [1, 1, 1] } = {}) => {
    const m = new THREE.Mesh(geom, mat);
    m.position.set(...pos);
    m.scale.set(...echelle);
    m.castShadow = true;
    frames[joint].add(m);
    return m;
  };
  const ellipsoide = (joint, mat, pos, rayons) => ajouter(joint, sphere, mat, { pos, echelle: rayons });
  // Volume qui descend (-y) depuis l'articulation: miroir en y.
  const membre = (joint, longueur, r0, r1, bombe, bombeEn, echelle = [1, 1, 1]) =>
    ajouter(joint, volume(longueur, r0, r1, bombe, bombeEn), peau, { echelle: [echelle[0], -echelle[1], echelle[2]] });

  // Tronc
  ellipsoide('bassin', peau, [0, -0.02, 0], [0.165, 0.105, 0.105]);
  ajouter('abdomen', volume(P.abdomen, 0.125, 0.13), peau, { echelle: [1.2, 1, 0.78] });
  ajouter('poitrine', volume(P.poitrine, 0.13, 0.15, 0.03, 0.55), peau, { echelle: [1.22, 1, 0.76] });
  ajouter('cou', volume(P.cou + 0.02, 0.05, 0.045), peau);
  ellipsoide('tete', peau, [0, 0.115, 0], [0.082, 0.115, 0.098]);
  ellipsoide('tete', peau, [0, 0.1, 0.098], [0.013, 0.022, 0.02]); // nez: indique l'avant

  // Muscles du tronc
  for (const s of [1, -1]) {
    ellipsoide('poitrine', zone('pectoraux'), [s * 0.075, 0.17, 0.07], [0.088, 0.065, 0.05]);
    ellipsoide('bassin', zone('fessiers'), [s * 0.075, -0.03, -0.085], [0.088, 0.085, 0.075]);
  }
  ellipsoide('poitrine', zone('dos'), [0, 0.13, -0.065], [0.15, 0.115, 0.05]);
  ellipsoide('abdomen', zone('abdominaux'), [0, 0.11, 0.075], [0.075, 0.1, 0.04]);

  // Bras et jambes (g et d)
  for (const c of ['g', 'd']) {
    const ep = `epaule_${c}`;
    const co = `coude_${c}`;
    const po = `poignet_${c}`;
    const ha = `hanche_${c}`;
    const ge = `genou_${c}`;
    const ch = `cheville_${c}`;
    ellipsoide(ep, peau, [0, 0, 0], [0.058, 0.058, 0.058]);
    ellipsoide(ep, zone('epaules'), [0, -0.035, 0], [0.062, 0.075, 0.06]);
    membre(ep, P.bras, 0.048, 0.037, 0.008, 0.35);
    ellipsoide(ep, zone('biceps'), [0, -0.16, 0.022], [0.04, 0.09, 0.036]);
    ellipsoide(ep, zone('triceps'), [0, -0.16, -0.026], [0.04, 0.095, 0.036]);
    ellipsoide(co, peau, [0, 0, 0], [0.04, 0.04, 0.04]);
    membre(co, P.avantBras, 0.04, 0.027, 0.01, 0.25);
    ellipsoide(po, peau, [0, -0.1, 0], [0.02, 0.1, 0.045]); // main à plat
    membre(ha, P.cuisse, 0.085, 0.056, 0.006, 0.3);
    ellipsoide(ha, zone('quadriceps'), [0, -0.22, 0.03], [0.062, 0.2, 0.058]);
    ellipsoide(ha, zone('ischios'), [0, -0.22, -0.034], [0.058, 0.18, 0.05]);
    ellipsoide(ge, peau, [0, 0, 0], [0.054, 0.054, 0.054]);
    membre(ge, P.tibia, 0.055, 0.032, 0.012, 0.28);
    ellipsoide(ge, zone('mollets'), [0, -0.13, -0.026], [0.052, 0.11, 0.05]);
    ellipsoide(ch, peau, [0, -0.04, 0.045], [0.042, 0.04, 0.125]); // pied
  }

  const m4 = new THREE.Matrix4();
  return {
    groupe,
    miseAJour(fk, zonesActives = []) {
      for (const [nom, g] of Object.entries(frames)) {
        const n = fk[nom];
        const r = n.rot;
        m4.set(r[0], r[1], r[2], n.pos[0], r[3], r[4], r[5], n.pos[1], r[6], r[7], r[8], n.pos[2], 0, 0, 0, 1);
        g.matrix.copy(m4);
        g.matrixWorldNeedsUpdate = true;
      }
      for (const [nom, mat] of Object.entries(matZones)) {
        const actif = zonesActives.includes(nom);
        mat.color.setHex(actif ? ACCENT : MUSCLE);
        mat.emissive.setHex(actif ? 0x3a1d00 : 0x000000);
      }
    },
    liberer() {
      groupe.traverse((o) => { if (o.geometry && o.geometry !== sphere) o.geometry.dispose(); });
      sphere.dispose();
      peau.dispose();
      for (const m of Object.values(matZones)) m.dispose();
    },
  };
}

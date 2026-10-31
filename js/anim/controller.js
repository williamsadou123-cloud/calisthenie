// État du lecteur d'animation et choix du rendu : pur, sans three.js ni DOM global.

// Caméra autour du mannequin (degrés, mètres). Le mannequin regarde vers +z.
export const VUES = {
  profil: { azimut: 90, elevation: 8, distance: 3.6 },
  face: { azimut: 0, elevation: 6, distance: 3.6 },
  'trois-quarts': { azimut: 40, elevation: 14, distance: 3.6 },
  dessus: { azimut: 90, elevation: 70, distance: 3.8 },
};
const ORDRE = ['profil', 'face', 'trois-quarts', 'dessus'];
const SAUT_MAX_MS = 100; // au retour d'un onglet en arrière-plan, on ne saute pas dans l'animation

export const creerLecteur = (vue) => ({ elapsed: 0, enPause: false, vitesse: 1, vue });

export function avancer(l, dtMs) {
  if (l.enPause) return { ...l };
  return { ...l, elapsed: l.elapsed + (Math.min(dtMs, SAUT_MAX_MS) * l.vitesse) / 1000 };
}

export const basculerPause = (l) => ({ ...l, enPause: !l.enPause });
export const basculerRalenti = (l) => ({ ...l, vitesse: l.vitesse === 1 ? 0.5 : 1 });

export function vueSuivante(vue) {
  const i = ORDRE.indexOf(vue);
  return ORDRE[(i + 1) % ORDRE.length];
}

export function webglDisponible(doc) {
  try {
    return !!doc.createElement('canvas').getContext('webgl2') || !!doc.createElement('canvas').getContext('webgl');
  } catch {
    return false;
  }
}

export function choisirRendu({ animation, webgl, reduireMouvement }) {
  if (!animation || !webgl) return 'svg';
  return reduireMouvement ? 'pose-fixe' : 'anime';
}

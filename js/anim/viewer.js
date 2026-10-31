// Lecteur d'animation: choisit entre animation 3D, pose fixe et dessin SVG, et gère le cycle de vie.
// three.js n'est chargé que si une animation est réellement affichée.
import { illustration } from '../illustrations.js';
import { computeFK, LIBELLES_MUSCLES } from './skeleton.js';
import { ancrer, lifter } from './anchor.js';
import { interpolatePose, interpolateLift, loopPhase } from './pose-math.js';
import {
  VUES, creerLecteur, avancer, basculerPause, basculerRalenti, vueSuivante, webglDisponible, choisirRendu,
} from './controller.js';

export function creerGestionnaire() {
  let actif = null;
  return {
    remplacer(handle) {
      const ancien = actif;
      actif = handle;
      if (ancien) ancien.destroy();
    },
    detruire() {
      const a = actif;
      actif = null;
      if (a) a.destroy();
    },
  };
}

let generation = 0; // chaque appel ou chaque destruction invalide les chargements plus anciens encore en cours

export const gestionnaire = (() => {
  const g = creerGestionnaire();
  const detruire = g.detruire;
  g.detruire = () => { generation++; detruire(); };
  return g;
})();

// Faux seulement quand la zone d'affichage a été retirée de la page (on a quitté l'écran).
export const zoneAttachee = (zone) => zone.isConnected !== false;

const NOMS_VUES = { profil: 'profil', face: 'face', 'trois-quarts': '3/4', dessus: 'dessus' };

function afficherSvg(zone, exercice) {
  zone.innerHTML = illustration(exercice.illustration);
}

// Joints pour une phase donnée, avec une légère respiration pour les tenues.
function jointsA(animation, lecteur) {
  const phase = loopPhase(lecteur.elapsed, animation.duree, animation.mode);
  const j = interpolatePose(animation.poses, phase);
  if (animation.mode === 'tenue') {
    const [rx, ry, rz] = j.poitrine || [0, 0, 0];
    j.poitrine = [rx + 1.2 * Math.sin((2 * Math.PI * lecteur.elapsed) / 3.5), ry, rz];
  }
  return j;
}

// Boîte englobante de toutes les poses (pour cadrer la caméra une fois pour toutes).
function cadrage(animation) {
  const mini = [Infinity, Infinity, Infinity];
  const maxi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i <= 10; i++) {
    const fk = lifter(ancrer(computeFK(interpolatePose(animation.poses, i / 10)), animation.ancrage), interpolateLift(animation.poses, i / 10));
    for (const n of Object.values(fk)) for (let k = 0; k < 3; k++) { mini[k] = Math.min(mini[k], n.pos[k]); maxi[k] = Math.max(maxi[k], n.pos[k]); }
  }
  if (animation.decor === 'barre-fixe') maxi[1] = Math.max(maxi[1], 2.3);
  const centre = [0, (mini[1] + maxi[1]) / 2, (mini[2] + maxi[2]) / 2];
  const rayon = Math.max(maxi[1] - mini[1], maxi[2] - mini[2], 1.2) / 2 + 0.35;
  return { centre, rayon };
}

async function animer(zone, exercice, animation, rendu, doc) {
  const [THREE, { creerMannequin }, { creerDecor }] = await Promise.all([
    import('../../vendor/three/three.module.min.js'),
    import('./mannequin.js'),
    import('./decor.js'),
  ]);

  if (!zoneAttachee(zone)) return { destroy() {} }; // l'écran a changé pendant le chargement

  zone.innerHTML = `
    <div class="demo">
      <div class="demo-scene"></div>
      <div class="demo-barre">
        <button type="button" class="petit" data-act="pause" aria-label="Mettre en pause">Pause</button>
        <button type="button" class="petit" data-act="ralenti" aria-pressed="false" aria-label="Ralenti">Ralenti ×0,5</button>
        <button type="button" class="petit" data-act="vue" aria-label="Changer de vue"></button>
      </div>
      <p class="doux demo-muscles"></p>
    </div>`;
  const scene3d = zone.querySelector('.demo-scene');
  const btnPause = zone.querySelector('[data-act="pause"]');
  const btnRalenti = zone.querySelector('[data-act="ralenti"]');
  const btnVue = zone.querySelector('[data-act="vue"]');
  zone.querySelector('.demo-muscles').textContent = `Muscles travaillés : ${animation.muscles.map((m) => LIBELLES_MUSCLES[m] || m).join(', ')}`;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene3d.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 0.7));
  const principale = new THREE.DirectionalLight(0xffffff, 2.4);
  principale.position.set(2.5, 4, 3);
  principale.castShadow = true;
  principale.shadow.mapSize.set(1024, 1024);
  Object.assign(principale.shadow.camera, { left: -3, right: 3, top: 3, bottom: -1, near: 0.5, far: 12 });
  scene.add(principale);
  const remplissage = new THREE.DirectionalLight(0x9db4ff, 0.7);
  remplissage.position.set(-3, 2, 2);
  scene.add(remplissage);
  const contrejour = new THREE.DirectionalLight(0xffd9b0, 1.0);
  contrejour.position.set(0, 3, -3);
  scene.add(contrejour);

  const decor = creerDecor(animation.decor, animation.decorPos);
  const mannequin = creerMannequin();
  scene.add(decor.groupe);
  scene.add(mannequin.groupe);

  const camera = new THREE.PerspectiveCamera(35, 4 / 3, 0.1, 30);
  const { centre, rayon } = cadrage(animation);
  const distance = (rayon / Math.tan((camera.fov * Math.PI) / 360)) * 1.0;

  let lecteur = creerLecteur(animation.vue);
  let raf = 0;
  let dernier = 0;
  let detruit = false;

  const placerCamera = () => {
    const v = VUES[lecteur.vue];
    const az = (v.azimut * Math.PI) / 180;
    const el = (v.elevation * Math.PI) / 180;
    camera.position.set(
      centre[0] + distance * Math.sin(az) * Math.cos(el),
      centre[1] + distance * Math.sin(el),
      centre[2] + distance * Math.cos(az) * Math.cos(el),
    );
    camera.lookAt(centre[0], centre[1], centre[2]);
    btnVue.textContent = `Vue : ${NOMS_VUES[lecteur.vue]}`;
  };
  const dessiner = () => {
    const phase = loopPhase(lecteur.elapsed, animation.duree, animation.mode);
    const fk = lifter(ancrer(computeFK(jointsA(animation, lecteur)), animation.ancrage), interpolateLift(animation.poses, phase));
    mannequin.miseAJour(fk, animation.muscles);
    renderer.render(scene, camera);
  };
  const redimensionner = () => {
    const w = Math.max(240, scene3d.clientWidth || 320);
    const h = Math.round(Math.min(w * 0.78, 420));
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dessiner();
  };
  const boucle = (t) => {
    if (detruit) return;
    if (!zoneAttachee(zone)) { handle.destroy(); return; }
    lecteur = avancer(lecteur, dernier ? t - dernier : 0);
    dernier = t;
    dessiner();
    raf = requestAnimationFrame(boucle);
  };
  const demarrer = () => { if (!detruit && rendu === 'anime' && !raf) { dernier = 0; raf = requestAnimationFrame(boucle); } };
  const arreter = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
  const visibilite = () => (doc.hidden ? arreter() : demarrer());

  if (rendu === 'pose-fixe') {
    lecteur = { ...lecteur, elapsed: animation.duree / 2 }; // sommet du mouvement
    btnPause.hidden = true;
    btnRalenti.hidden = true;
  }
  btnPause.addEventListener('click', () => {
    lecteur = basculerPause(lecteur);
    btnPause.textContent = lecteur.enPause ? 'Lecture' : 'Pause';
    btnPause.setAttribute('aria-label', lecteur.enPause ? 'Reprendre la lecture' : 'Mettre en pause');
  });
  btnRalenti.addEventListener('click', () => {
    lecteur = basculerRalenti(lecteur);
    btnRalenti.setAttribute('aria-pressed', String(lecteur.vitesse !== 1));
  });
  btnVue.addEventListener('click', () => { lecteur = { ...lecteur, vue: vueSuivante(lecteur.vue) }; placerCamera(); dessiner(); });
  doc.addEventListener('visibilitychange', visibilite);
  const observateur = typeof ResizeObserver === 'function' ? new ResizeObserver(redimensionner) : null;
  observateur?.observe(scene3d);
  // Contexte WebGL perdu (mémoire, onglet en veille): retour au dessin plutôt qu'un écran vide.
  const perdu = () => { handle.destroy(); afficherSvg(zone, exercice); };
  renderer.domElement.addEventListener('webglcontextlost', perdu);

  const handle = {
    destroy() {
      if (detruit) return;
      detruit = true;
      arreter();
      doc.removeEventListener('visibilitychange', visibilite);
      observateur?.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', perdu);
      mannequin.liberer();
      decor.liberer();
      renderer.dispose();
      renderer.forceContextLoss(); // libère le contexte WebGL tout de suite (les téléphones en autorisent peu)
      renderer.domElement.remove();
    },
  };
  placerCamera();
  redimensionner();
  demarrer();
  return handle;
}

// zone: élément où afficher la démo. data: { animations: { exercices } }. env: injection pour les tests.
export async function montrerAnimation(zone, exercice, data, env = {}) {
  gestionnaire.detruire();
  const moi = ++generation;
  const doc = env.doc ?? globalThis.document;
  const animation = data?.animations?.exercices?.[exercice.id];
  const reduireMouvement = env.reduireMouvement
    ?? (typeof globalThis.matchMedia === 'function' && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rendu = choisirRendu({ animation, webgl: doc ? webglDisponible(doc) : false, reduireMouvement });

  let handle = { destroy() {} };
  if (rendu !== 'svg') {
    try {
      handle = await (env.animer ?? animer)(zone, exercice, animation, rendu, doc);
    } catch {
      afficherSvg(zone, exercice);
      handle = { destroy() {} };
    }
  } else {
    afficherSvg(zone, exercice);
  }
  if (moi !== generation) { handle.destroy(); return { destroy() {} }; } // dépassé par un appel plus récent
  let detruit = false;
  const sur = { destroy() { if (detruit) return; detruit = true; handle.destroy(); } };
  gestionnaire.remplacer(sur);
  return sur;
}

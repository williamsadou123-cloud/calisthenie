// Décor 3D: sol (ombre portée seulement), barre fixe, barres parallèles. Le sol est à y = 0.
import * as THREE from '../../vendor/three/three.module.min.js';

const METAL = 0x8d96a3;

function cylindre(rayon, longueur, matiere) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon, longueur, 20), matiere);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// pos: [x, z] de l'accessoire (banc, mur, table, poteau); la barre fixe et les barres parallèles restent centrées.
export function creerDecor(type, pos = [0, 0]) {
  const groupe = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: METAL, roughness: 0.35, metalness: 0.7 });

  const sol = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.ShadowMaterial({ opacity: 0.38 }));
  sol.rotation.x = -Math.PI / 2;
  sol.receiveShadow = true;
  groupe.add(sol);
  const cercle = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.17, 64),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, side: THREE.DoubleSide }),
  );
  cercle.rotation.x = -Math.PI / 2;
  cercle.position.y = 0.002;
  groupe.add(cercle);

  if (type === 'barre-fixe') {
    const barre = cylindre(0.018, 2.0, metal);
    barre.rotation.z = Math.PI / 2;
    barre.position.set(0, 2.2, 0);
    groupe.add(barre);
    for (const x of [-1, 1]) {
      const poteau = cylindre(0.03, 2.2, metal);
      poteau.position.set(x, 1.1, 0);
      groupe.add(poteau);
    }
  }
  if (type === 'barres-paralleles') {
    for (const x of [-0.19, 0.19]) {
      const barre = cylindre(0.021, 1.3, metal);
      barre.rotation.x = Math.PI / 2;
      barre.position.set(x, 1.15, 0);
      groupe.add(barre);
      for (const z of [-0.65, 0.65]) {
        const poteau = cylindre(0.03, 1.15, metal);
        poteau.position.set(x, 0.575, z);
        groupe.add(poteau);
      }
    }
  }

  const bois = new THREE.MeshStandardMaterial({ color: 0x6b5d4f, roughness: 0.8, metalness: 0 });
  const boite = (l, h, p, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), bois);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    groupe.add(m);
  };
  if (type === 'banc') boite(0.9, 0.45, 0.32, pos[0], 0.225, pos[1]);
  if (type === 'table') {
    boite(1.3, 0.04, 0.75, pos[0], 0.73, pos[1]);
    for (const dx of [-0.6, 0.6]) for (const dz of [-0.32, 0.32]) boite(0.05, 0.71, 0.05, pos[0] + dx, 0.355, pos[1] + dz);
  }
  if (type === 'mur') {
    // Mur translucide: on voit le corps même quand il est devant la caméra.
    const mur = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.8), new THREE.MeshStandardMaterial({ color: 0x3a4150, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.4, depthWrite: false }));
    mur.position.set(pos[0], 1.4, pos[1]);
    mur.receiveShadow = true;
    groupe.add(mur);
  }
  if (type === 'poteau') {
    const poteau = cylindre(0.04, 2.6, metal);
    poteau.position.set(pos[0], 1.3, pos[1]);
    groupe.add(poteau);
  }

  return {
    groupe,
    liberer() {
      bois.dispose();
      groupe.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      metal.dispose();
    },
  };
}

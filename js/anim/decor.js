// Décor 3D: sol (ombre portée seulement), barre fixe, barres parallèles. Le sol est à y = 0.
import * as THREE from '../../vendor/three/three.module.min.js';

const METAL = 0x8d96a3;

function cylindre(rayon, longueur, matiere) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon, longueur, 20), matiere);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function creerDecor(type) {
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

  return {
    groupe,
    liberer() {
      groupe.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      metal.dispose();
    },
  };
}

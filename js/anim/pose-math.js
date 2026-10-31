// Mathématiques des poses : pures, sans three.js ni DOM.
// Une pose = { t: 0..1, joints: { articulation: [rx, ry, rz] en degrés } }.

const borne = (x, a, b) => Math.min(b, Math.max(a, x));

export function ease(t) {
  const x = borne(t, 0, 1);
  return x * x * (3 - 2 * x);
}

// Phase de lecture 0..1 : aller-retour sur `duree` en mode boucle, pose finale tenue sinon.
export function loopPhase(elapsedS, duree, mode) {
  if (mode === 'tenue') return 1;
  const cycle = (elapsedS / duree) % 1;
  return 1 - Math.abs(1 - 2 * cycle);
}

const ZERO = [0, 0, 0];

export function interpolatePose(poses, phase) {
  const p = borne(phase, 0, 1);
  let i = 0;
  while (i < poses.length - 2 && p > poses[i + 1].t) i++;
  const a = poses[i];
  const b = poses[Math.min(i + 1, poses.length - 1)];
  const span = b.t - a.t;
  const k = span > 0 ? ease(borne((p - a.t) / span, 0, 1)) : 1;
  const noms = new Set([...Object.keys(a.joints), ...Object.keys(b.joints)]);
  const out = {};
  for (const n of noms) {
    const va = a.joints[n] || ZERO;
    const vb = b.joints[n] || ZERO;
    out[n] = va.map((x, j) => x + (vb[j] - x) * k);
  }
  return out;
}

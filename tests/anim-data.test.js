import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JOINTS, ZONES_MUSCLES, computeFK } from '../js/anim/skeleton.js';
import { ancrer } from '../js/anim/anchor.js';
import { interpolatePose } from '../js/anim/pose-math.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));
const animations = lire('data/animations.json').exercices;
const exercices = lire('data/exercices.json');
const DECORS = ['sol', 'barre-fixe', 'barres-paralleles', 'banc', 'mur', 'table', 'poteau'];
const ECHANTILLON = ['pompes', 'tractions-pronation', 'dips-barres', 'planche-gainage', 'handstand-libre'];

const BARRE = (a) => a.ancrage.y;
const posePlacee = (a, phase) => ancrer(computeFK(interpolatePose(a.poses, phase)), a.ancrage);
const angle = (a, b, c) => {
  const u = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const v = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  const cos = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
};
const brasTendus = (fk) => ['g', 'd'].every((c) => angle(fk[`epaule_${c}`].pos, fk[`coude_${c}`].pos, fk[`poignet_${c}`].pos) >= 165);
const coude = (fk, c) => angle(fk[`epaule_${c}`].pos, fk[`coude_${c}`].pos, fk[`poignet_${c}`].pos);
const corpsDroit = (fk) => angle(fk.cou.pos, fk.bassin.pos, fk.cheville_g.pos) >= 165; // axe du corps

test('les 5 exercices d\'échantillon ont une animation', () => {
  for (const id of ECHANTILLON) assert.ok(animations[id], `${id} manquant`);
});

test('chaque animation référence un exercice existant', () => {
  const ids = new Set((Array.isArray(exercices) ? exercices : exercices.exercices).map((e) => e.id));
  for (const id of Object.keys(animations)) assert.ok(ids.has(id), `${id} inconnu dans exercices.json`);
});

test('structure des animations: durée, poses triées, articulations et angles valides', () => {
  for (const [id, a] of Object.entries(animations)) {
    assert.ok(a.duree >= 1 && a.duree <= 6, `${id}: durée`);
    assert.ok(['boucle', 'tenue'].includes(a.mode), `${id}: mode`);
    assert.ok(['profil', 'face', 'trois-quarts'].includes(a.vue), `${id}: vue`);
    assert.ok(DECORS.includes(a.decor), `${id}: décor`);
    if (a.decorPos !== undefined) assert.ok(Array.isArray(a.decorPos) && a.decorPos.length === 2 && a.decorPos.every(Number.isFinite), `${id}: decorPos [x, z]`);
    assert.ok(['sol', 'barre'].includes(a.ancrage.type), `${id}: ancrage`);
    assert.equal(a.poses[0].t, 0, `${id}: première pose à t=0`);
    assert.equal(a.poses.at(-1).t, 1, `${id}: dernière pose à t=1`);
    for (let i = 1; i < a.poses.length; i++) assert.ok(a.poses[i].t > a.poses[i - 1].t, `${id}: poses triées`);
    for (const p of a.poses) {
      for (const [j, ang] of Object.entries(p.joints)) {
        assert.ok(JOINTS.includes(j), `${id}: articulation inconnue ${j}`);
        assert.equal(ang.length, 3);
        for (const x of ang) assert.ok(x >= -200 && x <= 200, `${id}: angle ${x} hors limites`);
      }
    }
    assert.ok(a.muscles.length > 0 && a.muscles.every((m) => ZONES_MUSCLES.includes(m)), `${id}: muscles`);
  }
});

test('en mode boucle, le début et le sommet du mouvement sont différents', () => {
  for (const [id, a] of Object.entries(animations)) {
    if (a.mode !== 'boucle') continue;
    const debut = JSON.stringify(interpolatePose(a.poses, 0));
    const sommet = JSON.stringify(interpolatePose(a.poses, 1));
    assert.notEqual(debut, sommet, `${id}: pas de mouvement`);
  }
});

test('le point d\'appui le plus bas est une main, un pied ou un genou (jamais la tête ni le tronc)', () => {
  for (const [id, a] of Object.entries(animations)) {
    if (a.ancrage.type !== 'sol' || a.ancrage.hauteur) continue; // corps allongé: le tronc repose au sol
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      const fk = posePlacee(a, phase);
      const [nom] = Object.entries(fk).sort((p, q) => p[1].pos[1] - q[1].pos[1])[0];
      assert.match(nom, /^(main|doigts|poignet|coude|pied|pointe|cheville|genou)_/, `${id} @${phase}: point le plus bas = ${nom}`);
    }
  }
});

const appuisDe = (a) => (a.appuis || []).map((x) => (typeof x === 'string' ? { p: x, y: 0 } : { p: x.p, y: x.y ?? 0 }));

test('toute animation ancrée au sol déclare ses points d\'appui', () => {
  for (const [id, a] of Object.entries(animations)) {
    if (a.ancrage.type === 'sol') assert.ok(appuisDe(a).length >= 1, `${id}: appuis manquants`);
  }
});

test('chaque point d\'appui déclaré touche vraiment le sol (ou son support) dans chaque pose clé', () => {
  for (const [id, a] of Object.entries(animations)) {
    for (const { p, y } of appuisDe(a)) {
      for (const pose of a.poses) {
        const fk = posePlacee(a, pose.t);
        assert.ok(fk[p], `${id}: point inconnu ${p}`);
        assert.ok(Math.abs(fk[p].pos[1] - y) <= 0.04, `${id} @t=${pose.t}: ${p} à ${fk[p].pos[1].toFixed(3)} m, attendu ${y} m`);
      }
    }
  }
});

test('à la barre, les pieds restent au-dessus du sol et les mains sur la barre', () => {
  for (const [id, a] of Object.entries(animations)) {
    if (a.ancrage.type !== 'barre') continue;
    for (const phase of [0, 0.5, 1]) {
      const fk = posePlacee(a, phase);
      const bas = Math.min(...Object.values(fk).map((n) => n.pos[1]));
      assert.ok(bas >= (a.appuis ? -0.04 : 0.05), `${id} @${phase}: pieds à ${bas.toFixed(2)} m du sol`);
      assert.ok(Math.abs((fk.main_g.pos[1] + fk.main_d.pos[1]) / 2 - BARRE(a)) < 0.01, `${id}: mains hors de la barre`);
    }
  }
});

test('aux barres, les mains sont à l\'horizontale (posées ou accrochées sur la barre), doigts vers l\'avant', () => {
  for (const [id, a] of Object.entries(animations)) {
    if (a.ancrage.type !== 'barre') continue;
    for (const phase of [0, 0.5, 1]) {
      const fk = posePlacee(a, phase);
      for (const c of ['g', 'd']) {
        assert.ok(Math.abs(fk[`doigts_${c}`].pos[1] - fk[`poignet_${c}`].pos[1]) < 0.03, `${id} @${phase}: main ${c} pas horizontale`);
        assert.ok(fk[`doigts_${c}`].pos[2] > fk[`poignet_${c}`].pos[2] + 0.1, `${id} @${phase}: doigts ${c} pas vers l'avant`);
      }
    }
  }
});

test('pompes: bras tendus en haut, coudes ≤ 100° et poitrine basse en bas, corps droit', () => {
  const a = animations.pompes;
  const haut = posePlacee(a, 0);
  const bas = posePlacee(a, 1);
  assert.ok(brasTendus(haut), 'haut: bras tendus');
  assert.ok(coude(bas, 'g') <= 100 && coude(bas, 'd') <= 100, 'bas: coudes ≤ 100°');
  assert.ok(bas.poitrine.pos[1] < 0.3, `bas: poitrine à ${bas.poitrine.pos[1].toFixed(2)} m`);
  assert.ok(corpsDroit(haut) && corpsDroit(bas), 'corps droit');
});

test('pompes: mains et pointes de pieds restent plantées entre le haut et le bas', () => {
  const a = animations.pompes;
  const haut = posePlacee(a, 0);
  const bas = posePlacee(a, 1);
  assert.ok(Math.abs(haut.pointe_g.pos[2] - bas.pointe_g.pos[2]) < 0.03, 'les pieds glissent');
  assert.ok(Math.abs(haut.pointe_g.pos[1] - bas.pointe_g.pos[1]) < 0.03, 'les pieds décollent');
});

test('tractions: bras tendus en bas, tête au-dessus de la barre en haut', () => {
  const a = animations['tractions-pronation'];
  assert.ok(brasTendus(posePlacee(a, 0)), 'bas: bras tendus');
  const haut = posePlacee(a, 1);
  assert.ok(haut.tete.pos[1] > BARRE(a), `haut: tête à ${haut.tete.pos[1].toFixed(2)} m, barre à ${BARRE(a)} m`);
});

test('dips: bras tendus en haut, coudes ≤ 100° en bas, pieds au-dessus du sol', () => {
  const a = animations['dips-barres'];
  const haut = posePlacee(a, 0);
  const bas = posePlacee(a, 1);
  assert.ok(brasTendus(haut), 'haut: bras tendus');
  assert.ok(coude(bas, 'g') <= 100 && coude(bas, 'd') <= 100, 'bas: coudes ≤ 100°');
  for (const fk of [haut, bas]) assert.ok(fk.pied_g.pos[1] > 0.1 && fk.pied_d.pos[1] > 0.1, 'pieds au-dessus du sol');
});

test('planche gainage: tenue, avant-bras au sol, corps droit', () => {
  const a = animations['planche-gainage'];
  assert.equal(a.mode, 'tenue');
  const fk = posePlacee(a, 1);
  for (const c of ['g', 'd']) {
    assert.ok(fk[`coude_${c}`].pos[1] < 0.15 && fk[`poignet_${c}`].pos[1] < 0.15, `avant-bras ${c} au sol`);
  }
  assert.ok(corpsDroit(fk), 'corps droit');
});

test('équilibre sur les mains: tenue, mains au sol, pieds en haut, bras tendus, corps droit', () => {
  const a = animations['handstand-libre'];
  assert.equal(a.mode, 'tenue');
  const fk = posePlacee(a, 1);
  assert.ok(fk.main_g.pos[1] < 0.1 && fk.main_d.pos[1] < 0.1, 'mains au sol');
  assert.ok(fk.pied_g.pos[1] > 1.5 && fk.pied_d.pos[1] > 1.5, 'pieds en haut');
  assert.ok(brasTendus(fk), 'bras tendus');
  assert.ok(corpsDroit(fk), 'corps droit');
});

function taille(chemin) {
  const s = statSync(chemin);
  if (!s.isDirectory()) return s.size;
  return readdirSync(chemin).reduce((t, f) => t + taille(join(chemin, f)), 0);
}

test('poids ajouté par les animations < 1,2 Mo', () => {
  const total = taille(join(root, 'vendor', 'three')) + taille(join(root, 'js', 'anim')) + taille(join(root, 'data', 'animations.json'));
  assert.ok(total < 1_200_000, `${total} octets`);
});

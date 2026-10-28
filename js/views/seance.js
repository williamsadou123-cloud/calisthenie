import { evaluate, calibrateRange } from '../progression.js';
import { CLE_PROFIL, todayISO } from '../program.js';
import { restRemaining, formatSeconds } from '../timer.js';
import { beep, vibrate, keepAwake, unlockAudio } from '../feedback.js';
import { esc, fmtPlage, parExercice } from '../dom.js';

let tick = null;
let liberer = null;

function stopTick() {
  if (tick) { clearInterval(tick); tick = null; }
}

function nouvelleRun(s) {
  return {
    id: `${todayISO()}-${Date.now()}`,
    date: todayISO(),
    etapes: [
      { kind: 'echauffement' },
      ...s.blocs.map((b) => ({ kind: 'bloc', ...b })),
      { kind: 'etirements' },
    ],
    i: 0,
    serie: 0,
    reps: {},
    restEnd: null,
    chronoDebut: null,
    saved: false,
    fin: null,
  };
}

function nettoyer(ctx) {
  stopTick();
  if (liberer) { liberer(); liberer = null; }
  ctx.session = null;
  ctx.run = null;
}

async function sauvegarder(ctx, terminee) {
  const { run, session } = ctx;
  const series = Object.entries(run.reps).filter(([, r]) => r.length).map(([exerciceId, reps]) => ({ exerciceId, reps }));
  if (!series.length) return false;
  await ctx.store.addSession({ id: run.id, date: run.date, lieu: session.lieu, titre: session.titre, series, terminee });
  return true;
}

async function majRecords(ctx) {
  const records = await ctx.store.getRecords();
  let profil = ctx.profil || (await ctx.store.getProfile()) || {};
  let change = false;
  for (const [id, reps] of Object.entries(ctx.run.reps)) {
    const cle = CLE_PROFIL[id];
    if (!cle || !reps.length) continue;
    const meilleur = Math.max(...reps);
    if (meilleur > (records[cle] || 0)) {
      records[cle] = meilleur;
      profil = { ...profil, [cle]: calibrateRange(meilleur) };
      change = true;
    }
  }
  if (change) {
    await ctx.store.setRecords(records);
    await ctx.store.setProfile(profil);
    ctx.profil = profil;
  }
}

const CONSEIL = {
  maintenir: 'Garde le même exercice et vise toutes les séries dans la plage.',
  'plus-de-reps': 'Ajoute une répétition (ou quelques secondes) la prochaine fois.',
};

export async function render(root, ctx) {
  stopTick();
  const s = ctx.session;
  if (!s) {
    root.innerHTML = `<h1>Séance</h1><p class="doux">Aucune séance en cours.</p><button class="primaire gros" id="go">Voir la séance du jour</button>`;
    root.querySelector('#go').addEventListener('click', () => window.app.showView('aujourdhui'));
    return;
  }
  if (!ctx.run) ctx.run = nouvelleRun(s);
  if (!liberer) liberer = await keepAwake();
  draw(root, ctx);
}

function draw(root, ctx) {
  stopTick();
  const { run, session } = ctx;
  const par = parExercice(ctx.data.exercices);
  const step = run.etapes[run.i];
  if (!step) { terminer(root, ctx); return; }

  if (step.kind === 'echauffement' || step.kind === 'etirements') {
    const ids = step.kind === 'echauffement' ? session.echauffement : session.etirements;
    const titre = step.kind === 'echauffement' ? 'Échauffement' : 'Étirements';
    root.innerHTML = `
      <h1>${titre}</h1>
      <p class="doux">${esc(session.titre)}</p>
      <div class="carte">${(ids || []).map((id) => {
        const e = par[id];
        if (!e) return '';
        return `<details><summary><b>${esc(e.nom)}</b> <span class="doux">${fmtPlage(e.plage, e.type)}</span></summary><ol>${e.etapes.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></details>`;
      }).join('')}</div>
      ${step.kind === 'echauffement' ? '<p class="doux">Rappel : échauffe bien les poignets et les épaules avant les pompes, dips et figures.</p>' : ''}
      <button class="primaire gros" id="ok">${step.kind === 'echauffement' ? 'Échauffement fait' : 'Terminer la séance'}</button>
      <button class="petit" id="stop" style="margin-top:12px">Arrêter la séance</button>`;
    root.querySelector('#ok').addEventListener('click', () => { unlockAudio(); run.i++; draw(root, ctx); });
    root.querySelector('#stop').addEventListener('click', () => arreter(root, ctx));
    return;
  }

  // étape « bloc »
  const e = par[step.exerciceId];
  const suivant = run.etapes[run.i + 1];
  if (run.restEnd) {
    const reste = restRemaining(run.restEnd, Date.now());
    if (reste > 0) { drawRepos(root, ctx, step, par); return; }
    run.restEnd = null;
  }

  const defaut = step.plage.max;
  const facile = e.plusFacile && par[e.plusFacile]?.lieux.includes(session.lieu) ? par[e.plusFacile] : null;
  root.innerHTML = `
    <p class="doux">${esc(session.titre)} · étape ${run.i} / ${run.etapes.length - 2}</p>
    <h1>${esc(e.nom)}</h1>
    <p><span class="pastille">Série ${run.serie + 1} / ${step.series}</span><span class="pastille">Objectif ${fmtPlage(step.plage, step.type)}</span></p>
    <div class="carte" id="illu"></div>
    <details class="carte"><summary><b>Comment faire</b></summary>
      <ol>${e.etapes.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      ${e.conseils.length ? `<p><b>Conseils</b></p><ul>${e.conseils.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    </details>
    ${step.type === 'tenue' ? '<div class="gros-chrono" id="chrono">0:00</div><button class="gros" id="chronoBtn">Démarrer le chrono</button>' : ''}
    <label for="val">${step.type === 'tenue' ? 'Secondes tenues' : 'Répétitions réalisées'}</label>
    <input id="val" type="number" inputmode="numeric" min="0" max="999" value="${defaut}">
    <button class="primaire gros" id="ok" style="margin-top:12px">Série faite</button>
    <div class="ligne" style="margin-top:12px;flex-wrap:wrap">
      ${facile ? `<button class="petit" id="facile">Plus facile : ${esc(facile.nom)}</button>` : ''}
      <button class="petit" id="passer">Passer l'exercice</button>
      <button class="petit" id="stop">Arrêter</button>
    </div>
    ${suivant?.kind === 'bloc' ? `<p class="doux" style="margin-top:12px">Ensuite : ${esc(par[suivant.exerciceId].nom)}</p>` : ''}`;
  import('../illustrations.js').then((m) => { const z = root.querySelector('#illu'); if (z) z.innerHTML = m.illustration(e.illustration); }).catch(() => { const z = root.querySelector('#illu'); if (z) z.remove(); });

  const val = root.querySelector('#val');
  if (step.type === 'tenue') {
    const chronoEl = root.querySelector('#chrono');
    const btn = root.querySelector('#chronoBtn');
    const maj = () => { chronoEl.textContent = formatSeconds((Date.now() - run.chronoDebut) / 1000); };
    if (run.chronoDebut) { btn.textContent = 'Arrêter le chrono'; tick = setInterval(maj, 250); maj(); }
    btn.addEventListener('click', () => {
      unlockAudio();
      if (!run.chronoDebut) {
        run.chronoDebut = Date.now();
        btn.textContent = 'Arrêter le chrono';
        tick = setInterval(maj, 250);
      } else {
        const sec = Math.round((Date.now() - run.chronoDebut) / 1000);
        run.chronoDebut = null;
        stopTick();
        val.value = sec;
        chronoEl.textContent = formatSeconds(sec);
        btn.textContent = 'Redémarrer le chrono';
      }
    });
  }
  root.querySelector('#ok').addEventListener('click', () => {
    unlockAudio();
    const n = Math.max(0, Math.floor(Number(val.value) || 0));
    run.chronoDebut = null;
    (run.reps[step.exerciceId] ||= []).push(n);
    run.serie++;
    if (run.serie >= step.series) { run.i++; run.serie = 0; }
    const encoreDuTravail = run.serie > 0 || run.etapes[run.i]?.kind === 'bloc';
    run.restEnd = encoreDuTravail ? Date.now() + step.repos * 1000 : null;
    draw(root, ctx);
  });
  root.querySelector('#passer').addEventListener('click', () => { run.i++; run.serie = 0; run.restEnd = null; run.chronoDebut = null; draw(root, ctx); });
  root.querySelector('#stop').addEventListener('click', () => arreter(root, ctx));
  root.querySelector('#facile')?.addEventListener('click', () => {
    step.exerciceId = facile.id;
    step.plage = facile.plage;
    step.type = facile.type;
    step.repos = facile.repos;
    run.chronoDebut = null;
    draw(root, ctx);
  });
}

function drawRepos(root, ctx, step, par) {
  const { run } = ctx;
  const nom = par[step.exerciceId].nom;
  const libelle = run.serie > 0 ? `Prochaine série : ${run.serie + 1} / ${step.series}` : 'Ensuite';
  root.innerHTML = `
    <h1>Repos</h1>
    <div class="gros-chrono" id="reste">${formatSeconds(restRemaining(run.restEnd, Date.now()))}</div>
    <p class="doux" style="text-align:center">${libelle} — ${esc(nom)}</p>
    <button class="primaire gros" id="passer">Passer le repos</button>
    <button class="petit" id="stop" style="margin-top:12px">Arrêter la séance</button>`;
  const fin = () => { stopTick(); run.restEnd = null; draw(root, ctx); };
  tick = setInterval(() => {
    const r = restRemaining(run.restEnd, Date.now());
    const el = root.querySelector('#reste');
    if (el) el.textContent = formatSeconds(r);
    if (r <= 0) { beep(); vibrate(300); fin(); }
  }, 250);
  root.querySelector('#passer').addEventListener('click', fin);
  root.querySelector('#stop').addEventListener('click', () => arreter(root, ctx));
}

async function arreter(root, ctx) {
  if (!window.confirm('Arrêter la séance ? Les séries déjà faites sont gardées.')) return;
  await sauvegarder(ctx, false);
  await majRecords(ctx);
  nettoyer(ctx);
  window.app.showView('aujourdhui');
}

async function terminer(root, ctx) {
  stopTick();
  const { run } = ctx;
  const par = parExercice(ctx.data.exercices);
  if (!run.saved) {
    const a = await sauvegarder(ctx, true);
    await majRecords(ctx);
    run.saved = true;
    run.fin = run.etapes.filter((x) => x.kind === 'bloc' && run.reps[x.exerciceId]?.length).map((st) => {
      const ex = { ...par[st.exerciceId], plage: st.plage };
      const r = evaluate(ex, run.reps[st.exerciceId]);
      const texte = r.action === 'variante-plus-dure' ? `Prêt pour : ${par[r.exerciceId].nom}` : CONSEIL[r.action];
      return { nom: ex.nom, reps: run.reps[st.exerciceId], texte };
    });
    run.aucune = !a;
  }
  root.innerHTML = `
    <h1>Séance terminée</h1>
    ${run.aucune ? '<p class="doux">Aucune série enregistrée.</p>' : ''}
    ${run.fin.map((f) => `<div class="carte"><b>${esc(f.nom)}</b><br><span class="doux">${f.reps.join(' · ')}</span><br>${esc(f.texte)}</div>`).join('')}
    <button class="primaire gros" id="ok">Terminer</button>`;
  root.querySelector('#ok').addEventListener('click', () => { nettoyer(ctx); window.app.showView('aujourdhui'); });
}

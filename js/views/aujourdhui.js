import { buildSession, isDeloadWeek, jourCode, todayISO } from '../program.js';
import { esc, fmtPlage, LIEUX, NOMS_JOURS, parExercice } from '../dom.js';

export async function render(root, ctx) {
  const { exercices, programme } = ctx.data;
  const par = parExercice(exercices);
  const settings = await ctx.store.getSettings();
  const aujourdhui = jourCode();
  const jour = ctx.jour || aujourdhui;
  const defJour = programme.semaine.find((j) => j.jour === jour);
  const lieu = ctx.lieu || defJour?.lieu || 'maison';
  const deload = isDeloadWeek(settings.debut, todayISO(), programme.decharge.toutesLesSemaines);
  const repos = !defJour || defJour.blocs.length === 0;
  // Jour de repos : séance légère facultative = corps entier en mode décharge.
  const session = repos
    ? buildSession(programme, exercices, 'sam', lieu, ctx.profil, true)
    : buildSession(programme, exercices, jour, lieu, ctx.profil, deload);
  session.echauffement = programme.echauffement;
  session.etirements = programme.etirements;
  if (repos) session.titre = 'Séance légère';

  root.innerHTML = `
    <h1>${repos ? 'Jour de repos' : esc(session.titre)}</h1>
    <p class="doux">${NOMS_JOURS[jour]}${jour === aujourdhui ? ' (aujourd\'hui)' : ''}${deload && !repos ? ' · <span class="pastille alerte">Semaine de décharge</span>' : ''}</p>
    ${repos ? '<div class="carte"><p>Le repos fait partie de l\'entraînement. Tu peux quand même faire une séance légère si tu en as envie.</p></div>' : ''}
    <label for="jour">Jour du programme</label>
    <select id="jour">${programme.semaine.map((j) => `<option value="${j.jour}" ${j.jour === jour ? 'selected' : ''}>${NOMS_JOURS[j.jour]} — ${esc(j.titre)}</option>`).join('')}</select>
    <label>Lieu</label>
    <div class="segments" id="lieux">${Object.entries(LIEUX).map(([k, v]) => `<button data-lieu="${k}" class="${k === lieu ? 'actif' : ''}">${v}</button>`).join('')}</div>
    <h2>${repos ? 'Séance légère proposée' : 'Au programme'}</h2>
    <div class="carte">
      ${session.blocs.map((b) => {
        const e = par[b.exerciceId];
        return `<div class="ligne" style="padding:6px 0"><span>${esc(e.nom)}</span><span class="doux">${b.series} × ${fmtPlage(b.plage, b.type)}</span></div>`;
      }).join('') || '<p class="doux">Rien de prévu.</p>'}
    </div>
    <button id="go" class="primaire gros" ${session.blocs.length ? '' : 'disabled'}>${repos ? 'Faire la séance légère' : 'Démarrer'}</button>`;

  root.querySelector('#jour').addEventListener('change', (e) => {
    ctx.jour = e.target.value;
    const j = programme.semaine.find((x) => x.jour === ctx.jour);
    ctx.lieu = j?.lieu || ctx.lieu;
    render(root, ctx);
  });
  root.querySelector('#lieux').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-lieu]');
    if (!b) return;
    ctx.lieu = b.dataset.lieu;
    render(root, ctx);
  });
  root.querySelector('#go').addEventListener('click', () => window.app.startSession(session));
}

import { exportAll, parseImport, importAll } from '../storage.js';
import { todayISO } from '../program.js';
import { esc, LIEUX, parExercice } from '../dom.js';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const RECORDS = [['pompes', 'Pompes', ''], ['diamant', 'Pompes diamant', ''], ['tractions', 'Tractions', ''], ['dips', 'Dips', ''], ['planche', 'Planche gainage', ' s']];

function calendrier(sessions, aujourdhui) {
  const [y, m] = aujourdhui.split('-').map(Number);
  const jours = new Set(sessions.map((s) => s.date));
  const decalage = (new Date(y, m - 1, 1).getDay() + 6) % 7; // semaine commençant le lundi
  const nb = new Date(y, m, 0).getDate();
  const cases = [...Array(decalage).fill('<div class="jour vide"></div>')];
  for (let d = 1; d <= nb; d++) {
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cases.push(`<div class="jour ${jours.has(iso) ? 'fait' : ''}">${d}</div>`);
  }
  return `<h2>${MOIS[m - 1]} ${y}</h2><div class="calendrier">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j) => `<div class="doux">${j}</div>`).join('')}${cases.join('')}</div>`;
}

export async function render(root, ctx) {
  const par = parExercice(ctx.data.exercices);
  const sessions = await ctx.store.listSessions();
  const records = await ctx.store.getRecords();
  const aujourdhui = todayISO();

  root.innerHTML = `
    <h1>Progrès</h1>
    <div class="carte"><b>Mes records</b>
      ${RECORDS.map(([k, nom, u]) => `<div class="ligne" style="padding:4px 0"><span>${nom}</span><b>${records[k] ? records[k] + u : '—'}</b></div>`).join('')}
    </div>
    ${calendrier(sessions, aujourdhui)}
    <h2>Historique</h2>
    ${sessions.slice(0, 20).map((s) => `<div class="carte"><div class="ligne"><b>${esc(s.titre)}</b><span class="doux">${esc(s.date)}</span></div>
      <span class="pastille">${LIEUX[s.lieu] || ''}</span>${s.terminee ? '' : '<span class="pastille alerte">Interrompue</span>'}
      <div class="doux">${s.series.map((x) => `${esc(par[x.exerciceId]?.nom || x.exerciceId)} : ${x.reps.join('·')}`).join('<br>')}</div></div>`).join('') || '<p class="doux">Aucune séance pour le moment.</p>'}
    <h2>Sauvegarde</h2>
    <div class="carte">
      <p class="doux">Tes données sont uniquement sur cet appareil. Exporte-les régulièrement : vider le navigateur les efface.</p>
      <div class="grille">
        <button id="export">Exporter ma sauvegarde</button>
        <label class="bouton" for="fichier" style="text-align:center;margin:0">Importer une sauvegarde</label>
        <input id="fichier" type="file" accept=".json,application/json" hidden>
        <button id="retest">Refaire le test de départ</button>
      </div>
      <p id="msg" class="doux" aria-live="polite"></p>
    </div>`;

  const msg = root.querySelector('#msg');
  root.querySelector('#retest').addEventListener('click', () => window.app.showView('depart'));
  root.querySelector('#export').addEventListener('click', async () => {
    const texte = await exportAll(ctx.store);
    const url = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `calisthenie-sauvegarde-${aujourdhui}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    msg.textContent = 'Sauvegarde exportée.';
  });
  root.querySelector('#fichier').addEventListener('change', async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    const r = parseImport(await fichier.text());
    if (!r.ok) { msg.textContent = `Import refusé : ${r.erreur} Tes données actuelles n'ont pas changé.`; e.target.value = ''; return; }
    if (!window.confirm(`Remplacer tes données actuelles par cette sauvegarde (${r.donnees.sessions.length} séances) ?`)) { e.target.value = ''; return; }
    try {
      await importAll(ctx.store, r.donnees);
    } catch (err) {
      msg.textContent = `Import refusé : ${err.message} Tes données actuelles n'ont pas changé.`;
      return;
    }
    ctx.profil = await ctx.store.getProfile();
    render(root, ctx);
  });
}

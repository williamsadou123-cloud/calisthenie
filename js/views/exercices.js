import { illustration } from '../illustrations.js';
import { esc, fmtPlage, LIEUX, parExercice } from '../dom.js';

const GROUPES = {
  poussee: 'Poussée', tirage: 'Tirage', jambes: 'Jambes', gainage: 'Gainage',
  equilibre: 'Équilibre mains', figure: 'Figures', mobilite: 'Échauffement / mobilité',
};

const sansAccent = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function render(root, ctx) {
  const exercices = ctx.data.exercices;
  const par = parExercice(exercices);
  const f = ctx.filtres || (ctx.filtres = { q: '', groupe: '', lieu: '', diff: '' });
  if (ctx.exerciceOuvert && par[ctx.exerciceOuvert]) { fiche(root, ctx, par[ctx.exerciceOuvert], par); return; }
  ctx.exerciceOuvert = null;

  root.innerHTML = `
    <h1>Exercices</h1>
    <input id="q" type="search" placeholder="Rechercher (nom ou muscle)" value="${esc(f.q)}" aria-label="Rechercher">
    <div class="grille" style="grid-template-columns:repeat(3,1fr);margin-top:8px">
      <select id="groupe" aria-label="Muscle ou famille"><option value="">Tout</option>${Object.entries(GROUPES).map(([k, v]) => `<option value="${k}" ${f.groupe === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="lieu" aria-label="Lieu"><option value="">Lieu</option>${Object.entries(LIEUX).map(([k, v]) => `<option value="${k}" ${f.lieu === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="diff" aria-label="Difficulté"><option value="">Niveau</option>${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${String(f.diff) === String(n) ? 'selected' : ''}>Niveau ${n}</option>`).join('')}</select>
    </div>
    <p class="doux" id="compte"></p>
    <div id="liste"></div>`;

  const liste = root.querySelector('#liste');
  const maj = () => {
    const q = sansAccent(f.q.trim());
    const res = exercices.filter((e) =>
      (!q || sansAccent(e.nom).includes(q) || e.muscles.some((m) => sansAccent(m).includes(q))) &&
      (!f.groupe || e.groupe === f.groupe) &&
      (!f.lieu || e.lieux.includes(f.lieu)) &&
      (!f.diff || e.difficulte === Number(f.diff)));
    root.querySelector('#compte').textContent = `${res.length} exercice${res.length > 1 ? 's' : ''}`;
    liste.innerHTML = res.map((e) => `
      <button class="carte ligne" data-id="${e.id}" style="width:100%;text-align:left">
        <span><b>${esc(e.nom)}</b><br><span class="doux">${esc(e.muscles.join(', '))}</span></span>
        <span><span class="pastille">N${e.difficulte}</span></span>
      </button>`).join('') || '<p class="doux">Aucun exercice ne correspond.</p>';
  };
  maj();

  root.querySelector('#q').addEventListener('input', (e) => { f.q = e.target.value; maj(); });
  for (const k of ['groupe', 'lieu', 'diff']) root.querySelector(`#${k}`).addEventListener('change', (e) => { f[k] = e.target.value; maj(); });
  liste.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    ctx.exerciceOuvert = b.dataset.id;
    render(root, ctx);
    window.scrollTo(0, 0);
  });
}

function fiche(root, ctx, e, par) {
  const lien = (id, label) => (id && par[id] ? `<button class="petit" data-ouvrir="${id}">${label} : ${esc(par[id].nom)}</button>` : '');
  root.innerHTML = `
    <button class="petit" id="retour">← Retour</button>
    <h1 style="margin-top:12px">${esc(e.nom)}</h1>
    <p>
      <span class="pastille">${GROUPES[e.groupe]}</span>
      <span class="pastille">Niveau ${e.difficulte}</span>
      ${e.lieux.map((l) => `<span class="pastille">${LIEUX[l]}</span>`).join('')}
    </p>
    <div class="carte" id="demo">${illustration(e.illustration)}</div>
    <p class="doux">Muscles : ${esc(e.muscles.join(', '))}</p>
    <p><b>Conseil :</b> ${e.series} séries de ${fmtPlage(e.plage, e.type)}, repos ${e.repos} s.</p>
    <h2>Comment faire</h2>
    <ol>${e.etapes.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
    ${e.conseils.length ? `<h2>Points clés</h2><ul>${e.conseils.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${e.erreurs.length ? `<h2>Erreurs fréquentes</h2><ul>${e.erreurs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <div class="grille" style="margin-top:16px">${lien(e.plusFacile, 'Plus facile')}${lien(e.plusDur, 'Plus difficile')}</div>`;
  // Démo animée si elle existe: le dessin ci-dessus reste affiché en attendant et en cas d'échec.
  import('../anim/viewer.js').then((m) => m.montrerAnimation(root.querySelector('#demo'), e, ctx.data)).catch(() => {});
  root.querySelector('#retour').addEventListener('click', () => { ctx.exerciceOuvert = null; render(root, ctx); });
  root.querySelectorAll('[data-ouvrir]').forEach((b) => b.addEventListener('click', () => {
    ctx.exerciceOuvert = b.dataset.ouvrir;
    render(root, ctx);
    window.scrollTo(0, 0);
  }));
}

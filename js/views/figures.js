import { unlockedIndex, validatePalier } from '../figures.js';
import { esc, parExercice } from '../dom.js';

export async function render(root, ctx) {
  const { figures, exercices } = ctx.data;
  const par = parExercice(exercices);
  const validated = await ctx.store.getValidated();

  root.innerHTML = `
    <h1>Figures</h1>
    <div class="carte"><b>Avant de commencer</b>
      <p class="doux">Échauffe bien les poignets, les coudes et les épaules avant chaque travail de figure. Avance palier par palier : ne passe au suivant qu'après avoir validé le précédent. En cas de douleur, adapte ou consulte.</p>
    </div>
    ${figures.map((fig) => {
      const ouvert = unlockedIndex(fig, validated);
      return `<div class="carte"><h2 style="margin-top:0">${esc(fig.nom)}</h2>
        <p class="doux">${esc(fig.description || '')}</p>
        ${fig.paliers.map((p, i) => {
          const fait = validated.includes(p.id);
          const dispo = i === ouvert;
          const etat = fait ? '<span class="pastille ok">Validé</span>' : dispo ? '<span class="pastille alerte">À valider</span>' : '<span class="pastille">Verrouillé</span>';
          const unite = p.test.type === 'tenue' ? 's' : 'rép.';
          return `<div class="${!fait && !dispo ? 'verrou' : ''}" style="padding:8px 0;border-top:1px solid var(--carte2)">
            <div class="ligne"><span><b>${i + 1}. ${esc(p.nom)}</b><br><span class="doux">Test : ${p.test.valeur} ${unite}</span></span>${etat}</div>
            <button class="petit" data-fiche="${p.exerciceId}" style="margin-top:6px">Voir la fiche</button>
            ${dispo ? `<form class="ligne" data-palier="${fig.id}:${p.id}" style="margin-top:8px"><input type="number" inputmode="numeric" min="0" max="999" placeholder="Résultat (${unite})" aria-label="Résultat du test" required><button class="primaire petit" type="submit">Valider</button></form><p class="doux msg" aria-live="polite"></p>` : ''}
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}`;

  root.querySelectorAll('[data-fiche]').forEach((b) => b.addEventListener('click', () => {
    if (!par[b.dataset.fiche]) return;
    ctx.exerciceOuvert = b.dataset.fiche;
    window.app.showView('exercices');
  }));
  root.querySelectorAll('form[data-palier]').forEach((form) => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const [figId, palierId] = form.dataset.palier.split(':');
    const fig = figures.find((x) => x.id === figId);
    const courant = await ctx.store.getValidated();
    const r = validatePalier(fig, courant, palierId, form.querySelector('input').value);
    if (!r.ok) {
      const p = fig.paliers.find((x) => x.id === palierId);
      form.nextElementSibling.textContent = `Pas encore : il faut au moins ${p.test.valeur} ${p.test.type === 'tenue' ? 's' : 'répétitions'}.`;
      return;
    }
    await ctx.store.setValidated(r.validated);
    render(root, ctx);
  }));
}

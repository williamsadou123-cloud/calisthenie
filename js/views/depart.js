import { calibrateProfile } from '../progression.js';
import { todayISO } from '../program.js';

const CHAMPS = [
  ['pompes', 'Pompes classiques (max d\'affilée)'],
  ['diamant', 'Pompes diamant (max)'],
  ['tractions', 'Tractions (max)'],
  ['dips', 'Dips aux barres (max)'],
  ['planche', 'Planche gainage (secondes tenues)'],
];

export function render(root, ctx) {
  root.innerHTML = `
    <h1>Test de départ</h1>
    <p class="doux">Entre ce que tu fais aujourd'hui, en bonne forme. Laisse vide si tu ne sais pas : l'appli prendra une valeur prudente.</p>
    <form id="f" class="carte">
      ${CHAMPS.map(([k, label]) => `<label for="${k}">${label}</label><input id="${k}" name="${k}" type="number" inputmode="numeric" min="0" max="999">`).join('')}
      <button class="primaire gros" type="submit" style="margin-top:16px">Enregistrer et commencer</button>
    </form>`;
  root.querySelector('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const brut = Object.fromEntries(new FormData(e.target).entries());
    const profil = calibrateProfile(brut);
    const records = {};
    for (const [k] of CHAMPS) {
      const v = Number(brut[k]);
      if (Number.isFinite(v) && v > 0) records[k] = v;
    }
    await ctx.store.setProfile(profil);
    await ctx.store.setRecords(records);
    const settings = await ctx.store.getSettings();
    await ctx.store.setSettings({ ...settings, debut: settings.debut || todayISO() });
    ctx.profil = profil;
    window.app.showView('aujourdhui');
  });
}

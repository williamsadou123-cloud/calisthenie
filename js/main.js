import { openStore } from './storage.js';
import { gestionnaire } from './anim/viewer.js';
import { chargerFacultatif } from './chargement.js';

const VUES = ['aujourdhui', 'seance', 'figures', 'exercices', 'progres', 'depart'];
const racine = document.getElementById('vue');
const ctx = { session: null };

async function showView(name) {
  if (!VUES.includes(name)) name = 'aujourdhui';
  const onglet = name === 'depart' ? 'aujourdhui' : name;
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('actif', b.dataset.vue === onglet));
  const mod = await import(`./views/${name}.js`);
  gestionnaire.detruire(); // un seul rendu 3D à la fois, libéré quand on quitte l'écran
  racine.innerHTML = '';
  await mod.render(racine, ctx);
  window.scrollTo(0, 0);
}

function startSession(session) {
  ctx.session = session;
  ctx.run = null; // toujours repartir d'un état propre pour une nouvelle séance
  return showView('seance');
}

window.app = { showView, startSession, ctx };

document.getElementById('nav').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-vue]');
  if (b) showView(b.dataset.vue);
});

async function charger(f) {
  const r = await fetch(`data/${f}.json`);
  if (!r.ok) throw new Error(`data/${f}.json: ${r.status}`);
  return r.json();
}

async function boot() {
  try {
    const [exercices, programme, figures] = await Promise.all(['exercices', 'programme', 'figures'].map(charger));
    const animations = await chargerFacultatif(fetch, 'data/animations.json'); // facultatif: sans lui, les dessins s'affichent
    ctx.data = { exercices, programme, figures, animations };
    const { store, persistant } = await openStore();
    ctx.store = store;
    ctx.persistant = persistant;
    ctx.profil = await store.getProfile();
    const bandeau = document.getElementById('bandeau');
    if (!persistant) {
      bandeau.textContent = 'Stockage indisponible : tes séances ne seront pas conservées. Pense à exporter ta sauvegarde.';
      bandeau.hidden = false;
    }
    await showView(ctx.profil ? 'aujourdhui' : 'depart');
  } catch (err) {
    racine.innerHTML = `<h1>Erreur de chargement</h1><p class="doux">${String(err.message || err)}</p><button class="primaire" onclick="location.reload()">Réessayer</button>`;
  }
}

function proposerRechargement() {
  if (document.getElementById('maj')) return;
  const d = document.createElement('div');
  d.id = 'maj';
  d.className = 'bandeau';
  d.innerHTML = 'Une mise à jour est disponible. <button class="petit" id="recharger">Recharger</button>';
  document.body.prepend(d);
  d.querySelector('#recharger').addEventListener('click', () => location.reload());
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === 'maj') proposerRechargement(); });
}

boot();

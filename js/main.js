const VUES = ['aujourdhui', 'seance', 'figures', 'exercices', 'progres', 'depart'];
const racine = document.getElementById('vue');
const ctx = {};

async function showView(name) {
  if (!VUES.includes(name)) name = 'aujourdhui';
  const onglet = name === 'seance' || name === 'depart' ? 'aujourdhui' : name;
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('actif', b.dataset.vue === onglet));
  const mod = await import(`./views/${name}.js`);
  racine.innerHTML = '';
  await mod.render(racine, ctx);
  window.scrollTo(0, 0);
}

window.app = { showView, ctx };

document.getElementById('nav').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-vue]');
  if (b) showView(b.dataset.vue);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

showView('aujourdhui');

// Exercices dont la plage de répétitions suit le profil de départ.
export const CLE_PROFIL = {
  pompes: 'pompes',
  'pompes-diamant': 'diamant',
  'tractions-pronation': 'tractions',
  'tractions-supination': 'tractions',
  'dips-barres': 'dips',
  'dips-banc': 'dips',
  'planche-gainage': 'planche',
};

// getDay(): 0 = dimanche.
const JOURS_PAR_GETDAY = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

const pad = (n) => String(n).padStart(2, '0');

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function jourCode(d = new Date()) {
  return JOURS_PAR_GETDAY[d.getDay()];
}

function parseLocal(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function isDeloadWeek(startISO, todayIso, every = 5) {
  const a = parseLocal(startISO);
  const b = parseLocal(todayIso);
  if (!a || !b || !(every > 0)) return false;
  const jours = Math.round((b - a) / 86_400_000);
  if (jours < 0) return false;
  return (Math.floor(jours / 7) + 1) % every === 0;
}

export function buildSession(programme, exercices, jour, lieu, profil, deload) {
  const par = Object.fromEntries(exercices.map((e) => [e.id, e]));
  const j = programme.semaine.find((x) => x.jour === jour);
  if (!j) return { titre: '', jour, lieu, blocs: [] };
  const facteur = programme.decharge?.facteur ?? 0.6;
  const vus = new Set();
  const blocs = [];
  for (const bloc of j.blocs) {
    let ex = par[bloc.exerciceId];
    if (!ex) continue;
    if (!ex.lieux.includes(lieu)) ex = par[ex.substitut[lieu]];
    if (!ex || !ex.lieux.includes(lieu) || vus.has(ex.id)) continue;
    vus.add(ex.id);
    let series = bloc.series ?? ex.series;
    if (deload) series = Math.max(1, Math.round(series * facteur));
    const cle = CLE_PROFIL[ex.id];
    blocs.push({
      exerciceId: ex.id,
      series,
      plage: cle && profil?.[cle] ? profil[cle] : ex.plage,
      repos: ex.repos,
      type: ex.type,
    });
  }
  return { titre: j.titre ?? j.seance, jour, lieu, blocs };
}

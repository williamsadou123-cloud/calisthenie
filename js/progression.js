const DEFAUTS = { pompes: 1, diamant: 1, tractions: 1, dips: 1, planche: 20 };

export function calibrateRange(max) {
  const n = Math.floor(Number(max));
  if (!Number.isFinite(n) || n <= 0) return { min: 1, max: 1 };
  return { min: Math.max(1, Math.round(0.6 * n)), max: n };
}

export function calibrateProfile(maxes = {}) {
  const profil = {};
  for (const [cle, defaut] of Object.entries(DEFAUTS)) {
    const v = Number(maxes?.[cle]);
    profil[cle] = calibrateRange(Number.isFinite(v) && v > 0 ? v : defaut);
  }
  return profil;
}

export function evaluate(exercice, series) {
  const reste = { action: 'maintenir', exerciceId: exercice.id };
  if (!Array.isArray(series) || series.length === 0) return reste;
  const { min, max } = exercice.plage;
  if (series.some((r) => !(r >= min))) return reste;
  if (series.every((r) => r >= max)) {
    return exercice.plusDur
      ? { action: 'variante-plus-dure', exerciceId: exercice.plusDur }
      : { action: 'plus-de-reps', exerciceId: exercice.id };
  }
  return { action: 'plus-de-reps', exerciceId: exercice.id };
}

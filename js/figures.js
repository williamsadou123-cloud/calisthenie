export function unlockedIndex(figure, validated) {
  let i = 0;
  while (i < figure.paliers.length && validated.includes(figure.paliers[i].id)) i++;
  return i;
}

export function validatePalier(figure, validated, palierId, resultat) {
  const refus = { ok: false, validated };
  const idx = figure.paliers.findIndex((p) => p.id === palierId);
  if (idx < 0) return refus;
  if (validated.includes(palierId)) return { ok: true, validated };
  if (idx > unlockedIndex(figure, validated)) return refus;
  const n = Number(resultat);
  if (resultat === null || resultat === undefined || resultat === '' || !Number.isFinite(n)) return refus;
  if (n < figure.paliers[idx].test.valeur) return refus;
  return { ok: true, validated: [...validated, palierId] };
}

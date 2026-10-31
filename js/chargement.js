// Chargement d'un fichier de données facultatif: un fichier absent ou cassé ne doit pas bloquer l'appli.
export async function chargerFacultatif(fetchFn, chemin) {
  try {
    const r = await fetchFn(chemin);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

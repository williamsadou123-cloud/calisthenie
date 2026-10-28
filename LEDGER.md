# SDD ledger — plan: docs/superpowers/plans/2026-10-28-calisthenie-pwa.md
Pre-flight: T3 consomme JSON de T2; T5/T6/T8 consomment T3+T4. Interfaces alignées sur le plan.
Task 1: Ruling: "node --test tests/" échoue sous Node 24 (traite le dossier comme module) — script npm = "node --test" (découverte auto) — coût: aucun
Task 1: Ruling: stubs de vues + JSON vides créés pour que ASSETS existe sur disque — remplacés aux tâches 2,5-8
Task 1: complete (npm test → 2/2 pass)
Task 2: Ruling: paliers de tenue testés à 10 s partout (spec: ex. 10 s), reps pour kick-up/tractions/muscle-up — coût: ajuster data/figures.json
Task 2: Ruling: champ "titre" ajouté aux jours du programme et "description" aux figures (affichage) — coût: aucun
Task 2: complete (npm test → 11/11 pass, 74 exercices)

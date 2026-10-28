// Bip, vibration et écran allumé. Aucune de ces fonctions ne lève d'erreur si l'API est absente.
let audio = null;

export function beep() {
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    audio = audio || new AC();
    if (audio.state === 'suspended') audio.resume();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.2;
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.25);
  } catch { /* son indisponible : on continue sans */ }
}

export function vibrate(ms = 200) {
  try { navigator.vibrate?.(ms); } catch { /* ignoré */ }
}

export async function keepAwake() {
  try {
    const lock = await navigator.wakeLock?.request('screen');
    return () => { try { lock?.release(); } catch { /* ignoré */ } };
  } catch {
    return () => {};
  }
}

// À appeler sur un geste de l'utilisateur pour débloquer le son sur mobile.
export function unlockAudio() {
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    audio = audio || new AC();
    if (audio.state === 'suspended') audio.resume();
  } catch { /* ignoré */ }
}

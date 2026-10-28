export function restRemaining(endAt, now) {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function formatSeconds(s) {
  const total = Math.max(0, Math.floor(Number(s) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

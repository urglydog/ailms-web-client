export function easeOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 3);
}

export function countUpValue(target: number, elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return target;
  return Math.round(target * easeOutCubic(elapsedMs / durationMs));
}

export function nanSafe(v: number) {
  return isNaN(v) ? 0 : v;
}

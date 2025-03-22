export function nanSafe(v: any) {
  return isNaN(v) ? 0 : v;
}

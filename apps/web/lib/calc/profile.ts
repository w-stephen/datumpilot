export function evaluateProfile(measured: number, tolerance: number) {
  const pass = measured <= tolerance;
  return { pass };
}

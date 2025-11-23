export function evaluateFlatness(measuredVariation: number, tolerance: number) {
  const pass = measuredVariation <= tolerance;
  return { pass };
}

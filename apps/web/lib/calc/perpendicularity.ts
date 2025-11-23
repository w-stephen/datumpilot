export function evaluatePerpendicularity(deviation: number, tolerance: number) {
  const pass = deviation <= tolerance;
  return { pass };
}

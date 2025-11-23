export interface PositionInputs {
  nominalSize?: number;
  mmcSize?: number;
  actualSize?: number;
  geoToleranceAtMmc: number;
  radialLocationError: number;
}

export function calculatePositionAtMmc(inputs: PositionInputs) {
  const bonus = inputs.actualSize && inputs.mmcSize ? Math.abs(inputs.actualSize - inputs.mmcSize) : 0;
  const effectiveTolerance = inputs.geoToleranceAtMmc + bonus;
  const pass = inputs.radialLocationError <= effectiveTolerance / 2;
  return { bonus, effectiveTolerance, pass };
}

export function random(min: number, max: number, round = false): number {
  let value = Math.random() * (max - min) + min;
  return round ? Math.round(value) : value;
}

export function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if(value < inMin) {
    return outMin;
  }

  if(value > inMax) {
    return outMax;
  }

  return (value - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
}

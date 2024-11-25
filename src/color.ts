export interface IColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export const green: IColor = { r: 0, g: 1, b: 0, a: 1 };
export const red: IColor = { r: 1, g: 0, b: 0, a: 1 };
export const blue: IColor = { r: 0, g: 0, b: 1, a: 1 };
export const teal: IColor = { r: 0, g: 1, b: 1, a: 1 };
export const yellow: IColor = { r: 1, g: 1, b: 0, a: 1 };

export const white: IColor = { r: 1, g: 1, b: 1, a: 1 };
export const black: IColor = { r: 0, g: 0, b: 0, a: 1 };

export const gray: IColor = { r: 0.5, g: 0.5, b: 0.5, a: 1 };
export const grey = gray;

export function fromHex(hex: string): IColor | null {
  if (hex.length < 6) return null;
  hex = hex.toLowerCase();

  if (hex[0] === "#") {
    hex = hex.substring(1, hex.length);
  }

  const r = parseInt(hex[0] + hex[1], 16);
  const g = parseInt(hex[2] + hex[3], 16);
  const b = parseInt(hex[4] + hex[5], 16);
  return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
}

export function random(): IColor {
  return {
    r: Math.random(),
    g: Math.random(),
    b: Math.random(),
    a: Math.random(),
  };
}

export function pallet(): IColor {
  switch (Math.round(Math.random() * 4)) {
    case 0:
      return green;
    case 1:
      return red;
    case 2:
      return blue;
    case 3:
      return teal;
    case 4:
    default:
      return yellow;
  }
}

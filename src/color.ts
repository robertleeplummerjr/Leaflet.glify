export interface IColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

const green: IColor = {r: 0, g: 1, b: 0, a: 1};
const red: IColor = {r: 1, g: 0, b: 0, a: 1};
const blue: IColor = {r: 0, g: 0, b: 1, a: 1};
const teal: IColor = {r: 0, g: 1, b: 1, a: 1};
const yellow: IColor = {r: 1, g: 1, b: 0, a: 1};

const white: IColor = {r: 1, g: 1, b: 1, a: 1};
const black: IColor = {r: 0, g: 0, b: 0, a: 1};

const gray: IColor = {r: 0.5, g: 0.5, b: 0.5, a: 1};

export class Color {
  static green;
  static red;
  static blue;
  static teal;
  static yellow;
  static white;
  static black;
  static gray;
  static get grey() {
    return gray;
  }

  static fromHex(hex): IColor | null {
    if (hex.length < 6) return null;
    hex = hex.toLowerCase();

    if (hex[0] === '#') {
      hex = hex.substring(1, hex.length);
    }

    const r = parseInt(hex[0] + hex[1], 16)
      , g = parseInt(hex[2] + hex[3], 16)
      , b = parseInt(hex[4] + hex[5], 16)
      ;
    return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
  }

  static random(): IColor {
    return {
      r: Math.random(),
      g: Math.random(),
      b: Math.random(),
      a: Math.random(),
    };
  }

  static pallet(): IColor {
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
        return yellow;
    }
  }
}

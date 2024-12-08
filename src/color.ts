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

export function hexToRgbNormalized(hex: string): IColor {
  if (
    typeof hex !== "string" ||
    !/^#?[0-9A-Fa-f]{3}$|^#?[0-9A-Fa-f]{6}$|^#?[0-9A-Fa-f]{8}$/.test(hex)
  ) {
    console.error("Invalid hex string");
    return gray; // Return default gray for invalid input
  }

  // Remove the '#' if present
  if (hex.startsWith("#")) hex = hex.slice(1);

  // Expand shorthand hex (e.g., 'RGB' -> 'RRGGBB')
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Parse RGB and optional alpha values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : undefined;

  return { r, g, b, a };
}

export function getChosenColor(
  chosenColor:
    | string
    | IColor
    | [number, number, number]
    | [number, number, number, number]
): IColor {
  let rgb: IColor;

  // Handle hex string
  if (typeof chosenColor === "string") {
    rgb = hexToRgbNormalized(chosenColor);
  }
  // Handle normalized array
  else if (Array.isArray(chosenColor)) {
    let chosenColorArray = chosenColor;
    if (chosenColorArray.length === 3) {
      rgb = {
        r: chosenColorArray[0],
        g: chosenColorArray[1],
        b: chosenColorArray[2],
      };
    } else if (chosenColorArray.length === 4) {
      rgb = {
        r: chosenColorArray[0],
        g: chosenColorArray[1],
        b: chosenColorArray[2],
        a: chosenColorArray[3],
      };
    } else {
      throw new Error("Invalid array length for RGB or RGBA values.");
    }
  }
  // Handle RGB object
  else if (
    typeof chosenColor === "object" &&
    chosenColor !== null &&
    "r" in chosenColor &&
    "g" in chosenColor &&
    "b" in chosenColor &&
    (chosenColor.a === undefined || typeof chosenColor.a === "number")
  ) {
    rgb = chosenColor;
  }
  // Invalid input
  else {
    console.warn("Invalid color input. Falling back to default gray.");
    rgb = gray;
  }

  return rgb;
}

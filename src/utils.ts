import { LatLng, LatLngBounds, LeafletMouseEvent, Map } from "leaflet";
import { IPixel } from "./pixel";

// -- converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
// -- source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html
export function latLonToPixel(latitude: number, longitude: number): IPixel {
  const pi180 = Math.PI / 180.0;
  const pi4 = Math.PI * 4;
  const sinLatitude = Math.sin(latitude * pi180);
  const pixelY =
    (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / pi4) * 256;
  const pixelX = ((longitude + 180) / 360) * 256;

  return { x: pixelX, y: pixelY };
}

export function pixelInCircle(
  centerPixel: IPixel,
  checkPoint: IPixel,
  radius: number
): boolean {
  const distanceSquared =
    (centerPixel.x - checkPoint.x) * (centerPixel.x - checkPoint.x) +
    (centerPixel.y - checkPoint.y) * (centerPixel.y - checkPoint.y);
  return distanceSquared <= radius * radius;
}

export function latLngDistance(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) {
    // in case of 0 length line
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function vectorDistance(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

export function locationDistance(
  location1: LatLng,
  location2: LatLng,
  map: Map
): number {
  const point1 = map.latLngToLayerPoint(location1);
  const point2 = map.latLngToLayerPoint(location2);
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return vectorDistance(dx, dy);
}

export function debugPoint(containerPixel: IPixel): void {
  const el = document.createElement("div");
  const s = el.style;
  const x = containerPixel.x;
  const y = containerPixel.y;
  s.left = `${x}px`;
  s.top = `${y}px`;
  s.width = "10px";
  s.height = "10px";
  s.position = "absolute";
  s.backgroundColor = "#" + ((Math.random() * 0xffffff) << 0).toString(16);

  document.body.appendChild(el);
}

export function debounce(
  fn: (e: LeafletMouseEvent) => void,
  waitMilliseconds: number,
  immediate?: boolean
): (e: LeafletMouseEvent) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (e: LeafletMouseEvent): void {
    function later() {
      timeout = null;
      if (!immediate) fn(e);
    }
    const callNow = immediate && !timeout;
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, waitMilliseconds);
    if (callNow) fn(e);
  };
}

export function inBounds(latLng: LatLng, bounds: LatLngBounds): boolean {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return (
    ne.lat > latLng.lat &&
    latLng.lat > sw.lat &&
    ne.lng > latLng.lng &&
    latLng.lng > sw.lng
  );
}

type RGB = { r: number; g: number; b: number; a?: number };
const defaultGray: RGB = { r: 0.5, g: 0.5, b: 0.5, a: 1 };

export function hexToRgbNormalized(hex: string): RGB {
  if (
    typeof hex !== "string" ||
    !/^#?[0-9A-Fa-f]{3}$|^#?[0-9A-Fa-f]{6}$|^#?[0-9A-Fa-f]{8}$/.test(hex)
  ) {
    console.error("Invalid hex string");
    return defaultGray; // Return default gray for invalid input
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
    | RGB
    | [number, number, number]
    | [number, number, number, number],
): RGB {
  let rgb: RGB;

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
  else {
    rgb = chosenColor;
  }

  return rgb;
}


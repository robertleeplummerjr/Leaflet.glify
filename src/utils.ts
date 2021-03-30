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

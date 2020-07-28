import { LatLng, Map } from './leaflet-bindings';

export function defaults(userSettings, defaults) {
  const settings = {};

  for (const i in defaults) {
    if (!defaults.hasOwnProperty(i)) continue;
    settings[i] = (userSettings.hasOwnProperty(i) ? userSettings[i] : defaults[i]);
  }

  return settings;
}

// -- converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
// -- source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html
export function latLonToPixel(latitude, longitude) {
  const pi180 = Math.PI / 180.0,
    pi4 = Math.PI * 4,
    sinLatitude = Math.sin(latitude * pi180),
    pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi4)) * 256,
    pixelX = ((longitude + 180) / 360) * 256;

  return {x: pixelX, y: pixelY};
}

export function pointInCircle(centerPoint, checkPoint, radius) {
  const distanceSquared = (centerPoint.x - checkPoint.x) * (centerPoint.x - checkPoint.x) + (centerPoint.y - checkPoint.y) * (centerPoint.y - checkPoint.y);
  return distanceSquared <= radius * radius;
}

export function pDistance(x, y, x1, y1, x2, y2): number {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) //in case of 0 length line
    param = dot / len_sq;

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

  let dx = x - xx;
  let dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function vectorDistance(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

export function locationDistance(location1: LatLng, location2: LatLng, map: Map): number {
  const point1 = map.latLngToLayerPoint(location1)
    , point2 = map.latLngToLayerPoint(location2)
    , dx = point1.x - point2.x
    , dy = point1.y - point2.y
  ;
  return vectorDistance(dx, dy);
}

export function debugPoint(containerPoint) {
  const el = document.createElement('div')
    , s = el.style
    , x = containerPoint.x
    , y = containerPoint.y
  ;

  s.left = x + 'px';
  s.top = y + 'px';
  s.width = '10px';
  s.height = '10px';
  s.position = 'absolute';
  s.backgroundColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);

  document.body.appendChild(el);
}

export function debounce(func, wait: number, immediate: Boolean) {
  let timeout;
  return function() {
      let context = this, args = arguments;
      let later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
      };
      let callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
  };
}

export function inBounds(e, bounds) {
  let cond = ((bounds._northEast.lat > e.lat) && (e.lat > bounds._southWest.lat) &&
   (bounds._northEast.lng > e.lng) && (e.lng > bounds._southWest.lng));
  return cond;
}

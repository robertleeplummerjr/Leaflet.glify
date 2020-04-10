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
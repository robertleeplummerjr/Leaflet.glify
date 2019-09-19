function defaults(userSettings, defaults) {
  var settings = {},
    i;

  for (i in defaults) if (defaults.hasOwnProperty(i)) {
    settings[i] = (userSettings.hasOwnProperty(i) ? userSettings[i] : defaults[i]);
  }

  return settings;
}

function tryFunction(it, lookup) {
  //see if it is actually a function
  if (typeof it === 'function') return it;

  //we know that it isn't a function, but lookup[it] might be, check that here
  if (typeof lookup === 'undefined' || !lookup.hasOwnProperty(it)) return null;

  return lookup[it];
}

function flattenData(data) {
  var dim = data[0][0].length,
    result = {vertices: [], holes: [], dimensions: dim},
    holeIndex = 0;

  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++) {
      for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
    }
    if (i > 0) {
      holeIndex += data[i - 1].length;
      result.holes.push(holeIndex);
    }
  }

  return result;
}

function glslMin(src) {
  return '"' +
    src
    //remove possible pointless windows character
      .replace(/\r/g, '')
      //remove comments
      .replace(/[/][/].*\n/g, '')
      //remove line breaks
      .replace(/\n/g, '')
      //remove tabs
      .replace(/\t+/g, ' ')
      //remove big spaces
      .replace(/\s\s+|\t/g, ' ')

    + '"';
}

function pointInCircle(centerPoint, checkPoint, radius) {
  var distanceSquared = (centerPoint.x - checkPoint.x) * (centerPoint.x - checkPoint.x) + (centerPoint.y - checkPoint.y) * (centerPoint.y - checkPoint.y);
  return distanceSquared <= radius * radius;
}

module.exports = {
  defaults,
  tryFunction,
  glslMin,
  pointInCircle,
  flattenData
};
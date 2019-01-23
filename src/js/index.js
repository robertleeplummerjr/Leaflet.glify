var fs = require('fs');
var Points = require('./points');
var Shapes = require('./shapes');
var Lines = require('./lines');
var mapMatrix = require('./map-matrix');
var glify = {
  longitudeKey: 1,
  latitudeKey: 0,
  longitudeFirst: function() {
    glify.longitudeKey = 0;
    glify.latitudeKey = 1;
    return glify;
  },
  latitudeFirst: function() {
    glify.latitudeKey = 0;
    glify.longitudeKey = 1;
    return glify;
  },
  get instances() {
    return []
      .concat(Points.instances)
      .concat(Shapes.instances);
  },
  points: function(settings) {
    var extendedSettings = {
      setupClick: glify.setupClick.bind(this),
      attachShaderVars: glify.attachShaderVars.bind(this),
      latitudeKey: glify.latitudeKey,
      longitudeKey: glify.longitudeKey,
      vertexShaderSource: function() { return glify.shader.vertex; },
      fragmentShaderSource: function() { return glify.shader.fragment.point; },
      color: glify.color.random,
      closest: glify.closest.bind(this)
    };
    for (var p in settings) {
      extendedSettings[p] = settings[p];
    }
    return new Points(extendedSettings);
  },
  shapes: function(settings) {
    var extendedSettings = {
      setupClick: glify.setupClick.bind(this),
      attachShaderVars: glify.attachShaderVars.bind(this),
      latitudeKey: glify.latitudeKey,
      longitudeKey: glify.longitudeKey,
      vertexShaderSource: function() { return glify.shader.vertex; },
      fragmentShaderSource: function() { return glify.shader.fragment.polygon; },
      color: glify.color.random,
      closest: glify.closest.bind(this)
    };
    for (var p in settings) {
      extendedSettings[p] = settings[p];
    }
    return new Shapes(extendedSettings);
  },
  lines: function(settings) {
    var extendedSettings = {
      setupClick: glify.setupClick.bind(this),
      attachShaderVars: glify.attachShaderVars.bind(this),
      latitudeKey: glify.latitudeKey,
      longitudeKey: glify.longitudeKey,
      vertexShaderSource: function() { return glify.shader.vertex; },
      fragmentShaderSource: function() { return glify.shader.fragment.polygon; },
      color: glify.color.random,
      closest: glify.closest.bind(this)
    };
    for (var p in settings) {
      extendedSettings[p] = settings[p];
    }
    return new Lines(extendedSettings);
  },
  Points: Points,
  Shapes: Shapes,
  Lines: Lines,
  maps: [],
  setupClick: function(map) {
    if (this.maps.indexOf(map) < 0) {
      this.maps.push(map);
      map.on('click', function (e) {
        var hit;
        hit = Points.tryClick(e, map);
        if (hit !== undefined) return hit;

        hit = Lines.tryClick(e, map);
        if (hit !== undefined) return hit;

        hit = Shapes.tryClick(e, map);
        if (hit !== undefined) return hit;
      });
    }
  },
  pointInCircle: function (centerPoint, checkPoint, radius) {
    var distanceSquared = (centerPoint.x - checkPoint.x) * (centerPoint.x - checkPoint.x) + (centerPoint.y - checkPoint.y) * (centerPoint.y - checkPoint.y);
    return distanceSquared <= radius * radius;
  },
  attachShaderVars: function(size, gl, program, attributes) {
    var name,
        loc,
        attribute,
        bytes = 5;

    for (name in attributes) if (attributes.hasOwnProperty(name)) {
      attribute = attributes[name];
      loc = gl.getAttribLocation(program, name);
      if (loc < 0) {
        console.log(name, attribute);
        throw new Error('shader variable ' + name + ' not found');
      }
      gl.vertexAttribPointer(loc, attribute.size, gl[attribute.type], false, size * (attribute.bytes || bytes), size * attribute.start);
      gl.enableVertexAttribArray(loc);
    }

    return this;
  },
  debugPoint: function (containerPoint) {
    var el = document.createElement('div'),
        s = el.style,
        x = containerPoint.x,
        y = containerPoint.y;

    s.left = x + 'px';
    s.top = y + 'px';
    s.width = '10px';
    s.height = '10px';
    s.position = 'absolute';
    s.backgroundColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);

    document.body.appendChild(el);

    return this;
  },
  /**
   *
   * @param targetLocation
   * @param points
   * @param map
   * @returns {*}
   */
  closest: function (targetLocation, points, map) {
    var self = this;
    if (points.length < 1) return null;
    return points.reduce(function (prev, curr) {
      var prevDistance = self.locationDistance(targetLocation, prev, map),
          currDistance = self.locationDistance(targetLocation, curr, map);
      return (prevDistance < currDistance) ? prev : curr;
    });
  },
  vectorDistance: function (dx, dy) {
    return Math.sqrt(dx * dx + dy * dy);
  },
  locationDistance: function (location1, location2, map) {
    var point1 = map.latLngToLayerPoint(location1),
        point2 = map.latLngToLayerPoint(location2),

        dx = point1.x - point2.x,
        dy = point1.y - point2.y;

    return this.vectorDistance(dx, dy);
  },
  color: {
    fromHex: function(hex) {
      if (hex.length < 6) return null;
      hex = hex.toLowerCase();

      if (hex[0] === '#') {
        hex = hex.substring(1, hex.length);
      }
      var r = parseInt(hex[0] + hex[1], 16),
        g = parseInt(hex[2] + hex[3], 16),
        b = parseInt(hex[4] + hex[5], 16);

      return {r: r / 255, g: g / 255, b: b / 255};
    },
    green: {r: 0, g: 1, b: 0},
    red: {r: 1, g: 0, b: 0},
    blue: {r: 0, g: 0, b: 1},
    teal: {r: 0, g: 1, b: 1},
    yellow: {r: 1, g: 1, b: 0},

    white: {r: 1, g: 1, b: 1},
    black: {r: 0, g: 0, b: 0},

    gray: {r: 0.5, g: 0.5, b: 0.5},

    get grey() {
      return glify.color.gray;
    },
    random: function () {
      return {
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
      };
    },
    pallet: function () {
      switch (Math.round(Math.random() * 4)) {
        case 0:
          return glify.color.green;
        case 1:
          return glify.color.red;
        case 2:
          return glify.color.blue;
        case 3:
          return glify.color.teal;
        case 4:
          return glify.color.yellow;
      }
    }
  },
  mapMatrix: mapMatrix,
  shader: {
    vertex: fs.readFileSync(__dirname + '/../shader/vertex/default.glsl'),
    fragment: {
      dot: fs.readFileSync(__dirname + '/../shader/fragment/dot.glsl'),
      point: fs.readFileSync(__dirname + '/../shader/fragment/point.glsl'),
      puck: fs.readFileSync(__dirname + '/../shader/fragment/puck.glsl'),
      simpleCircle: fs.readFileSync(__dirname + '/../shader/fragment/simple-circle.glsl'),
      square: fs.readFileSync(__dirname + '/../shader/fragment/square.glsl'),
      polygon: fs.readFileSync(__dirname + '/../shader/fragment/polygon.glsl')
    }
  }
};

module.exports = glify;
if (typeof window !== 'undefined' && window.L) {
  window.L.glify = glify;
}
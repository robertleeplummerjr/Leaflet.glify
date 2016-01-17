//top-message

(function(window, document, L, undefined) {

  function defaults(userSettings, defaults) {
    var settings = {},
      i;

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      settings[i] = (userSettings.hasOwnProperty(i) ? userSettings[i] : defaults[i]);
    }

    return settings;
  }

  L.glify = {
    get instances() {
      return []
        .concat(L.glify.Points.instances)
        .concat(L.glify.Shapes.instances);
    },
    points: function(settings) {
      return new this.Points(settings);
    },
    shapes: function(settings) {
      return new this.Shapes(settings);
    },
    flattenData: function (data) {
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
    },
    // -- converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
    // -- source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html
    latLonToPixel: function (latitude, longitude) {
      var pi180 = Math.PI / 180.0,
        pi4 = Math.PI * 4,
        sinLatitude = Math.sin(latitude * pi180),
        pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi4)) * 256,
        pixelX = ((longitude + 180) / 360) * 256;

      return {x: pixelX, y: pixelY};
    },
    Points: null,
    Shapes: null,
    maps: [],
    setupClick: function(map) {
      if (this.maps.indexOf(map) < 0) {
        this.maps.push(map);
        map.on('click', function (e) {
          var hit;
          hit = L.glify.Points.tryClick(e, map);
          if (typeof hit !== 'undefined') return hit;

          //todo: handle lines

          hit = L.glify.Shapes.tryClick(e, map);
          if (typeof hit !== 'undefined') return hit;
        });
      }
    },
    pointInCircle: function (centerPoint, checkPoint, radius) {
      var distanceSquared = (centerPoint.x - checkPoint.x) * (centerPoint.x - checkPoint.x) + (centerPoint.y - checkPoint.y) * (centerPoint.y - checkPoint.y);
      return distanceSquared <= radius * radius;
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
        return L.glify.color.gray;
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
            return L.glify.color.green;
          case 1:
            return L.glify.color.red;
          case 2:
            return L.glify.color.blue;
          case 3:
            return L.glify.color.teal;
          case 4:
            return L.glify.color.yellow;
        }
      }
    },
    mapMatrix: null,
    shader: {
      vertex: null,
      fragment: {
        dot: null,
        point: null,
        simpleCircle: null,
        square: null,
        polygon: null
      }
    }
  };
})(window, document, L);

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
    // -- converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
    // -- source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html
    latLonToPixelXY: function (latitude, longitude) {
      var pi_180 = Math.PI / 180.0,
        pi_4 = Math.PI * 4,
        sinLatitude = Math.sin(latitude * pi_180),
        pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256,
        pixelX = ((longitude + 180) / 360) * 256;

      return {x: pixelX, y: pixelY};
    },
    Points: null,
    Shapes: null,
    color: {
      fromHex: function(hex) {
        if (hex.length < 6) return null;

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
        polygon: null
      }
    }
  };


  //node-dependencies

})(window, document, L);
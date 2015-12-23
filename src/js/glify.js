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
    points: function(settings) {
      return new this.Points(settings);
    },
    shapes: function(settings) {
      return new this.Shapes(settings);
    },
    Points: null,
    Shapes: null,
    shader: {
      vertex: null,
      fragment: {
        dot: null,
        polygon: null
      }
    }
  };
})(window, document, L);
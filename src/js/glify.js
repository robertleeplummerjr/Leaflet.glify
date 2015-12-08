(function(window, document, L, undefined) {

  function defaults(userSettings, defaults) {
    var settings = {},
      i;

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      settings[i] = (userSettings.hasOwnProperty(i) ? userSettings[i] : defaults[i]);
    }

    return settings;
  }

  var glify = {
    points: function(settings) {
      return new L.glify.Points(settings);
    },
    shapes: function() {
      return new L.glify.Shapes(settings);
    },
    defaultShaders: {
      vertex: null,
      fragment: {
        dot: null,
        polygon: null
      }
    }
  };

  //injection

  L.glify = glify;
})(window, document, L);
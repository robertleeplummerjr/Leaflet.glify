var L = typeof window !== 'undefined' ? window.L : require('leaflet');
var utils = require('./utils');
var mapMatrix = require('./map-matrix');
var canvasOverlay = require('./canvasoverlay').canvasOverlay;

var Lines = function Lines(settings) {
    Lines.instances.push(this);
  this.settings = utils.defaults(settings, Lines.defaults);

  if (!settings.data) throw new Error('no "data" array setting defined');
  if (!settings.map) throw new Error('no leaflet "map" object setting defined');

  this.active = true;

  var self = this,
    glLayer = this.glLayer = canvasOverlay(function() {
        self.drawOnCanvas();
      })
      .addTo(settings.map),
    canvas = this.canvas = glLayer.canvas;

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  canvas.style.position = 'absolute';
  if (settings.className) {
    canvas.className += ' ' + settings.className;
  }

  this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  this.pixelsToWebGLMatrix = new Float32Array(16);
  this.mapMatrix = mapMatrix();
  this.vertexShader = null;
  this.fragmentShader = null;
  this.program = null;
  this.matrix = null;
  this.verts = null;
  this.latLngLookup = null;

  this
    .setup()
    .render();
};

Lines.defaults = {
  map: null,
  data: [],
  longitudeKey: null,
  latitudeKey: null,
  attachShaderVars: null,
  setupClick: null,
  vertexShaderSource: null,
  fragmentShaderSource: null,
  click: null,
  color: 'random',
  className: '',
  opacity: 0.5,
  shaderVars: {
    color: {
      type: 'FLOAT',
      start: 2,
      size: 3
    }
  }
};

//statics
Lines.instances = [];

Lines.prototype = {
  maps: [],
  /**
   *
   * @returns {Lines}
   */
  setup: function () {
    var settings = this.settings;
    if (settings.click) {
      settings.setupClick(settings.map);
    }

    return this
      .setupVertexShader()
      .setupFragmentShader()
      .setupProgram();
  },
  /**
   *
   * @returns {Lines}
   */
  render: function () {
    this.resetVertices();

    var pixelsToWebGLMatrix = this.pixelsToWebGLMatrix,
      settings = this.settings,
      canvas = this.canvas,
      gl = this.gl,
      glLayer = this.glLayer,
      verts = this.verts,
      vertexBuffer = gl.createBuffer(),
      program = this.program,
      vertex = gl.getAttribLocation(program, 'vertex'),
      opacity = gl.getUniformLocation(program, 'opacity');

    gl.uniform1f(opacity, this.settings.opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    /*
    Transforming lines according to the rule:
    1. Take one line (single feature)
    [[0,0],[1,1],[2,2]]
    2. Split the line in segments, duplicating all coordinates except first and last one
    [[0,0],[1,1],[2,2]] => [[0,0],[1,1],[1,1],[2,2]]
    3. Do this for all lines and put all coordinates in array
    */
    var size = 0;
    var allVertices = [];
    verts.map(function (vertices) {
      var verticesDuplicated = [];
      for (var i = 0; i < vertices.length / 5; i++) {
        if (i !== 0 && i !== (vertices.length / 5 - 1)) {
          verticesDuplicated.push(vertices[i * 5], vertices[i * 5 + 1], vertices[i * 5 + 2], vertices[i * 5 + 3], vertices[i * 5 + 4]);
        }

        verticesDuplicated.push(vertices[i * 5], vertices[i * 5 + 1], vertices[i * 5 + 2], vertices[i * 5 + 3], vertices[i * 5 + 4]);
      }

      allVertices = allVertices.concat(verticesDuplicated); 
    });

    this.verts = allVertices;

    var vertArray = new Float32Array(allVertices);
    size = vertArray.BYTES_PER_ELEMENT;
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, size * 5, 0);
    gl.enableVertexAttribArray(vertex);

    //  gl.disable(gl.DEPTH_TEST);
    // ----------------------------
    // look up the locations for the inputs to our shaders.
    this.matrix = gl.getUniformLocation(program, 'matrix');
    gl.aPointSize = gl.getAttribLocation(program, 'pointSize');

    // Set the matrix to some that makes 1 unit 1 pixel.
    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.uniformMatrix4fv(this.matrix, false, pixelsToWebGLMatrix);

    if (settings.shaderVars !== null) {
      settings.attachShaderVars(size, gl, program, settings.shaderVars);
    }

    glLayer.redraw();

    return this;
  },

  /**
   *
   * @returns {Lines}
   */
  resetVertices: function () {
    this.verts = [];

    var pixel,
      verts = this.verts,
      settings = this.settings,
      data = settings.data,
      features = data.features,
      feature,
      colorFn,
      color = settings.color,
      latitudeKey = settings.latitudeKey,
      longitudeKey = settings.longitudeKey,
      featureIndex = 0,
      featureMax = features.length,
      i;

    if (color === null) {
      throw new Error('color is not properly defined');
    } else if (typeof color === 'function') {
      colorFn = color;
      color = undefined;
    }

    // -- data
    for (; featureIndex < featureMax; featureIndex++) {
      feature = features[featureIndex];
      var featureVerts = [];

      //use colorFn function here if it exists
      if (colorFn) {
        color = colorFn(featureIndex, feature);
      }

      for (i = 0; i < feature.geometry.coordinates.length; i++) {
        pixel = utils.latLonToPixel(feature.geometry.coordinates[i][latitudeKey], feature.geometry.coordinates[i][longitudeKey]);
        featureVerts.push(pixel.x, pixel.y, color.r, color.g, color.b);
      }

      verts.push(featureVerts);
    }

    return this;
  },
  /**
   *
   * @returns {Lines}
   */
  setupVertexShader: function () {
    var gl = this.gl,
      settings = this.settings,
      vertexShaderSource = typeof settings.vertexShaderSource === 'function' ? settings.vertexShaderSource() : settings.vertexShaderSource,
      vertexShader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    this.vertexShader = vertexShader;

    return this;
  },

  /**
   *
   * @returns {Lines}
   */
  setupFragmentShader: function () {
    var gl = this.gl,
      settings = this.settings,
      fragmentShaderSource = typeof settings.fragmentShaderSource === 'function' ? settings.fragmentShaderSource() : settings.fragmentShaderSource,
      fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    this.fragmentShader = fragmentShader;

    return this;
  },

  /**
   *
   * @returns {Lines}
   */
  setupProgram: function () {
    // link shaders to create our program
    var gl = this.gl,
      program = gl.createProgram();

    gl.attachShader(program, this.vertexShader);
    gl.attachShader(program, this.fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    this.program = program;

    return this;
  },

  /**
   *
   * @return Lines
   */
  drawOnCanvas: function () {
    if (this.gl == null) return this;

    var gl = this.gl,
      settings = this.settings,
      canvas = this.canvas,
      map = settings.map,
      pointSize = Math.max(map.getZoom() - 4.0, 4.0),
      bounds = map.getBounds(),
      topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest()),
    // -- Scale to current zoom
      scale = Math.pow(2, map.getZoom()),
      offset = utils.latLonToPixel(topLeft.lat, topLeft.lng),
      mapMatrix = this.mapMatrix,
      pixelsToWebGLMatrix = this.pixelsToWebGLMatrix;

    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);

    // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix
      .set(pixelsToWebGLMatrix)
      .scaleMatrix(scale)
      .translateMatrix(-offset.x, -offset.y);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.vertexAttrib1f(gl.aPointSize, pointSize);
    // -- attach matrix value to 'mapMatrix' uniform in shader
    gl.uniformMatrix4fv(this.matrix, false, mapMatrix);

    gl.drawArrays(gl.LINES, 0, this.verts.length / 5);

    return this;
  },

  /**
   *
   * @param {L.Map} [map]
   * @returns {Lines}
   */
  addTo: function(map) {
    this.glLayer.addTo(map || this.settings.map);
    this.active = true;
    return this.render();
  },

  /**
   *
   * @returns {Lines}
   */
  remove: function() {
    this.settings.map.removeLayer(this.glLayer);
    this.active = false;
    return this;
  }
};

Lines.tryClick = function(e, map) {
  function pDistance(x, y, x1, y1, x2, y2) {
    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    }
    else if (param > 1) {
      xx = x2;
      yy = y2;
    }
    else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  var foundFeature = false;
  var instance = false;
  var record = 0.1;
  var settings;
  Lines.instances.forEach(function (_instance) {
    settings = _instance.settings;
    if (!_instance.active) return;
    if (settings.map !== map) return;
    if (!settings.click) return;

    settings.data.features.map(feature => {
      for (var i = 1; i < feature.geometry.coordinates.length; i++) {
        var distance = pDistance(e.latlng.lng, e.latlng.lat,
          feature.geometry.coordinates[i - 1][0], feature.geometry.coordinates[i - 1][1],
          feature.geometry.coordinates[i][0], feature.geometry.coordinates[i][1]);
        if (distance < record) {
          record = distance;
          foundFeature = feature;
          instance = _instance;
        }
      }
    });
  });

  if (instance) {
    instance.settings.click(e, foundFeature);
  } else {
    return false;
  }
};

module.exports = Lines;
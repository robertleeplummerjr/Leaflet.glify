var L = typeof window !== 'undefined' ? window.L : require('leaflet');
var earcut = require('earcut');
var PolygonLookup = require('polygon-lookup');
var utils = require('./utils');
var mapMatrix = require('./map-matrix');
var canvasOverlay = require('./canvasoverlay').canvasOverlay;

var Shapes = function Shapes(settings) {
  Shapes.instances.push(this);
  this.settings = utils.defaults(settings, Shapes.defaults);

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
  this.polygonLookup = null;

  this
    .setup()
    .render();
};

Shapes.defaults = {
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
Shapes.instances = [];

Shapes.prototype = {
  maps: [],
  /**
   *
   * @returns {Shapes}
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
   * @returns {Shapes}
   */
  render: function () {
    this.resetVertices();
    // triangles or point count

    var pixelsToWebGLMatrix = this.pixelsToWebGLMatrix,
      settings = this.settings,
      canvas = this.canvas,
      gl = this.gl,
      glLayer = this.glLayer,
      start = new Date(),
      verts = this.verts,
      numPoints = verts.length / 5,
      vertexBuffer = gl.createBuffer(),
      vertArray = new Float32Array(verts),
      size = vertArray.BYTES_PER_ELEMENT,
      program = this.program,
      vertex = gl.getAttribLocation(program, 'vertex'),
      opacity = gl.getUniformLocation(program, 'opacity');
    gl.uniform1f(opacity, this.settings.opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
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
   * @returns {Shapes}
   */
  resetVertices: function () {
    this.verts = [];
    this.polygonLookup = new PolygonLookup();

    var pixel,
      verts = this.verts,
      polygonLookup = this.polygonLookup,
      index,
      settings = this.settings,
      data = settings.data,
      features = data.features,
      feature,
      colorFn,
      color = settings.color,
      featureIndex = 0,
      featureMax = features.length,
      triangles,
      indices,
      flat,
      dim,
      iMax,
      i;

    polygonLookup.loadFeatureCollection(data);

    if (color === null) {
      throw new Error('color is not properly defined');
    } else if (typeof color === 'function') {
      colorFn = color;
      color = undefined;
    }

    // -- data
    for (; featureIndex < featureMax; featureIndex++) {
      feature = features[featureIndex];
      //***
      triangles = [];

      //use colorFn function here if it exists
      if (colorFn) {
        color = colorFn(featureIndex, feature);
      }

      flat = utils.flattenData(feature.geometry.coordinates);

      indices = earcut(flat.vertices, flat.holes, flat.dimensions);

      dim = feature.geometry.coordinates[0][0].length;
      for (i = 0, iMax = indices.length; i < iMax; i++) {
        index = indices[i];
        triangles.push(flat.vertices[index * dim + settings.longitudeKey], flat.vertices[index * dim + settings.latitudeKey]);
      }

      for (i = 0, iMax = triangles.length; i < iMax; i) {
        pixel = utils.latLonToPixel(triangles[i++],triangles[i++]);
        verts.push(pixel.x, pixel.y, color.r, color.g, color.b);
      }
    }

    return this;
  },
  /**
   *
   * @returns {Shapes}
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
   * @returns {Shapes}
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
   * @returns {Shapes}
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
   * @return Shapes
   */
  drawOnCanvas: function () {
    if (this.gl == null) return this;

    var gl = this.gl,
      settings = this.settings,
      canvas = this.canvas,
      map = settings.map,
      pointSize = Math.max(map.getZoom() - 4.0, 1.0),
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
    gl.drawArrays(gl.TRIANGLES, 0, this.verts.length / 5);

    return this;
  },

  /**
   *
   * @param {L.Map} [map]
   * @returns {Shapes}
   */
  addTo: function(map) {
    this.glLayer.addTo(map || this.settings.map);
    this.active = true;
    return this.render();
  },

  /**
   *
   * @returns {Shapes}
   */
  remove: function() {
    this.settings.map.removeLayer(this.glLayer);
    this.active = false;
    return this;
  }
};

Shapes.tryClick = function(e, map) {
  var result,
      settings,
      feature;

  Shapes.instances.forEach(function (_instance) {
    settings = _instance.settings;
    if (!_instance.active) return;
    if (settings.map !== map) return;
    if (!settings.click) return;

    feature = _instance.polygonLookup.search(e.latlng.lng, e.latlng.lat);
    if (feature !== undefined) {
      result = settings.click(e, feature);
    }
  });

  return result !== undefined ? result : true;
};

module.exports = Shapes;
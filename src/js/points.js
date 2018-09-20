var utils = require('./utils');
var L = typeof window !== 'undefined' ? window.L : require('leaflet');
var mapMatrix = require('./map-matrix');
var canvasOverlay = require('./canvasoverlay').canvasOverlay;

/**
   *
   * @param settings
   * @constructor
   */
var Points = function Points(settings) {
  Points.instances.push(this);
  this.settings = utils.defaults(settings, Points.defaults);

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

Points.defaults = {
  map: null,
  data: [],
  longitudeKey: null,
  latitudeKey: null,
  closest: null,
  attachShaderVars: null,
  setupClick: null,
  vertexShaderSource: null,
  fragmentShaderSource: null,
  eachVertex: null,
  click: null,
  color: 'random',
  opacity: 0.8,
  size: null,
  className: '',
  sensitivity: 2,
  shaderVars: {
    color: {
      type: 'FLOAT',
      start: 2,
      size: 3
    }
  }
};

//statics
Points.instances = [];

Points.prototype = {
  maps: [],
  /**
   *
   * @returns {Points}
   */
  setup: function () {
    var settings = this.settings;
    if (settings.click) {
      this.settings.setupClick(settings.map);
    }

    return this
      .setupVertexShader()
      .setupFragmentShader()
      .setupProgram();
  },

  /**
   *
   * @returns {Points}
   */
  render: function () {

    this.resetVertices();

    //look up the locations for the inputs to our shaders.
    var gl = this.gl,
      settings = this.settings,
      canvas = this.canvas,
      program = this.program,
      glLayer = this.glLayer,
      matrix = this.matrix = gl.getUniformLocation(program, 'matrix'),
      opacity = gl.getUniformLocation(program, 'opacity'),
      vertex = gl.getAttribLocation(program, 'vertex'),
      vertexBuffer = gl.createBuffer(),
      vertexArray = new Float32Array(this.verts),
      size = vertexArray.BYTES_PER_ELEMENT;

    gl.pointSize = gl.getAttribLocation(program, 'pointSize');

    //set the matrix to some that makes 1 unit 1 pixel.
    this.pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(matrix, false, this.pixelsToWebGLMatrix);
    gl.uniform1f(opacity, this.settings.opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, size * 5, 0);
    gl.enableVertexAttribArray(vertex);

    if (settings.shaderVars !== null) {
      this.settings.attachShaderVars(size, gl, program, settings.shaderVars);
    }

    glLayer.redraw();

    return this;
  },
  resetVertices: function () {
    //empty verts and repopulate
    this.latLngLookup = {};
    this.verts = [];

    // -- data
    var verts = this.verts,
      settings = this.settings,
      data = settings.data,
      colorFn,
      color = settings.color,
      i = 0,
      max = data.length,
      latLngLookup = this.latLngLookup,
      latitudeKey = settings.latitudeKey,
      longitudeKey = settings.longitudeKey,
      latLng,
      pixel,
      lookup,
      key;

    if (color === null) {
      throw new Error('color is not properly defined');
    } else if (typeof color === 'function') {
      colorFn = color;
      color = undefined;
    }

    for(; i < max; i++) {
      latLng = data[i];
      key = latLng[latitudeKey].toFixed(2) + 'x' + latLng[longitudeKey].toFixed(2);
      lookup = latLngLookup[key];
      pixel = utils.latLonToPixel(latLng[latitudeKey], latLng[longitudeKey]);

      if (lookup === undefined) {
        lookup = latLngLookup[key] = [];
      }

      lookup.push(latLng);

      if (colorFn) {
        color = colorFn(i, latLng);
      }

      //-- 2 coord, 3 rgb colors interleaved buffer
      verts.push(pixel.x, pixel.y, color.r, color.g, color.b);
      if (settings.eachVertex !== null) {
        settings.eachVertex.call(this, latLng, pixel, color);
      }
    }

    return this;
  },
  /**
   *
   * @param data
   * @returns {Points}
   */
  setData: function (data) {
    this.settings.data = data;
    return this;
  },

  /**
   *
   * @returns {Points}
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
   * @returns {Points}
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
   * @returns {Points}
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

  pointSize: function() {
    var settings = this.settings,
      map = settings.map,
      pointSize = settings.size,
      // -- Scale to current zoom
      zoom = map.getZoom();

    return pointSize === null ? Math.max(zoom - 4.0, 1.0) : pointSize
  },

  /**
   *
   * @returns {Points}
   */
  drawOnCanvas: function () {
    if (this.gl == null) return this;

    var gl = this.gl,
      canvas = this.canvas,
      settings = this.settings,
      map = settings.map,
      bounds = map.getBounds(),
      topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest()),
      offset = utils.latLonToPixel(topLeft.lat, topLeft.lng),
      zoom = map.getZoom(),
      scale = Math.pow(2, zoom),
      mapMatrix = this.mapMatrix,
      pixelsToWebGLMatrix = this.pixelsToWebGLMatrix;

    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);

    //set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix
      .set(pixelsToWebGLMatrix)
      .scaleMatrix(scale)
      .translateMatrix(-offset.x, -offset.y);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.vertexAttrib1f(gl.pointSize, this.pointSize());
    // -- attach matrix value to 'mapMatrix' uniform in shader
    gl.uniformMatrix4fv(this.matrix, false, mapMatrix);
    gl.drawArrays(gl.POINTS, 0, settings.data.length);

    return this;
  },

  /**
   *
   * @param map
   * @returns {Points}
   */
  addTo: function (map) {
    this.glLayer.addTo(map || this.settings.map);
    this.active = true;
    return this.render();
  },

  /**
   * Iterates through a small area around the
   * @param {L.LatLng} coords
   * @returns {*}
   */
  lookup: function (coords) {
    var x = coords.lat - 0.03,
      y,

      xMax = coords.lat + 0.03,
      yMax = coords.lng + 0.03,

      foundI,
      foundMax,

      matches = [],
      found,
      key;

    for (; x <= xMax; x += 0.01) {
      y = coords.lng - 0.03;
      for (; y <= yMax; y += 0.01) {
        key = x.toFixed(2) + 'x' + y.toFixed(2);
        found = this.latLngLookup[key];
        if (found) {
          foundI = 0;
          foundMax = found.length;
          for (; foundI < foundMax; foundI++) {
            matches.push(found[foundI]);
          }
        }
      }
    }

    //try matches first, if it is empty, try the data, and hope it isn't too big
    return this.settings.closest(coords, matches.length === 0 ? this.settings.data.slice(0) : matches, this.settings.map);
  },
  remove: function() {
    this.settings.map.removeLayer(this.glLayer);
    this.active = false;
    return this;
  }
};

Points.tryClick = function(e, map) {
  var result,
      settings,
      instance,
      closestFromEach = [],
      instancesLookup = {},
      point,
      xy,
      found,
      latLng;

  Points.instances.forEach(function (_instance) {
    settings = _instance.settings;
    if (!_instance.active) return;
    if (settings.map !== map) return;
    if (!settings.click) return;

    point = _instance.lookup(e.latlng);
    instancesLookup[point] = _instance;
    closestFromEach.push(point);
  });

  if (closestFromEach.length < 1) return;
  if (!settings) return;

  found = settings.closest(e.latlng, closestFromEach, map);

  if (found === null) return;

  instance = instancesLookup[found];
  if (!instance) return;

  latLng = L.latLng(found[settings.latitudeKey], found[settings.longitudeKey]);
  xy = map.latLngToLayerPoint(latLng);

  if (utils.pointInCircle(xy, e.layerPoint, instance.pointSize() * instance.settings.sensitivity)) {
    result = instance.settings.click(e, found, xy);
    return result !== undefined ? result : true;
  }
};

module.exports = Points;
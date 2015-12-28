//this file was auto generated, any edits to it will be lost when you run `node build.js`

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
    Points: (function () {
  /**
   *
   * @param settings
   * @constructor
   */
  function Points(settings) {
    this.instances.push(this);
    this.settings = defaults(settings, Points.defaults);

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');

    var self = this,
      glLayer = this.glLayer = L.canvasOverlay()
        .drawing(function (params) {
          self.drawOnCanvas(params);
        })
        .addTo(settings.map),
      canvas = this.canvas = glLayer.canvas();

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.position = 'absolute';
    canvas.className = settings.className;

    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    this.pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = L.glify.mapMatrix();
    this.vertexShader = null;
    this.fragmentShader = null;
    this.program = null;
    this.uMatrix = null;
    this.verts = null;
    this.latLngLookup = null;

    this
      .setup()
      .render();
  }

  Points.defaults = {
    map: null,
    data: [],
    debug: false,
    vertexShaderSource: function() { return L.glify.shader.vertex; },
    fragmentShaderSource: function() { return L.glify.shader.fragment.dot; },
    pointThreshold: 10,
    click: null,
    color: 'random',
    opacity: 0.6,
    size: null,
    className: '',
    sensitivity: 2
  };


  Points.prototype = {
    instances: [],
    maps: [],
    /**
     *
     * @returns {Points}
     */
    setup: function () {
      var self = this,
        settings = this.settings,
        map = settings.map,
        xy,
        point,
        latLng;

      if (settings.click) {
        if (this.maps.indexOf(settings.map) < 0) {
          this.maps.push(map);
          map.on('click', function (e) {
            point = self.closest(e.latlng, self.instances.map(function(instance) {
              return instance.lookup(e.latlng);
            }));

            if (point !== null) {
              latLng = L.latLng(point[0], point[1]);
              xy = map.latLngToLayerPoint(latLng);
              if (self.pointInCircle(xy, e.layerPoint, self.pointSize() * settings.sensitivity)) {
                settings.click(point, {
                  latLng: latLng,
                  xy: xy
                }, e);
              }
            }

            if (settings.debug) {
              self.debugPoint(e.containerPoint);
            }
          });
        }
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
        canvas = this.canvas,
        program = this.program,
        glLayer = this.glLayer,
        uMatrix = this.uMatrix = gl.getUniformLocation(program, 'uMatrix'),
        opacity = gl.getUniformLocation(program, 'opacity'),
        colorLocation = gl.getAttribLocation(program, 'aColor'),
        vertexLocation = gl.getAttribLocation(program, 'aVertex'),
        vertexBuffer = gl.createBuffer(),
        vertexArray = new Float32Array(this.verts),
        fsize = vertexArray.BYTES_PER_ELEMENT;

      gl.aPointSize = gl.getAttribLocation(program, 'aPointSize');

      //set the matrix to some that makes 1 unit 1 pixel.
      this.pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniformMatrix4fv(uMatrix, false, this.pixelsToWebGLMatrix);
      gl.uniform1f(opacity, this.settings.opacity);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
      gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, fsize * 5, 0);
      gl.enableVertexAttribArray(vertexLocation);

      //offset for color buffer
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, fsize * 5, fsize * 2);
      gl.enableVertexAttribArray(colorLocation);

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
        colorKey = settings.color,
        colorFn = null,
        color,
        i = 0,
        max = data.length,
        latLngLookup = this.latLngLookup,
        latLng,
        pixel,
        lookup,
        key;

      //see if colorKey is actually a function
      if (typeof colorKey === 'function') {
        colorFn = colorKey;
      }
      //we know that colorKey isn't a function, but L.glify.color[key] might be, check that here
      else {
        color = L.glify.color[colorKey];

        if (typeof color === 'function') {
          colorFn = color;
        }
      }

      for(; i < max; i++) {
        latLng = data[i];
        key = latLng[0].toFixed(2) + 'x' + latLng[1].toFixed(2);
        lookup = latLngLookup[key];
        pixel = this.latLngToPixelXY(latLng[0], latLng[1]);

        if (lookup === undefined) {
          lookup = latLngLookup[key] = [];
        }

        lookup.push(latLng);

        //use colorFn function here if it exists
        if (colorFn) {
          color = colorFn();
        }

        //-- 2 coord, 3 rgb colors interleaved buffer
        verts.push(pixel.x, pixel.y, color.r, color.g, color.b);
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
     * @param params
     * @returns {Points}
     */
    drawOnCanvas: function (params) {
      if (this.gl == null) return this;

      var gl = this.gl,
        canvas = this.canvas,
        settings = this.settings,
        map = settings.map,
        bounds = map.getBounds(),
        topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest()),
        offset = this.latLngToPixelXY(topLeft.lat, topLeft.lng),
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
      gl.vertexAttrib1f(gl.aPointSize, this.pointSize());
      // -- attach matrix value to 'mapMatrix' uniform in shader
      gl.uniformMatrix4fv(this.uMatrix, false, mapMatrix);
      gl.drawArrays(gl.POINTS, 0, settings.data.length);

      return this;
    },

    /**
     * converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
     * source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html
     * @param latitude
     * @param longitude
     * @returns {{x: number, y: number}}
     */
    latLngToPixelXY: function (latitude, longitude) {
      var pi180 = Math.PI / 180.0,
        pi4 = Math.PI * 4,
        sinLatitude = Math.sin(latitude * pi180),
        pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi4)) * 256,
        pixelX = ((longitude + 180) / 360) * 256;

      return {
        x: pixelX,
        y: pixelY
      };
    },

    /**
     *
     * @param map
     * @returns {Points}
     */
    addTo: function (map) {
      this.glLayer.addTo(map);

      return this;
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
      return this.closest(coords, matches.length === 0 ? this.settings.data.slice(0) : matches);
    },

    /**
     *
     * @param targetLocation
     * @param points
     * @returns {*}
     */
    closest: function (targetLocation, points) {
      var self = this;
      return points.reduce(function (prev, curr) {
        var prevDistance = self.locationDistance(targetLocation, prev),
          currDistance = self.locationDistance(targetLocation, curr);
        return (prevDistance < currDistance) ? prev : curr;
      });
    },
    pointInCircle: function (centerPoint, checkPoint, radius) {
      var distanceSquared = (centerPoint.x - checkPoint.x) * (centerPoint.x - checkPoint.x) + (centerPoint.y - checkPoint.y) * (centerPoint.y - checkPoint.y);
      return distanceSquared <= radius * radius;
    },
    vectorDistance: function (dx, dy) {
      return Math.sqrt(dx * dx + dy * dy);
    },
    locationDistance: function (location1, location2) {
      var settings = this.settings,
        map = settings.map,
        point1 = map.latLngToLayerPoint(location1),
        point2 = map.latLngToLayerPoint(location2),

        dx = point1.x - point2.x,
        dy = point1.y - point2.y;

      return this.vectorDistance(dx, dy);
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
    }
  };

  return Points;
})(),
    Shapes: (function () {
  function Shapes(settings) {
    this.instances.push(this);
    this.settings = defaults(settings, Shapes.defaults);

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');

    var self = this,
      glLayer = this.glLayer = L.canvasOverlay()
        .drawing(function (params) {
          self.drawOnCanvas(params);
        })
        .addTo(settings.map),
      canvas = this.canvas = glLayer.canvas();

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.position = 'absolute';
    canvas.className = settings.className;

    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    this.pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = L.glify.mapMatrix();
    this.vertexShader = null;
    this.fragmentShader = null;
    this.program = null;
    this.uMatrix = null;
    this.verts = null;
    this.latLngLookup = null;

    this
      .setup()
      .render();
  }

  Shapes.defaults = {
    map: null,
    data: [],
    debug: false,
    vertexShaderSource: function() { return L.glify.shader.vertex; },
    fragmentShaderSource: function() { return L.glify.shader.fragment.polygon; },
    pointThreshold: 10,
    clickShape: null,
    color: 'red'
  };

  Shapes.prototype = {
    instances: [],
    setup: function () {

      return this
        .setupVertexShader()
        .setupFragmentShader()
        .setupProgram();
    },
    render: function () {
      this.resetVertices();
      // triangles or point count

      var pixelsToWebGLMatrix = this.pixelsToWebGLMatrix,
        canvas = this.canvas,
        gl = this.gl,
        glLayer = this.glLayer,
        start = new Date(),
        verts = this.verts,
        numPoints = verts.length / 5,
        vertexBuffer = gl.createBuffer(),
        vertArray = new Float32Array(verts),
        fsize = vertArray.BYTES_PER_ELEMENT,
        program = this.program,
        vertLoc = gl.getAttribLocation(program, "aVertex"),

      // -- offset for color buffer
        colorLoc = gl.getAttribLocation(program, "aColor");

      console.log("updated at  " + new Date().setTime(new Date().getTime() - start.getTime()) + " ms ");

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
      gl.vertexAttribPointer(vertLoc, 2, gl.FLOAT, false, fsize * 5, 0);
      gl.enableVertexAttribArray(vertLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, fsize * 5, fsize * 2);
      gl.enableVertexAttribArray(colorLoc);

      //  gl.disable(gl.DEPTH_TEST);
      // ----------------------------
      // look up the locations for the inputs to our shaders.
      this.uMatrix = gl.getUniformLocation(program, "uMatrix");
      gl.aPointSize = gl.getAttribLocation(program, "aPointSize");

      // Set the matrix to some that makes 1 unit 1 pixel.
      pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.uniformMatrix4fv(this.uMatrix, false, pixelsToWebGLMatrix);

      glLayer.redraw();

      return this;
    },
    resetVertices: function () {
      this.verts = [];

      var pixel,
        verts = this.verts,
        rawVerts = [],
      //-- verts only
        settings = this.settings,
        data = settings.data,
        features = data.features,
        feature,
        currentColor,
        featureIndex = 0,
        featureMax = features.length,
        triangle,
        triangles,
        coords,
        iMax,
        i;

      // -- data
      for (; featureIndex < featureMax; featureIndex++) {
        rawVerts = [];
        feature = features[featureIndex];

        //***
        coords = feature.geometry.coordinates[0];
        for (i = 0, iMax = coords.length; i < iMax; i++) {
          rawVerts.push([coords[i][1], coords[i][0]]);
        }

        rawVerts.pop();
        currentColor = [Math.random(), Math.random(), Math.random()];

        triangles = earcut([rawVerts]);
        for (i = 0, iMax = triangles.length; i < iMax; i++) {
          triangle = triangles[i];
          pixel = L.glify.latLonToPixelXY(triangle[0], triangle[1]);
          verts.push(pixel.x, pixel.y, currentColor[0], currentColor[1], currentColor[2]
            /**random color -> **/ );
          //TODO: handle color
        }
      }

      console.log("num points:   " + (verts.length / 5));

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
    drawOnCanvas: function (canvasOverlay, params) {
      if (this.gl == null) return;

      var gl = this.gl,
        settings = this.settings,
        canvas = this.canvas,
        map = settings.map,
        pointSize = Math.max(map.getZoom() - 4.0, 1.0),
        bounds = map.getBounds(),
        topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest()),
      // -- Scale to current zoom
        scale = Math.pow(2, map.getZoom()),
        offset = L.glify.latLonToPixelXY(topLeft.lat, topLeft.lng),
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
      gl.uniformMatrix4fv(this.uMatrix, false, mapMatrix);
      gl.drawArrays(gl.TRIANGLES, 0, this.verts.length / 5);
    }
  };

  return Shapes;
})(),
    color: {
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
    mapMatrix: (function() {
  function mapMatrix() {
    var _mapMatrix = new Float32Array(16);

    _mapMatrix._set = _mapMatrix.set;
    _mapMatrix.set = function() {
      _mapMatrix._set.apply(this, arguments);
      return this;
    };
    /**
     *
     * @param tx
     * @param ty
     * @returns {mapMatrix}
     */
    _mapMatrix.translateMatrix = function (tx, ty) {
      // translation is in last column of matrix
      this[12] += this[0] * tx + this[4] * ty;
      this[13] += this[1] * tx + this[5] * ty;
      this[14] += this[2] * tx + this[6] * ty;
      this[15] += this[3] * tx + this[7] * ty;

      return this;
    };

    /**
     *
     * @param scale
     * @returns {mapMatrix}
     */
    _mapMatrix.scaleMatrix = function (scale) {
      // scaling x and y, which is just scaling first two columns of matrix
      this[0] *= scale;
      this[1] *= scale;
      this[2] *= scale;
      this[3] *= scale;

      this[4] *= scale;
      this[5] *= scale;
      this[6] *= scale;
      this[7] *= scale;

      return this;
    };

    return _mapMatrix;
  }

  return mapMatrix;
})(),
    shader: {
      vertex: "uniform mat4 uMatrix;attribute vec4 aVertex;attribute float aPointSize;attribute vec4 aColor;varying vec4 vColor;void main() { gl_PointSize = aPointSize; gl_Position = uMatrix * aVertex; vColor = aColor;}",
      fragment: {
        dot: "precision mediump float;varying vec4 vColor;uniform float opacity;void main() { float border = 0.05; float radius = 0.5; vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0); vec4 color1 = vec4(vColor[0], vColor[1], vColor[2], opacity); vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5); float dist = radius - sqrt(m.x * m.x + m.y * m.y); float t = 0.0; if (dist > border) { t = 1.0; } else if (dist > 0.0) { t = dist / border; } gl_FragColor = mix(color0, color1, t);}",
        polygon: "precision mediump float; varying vec4 vColor; void main() { gl_FragColor = vColor; gl_FragColor.a = 0.8; }"
      }
    }
  };


  //node-dependencies

})(window, document, L);//taken from: http://www.sumbera.com/gist/js/leaflet/canvas/L.CanvasOverlay.js, added as part of this lib because if need from library
/*
 Generic  Canvas Overlay for leaflet,
 Stanislav Sumbera, April , 2014

 - added userDrawFunc that is called when Canvas need to be redrawn
 - added few useful params fro userDrawFunc callback
 - fixed resize map bug
 inspired & portions taken from  :   https://github.com/Leaflet/Leaflet.heat


 */


L.CanvasOverlay = L.Class.extend({

  initialize: function (userDrawFunc, options) {
    this._userDrawFunc = userDrawFunc;
    L.setOptions(this, options);
  },

  drawing: function (userDrawFunc) {
    this._userDrawFunc = userDrawFunc;
    return this;
  },

  params:function(options){
    L.setOptions(this, options);
    return this;
  },

  canvas: function () {
    return this._canvas;
  },

  redraw: function () {
    if (!this._frame) {
      this._frame = L.Util.requestAnimFrame(this._redraw, this);
    }
    return this;
  },



  onAdd: function (map) {
    this._map = map;
    this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer');

    var size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;

    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));


    map._panes.overlayPane.appendChild(this._canvas);

    map.on('moveend', this._reset, this);
    map.on('resize',  this._resize, this);

    if (map.options.zoomAnimation && L.Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this);
    }

    this._reset();
  },

  onRemove: function (map) {
    map.getPanes().overlayPane.removeChild(this._canvas);

    map.off('moveend', this._reset, this);
    map.off('resize', this._resize, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this._animateZoom, this);
    }
    this_canvas = null;

  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  _resize: function (resizeEvent) {
    this._canvas.width  = resizeEvent.newSize.x;
    this._canvas.height = resizeEvent.newSize.y;
  },
  _reset: function () {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);
    this._redraw();
  },

  _redraw: function () {
    var size     = this._map.getSize();
    var bounds   = this._map.getBounds();
    var zoomScale = (size.x * 180) / (20037508.34  * (bounds.getEast() - bounds.getWest())); // resolution = 1/zoomScale
    var zoom = this._map.getZoom();

    // console.time('process');

    if (this._userDrawFunc) {
      this._userDrawFunc(this,
        {
          canvas   :this._canvas,
          bounds   : bounds,
          size     : size,
          zoomScale: zoomScale,
          zoom : zoom,
          options: this.options
        });
    }


    // console.timeEnd('process');

    this._frame = null;
  },

  _animateZoom: function (e) {
    var scale = this._map.getZoomScale(e.zoom),
      offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

    this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';

  }
});

L.canvasOverlay = function (userDrawFunc, options) {
  return new L.CanvasOverlay(userDrawFunc, options);
};
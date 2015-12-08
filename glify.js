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
      vertex: "uniform mat4 uMatrix;attribute vec4 aVertex;attribute float aPointSize;attribute vec4 aColor;varying vec4 vColor;void main() { gl_PointSize = aPointSize; gl_Position = uMatrix * aVertex; vColor = aColor;}",
      fragment: {
        dot: "precision mediump float;varying vec4 vColor;void main() { float border = 0.05; float radius = 0.5; vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0); vec4 color1 = vec4(vColor[0], vColor[1], vColor[2], 0.2); vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5); float dist = radius - sqrt(m.x * m.x + m.y * m.y); float t = 0.0; if (dist > border) { t = 1.0; } else if (dist > 0.0) { t = dist / border; } gl_FragColor = mix(color0, color1, t);}",
        polygon: "uniform mat4 uMatrix;attribute vec4 aVertex;attribute float aPointSize;attribute vec4 aColor;varying vec4 vColor;void main() { gl_PointSize = aPointSize; gl_Position = uMatrix * aVertex; vColor = aColor;}"
      }
    }
  };

  (function(glify) {
  /**
   *
   * @param settings
   * @constructor
   */
  function Points(settings) {
      this.settings = defaults(settings, Points.defaults);

      if (!settings.vertexShader) throw new Error('no "vertexShader" string setting defined');
      if (!settings.fragmentShader) throw new Error('no "fragmentShader" string setting defined');
      if (!settings.data) throw new Error('no "data" array setting defined');
      if (!settings.map) throw new Error('no leaflet "map" object setting defined');

      var glLayer = this.glLayer = L.canvasOverlay()
              .drawing(function(params) {
                  this.drawOnCanvas(params);
              }.bind(this))
              .addTo(settings.map),
          canvas = this.canvas = glLayer.canvas();

      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      this.pixelsToWebGLMatrix = new Float32Array(16);
      this.mapMatrix = new Float32Array(16);
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
      vertexShader: '',
      fragmentShader: '',
      pointThreshold: 10,
      clickPoint: null,
      color: 'red'
  };

  Points.color = {
      green : {r: 0, g: 1, b: 0},
      red   : {r: 1, g: 0, b: 0},
      blue  : {r: 0, g: 0, b: 1},
      teal  : {r: 0, g: 1, b: 1},
      yellow: {r: 1, g: 1, b: 0},
      random: function() {
          return {
              r: Math.random(),
              g: Math.random(),
              b: Math.random()
          };
      },
      pallet : function() {
          switch (Math.round(Math.random() * 4)) {
              case 0: return Points.color.green;
              case 1: return Points.color.red;
              case 2: return Points.color.blue;
              case 3: return Points.color.teal;
              case 4: return Points.color.yellow;
          }
      }
  };

  Points.prototype = {
      /**
       *
       * @returns {Points}
       */
      setup: function () {
          var self = this,
              settings = this.settings;

          if (settings.clickPoint) {
              settings.map.on('click', function(e) {
                  var point = self.lookup(e.latlng);
                  if (point !== null) {
                      settings.clickPoint(point, e);
                  }


                  if (settings.debug) {
                      self.debugPoint(e.containerPoint);
                  }
              });
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
      render: function() {
          //empty verts and repopulate
          this.verts = [];
          this.latLngLookup = {};
          // -- data
          var settings = this.settings,
              colorKey = settings.color,
              colorFn,
              color = Points.color[ colorKey ];

          if (color === undefined) {
              color = colorKey;
          }

          if (color.call !== undefined) {
              colorKey = color;
          }

          //see if colorKey is actually a function
          if (colorKey.call !== undefined) {
              colorFn = colorKey;
              this.settings.data.map(function (latLng, i) {
                  var pixel = this.latLngToPixelXY(latLng[0], latLng[1]),
                      color = colorFn();

                  //-- 2 coord, 3 rgb colors interleaved buffer
                  this.verts.push(pixel.x, pixel.y, color.r, color.g, color.b);
              }.bind(this));
          } else {
              this.settings.data.map(function (latLng, i) {
                  var pixel = this.latLngToPixelXY(latLng[0], latLng[1]);

                  //-- 2 coord, 3 rgb colors interleaved buffer
                  this.verts.push(pixel.x, pixel.y, color.r, color.g, color.b);
              }.bind(this));
          }



          //look up the locations for the inputs to our shaders.
          var gl = this.gl,
              canvas = this.canvas,
              program = this.program,
              glLayer = this.glLayer,
              uMatrix = this.uMatrix = gl.getUniformLocation(program, "uMatrix"),
              colorLocation = gl.getAttribLocation(program, "aColor"),
              vertexLocation = gl.getAttribLocation(program, "aVertex"),
              vertexBuffer = gl.createBuffer(),
              vertexArray = new Float32Array(this.verts),
              fsize = vertexArray.BYTES_PER_ELEMENT;

          gl.aPointSize = gl.getAttribLocation(program, "aPointSize");

          //set the matrix to some that makes 1 unit 1 pixel.
          this.pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);

          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.uniformMatrix4fv(uMatrix, false, this.pixelsToWebGLMatrix);
          gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
          gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, fsize * 5 ,0);
          gl.enableVertexAttribArray(vertexLocation);

          //offset for color buffer
          gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, fsize * 5, fsize * 2);
          gl.enableVertexAttribArray(colorLocation);

          glLayer.redraw();

          return this;
      },

      /**
       *
       * @param data
       * @returns {Points}
       */
      setData: function(data) {
          this.settings.data = data;
          return this;
      },

      /**
       *
       * @returns {Points}
       */
      setupVertexShader: function() {
          var gl = this.gl,
              vertexShader = gl.createShader(gl.VERTEX_SHADER);

          gl.shaderSource(vertexShader, this.settings.vertexShader);
          gl.compileShader(vertexShader);

          this.vertexShader = vertexShader;

          return this;
      },

      /**
       *
       * @returns {Points}
       */
      setupFragmentShader: function() {
          var gl = this.gl,
              fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

          gl.shaderSource(fragmentShader, this.settings.fragmentShader);
          gl.compileShader(fragmentShader);

          this.fragmentShader = fragmentShader;

          return this;
      },

      /**
       *
       * @returns {Points}
       */
      setupProgram: function() {
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
       * @param params
       * @returns {Points}
       */
      drawOnCanvas: function(params) {
          if (this.gl == null) return this;

          var gl = this.gl,
              canvas = this.canvas,
              map = this.settings.map,
              zoom = map.getZoom(),
              bounds = map.getBounds(),
              topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest()),
              offset = this.latLngToPixelXY(topLeft.lat, topLeft.lng),
              // -- Scale to current zoom
              scale = Math.pow(2, zoom),
              pointSize = Math.max(zoom - 4.0, 1.0);

          gl.clear(gl.COLOR_BUFFER_BIT);

          this.pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.vertexAttrib1f(gl.aPointSize, pointSize);

          //set base matrix to translate canvas pixel coordinates -> webgl coordinates
          this.mapMatrix.set(this.pixelsToWebGLMatrix);

          this
              .scaleMatrix(scale, scale)
              .translateMatrix(-offset.x, -offset.y);

          // -- attach matrix value to 'mapMatrix' uniform in shader
          gl.uniformMatrix4fv(this.uMatrix, false, this.mapMatrix);
          gl.drawArrays(gl.POINTS, 0, this.settings.data.length);

          return this;
      },

      /**
       * converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
       * source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html
       * @param latitude
       * @param longitude
       * @returns {{x: number, y: number}}
       */
      latLngToPixelXY: function(latitude, longitude) {
          var pi180 = Math.PI / 180.0,
              pi4 = Math.PI * 4,
              sinLatitude = Math.sin(latitude * pi180),
              pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi4)) * 256,
              pixelX = ((longitude + 180) / 360) * 256,
              pixel,
              key = latitude.toFixed(2) + 'x' + longitude.toFixed(2),
              lookup = this.latLngLookup[key];

          pixel = {
              lat: latitude,
              lng: longitude,
              x: pixelX,
              y: pixelY,
              key: key
          };

          if (lookup === undefined) {
              lookup = this.latLngLookup[key] = [];
          }

          lookup.push(pixel);

          return pixel;
      },

      /**
       *
       * @param tx
       * @param ty
       * @returns {Points}
       */
      translateMatrix: function(tx, ty) {
          var matrix = this.mapMatrix;
          // translation is in last column of matrix
          matrix[12] += matrix[0] * tx + matrix[4] * ty;
          matrix[13] += matrix[1] * tx + matrix[5] * ty;
          matrix[14] += matrix[2] * tx + matrix[6] * ty;
          matrix[15] += matrix[3] * tx + matrix[7] * ty;

          return this;
      },

      /**
       *
       * @param scaleX
       * @param scaleY
       * @returns {Points}
       */
      scaleMatrix: function(scaleX, scaleY) {
          var matrix = this.mapMatrix;
          // scaling x and y, which is just scaling first two columns of matrix
          matrix[0] *= scaleX;
          matrix[1] *= scaleX;
          matrix[2] *= scaleX;
          matrix[3] *= scaleX;

          matrix[4] *= scaleY;
          matrix[5] *= scaleY;
          matrix[6] *= scaleY;
          matrix[7] *= scaleY;

          return this;
      },

      /**
       *
       * @param map
       * @returns {Points}
       */
      addTo: function(map) {
          this.glLayer.addTo(map);

          return this;
      },

      /**
       * Iterates through a small area around the
       * @param {L.LatLng} coords
       * @returns {*}
       */
      lookup: function(coords) {
          var x = coords.lat - 0.03,
              y,

              xMax = coords.lat + 0.03,
              yMax = coords.lng + 0.03,

              foundI,
              foundMax,

              matches = [],
              found,
              key;

          for (; x <= xMax; x+=0.01) {
              y = coords.lng - 0.03;
              for (; y <= yMax; y+=0.01) {
                  key = x.toFixed(2) + 'x' + y.toFixed(2);
                  found = this.latLngLookup[key];
                  if (found) {
                      foundI = 0;
                      foundMax = found.length;
                      for (; foundI < foundMax; foundI++) {
                          found[foundI].key = key;
                          matches.push(found[foundI]);
                      }
                  }
              }
          }

          return this.closestPoint(coords, matches);
      },

      /**
       *
       * @param targetLocation
       * @param points
       * @returns {*}
       */
      closestPoint: function(targetLocation, points) {
          function vectorDistance(dx, dy) {
              return Math.sqrt(dx * dx + dy * dy);
          }

          function locationDistance(location1, location2) {
              var dx = location1.lat - location2.lat,
                  dy = location1.lng - location2.lng;

              return vectorDistance(dx, dy);
          }

          return points.reduce(function(prev, curr) {
              var prevDistance = locationDistance(targetLocation , prev),
                  currDistance = locationDistance(targetLocation , curr);
              return (prevDistance < currDistance) ? prev : curr;
          });
      },
      debugPoint: function(containerPoint) {
          var el = document.createElement('div'),
              s = el.style,
              x = containerPoint.x,
              y = containerPoint.y;

          s.left = x + 'px';
          s.top = y + 'px';
          s.width = '10px';
          s.height = '10px';
          s.position = 'absolute';
          s.backgroundColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);

          document.body.appendChild(el);

          return this;
      }
  };

  glify.Points = Points;
})(L.glify);(function(glify) {
  function Shapes(settings) {
    this.settings = defaults(settings, Shapes.defaults);

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');

    var glLayer = this.glLayer = L.canvasOverlay()
        .drawing(function(params) {
          this.drawOnCanvas(params);
        }.bind(true))
        .addTo(settings.map),
      canvas = this.canvas = glLayer.canvas();

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;


    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    this.pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = new Float32Array(16);

    this
      .setup()
      .render();
  }

  Shapes.defaults = {
    map: null,
    data: [],
    debug: false,
    vertexShader: '',
    fragmentShader: '',
    pointThreshold: 10,
    clickShape: null,
    color: 'red'
  };

  Shapes.prototype = {
    setup: function() {

      // -- WebGl setup
      var gl = this.gl,
        vertexShader = gl.createShader(gl.VERTEX_SHADER),
        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER),
        program = gl.createProgram();

      gl.shaderSource(vertexShader, document.getElementById('vshader').text);
      gl.compileShader(vertexShader);


      gl.shaderSource(fragmentShader, document.getElementById('fshader').text);
      gl.compileShader(fragmentShader);

      // link shaders to create our program
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      //  gl.disable(gl.DEPTH_TEST);
      // ----------------------------
      // look up the locations for the inputs to our shaders.
      this.uMatLoc = gl.getUniformLocation(program, "u_matrix");
      gl.aPointSize = gl.getAttribLocation(program, "a_pointSize");

      return this;
    },
    render: function() {

      var pixelsToWebGLMatrix = this.pixelsToWebGLMatrix,
        canvas = this.canvas,
        gl = this.gl,
        pixel,
        verts = [],
        rawVerts = [],
        //-- verts only

        start = new Date(),
        features = data.features,
        feature,
        featureIndex = 0,
        featureMax = data.features.length,
        triangle,
        triangles,
        coords,
        iMax,
        i;

      // Set the matrix to some that makes 1 unit 1 pixel.
      pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.uniformMatrix4fv(this.uMatLoc, false, pixelsToWebGLMatrix);

      // -- data
      for (; featureIndex < featureMax ; featureIndex++) {
        rawVerts = [];
        feature = features[f];

        //***
        coords = feature.geometry.coordinates[0];
        for (i = 0, iMax = coords.length; i < iMax; i++) {
          rawVerts.push([coords[i][1], coords[i][0]]);
        }

        rawVerts.pop();

        triangles = earcut([rawVerts]);
        for (i = 0, iMax = triangles.length; i < iMax; i++) {
          triangle = triangles[i];
          pixel = this.latLonToPixelXY(triangle[0], triangle[1]);
          verts.push(pixel.x, pixel.y,
            /**random color -> **/ Math.random(), Math.random(), Math.random());
          //TODO: handle color
        }
      }

      console.log("updated at  " + new Date().setTime(new Date().getTime() - start.getTime()) + " ms ");

      // tirangles or point count
      var numPoints = verts.length / 5;
      console.log("num points:   " + numPoints);
      var vertBuffer = gl.createBuffer();
      var vertArray = new Float32Array(verts);
      var fsize = vertArray.BYTES_PER_ELEMENT;
      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
      var vertLoc = gl.getAttribLocation(program, "a_vertex");
      gl.vertexAttribPointer(vertLoc, 2, gl.FLOAT, false, fsize * 5, 0);
      gl.enableVertexAttribArray(vertLoc);
      // -- offset for color buffer
      var colorLoc = gl.getAttribLocation(program, "a_color");
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, fsize * 5, fsize * 2);
      gl.enableVertexAttribArray(colorLoc);

      glLayer.redraw();

      return this;
    },
    /**
     *
     * @returns {Shapes}
     */
    setupVertexShader: function() {
      var gl = this.gl,
        vertexShader = gl.createShader(gl.VERTEX_SHADER);

      gl.shaderSource(vertexShader, this.settings.vertexShader);
      gl.compileShader(vertexShader);

      this.vertexShader = vertexShader;

      return this;
    },

    /**
     *
     * @returns {Shapes}
     */
    setupFragmentShader: function() {
      var gl = this.gl,
        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

      gl.shaderSource(fragmentShader, this.settings.fragmentShader);
      gl.compileShader(fragmentShader);

      this.fragmentShader = fragmentShader;

      return this;
    },

    /**
     *
     * @returns {Shapes}
     */
    setupProgram: function() {
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
        map = this.map,
        pointSize = Math.max(map.getZoom() - 4.0, 1.0),
        bounds = map.getBounds(),
        topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest()),
        // -- Scale to current zoom
        scale = Math.pow(2, map.getZoom()),
        offset = this.latLonToPixelXY(topLeft.lat, topLeft.lng),
        mapMatrix = this.mapMatrix,
        pixelsToWebGLMatrix = this.pixelsToWebGLMatrix;

      gl.clear(gl.COLOR_BUFFER_BIT);

      pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
      gl.viewport(0, 0, canvas.width, canvas.height);


      gl.vertexAttrib1f(gl.aPointSize, pointSize);

      // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
      mapMatrix.set(this.pixelsToWebGLMatrix);

      this
        .scaleMatrix(mapMatrix, scale, scale)
        .translateMatrix(mapMatrix, -offset.x, -offset.y);

      // -- attach matrix value to 'mapMatrix' uniform in shader
      gl.uniformMatrix4fv(this.uMatLoc, false, mapMatrix);
      gl.drawArrays(gl.TRIANGLES, 0, numPoints);
    },
    // -- converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
    // -- source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html

    latLonToPixelXY: function (latitude, longitude) {
      var pi_180 = Math.PI / 180.0,
        pi_4 = Math.PI * 4,
        sinLatitude = Math.sin(latitude * pi_180),
        pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256,
        pixelX = ((longitude + 180) / 360) * 256;

        return { x: pixelX, y: pixelY };
    },

    translateMatrix: function (matrix, tx, ty) {
      // translation is in last column of matrix
      matrix[12] += matrix[0] * tx + matrix[4] * ty;
      matrix[13] += matrix[1] * tx + matrix[5] * ty;
      matrix[14] += matrix[2] * tx + matrix[6] * ty;
      matrix[15] += matrix[3] * tx + matrix[7] * ty;

      return this;
    },

    scaleMatrix: function (matrix, scaleX, scaleY) {
      // scaling x and y, which is just scaling first two columns of matrix
      matrix[0] *= scaleX;
      matrix[1] *= scaleX;
      matrix[2] *= scaleX;
      matrix[3] *= scaleX;

      matrix[4] *= scaleY;
      matrix[5] *= scaleY;
      matrix[6] *= scaleY;
      matrix[7] *= scaleY;

      return this;
    }
  };
})(L.glify);

  L.glify = glify;
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
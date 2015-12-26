(function () {
  /**
   *
   * @param settings
   * @constructor
   */
  function Points(settings) {
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
    clickPoint: null,
    color: 'random',
    opacity: 0.6,
    pointSize: null,
    className: ''
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
        settings.map.on('click', function (e) {
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
        latLng,
        pixel;

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

      //use colorFn function here
      if (colorFn !== null) {
        for(; i < max; i++) {
          latLng = data[i];
          pixel = this.latLngToPixelXY(latLng[0], latLng[1]);
          color = colorFn();

          //-- 2 coord, 3 rgb colors interleaved buffer
          verts.push(pixel.x, pixel.y, color.r, color.g, color.b);
        }
      }

      //use color object here
      else {
        for(; i < max; i++) {
          latLng = data[i];
          pixel = this.latLngToPixelXY(latLng[0], latLng[1]);

          //-- 2 coord, 3 rgb colors interleaved buffer
          verts.push(pixel.x, pixel.y, color.r, color.g, color.b);
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
        zoom = map.getZoom(),
        bounds = map.getBounds(),
        topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest()),
        offset = this.latLngToPixelXY(topLeft.lat, topLeft.lng),
        // -- Scale to current zoom
        scale = Math.pow(2, zoom),
        pointSize = settings.pointSize === null ? Math.max(zoom - 4.0, 1.0) : settings.pointSize,
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
      gl.vertexAttrib1f(gl.aPointSize, pointSize);
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
    closestPoint: function (targetLocation, points) {
      function vectorDistance(dx, dy) {
        return Math.sqrt(dx * dx + dy * dy);
      }

      function locationDistance(location1, location2) {
        var dx = location1.lat - location2.lat,
          dy = location1.lng - location2.lng;

        return vectorDistance(dx, dy);
      }

      return points.reduce(function (prev, curr) {
        var prevDistance = locationDistance(targetLocation, prev),
          currDistance = locationDistance(targetLocation, curr);
        return (prevDistance < currDistance) ? prev : curr;
      });
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
})()
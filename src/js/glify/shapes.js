(function () {
  function Shapes(settings) {
    Shapes.instances.push(this);
    this.settings = defaults(settings, Shapes.defaults);

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');

    this.active = true;

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
    if (settings.className) {
      canvas.className = settings.className;
    }

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
    color: 'random',
    className: ''
  };

  //statics
  Shapes.instances = [];

  Shapes.prototype = {
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
    },
    addTo: function(map) {
      this.glLayer.addTo(map || this.settings.map);
      this.active = true;

      return this;
    },
    remove: function() {
      this.settings.map.removeLayer(this.glLayer);
      this.active = false;
      return this;
    }
  };

  return Shapes;
})()
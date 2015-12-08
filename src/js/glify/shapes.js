(function(glify) {
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
/*this file was auto generated, any edits to it will be lost when you run `node build.js`
please submit pull requests by first editing src/* and then running `node build.js`*/

(function(window, document, L, undefined) {

  function defaults(userSettings, defaults) {
    var settings = {},
      i;

    for (i in defaults) if (defaults.hasOwnProperty(i)) {
      settings[i] = (userSettings.hasOwnProperty(i) ? userSettings[i] : defaults[i]);
    }

    return settings;
  }

  function tryFunction(it, lookup) {
    //see if it is actually a function
    if (typeof it === 'function') return it;

    //we know that it isn't a function, but lookup[it] might be, check that here
    if (typeof lookup === 'undefined' || !lookup.hasOwnProperty(it)) return null;

    return lookup[it];
  }

  L.glify = {
    longitudeKey: 1,
    latitudeKey: 0,
    longitudeFirst: function() {
      L.glify.longitudeKey = 0;
      L.glify.latitudeKey = 1;
      return L.glify;
    },
    latitudeFirst: function() {
      L.glify.latitudeKey = 0;
      L.glify.longitudeKey = 1;
      return L.glify;
    },
    get instances() {
      return []
        .concat(L.glify.Points.instances)
        .concat(L.glify.Shapes.instances);
    },
    points: function(settings) {
      return new this.Points(settings);
    },
    shapes: function(settings) {
      return new this.Shapes(settings);
    },
    flattenData: function (data) {
      var dim = data[0][0].length,
        result = {vertices: [], holes: [], dimensions: dim},
        holeIndex = 0;

      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
          for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
        }
        if (i > 0) {
          holeIndex += data[i - 1].length;
          result.holes.push(holeIndex);
        }
      }

      return result;
    },
    // -- converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
    // -- source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html
    latLonToPixel: function (latitude, longitude) {
      var pi180 = Math.PI / 180.0,
        pi4 = Math.PI * 4,
        sinLatitude = Math.sin(latitude * pi180),
        pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi4)) * 256,
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
    Points.instances.push(this);
    this.settings = defaults(settings, Points.defaults);

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');

    this.active = true;

    var self = this,
      glLayer = this.glLayer = L.canvasOverlay(function() {
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
    this.mapMatrix = L.glify.mapMatrix();
    this.vertexShader = null;
    this.fragmentShader = null;
    this.program = null;
    this.matrix = null;
    this.verts = null;
    this.latLngLookup = null;

    this
      .setup()
      .render();
  }

  Points.defaults = {
    map: null,
    data: [],
    vertexShaderSource: function() { return L.glify.shader.vertex; },
    fragmentShaderSource: function() { return L.glify.shader.fragment.point; },
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
        L.glify.setupClick(settings.map);
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
        L.glify.attachShaderVars(size, gl, program, settings.shaderVars);
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
        color = tryFunction(settings.color, L.glify.color),
        i = 0,
        max = data.length,
        latLngLookup = this.latLngLookup,
        latitudeKey = L.glify.latitudeKey,
        longitudeKey = L.glify.longitudeKey,
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
        pixel = L.glify.latLonToPixel(latLng[latitudeKey], latLng[longitudeKey]);

        if (lookup === undefined) {
          lookup = latLngLookup[key] = [];
        }

        lookup.push(latLng);

        if (colorFn) {
          color = colorFn();
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
        offset = L.glify.latLonToPixel(topLeft.lat, topLeft.lng),
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
      return L.glify.closest(coords, matches.length === 0 ? this.settings.data.slice(0) : matches, this.settings.map);
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

    found = L.glify.closest(e.latlng, closestFromEach, map);

    if (found === null) return;

    instance = instancesLookup[found];
    if (!instance) return;

    latLng = L.latLng(found[L.glify.latitudeKey], found[L.glify.longitudeKey]);
    xy = map.latLngToLayerPoint(latLng);

    if (L.glify.pointInCircle(xy, e.layerPoint, instance.pointSize() * instance.settings.sensitivity)) {
      result = instance.settings.click(e, found, xy);
      return result !== undefined ? result : true;
    }
  };

  return Points;
})(),
    Shapes: (function () {
  function Shapes(settings) {
    Shapes.instances.push(this);
    this.settings = defaults(settings, Shapes.defaults);

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');

    this.active = true;

    var self = this,
      glLayer = this.glLayer = L.canvasOverlay(function() {
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
    this.mapMatrix = L.glify.mapMatrix();
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
  }

  Shapes.defaults = {
    map: null,
    data: [],
    vertexShaderSource: function() { return L.glify.shader.vertex; },
    fragmentShaderSource: function() { return L.glify.shader.fragment.polygon; },
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
        L.glify.setupClick(settings.map);
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

      console.log("updated at  " + new Date().setTime(new Date().getTime() - start.getTime()) + " ms ");

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
        L.glify.attachShaderVars(size, gl, program, settings.shaderVars);
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
        color = tryFunction(settings.color, L.glify.color),
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
          color = colorFn();
        }

        flat = L.glify.flattenData(feature.geometry.coordinates);

        indices = earcut(flat.vertices, flat.holes, flat.dimensions);

        dim = feature.geometry.coordinates[0][0].length;
        for (i = 0, iMax = indices.length; i < iMax; i++) {
          index = indices[i];
          triangles.push(flat.vertices[index * dim + L.glify.longitudeKey], flat.vertices[index * dim + L.glify.latitudeKey]);
        }

        for (i = 0, iMax = triangles.length; i < iMax; i) {
          pixel = L.glify.latLonToPixel(triangles[i++],triangles[i++]);
          verts.push(pixel.x, pixel.y, color.r, color.g, color.b);
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
        offset = L.glify.latLonToPixel(topLeft.lat, topLeft.lng),
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

  return Shapes;
})(),
    maps: [],
    setupClick: function(map) {
      if (this.maps.indexOf(map) < 0) {
        this.maps.push(map);
        map.on('click', function (e) {
          var hit;
          hit = L.glify.Points.tryClick(e, map);
          if (hit !== undefined) return hit;

          //todo: handle lines

          hit = L.glify.Shapes.tryClick(e, map);
          if (hit !== undefined) return hit;
        });
      }
    },
    pointInCircle: function (centerPoint, checkPoint, radius) {
      var distanceSquared = (centerPoint.x - checkPoint.x) * (centerPoint.x - checkPoint.x) + (centerPoint.y - checkPoint.y) * (centerPoint.y - checkPoint.y);
      return distanceSquared <= radius * radius;
    },
    attachShaderVars: function(size, gl, program, attributes) {
      var name,
          loc,
          attribute,
          bytes = 5;

      for (name in attributes) if (attributes.hasOwnProperty(name)) {
        attribute = attributes[name];
        loc = gl.getAttribLocation(program, name);
        if (loc < 0) {
          console.log(name, attribute);
          throw new Error('shader variable ' + name + ' not found');
        }
        gl.vertexAttribPointer(loc, attribute.size, gl[attribute.type], false, size * (attribute.bytes || bytes), size * attribute.start);
        gl.enableVertexAttribArray(loc);
      }

      return this;
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
    },
    /**
     *
     * @param targetLocation
     * @param points
     * @param map
     * @returns {*}
     */
    closest: function (targetLocation, points, map) {
      var self = this;
      if (points.length < 1) return null;
      return points.reduce(function (prev, curr) {
        var prevDistance = self.locationDistance(targetLocation, prev, map),
            currDistance = self.locationDistance(targetLocation, curr, map);
        return (prevDistance < currDistance) ? prev : curr;
      });
    },
    vectorDistance: function (dx, dy) {
      return Math.sqrt(dx * dx + dy * dy);
    },
    locationDistance: function (location1, location2, map) {
      var point1 = map.latLngToLayerPoint(location1),
          point2 = map.latLngToLayerPoint(location2),

          dx = point1.x - point2.x,
          dy = point1.y - point2.y;

      return this.vectorDistance(dx, dy);
    },
    color: {
      fromHex: function(hex) {
        if (hex.length < 6) return null;
        hex = hex.toLowerCase();

        if (hex[0] === '#') {
          hex = hex.substring(1, hex.length);
        }
        var r = parseInt(hex[0] + hex[1], 16),
          g = parseInt(hex[2] + hex[3], 16),
          b = parseInt(hex[4] + hex[5], 16);

        return {r: r / 255, g: g / 255, b: b / 255};
      },
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
      vertex: "uniform mat4 matrix;attribute vec4 vertex;attribute float pointSize;attribute vec4 color;varying vec4 _color;void main() { gl_PointSize = pointSize; gl_Position = matrix * vertex; _color = color;}",
      fragment: {
        dot: "precision mediump float;uniform vec4 color;uniform float opacity;void main() { float border = 0.05; float radius = 0.5; vec2 center = vec2(0.5); vec4 color0 = vec4(0.0); vec4 color1 = vec4(color[0], color[1], color[2], opacity); vec2 m = gl_PointCoord.xy - center; float dist = radius - sqrt(m.x * m.x + m.y * m.y); float t = 0.0; if (dist > border) { t = 1.0; } else if (dist > 0.0) { t = dist / border; } gl_FragColor = mix(color0, color1, t);}",
        point: "precision mediump float;varying vec4 _color;uniform float opacity;void main() { float border = 0.1; float radius = 0.5; vec2 center = vec2(0.5, 0.5); vec4 pointColor = vec4(_color[0], _color[1], _color[2], opacity); vec2 m = gl_PointCoord.xy - center; float dist1 = radius - sqrt(m.x * m.x + m.y * m.y); float t1 = 0.0; if (dist1 > border) { t1 = 1.0; } else if (dist1 > 0.0) { t1 = dist1 / border; } float outerBorder = 0.05; float innerBorder = 0.8; vec4 borderColor = vec4(0, 0, 0, 0.4); vec2 uv = gl_PointCoord.xy; vec4 clearColor = vec4(0, 0, 0, 0); uv -= center; float dist2 = sqrt(dot(uv, uv)); float t2 = 1.0 + smoothstep(radius, radius + outerBorder, dist2) - smoothstep(radius - innerBorder, radius, dist2); gl_FragColor = mix(mix(borderColor, clearColor, t2), pointColor, t1);}",
        puck: "precision mediump float;varying vec4 _color;uniform float opacity;void main() { vec2 center = vec2(0.5); vec2 uv = gl_PointCoord.xy - center; float smoothing = 0.005; vec4 _color1 = vec4(_color[0], _color[1], _color[2], opacity); float radius1 = 0.3; vec4 _color2 = vec4(_color[0], _color[1], _color[2], opacity); float radius2 = 0.5; float dist = length(uv); float gamma = 2.2; color1.rgb = pow(_color1.rgb, vec3(gamma)); color2.rgb = pow(_color2.rgb, vec3(gamma)); vec4 puck = mix( mix( _color1, _color2, smoothstep( radius1 - smoothing, radius1 + smoothing, dist ) ), vec4(0,0,0,0), smoothstep( radius2 - smoothing, radius2 + smoothing, dist ) ); puck.rgb = pow(puck.rgb, vec3(1.0 / gamma)); gl_FragColor = puck;}",
        simpleCircle: "precision mediump float;uniform float opacity;void main() { float border = 0.05; float radius = 0.5; vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0); vec4 color1 = vec4(color[0], color[1], color[2], opacity); vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5); float dist = radius - sqrt(m.x * m.x + m.y * m.y); float t = 0.0; if (dist > border) { t = 1.0; } else if (dist > 0.0) { t = dist / border; } float d = distance (gl_PointCoord, vec2(0.5, 0.5)); if (d < 0.5 ){ gl_FragColor = color1; } else { discard; }}",
        square: "precision mediump float;uniform float opacity;void main() { float border = 0.05; float radius = 0.5; vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0); vec4 color1 = vec4(color[0], color[1], color[2], opacity); vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5); float dist = radius - sqrt(m.x * m.x + m.y * m.y); float t = 0.0; if (dist > border) { t = 1.0; } else if (dist > 0.0) { t = dist / border; } gl_FragColor = vec4(color[0], color[1], color[2], opacity);}",
        polygon: "precision mediump float;uniform float opacity;varying vec4 _color;void main() { gl_FragColor = vec4(_color[0], _color[1], _color[2], opacity);}"
      }
    }
  };
})(window, document, L);
/*
originally taken from: http://www.sumbera.com/gist/js/leaflet/canvas/L.CanvasOverlay.js, added and customized as part of this lib because of need from library
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
    this._frame = null;
    this._redrawCallbacks = [];
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

  redraw: function (callback) {
    if (typeof callback === 'function') {
      this._redrawCallbacks.push(callback);
    }
    if (this._frame === null) {
      this._frame = L.Util.requestAnimFrame(this._redraw, this);
    }
    return this;
  },

  onAdd: function (map) {
    this._map = map;
    this.canvas = this.canvas || document.createElement('canvas');

    var size = this._map.getSize()
      , animated = this._map.options.zoomAnimation && L.Browser.any3d
      ;

    this.canvas.width = size.x;
    this.canvas.height = size.y;

    this.canvas.className = 'leaflet-zoom-' + (animated ? 'animated' : 'hide');

    map._panes.overlayPane.appendChild(this.canvas);

    map.on('moveend', this._reset, this);
    map.on('resize',  this._resize, this);

    if (map.options.zoomAnimation && L.Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this);
    }

    this._reset();
  },

  onRemove: function (map) {
    map.getPanes().overlayPane.removeChild(this.canvas);

    map.off('moveend', this._reset, this);
    map.off('resize', this._resize, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this._animateZoom, this);
    }
  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  _resize: function (resizeEvent) {
    this.canvas.width  = resizeEvent.newSize.x;
    this.canvas.height = resizeEvent.newSize.y;
  },

  _reset: function () {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this.canvas, topLeft);
    this._redraw();
  },

  _redraw: function () {
    var size      = this._map.getSize()
      , bounds    = this._map.getBounds()
      , zoomScale = (size.x * 180) / (20037508.34  * (bounds.getEast() - bounds.getWest())) // resolution = 1/zoomScale
      , zoom      = this._map.getZoom()
      ;

    if (this._userDrawFunc) {
      this._userDrawFunc(this, {
        canvas   :this.canvas,
        bounds   : bounds,
        size     : size,
        zoomScale: zoomScale,
        zoom     : zoom,
        options  : this.options
      });
    }

    while (this._redrawCallbacks.length > 0) {
      this._redrawCallbacks.shift()(this);
    }

    this._frame = null;
  },

  _animateZoom: function (e) {
    var scale = this._map.getZoomScale(e.zoom)
      , offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos())
      ;

    this.canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
  }
});

L.canvasOverlay = function (userDrawFunc, options) {
  return new L.CanvasOverlay(userDrawFunc, options);
};

//third party libraries


window.earcut = (function() {
'use strict';

return earcut;

function earcut(data, holeIndices, dim) {

    dim = dim || 2;

    var hasHoles = holeIndices && holeIndices.length,
        outerLen = hasHoles ? holeIndices[0] * dim : data.length,
        outerNode = linkedList(data, 0, outerLen, dim, true),
        triangles = [];

    if (!outerNode) return triangles;

    var minX, minY, maxX, maxY, x, y, size;

    if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

    // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
    if (data.length > 80 * dim) {
        minX = maxX = data[0];
        minY = maxY = data[1];

        for (var i = dim; i < outerLen; i += dim) {
            x = data[i];
            y = data[i + 1];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        // minX, minY and size are later used to transform coords into integers for z-order calculation
        size = Math.max(maxX - minX, maxY - minY);
    }

    earcutLinked(outerNode, triangles, dim, minX, minY, size);

    return triangles;
}

// create a circular doubly linked list from polygon points in the specified winding order
function linkedList(data, start, end, dim, clockwise) {
    var sum = 0,
        i, j, last;

    // calculate original winding order of a polygon ring
    for (i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
    }

    // link points into circular doubly-linked list in the specified winding order
    if (clockwise === (sum > 0)) {
        for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
    } else {
        for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
    }

    return last;
}

// eliminate colinear or duplicate points
function filterPoints(start, end) {
    if (!start) return start;
    if (!end) end = start;

    var p = start,
        again;
    do {
        again = false;

        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
            removeNode(p);
            p = end = p.prev;
            if (p === p.next) return null;
            again = true;

        } else {
            p = p.next;
        }
    } while (again || p !== end);

    return end;
}

// main ear slicing loop which triangulates a polygon (given as a linked list)
function earcutLinked(ear, triangles, dim, minX, minY, size, pass) {
    if (!ear) return;

    // interlink polygon nodes in z-order
    if (!pass && size) indexCurve(ear, minX, minY, size);

    var stop = ear,
        prev, next;

    // iterate through ears, slicing them one by one
    while (ear.prev !== ear.next) {
        prev = ear.prev;
        next = ear.next;

        if (size ? isEarHashed(ear, minX, minY, size) : isEar(ear)) {
            // cut off the triangle
            triangles.push(prev.i / dim);
            triangles.push(ear.i / dim);
            triangles.push(next.i / dim);

            removeNode(ear);

            // skipping the next vertice leads to less sliver triangles
            ear = next.next;
            stop = next.next;

            continue;
        }

        ear = next;

        // if we looped through the whole remaining polygon and can't find any more ears
        if (ear === stop) {
            // try filtering points and slicing again
            if (!pass) {
                earcutLinked(filterPoints(ear), triangles, dim, minX, minY, size, 1);

            // if this didn't work, try curing all small self-intersections locally
            } else if (pass === 1) {
                ear = cureLocalIntersections(ear, triangles, dim);
                earcutLinked(ear, triangles, dim, minX, minY, size, 2);

            // as a last resort, try splitting the remaining polygon into two
            } else if (pass === 2) {
                splitEarcut(ear, triangles, dim, minX, minY, size);
            }

            break;
        }
    }
}

// check whether a polygon node forms a valid ear with adjacent nodes
function isEar(ear) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // now make sure we don't have other points inside the potential ear
    var p = ear.next.next;

    while (p !== ear.prev) {
        if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.next;
    }

    return true;
}

function isEarHashed(ear, minX, minY, size) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // triangle bbox; min & max are calculated like this for speed
    var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
        minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
        maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
        maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

    // z-order range for the current triangle bbox;
    var minZ = zOrder(minTX, minTY, minX, minY, size),
        maxZ = zOrder(maxTX, maxTY, minX, minY, size);

    // first look for points inside the triangle in increasing z-order
    var p = ear.nextZ;

    while (p && p.z <= maxZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.nextZ;
    }

    // then look for points in decreasing z-order
    p = ear.prevZ;

    while (p && p.z >= minZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;
    }

    return true;
}

// go through all polygon nodes and cure small local self-intersections
function cureLocalIntersections(start, triangles, dim) {
    var p = start;
    do {
        var a = p.prev,
            b = p.next.next;

        // a self-intersection where edge (v[i-1],v[i]) intersects (v[i+1],v[i+2])
        if (intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

            triangles.push(a.i / dim);
            triangles.push(p.i / dim);
            triangles.push(b.i / dim);

            // remove two nodes involved
            removeNode(p);
            removeNode(p.next);

            p = start = b;
        }
        p = p.next;
    } while (p !== start);

    return p;
}

// try splitting polygon into two and triangulate them independently
function splitEarcut(start, triangles, dim, minX, minY, size) {
    // look for a valid diagonal that divides the polygon into two
    var a = start;
    do {
        var b = a.next.next;
        while (b !== a.prev) {
            if (a.i !== b.i && isValidDiagonal(a, b)) {
                // split the polygon in two by the diagonal
                var c = splitPolygon(a, b);

                // filter colinear points around the cuts
                a = filterPoints(a, a.next);
                c = filterPoints(c, c.next);

                // run earcut on each half
                earcutLinked(a, triangles, dim, minX, minY, size);
                earcutLinked(c, triangles, dim, minX, minY, size);
                return;
            }
            b = b.next;
        }
        a = a.next;
    } while (a !== start);
}

// link every hole into the outer loop, producing a single-ring polygon without holes
function eliminateHoles(data, holeIndices, outerNode, dim) {
    var queue = [],
        i, len, start, end, list;

    for (i = 0, len = holeIndices.length; i < len; i++) {
        start = holeIndices[i] * dim;
        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        list = linkedList(data, start, end, dim, false);
        if (list === list.next) list.steiner = true;
        queue.push(getLeftmost(list));
    }

    queue.sort(compareX);

    // process holes from left to right
    for (i = 0; i < queue.length; i++) {
        eliminateHole(queue[i], outerNode);
        outerNode = filterPoints(outerNode, outerNode.next);
    }

    return outerNode;
}

function compareX(a, b) {
    return a.x - b.x;
}

// find a bridge between vertices that connects hole with an outer ring and and link it
function eliminateHole(hole, outerNode) {
    outerNode = findHoleBridge(hole, outerNode);
    if (outerNode) {
        var b = splitPolygon(outerNode, hole);
        filterPoints(b, b.next);
    }
}

// David Eberly's algorithm for finding a bridge between hole and outer polygon
function findHoleBridge(hole, outerNode) {
    var p = outerNode,
        hx = hole.x,
        hy = hole.y,
        qx = -Infinity,
        m;

    // find a segment intersected by a ray from the hole's leftmost point to the left;
    // segment's endpoint with lesser x will be potential connection point
    do {
        if (hy <= p.y && hy >= p.next.y) {
            var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
            if (x <= hx && x > qx) {
                qx = x;
                m = p.x < p.next.x ? p : p.next;
            }
        }
        p = p.next;
    } while (p !== outerNode);

    if (!m) return null;

    // look for points inside the triangle of hole point, segment intersection and endpoint;
    // if there are no points found, we have a valid connection;
    // otherwise choose the point of the minimum angle with the ray as connection point

    var stop = m,
        tanMin = Infinity,
        tan;

    p = m.next;

    while (p !== stop) {
        if (hx >= p.x && p.x >= m.x &&
                pointInTriangle(hy < m.y ? hx : qx, hy, m.x, m.y, hy < m.y ? qx : hx, hy, p.x, p.y)) {

            tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

            if ((tan < tanMin || (tan === tanMin && p.x > m.x)) && locallyInside(p, hole)) {
                m = p;
                tanMin = tan;
            }
        }

        p = p.next;
    }

    return m;
}

// interlink polygon nodes in z-order
function indexCurve(start, minX, minY, size) {
    var p = start;
    do {
        if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, size);
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
    } while (p !== start);

    p.prevZ.nextZ = null;
    p.prevZ = null;

    sortLinked(p);
}

// Simon Tatham's linked list merge sort algorithm
// http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
function sortLinked(list) {
    var i, p, q, e, tail, numMerges, pSize, qSize,
        inSize = 1;

    do {
        p = list;
        list = null;
        tail = null;
        numMerges = 0;

        while (p) {
            numMerges++;
            q = p;
            pSize = 0;
            for (i = 0; i < inSize; i++) {
                pSize++;
                q = q.nextZ;
                if (!q) break;
            }

            qSize = inSize;

            while (pSize > 0 || (qSize > 0 && q)) {

                if (pSize === 0) {
                    e = q;
                    q = q.nextZ;
                    qSize--;
                } else if (qSize === 0 || !q) {
                    e = p;
                    p = p.nextZ;
                    pSize--;
                } else if (p.z <= q.z) {
                    e = p;
                    p = p.nextZ;
                    pSize--;
                } else {
                    e = q;
                    q = q.nextZ;
                    qSize--;
                }

                if (tail) tail.nextZ = e;
                else list = e;

                e.prevZ = tail;
                tail = e;
            }

            p = q;
        }

        tail.nextZ = null;
        inSize *= 2;

    } while (numMerges > 1);

    return list;
}

// z-order of a point given coords and size of the data bounding box
function zOrder(x, y, minX, minY, size) {
    // coords are transformed into non-negative 15-bit integer range
    x = 32767 * (x - minX) / size;
    y = 32767 * (y - minY) / size;

    x = (x | (x << 8)) & 0x00FF00FF;
    x = (x | (x << 4)) & 0x0F0F0F0F;
    x = (x | (x << 2)) & 0x33333333;
    x = (x | (x << 1)) & 0x55555555;

    y = (y | (y << 8)) & 0x00FF00FF;
    y = (y | (y << 4)) & 0x0F0F0F0F;
    y = (y | (y << 2)) & 0x33333333;
    y = (y | (y << 1)) & 0x55555555;

    return x | (y << 1);
}

// find the leftmost node of a polygon ring
function getLeftmost(start) {
    var p = start,
        leftmost = start;
    do {
        if (p.x < leftmost.x) leftmost = p;
        p = p.next;
    } while (p !== start);

    return leftmost;
}

// check if a point lies within a convex triangle
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
           (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
           (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
}

// check if a diagonal between two polygon nodes is valid (lies in polygon interior)
function isValidDiagonal(a, b) {
    return equals(a, b) || a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) &&
           locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b);
}

// signed area of a triangle
function area(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

// check if two points are equal
function equals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}

// check if two segments intersect
function intersects(p1, q1, p2, q2) {
    return area(p1, q1, p2) > 0 !== area(p1, q1, q2) > 0 &&
           area(p2, q2, p1) > 0 !== area(p2, q2, q1) > 0;
}

// check if a polygon diagonal intersects any polygon segments
function intersectsPolygon(a, b) {
    var p = a;
    do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                intersects(p, p.next, a, b)) return true;
        p = p.next;
    } while (p !== a);

    return false;
}

// check if a polygon diagonal is locally inside the polygon
function locallyInside(a, b) {
    return area(a.prev, a, a.next) < 0 ?
        area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
        area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}

// check if the middle point of a polygon diagonal is inside the polygon
function middleInside(a, b) {
    var p = a,
        inside = false,
        px = (a.x + b.x) / 2,
        py = (a.y + b.y) / 2;
    do {
        if (((p.y > py) !== (p.next.y > py)) && (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
            inside = !inside;
        p = p.next;
    } while (p !== a);

    return inside;
}

// link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
// if one belongs to the outer ring and another to a hole, it merges it into a single ring
function splitPolygon(a, b) {
    var a2 = new Node(a.i, a.x, a.y),
        b2 = new Node(b.i, b.x, b.y),
        an = a.next,
        bp = b.prev;

    a.next = b;
    b.prev = a;

    a2.next = an;
    an.prev = a2;

    b2.next = a2;
    a2.prev = b2;

    bp.next = b2;
    b2.prev = bp;

    return b2;
}

// create a node and optionally link it with previous one (in a circular doubly linked list)
function insertNode(i, x, y, last) {
    var p = new Node(i, x, y);

    if (!last) {
        p.prev = p;
        p.next = p;

    } else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
    }
    return p;
}

function removeNode(p) {
    p.next.prev = p.prev;
    p.prev.next = p.next;

    if (p.prevZ) p.prevZ.nextZ = p.nextZ;
    if (p.nextZ) p.nextZ.prevZ = p.prevZ;
}

function Node(i, x, y) {
    // vertice index in coordinates array
    this.i = i;

    // vertex coordinates
    this.x = x;
    this.y = y;

    // previous and next vertice nodes in a polygon ring
    this.prev = null;
    this.next = null;

    // z-order curve value
    this.z = null;

    // previous and next nodes in z-order
    this.prevZ = null;
    this.nextZ = null;

    // indicates whether this is a steiner point
    this.steiner = false;
}

})();/*
 (c) 2015, Vladimir Agafonkin
 RBush, a JavaScript library for high-performance 2D spatial indexing of points and rectangles.
 https://github.com/mourner/rbush
*/

(function () {
'use strict';

function rbush(maxEntries, format) {

    // jshint newcap: false, validthis: true
    if (!(this instanceof rbush)) return new rbush(maxEntries, format);

    // max entries in a node is 9 by default; min node fill is 40% for best performance
    this._maxEntries = Math.max(4, maxEntries || 9);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

    if (format) {
        this._initFormat(format);
    }

    this.clear();
}

rbush.prototype = {

    all: function () {
        return this._all(this.data, []);
    },

    search: function (bbox) {

        var node = this.data,
            result = [],
            toBBox = this.toBBox;

        if (!intersects(bbox, node.bbox)) return result;

        var nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child.bbox;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf) result.push(child);
                    else if (contains(bbox, childBBox)) this._all(child, result);
                    else nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return result;
    },

    collides: function (bbox) {

        var node = this.data,
            toBBox = this.toBBox;

        if (!intersects(bbox, node.bbox)) return false;

        var nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child.bbox;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf || contains(bbox, childBBox)) return true;
                    nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return false;
    },

    load: function (data) {
        if (!(data && data.length)) return this;

        if (data.length < this._minEntries) {
            for (var i = 0, len = data.length; i < len; i++) {
                this.insert(data[i]);
            }
            return this;
        }

        // recursively build the tree with the given data from stratch using OMT algorithm
        var node = this._build(data.slice(), 0, data.length - 1, 0);

        if (!this.data.children.length) {
            // save as is if tree is empty
            this.data = node;

        } else if (this.data.height === node.height) {
            // split root if trees have the same height
            this._splitRoot(this.data, node);

        } else {
            if (this.data.height < node.height) {
                // swap trees if inserted one is bigger
                var tmpNode = this.data;
                this.data = node;
                node = tmpNode;
            }

            // insert the small tree into the large tree at appropriate level
            this._insert(node, this.data.height - node.height - 1, true);
        }

        return this;
    },

    insert: function (item) {
        if (item) this._insert(item, this.data.height - 1);
        return this;
    },

    clear: function () {
        this.data = {
            children: [],
            height: 1,
            bbox: empty(),
            leaf: true
        };
        return this;
    },

    remove: function (item) {
        if (!item) return this;

        var node = this.data,
            bbox = this.toBBox(item),
            path = [],
            indexes = [],
            i, parent, index, goingUp;

        // depth-first iterative tree traversal
        while (node || path.length) {

            if (!node) { // go up
                node = path.pop();
                parent = path[path.length - 1];
                i = indexes.pop();
                goingUp = true;
            }

            if (node.leaf) { // check current node
                index = node.children.indexOf(item);

                if (index !== -1) {
                    // item found, remove the item and condense tree upwards
                    node.children.splice(index, 1);
                    path.push(node);
                    this._condense(path);
                    return this;
                }
            }

            if (!goingUp && !node.leaf && contains(node.bbox, bbox)) { // go down
                path.push(node);
                indexes.push(i);
                i = 0;
                parent = node;
                node = node.children[0];

            } else if (parent) { // go right
                i++;
                node = parent.children[i];
                goingUp = false;

            } else node = null; // nothing found
        }

        return this;
    },

    toBBox: function (item) { return item; },

    compareMinX: function (a, b) { return a[0] - b[0]; },
    compareMinY: function (a, b) { return a[1] - b[1]; },

    toJSON: function () { return this.data; },

    fromJSON: function (data) {
        this.data = data;
        return this;
    },

    _all: function (node, result) {
        var nodesToSearch = [];
        while (node) {
            if (node.leaf) result.push.apply(result, node.children);
            else nodesToSearch.push.apply(nodesToSearch, node.children);

            node = nodesToSearch.pop();
        }
        return result;
    },

    _build: function (items, left, right, height) {

        var N = right - left + 1,
            M = this._maxEntries,
            node;

        if (N <= M) {
            // reached leaf level; return leaf
            node = {
                children: items.slice(left, right + 1),
                height: 1,
                bbox: null,
                leaf: true
            };
            calcBBox(node, this.toBBox);
            return node;
        }

        if (!height) {
            // target height of the bulk-loaded tree
            height = Math.ceil(Math.log(N) / Math.log(M));

            // target number of root entries to maximize storage utilization
            M = Math.ceil(N / Math.pow(M, height - 1));
        }

        node = {
            children: [],
            height: height,
            bbox: null,
            leaf: false
        };

        // split the items into M mostly square tiles

        var N2 = Math.ceil(N / M),
            N1 = N2 * Math.ceil(Math.sqrt(M)),
            i, j, right2, right3;

        multiSelect(items, left, right, N1, this.compareMinX);

        for (i = left; i <= right; i += N1) {

            right2 = Math.min(i + N1 - 1, right);

            multiSelect(items, i, right2, N2, this.compareMinY);

            for (j = i; j <= right2; j += N2) {

                right3 = Math.min(j + N2 - 1, right2);

                // pack each entry recursively
                node.children.push(this._build(items, j, right3, height - 1));
            }
        }

        calcBBox(node, this.toBBox);

        return node;
    },

    _chooseSubtree: function (bbox, node, level, path) {

        var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;

        while (true) {
            path.push(node);

            if (node.leaf || path.length - 1 === level) break;

            minArea = minEnlargement = Infinity;

            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                area = bboxArea(child.bbox);
                enlargement = enlargedArea(bbox, child.bbox) - area;

                // choose entry with the least area enlargement
                if (enlargement < minEnlargement) {
                    minEnlargement = enlargement;
                    minArea = area < minArea ? area : minArea;
                    targetNode = child;

                } else if (enlargement === minEnlargement) {
                    // otherwise choose one with the smallest area
                    if (area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
                }
            }

            node = targetNode;
        }

        return node;
    },

    _insert: function (item, level, isNode) {

        var toBBox = this.toBBox,
            bbox = isNode ? item.bbox : toBBox(item),
            insertPath = [];

        // find the best node for accommodating the item, saving all nodes along the path too
        var node = this._chooseSubtree(bbox, this.data, level, insertPath);

        // put the item into the node
        node.children.push(item);
        extend(node.bbox, bbox);

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level);
                level--;
            } else break;
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level);
    },

    // split overflowed node into two
    _split: function (insertPath, level) {

        var node = insertPath[level],
            M = node.children.length,
            m = this._minEntries;

        this._chooseSplitAxis(node, m, M);

        var splitIndex = this._chooseSplitIndex(node, m, M);

        var newNode = {
            children: node.children.splice(splitIndex, node.children.length - splitIndex),
            height: node.height,
            bbox: null,
            leaf: false
        };

        if (node.leaf) newNode.leaf = true;

        calcBBox(node, this.toBBox);
        calcBBox(newNode, this.toBBox);

        if (level) insertPath[level - 1].children.push(newNode);
        else this._splitRoot(node, newNode);
    },

    _splitRoot: function (node, newNode) {
        // split root node
        this.data = {
            children: [node, newNode],
            height: node.height + 1,
            bbox: null,
            leaf: false
        };
        calcBBox(this.data, this.toBBox);
    },

    _chooseSplitIndex: function (node, m, M) {

        var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;

        minOverlap = minArea = Infinity;

        for (i = m; i <= M - m; i++) {
            bbox1 = distBBox(node, 0, i, this.toBBox);
            bbox2 = distBBox(node, i, M, this.toBBox);

            overlap = intersectionArea(bbox1, bbox2);
            area = bboxArea(bbox1) + bboxArea(bbox2);

            // choose distribution with minimum overlap
            if (overlap < minOverlap) {
                minOverlap = overlap;
                index = i;

                minArea = area < minArea ? area : minArea;

            } else if (overlap === minOverlap) {
                // otherwise choose distribution with minimum area
                if (area < minArea) {
                    minArea = area;
                    index = i;
                }
            }
        }

        return index;
    },

    // sorts node children by the best axis for split
    _chooseSplitAxis: function (node, m, M) {

        var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX,
            compareMinY = node.leaf ? this.compareMinY : compareNodeMinY,
            xMargin = this._allDistMargin(node, m, M, compareMinX),
            yMargin = this._allDistMargin(node, m, M, compareMinY);

        // if total distributions margin value is minimal for x, sort by minX,
        // otherwise it's already sorted by minY
        if (xMargin < yMargin) node.children.sort(compareMinX);
    },

    // total margin of all possible split distributions where each node is at least m full
    _allDistMargin: function (node, m, M, compare) {

        node.children.sort(compare);

        var toBBox = this.toBBox,
            leftBBox = distBBox(node, 0, m, toBBox),
            rightBBox = distBBox(node, M - m, M, toBBox),
            margin = bboxMargin(leftBBox) + bboxMargin(rightBBox),
            i, child;

        for (i = m; i < M - m; i++) {
            child = node.children[i];
            extend(leftBBox, node.leaf ? toBBox(child) : child.bbox);
            margin += bboxMargin(leftBBox);
        }

        for (i = M - m - 1; i >= m; i--) {
            child = node.children[i];
            extend(rightBBox, node.leaf ? toBBox(child) : child.bbox);
            margin += bboxMargin(rightBBox);
        }

        return margin;
    },

    _adjustParentBBoxes: function (bbox, path, level) {
        // adjust bboxes along the given tree path
        for (var i = level; i >= 0; i--) {
            extend(path[i].bbox, bbox);
        }
    },

    _condense: function (path) {
        // go through the path, removing empty nodes and updating bboxes
        for (var i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
                if (i > 0) {
                    siblings = path[i - 1].children;
                    siblings.splice(siblings.indexOf(path[i]), 1);

                } else this.clear();

            } else calcBBox(path[i], this.toBBox);
        }
    },

    _initFormat: function (format) {
        // data format (minX, minY, maxX, maxY accessors)

        // uses eval-type function compilation instead of just accepting a toBBox function
        // because the algorithms are very sensitive to sorting functions performance,
        // so they should be dead simple and without inner calls

        // jshint evil: true

        var compareArr = ['return a', ' - b', ';'];

        this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
        this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));

        this.toBBox = new Function('a', 'return [a' + format.join(', a') + '];');
    }
};


// calculate node's bbox from bboxes of its children
function calcBBox(node, toBBox) {
    node.bbox = distBBox(node, 0, node.children.length, toBBox);
}

// min bounding rectangle of node children from k to p-1
function distBBox(node, k, p, toBBox) {
    var bbox = empty();

    for (var i = k, child; i < p; i++) {
        child = node.children[i];
        extend(bbox, node.leaf ? toBBox(child) : child.bbox);
    }

    return bbox;
}

function empty() { return [Infinity, Infinity, -Infinity, -Infinity]; }

function extend(a, b) {
    a[0] = Math.min(a[0], b[0]);
    a[1] = Math.min(a[1], b[1]);
    a[2] = Math.max(a[2], b[2]);
    a[3] = Math.max(a[3], b[3]);
    return a;
}

function compareNodeMinX(a, b) { return a.bbox[0] - b.bbox[0]; }
function compareNodeMinY(a, b) { return a.bbox[1] - b.bbox[1]; }

function bboxArea(a)   { return (a[2] - a[0]) * (a[3] - a[1]); }
function bboxMargin(a) { return (a[2] - a[0]) + (a[3] - a[1]); }

function enlargedArea(a, b) {
    return (Math.max(b[2], a[2]) - Math.min(b[0], a[0])) *
           (Math.max(b[3], a[3]) - Math.min(b[1], a[1]));
}

function intersectionArea(a, b) {
    var minX = Math.max(a[0], b[0]),
        minY = Math.max(a[1], b[1]),
        maxX = Math.min(a[2], b[2]),
        maxY = Math.min(a[3], b[3]);

    return Math.max(0, maxX - minX) *
           Math.max(0, maxY - minY);
}

function contains(a, b) {
    return a[0] <= b[0] &&
           a[1] <= b[1] &&
           b[2] <= a[2] &&
           b[3] <= a[3];
}

function intersects(a, b) {
    return b[0] <= a[2] &&
           b[1] <= a[3] &&
           b[2] >= a[0] &&
           b[3] >= a[1];
}

// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
// combines selection algorithm with binary divide & conquer approach

function multiSelect(arr, left, right, n, compare) {
    var stack = [left, right],
        mid;

    while (stack.length) {
        right = stack.pop();
        left = stack.pop();

        if (right - left <= n) continue;

        mid = left + Math.ceil((right - left) / n / 2) * n;
        select(arr, left, right, mid, compare);

        stack.push(left, mid, mid, right);
    }
}

// Floyd-Rivest selection algorithm:
// sort an array between left and right (inclusive) so that the smallest k elements come first (unordered)
function select(arr, left, right, k, compare) {
    var n, i, z, s, sd, newLeft, newRight, t, j;

    while (right > left) {
        if (right - left > 600) {
            n = right - left + 1;
            i = k - left + 1;
            z = Math.log(n);
            s = 0.5 * Math.exp(2 * z / 3);
            sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (i - n / 2 < 0 ? -1 : 1);
            newLeft = Math.max(left, Math.floor(k - i * s / n + sd));
            newRight = Math.min(right, Math.floor(k + (n - i) * s / n + sd));
            select(arr, newLeft, newRight, k, compare);
        }

        t = arr[k];
        i = left;
        j = right;

        swap(arr, left, k);
        if (compare(arr[right], t) > 0) swap(arr, left, right);

        while (i < j) {
            swap(arr, i, j);
            i++;
            j--;
            while (compare(arr[i], t) < 0) i++;
            while (compare(arr[j], t) > 0) j--;
        }

        if (compare(arr[left], t) === 0) swap(arr, left, j);
        else {
            j++;
            swap(arr, j, right);
        }

        if (j <= k) left = j + 1;
        if (k <= j) right = j - 1;
    }
}

function swap(arr, i, j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}


// export as AMD/CommonJS module or global variable
if (typeof define === 'function' && define.amd) define('rbush', function () { return rbush; });
else if (typeof module !== 'undefined') return rbush;
else if (typeof self !== 'undefined') self.rbush = rbush;
else window.rbush = rbush;

})();

window.pointInPolygon = (function() {
return function (point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    
    var x = point[0], y = point[1];
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};

})();
window.polygonUtils = (function() {
/**
 * Miscellaneous polygon utilities.
 */

'use strict';

/**
 * @param {2d array of number} poly An array of 2D point arrays.
 * @return {array of numbe} The bounding box of the polygon, in
 *    `minX, minY, maxX, maxY` format.
 */
function getBoundingBox( poly ){
  var firstPt = poly[ 0 ];
  var bbox = [
    firstPt[ 0 ], firstPt[ 1 ],
    firstPt[ 0 ], firstPt[ 1 ]
  ];

  for( var ind = 1; ind < poly.length; ind++ ){
    var pt = poly[ ind ];

    var x = pt[ 0 ];
    if( x < bbox[ 0 ] ){
      bbox[ 0 ] = x;
    }
    else if( x > bbox[ 2 ] ){
      bbox[ 2 ] = x;
    }

    var y = pt[ 1 ];
    if( y < bbox[ 1 ] ){
      bbox[ 1 ] = y;
    }
    else if( y > bbox[ 3 ] ){
      bbox[ 3 ] = y;
    }
  }

  return bbox;
}

return {
  getBoundingBox: getBoundingBox
};

})();
window.PolygonLookup = (function() {
/**
 * Exports a `PolygonLookup` constructor, which constructs a data-structure for
 * quickly finding the polygon that a point intersects in a (potentially very
 * large) set.
 */

'use strict';

/**
 * @property {rbush} rtree A spatial index for `this.polygons`.
 * @property {object} polgons A GeoJSON feature collection.
 *
 * @param {object} [featureCollection] An optional GeoJSON feature collection
 *    to pass to `loadFeatureCollection()`.
 */
function PolygonLookup( featureCollection ){
  if( featureCollection !== undefined ){
    this.loadFeatureCollection( featureCollection );
  }
}

/**
 * Find the polygon that a point intersects. Execute a bounding-box search to
 * narrow down the candidate polygons to a small subset, and then perform
 * additional point-in-polygon intersections to resolve any ambiguities.
 *
 * @param {number} x The x-coordinate of the point.
 * @param {number} y The y-coordinate of the point.
 * @return {undefined|object} If one or more bounding box intersections are
 *    found, return the first polygon that intersects (`x`, `y`); otherwise,
 *    `undefined`.
 */
PolygonLookup.prototype.search = function search( x, y ){
  var bboxes = this.rtree.search( [ x, y, x, y ] );
  var pt = [ x, y ];
  for( var ind = 0; ind < bboxes.length; ind++ ){
    var polyObj = this.polygons[ bboxes[ ind ].polyId ];
    var polyCoords = polyObj.geometry.coordinates[ 0 ];
    if( pointInPolygon( pt, polyCoords ) ){
      var inHole = false;
      for( var subPolyInd = 1; subPolyInd < polyObj.geometry.coordinates.length; subPolyInd++ ){
        if( pointInPolygon( pt, polyObj.geometry.coordinates[ subPolyInd ] ) ){
          inHole = true;
          break;
        }
      }

      if( !inHole ){
        return polyObj;
      }
    }
  }
};

/**
 * Build a spatial index for a set of polygons, and store both the polygons and
 * the index in this `PolygonLookup`.
 *
 * @param {object} collection A GeoJSON-formatted FeatureCollection.
 */
PolygonLookup.prototype.loadFeatureCollection = function loadFeatureCollection( collection ){
  var bboxes = [];
  var polygons = [];
  var polyId = 0;

  function indexPolygon( poly ){
    polygons.push(poly);
    var bbox = polygonUtils.getBoundingBox( poly.geometry.coordinates[ 0 ] );
    bbox.polyId = polyId++;
    bboxes.push(bbox);
  }

  function indexFeature( poly ){
    if( poly.geometry.coordinates[ 0 ] !== undefined &&
        poly.geometry.coordinates[ 0 ].length > 0){
      switch( poly.geometry.type ){
        case 'Polygon':
          indexPolygon( poly );
          break;

        case 'MultiPolygon':
          var childPolys = poly.geometry.coordinates;
          for( var ind = 0; ind < childPolys.length; ind++ ){
            var childPoly = {
              type: 'Feature',
              properties: poly.properties,
              geometry: {
                type: 'Polygon',
                coordinates: childPolys[ ind ]
              }
            };
            indexPolygon( childPoly );
          }
          break;
      }
    }
  }

  collection.features.forEach( indexFeature );
  this.rtree = new rbush().load( bboxes );
  this.polygons = polygons;
};

return PolygonLookup;

})();
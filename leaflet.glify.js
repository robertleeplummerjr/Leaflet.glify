(function(window, document, L, undefined) {

    function defaults(userSettings) {
        var defaults = Glify.defaults,
            settings = {},
            i;

        for (i in defaults) if (defaults.hasOwnProperty(i)) {
            settings[i] = (userSettings.hasOwnProperty(i) ? userSettings[i] : defaults[i]);
        }

        return settings;
    }

    function Glify(settings) {
        var self = this;
        this.settings = defaults(settings);
        this.glLayer = L.canvasOverlay()
            .drawing(function(params) {
                self.drawOnCanvas(params);
            })
            .addTo(this.settings.map);

        var canvas = this.canvas = this.glLayer.canvas();
        this.glLayer.canvas.width = canvas.clientWidth;
        this.glLayer.canvas.height = canvas.clientHeight;
        this.gl = canvas.getContext('experimental-webgl', { antialias: true });

        this.pixelsToWebGLMatrix = new Float32Array(16);
        this.mapMatrix = new Float32Array(16);
        this.vertexShader = null;
        this.fragmentShader = null;
        this.program = null;
        this.verts = [];
        this.data = [];

        this.setup();
    }

    Glify.defaults = {
        map: null,
        clickPoint: function() {}
    };

    Glify.prototype = {
        setup: function setup() {
            this.setupVertexShader()
                .setupFragmentShader()
                .setupProgram();
        },
        render: function() {
            //  gl.disable(gl.DEPTH_TEST);
            // ----------------------------
            // look up the locations for the inputs to our shaders.
            var self = this,
                gl = this.gl,
                canvas = this.canvas,
                program = this.program,
                glLayer = this.glLayer,
                u_matLoc = this.u_matLoc = gl.getUniformLocation(program, "u_matrix"),
                colorLoc = gl.getAttribLocation(program, "a_color"),
                vertLoc = gl.getAttribLocation(program, "a_vertex");

            gl.aPointSize = gl.getAttribLocation(program, "a_pointSize");
            // Set the matrix to some that makes 1 unit 1 pixel.

            this.pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
            gl.viewport(0, 0, canvas.width, canvas.height);

            gl.uniformMatrix4fv(u_matLoc, false, this.pixelsToWebGLMatrix);

            // -- data
            this.data.map(function (d, i) {
                var pixel = self.latLongToPixelXY(d[0], d[1]);
                //-- 2 coord, 3 rgb colors interleaved buffer
                self.verts.push(pixel.x, pixel.y, Math.random(), Math.random(), Math.random());
            });

            var vertBuffer = gl.createBuffer(),
                vertArray = new Float32Array(this.verts),
                fsize = vertArray.BYTES_PER_ELEMENT;

            gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
            gl.vertexAttribPointer(vertLoc, 2, gl.FLOAT, false,fsize*5,0);
            gl.enableVertexAttribArray(vertLoc);
            // -- offset for color buffer
            gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, fsize*5, fsize*2);
            gl.enableVertexAttribArray(colorLoc);

            glLayer.redraw();

            return this;
        },
        setData: function(data) {
            this.data = data;

            return this;
        },
        setupVertexShader: function() {
            var gl = this.gl,
                vertexShader = gl.createShader(gl.VERTEX_SHADER);

            gl.shaderSource(vertexShader, this.vertexShaderTemplate);
            gl.compileShader(vertexShader);

            this.vertexShader = vertexShader;
            return this;
        },
        setupFragmentShader: function() {
            var gl = this.gl,
                fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

            gl.shaderSource(fragmentShader, this.fragmentShaderTemplate);
            gl.compileShader(fragmentShader);

            this.fragmentShader = fragmentShader;

            return this;
        },
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
        drawOnCanvas: function(params) {
            var gl = this.gl,
                canvas = this.canvas;

            if (gl == null) return;

            gl.clear(gl.COLOR_BUFFER_BIT);

            this.pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
            gl.viewport(0, 0, canvas.width, canvas.height);

            var pointSize = Math.max(leafletMap.getZoom() - 4.0, 1.0);
            gl.vertexAttrib1f(gl.aPointSize, pointSize);

            // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
            this.mapMatrix.set(this.pixelsToWebGLMatrix);

            var bounds = leafletMap.getBounds(),
                topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest()),
                offset = this.latLongToPixelXY(topLeft.lat, topLeft.lng),
                // -- Scale to current zoom
                scale = Math.pow(2, leafletMap.getZoom());

            this
                .scaleMatrix(this.mapMatrix, scale, scale)
                .translateMatrix(this.mapMatrix, -offset.x, -offset.y);

            // -- attach matrix value to 'mapMatrix' uniform in shader
            gl.uniformMatrix4fv(this.u_matLoc, false, this.mapMatrix);
            gl.drawArrays(gl.POINTS, 0, this.data.length);

            return this;
        },

        // Returns a random integer from 0 to range - 1.
        randomInt: function(range) {
            return Math.floor(Math.random() * range);
        },

        /*
         function latlonToPixels(lat, lon) {
         initialResolution = 2 * Math.PI * 6378137 / 256, // at zoomlevel 0
         originShift = 2 * Math.PI * 6378137 / 2;

         // -- to meters
         var mx = lon * originShift / 180;
         var my = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
         my = my * originShift / 180;


         // -- to pixels at zoom level 0

         var res = initialResolution;
         x = (mx + originShift) / res,
         y = (my + originShift) / res;


         return { x: x, y: 256- y };
         }
         */
        // -- converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
        // -- source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html
        latLongToPixelXY: function(latitude, longitude) {
            var pi_180 = Math.PI / 180.0,
                pi_4 = Math.PI * 4,
                sinLatitude = Math.sin(latitude * pi_180),
                pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256,
                pixelX = ((longitude + 180) / 360) * 256;

            return {
                x: pixelX,
                y: pixelY
            };
        },
        translateMatrix: function(matrix, tx, ty) {
            // translation is in last column of matrix
            matrix[12] += matrix[0] * tx + matrix[4] * ty;
            matrix[13] += matrix[1] * tx + matrix[5] * ty;
            matrix[14] += matrix[2] * tx + matrix[6] * ty;
            matrix[15] += matrix[3] * tx + matrix[7] * ty;

            return this;
        },
        scaleMatrix: function(matrix, scaleX, scaleY) {
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
        addTo: function(map) {
            this.glLayer.addTo(map);

            return this;
        },
        vertexShaderTemplate: '{{vertex-shader}}',
        fragmentShaderTemplate: '{{fragment-shader}}'
    };

    L.glify = function(settings) {
        return new L.Glify(settings);
    };

    L.Glify = Glify;
})(window, document, L);
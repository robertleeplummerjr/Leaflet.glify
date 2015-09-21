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

    /**
     *
     * @param settings
     * @constructor
     */
    function Glify(settings) {
        this.settings = defaults(settings);

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
        this.latLonLookup = null;

        this
            .setup()
            .render();
    }

    Glify.defaults = {
        map: null,
        data: [],
        vertexShader: '',
        fragmentShader: '',
        pointThreshold: 10,
        clickPoint: null
    };

    Glify.prototype = {
        /**
         *
         * @returns {Glify}
         */
        setup: function () {
            var self = this;
            this.settings.map.on('click', function(e) {
                self.lookup(e.latlng, e.containerPoint);
            });

            return this
                .setupVertexShader()
                .setupFragmentShader()
                .setupProgram();
        },

        /**
         *
         * @returns {Glify}
         */
        render: function() {
            //empty verts and repopulate
            this.verts = [];
            this.latLonLookup = {};
            // -- data
            this.settings.data.map(function (d, i) {
                var lat = d[0],
                    lon = d[1],
                    latLookupKey = lat.toFixed(2),
                    lonLookupKey = lon.toFixed(2),
                    latLonKey = latLookupKey + 'x' + lonLookupKey,
                    pixel = this.latLongToPixelXY(lat, lon),
                    lookup = this.latLonLookup[latLonKey];

                if (lookup === undefined) {
                    lookup = this.latLonLookup[latLonKey] = [];
                }

                lookup.push(pixel);

                //-- 2 coord, 3 rgb colors interleaved buffer
                this.verts.push(pixel.x, pixel.y, Math.random(), Math.random(), Math.random());
            }.bind(this));

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
         * @returns {Glify}
         */
        setData: function(data) {
            this.settings.data = data;
            return this;
        },

        /**
         *
         * @returns {Glify}
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
         * @returns {Glify}
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
         * @returns {Glify}
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
         * @returns {Glify}
         */
        drawOnCanvas: function(params) {
            if (this.gl == null) return this;

            var gl = this.gl,
                canvas = this.canvas,
                map = this.settings.map,
                zoom = map.getZoom(),
                bounds = map.getBounds(),
                topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest()),
                offset = this.latLongToPixelXY(topLeft.lat, topLeft.lng),
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
        latLongToPixelXY: function(latitude, longitude) {
            var pi180 = Math.PI / 180.0,
                pi4 = Math.PI * 4,
                sinLatitude = Math.sin(latitude * pi180),
                pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi4)) * 256,
                pixelX = ((longitude + 180) / 360) * 256;

            return {
                lat: latitude,
                lon: longitude,
                x: pixelX,
                y: pixelY
            };
        },

        /**
         *
         * @param tx
         * @param ty
         * @returns {Glify}
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
         * @returns {Glify}
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
         * @returns {Glify}
         */
        addTo: function(map) {
            this.glLayer.addTo(map);

            return this;
        },

        /**
         *
         * @param {L.LatLng} coords
         * @param {L.Point} containerPoint
         */
        lookup: function(coords, containerPoint) {
            var latLookupKey = coords.lat.toFixed(2),
                lonLookupKey = coords.lng.toFixed(2),
                standardLatLonKey = latLookupKey + 'x' + lonLookupKey,

                settings = this.settings,
                map = settings.map,
                pointThreshold = settings.pointThreshold,

                leftThreshold = containerPoint.x - pointThreshold,
                rightThreshold = containerPoint.x + pointThreshold,
                topThreshold = containerPoint.y - pointThreshold,
                bottomThreshold = containerPoint.y + pointThreshold,

                neThreshold = map.containerPointToLatLng(new L.Path(leftThreshold, topThreshold)),
                swThreshold = map.containerPointToLatLng(new L.Path(rightThreshold, bottomThreshold)),

                neThresholdLatLonKey = neThreshold.lat.toFixed(2) + 'x' + neThreshold.lng.toFixed(2),
                swThresholdLatLonKey = swThreshold.lat.toFixed(2) + 'x' + swThreshold.lng.toFixed(2);

            

        }
    };

    L.glify = function(settings) {
        return new L.Glify(settings);
    };

    L.Glify = Glify;
})(window, document, L);
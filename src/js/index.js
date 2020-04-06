var Points = require('./points');
var Shapes = require('./shapes');
var Lines = require('./lines');
var mapMatrix = require('./map-matrix');
var glify = {
  longitudeKey: 1,
  latitudeKey: 0,
  longitudeFirst: function() {
    glify.longitudeKey = 0;
    glify.latitudeKey = 1;
    return glify;
  },
  latitudeFirst: function() {
    glify.latitudeKey = 0;
    glify.longitudeKey = 1;
    return glify;
  },
  get instances() {
    return []
      .concat(Points.instances)
      .concat(Shapes.instances);
  },
  points: function(settings) {
    var extendedSettings = {
      setupClick: glify.setupClick.bind(this),
      attachShaderVars: glify.attachShaderVars.bind(this),
      latitudeKey: glify.latitudeKey,
      longitudeKey: glify.longitudeKey,
      vertexShaderSource: function() { return glify.shader.vertex; },
      fragmentShaderSource: function() { return glify.shader.fragment.point; },
      color: glify.color.random,
      closest: glify.closest.bind(this)
    };
    for (var p in settings) {
      extendedSettings[p] = settings[p];
    }
    return new Points(extendedSettings);
  },
  shapes: function(settings) {
    var extendedSettings = {
      setupClick: glify.setupClick.bind(this),
      attachShaderVars: glify.attachShaderVars.bind(this),
      latitudeKey: glify.latitudeKey,
      longitudeKey: glify.longitudeKey,
      vertexShaderSource: function() { return glify.shader.vertex; },
      fragmentShaderSource: function() { return glify.shader.fragment.polygon; },
      color: glify.color.random,
      closest: glify.closest.bind(this)
    };
    for (var p in settings) {
      extendedSettings[p] = settings[p];
    }
    return new Shapes(extendedSettings);
  },
  lines: function(settings) {
    var extendedSettings = {
      setupClick: glify.setupClick.bind(this),
      attachShaderVars: glify.attachShaderVars.bind(this),
      latitudeKey: glify.latitudeKey,
      longitudeKey: glify.longitudeKey,
      vertexShaderSource: function() { return glify.shader.vertex; },
      fragmentShaderSource: function() { return glify.shader.fragment.polygon; },
      color: glify.color.random,
      closest: glify.closest.bind(this)
    };
    for (var p in settings) {
      extendedSettings[p] = settings[p];
    }
    return new Lines(extendedSettings);
  },
  Points: Points,
  Shapes: Shapes,
  Lines: Lines,
  maps: [],
  setupClick: function(map) {
    if (this.maps.indexOf(map) < 0) {
      this.maps.push(map);
      map.on('click', function (e) {
        var hit;
        hit = Shapes.tryClick(e, map); 
        if (hit !== undefined) return hit;

        hit = Points.tryClick(e, map);
        if (hit !== undefined) return hit;

        hit = Lines.tryClick(e, map);
        if (hit !== undefined) return hit;


      });
    }
  },
  pointInCircle: function (centerPoint, checkPoint, radius) {
    var distanceSquared = (centerPoint.x - checkPoint.x) * (centerPoint.x - checkPoint.x) + (centerPoint.y - checkPoint.y) * (centerPoint.y - checkPoint.y);
    return distanceSquared <= radius * radius;
  },
  attachShaderVars: function(byteCount, gl, program, attributes) {
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
      gl.vertexAttribPointer(loc, attribute.size, gl[attribute.type], attribute.normalize ? true : false, byteCount * (attribute.bytes || bytes), byteCount * attribute.start);
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
      return glify.color.gray;
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
          return glify.color.green;
        case 1:
          return glify.color.red;
        case 2:
          return glify.color.blue;
        case 3:
          return glify.color.teal;
        case 4:
          return glify.color.yellow;
      }
    }
  },
  mapMatrix: mapMatrix,
  shader: {
    vertex: `uniform mat4 matrix;
    attribute vec4 vertex;
    attribute float pointSize;
    attribute vec4 color;
    varying vec4 _color;
    
    void main() {
      //set the size of the point
      gl_PointSize = pointSize;
    
      //multiply each vertex by a matrix.
      gl_Position = matrix * vertex;
    
      //pass the color to the fragment shader
      _color = color;
    }`,
    fragment: {
      dot: `precision mediump float;
      uniform vec4 color;
      uniform float opacity;
      
      void main() {
          float border = 0.05;
          float radius = 0.5;
          vec2 center = vec2(0.5);
      
          vec4 color0 = vec4(0.0);
          vec4 color1 = vec4(color[0], color[1], color[2], opacity);
      
          vec2 m = gl_PointCoord.xy - center;
          float dist = radius - sqrt(m.x * m.x + m.y * m.y);
      
          float t = 0.0;
          if (dist > border) {
              t = 1.0;
          } else if (dist > 0.0) {
              t = dist / border;
          }
      
          //works for overlapping circles if blending is enabled
          gl_FragColor = mix(color0, color1, t);
      }`,
      point: `precision mediump float;
      varying vec4 _color;
      uniform float opacity;
      
      void main() {
        float border = 0.1;
        float radius = 0.5;
        vec2 center = vec2(0.5, 0.5);
      
        vec4 pointColor = vec4(_color[0], _color[1], _color[2], opacity);
      
        vec2 m = gl_PointCoord.xy - center;
        float dist1 = radius - sqrt(m.x * m.x + m.y * m.y);
      
        float t1 = 0.0;
        if (dist1 > border) {
            t1 = 1.0;
        } else if (dist1 > 0.0) {
            t1 = dist1 / border;
        }
      
        //works for overlapping circles if blending is enabled
        //gl_FragColor = mix(color0, color1, t);
      
        //border
        float outerBorder = 0.05;
        float innerBorder = 0.8;
        vec4 borderColor = vec4(0, 0, 0, 0.4);
        vec2 uv = gl_PointCoord.xy;
        vec4 clearColor = vec4(0, 0, 0, 0);
        
        // Offset uv with the center of the circle.
        uv -= center;
        
        float dist2 =  sqrt(dot(uv, uv));
       
        float t2 = 1.0 + smoothstep(radius, radius + outerBorder, dist2)
                      - smoothstep(radius - innerBorder, radius, dist2);
       
        gl_FragColor = mix(mix(borderColor, clearColor, t2), pointColor, t1);
      }`,
      puck: `precision mediump float;
      varying vec4 _color;
      uniform float opacity;
      
      void main() {
        vec2 center = vec2(0.5);
        vec2 uv = gl_PointCoord.xy - center;
        float smoothing = 0.005;
        vec4 _color1 = vec4(_color[0], _color[1], _color[2], opacity);
        float radius1 = 0.3;
        vec4 _color2 = vec4(_color[0], _color[1], _color[2], opacity);
        float radius2 = 0.5;
        float dist = length(uv);
      
        //SMOOTH
        float gamma = 2.2;
        color1.rgb = pow(_color1.rgb, vec3(gamma));
        color2.rgb = pow(_color2.rgb, vec3(gamma));
      
        vec4 puck = mix(
          mix(
            _color1,
            _color2,
            smoothstep(
              radius1 - smoothing,
              radius1 + smoothing,
              dist
            )
          ),
          vec4(0,0,0,0),
            smoothstep(
              radius2 - smoothing,
              radius2 + smoothing,
              dist
          )
        );
      
        //Gamma correction (prevents color fringes)
        puck.rgb = pow(puck.rgb, vec3(1.0 / gamma));
        gl_FragColor = puck;
      }`,
      simpleCircle: `precision mediump float;
      uniform float opacity;
      
      void main() {
      
          float border = 0.05;
          float radius = 0.5;
          vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);
          vec4 color1 = vec4(color[0], color[1], color[2], opacity);
      
          vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5);
          float dist = radius - sqrt(m.x * m.x + m.y * m.y);
      
          float t = 0.0;
          if (dist > border) {
              t = 1.0;
          } else if (dist > 0.0) {
              t = dist / border;
          }
      
          //simple circles
          float d = distance (gl_PointCoord, vec2(0.5, 0.5));
          if (d < 0.5 ){
              gl_FragColor = color1;
          } else {
              discard;
          }
      }`,
      square: `precision mediump float;
      uniform float opacity;
      
      void main() {
          float border = 0.05;
          float radius = 0.5;
          vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);
          vec4 color1 = vec4(color[0], color[1], color[2], opacity);
          vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5);
          float dist = radius - sqrt(m.x * m.x + m.y * m.y);
      
          float t = 0.0;
          if (dist > border) {
              t = 1.0;
          } else if (dist > 0.0) {
              t = dist / border;
          }
      
          //squares
          gl_FragColor = vec4(color[0], color[1], color[2], opacity);
      }`,
      polygon: `precision mediump float;
      uniform float opacity;
      varying vec4 _color;
      
      void main() {
        gl_FragColor = vec4(_color[0], _color[1], _color[2], opacity);
      }`
    }
  }
};

module.exports = glify;
if (typeof window !== 'undefined' && window.L) {
  window.L.glify = glify;
}
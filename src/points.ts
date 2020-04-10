import { pointInCircle } from './utils';
import { latLng, LatLng } from './leaflet-bindings';
import { Base, IBaseSettings } from './base';

export interface IPointsSettings extends IBaseSettings {
  closest: (targetLocation, points, map) => Points;
  size: (i: number, latLng: typeof LatLng) => number;
  eachVertex?: (dataLatLng, pixel, color) => void;
}

const defaults: IPointsSettings = {
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
    vertex: {
      type: 'FLOAT',
      start: 0,
      size: 2,
      bytes: 6
    },
    color: {
      type: 'FLOAT',
      start: 2,
      size: 3,
      bytes: 6
    },
    pointSize: {
      type: 'FLOAT',
      start: 5,
      size: 1,
      bytes: 6
    },
  }
};

export class Points extends Base<IPointsSettings> {
  static instances: Points[] = [];
  static defaults = defaults;
  static maps = [];
  latLngLookup: { [key: string]: number[] };
  verts: number[];

  constructor(settings) {
    super(settings);
    Points.instances.push(this);
    this.settings = {...Points.defaults, ...settings};

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');

    this.active = true;

    this
      .setup()
      .render();
  }

  render(): this {

    this.resetVertices();

    //look up the locations for the inputs to our shaders.
    const gl = this.gl
      , settings = this.settings
      , canvas = this.canvas
      , program = this.program
      , glLayer = this.glLayer
      , matrix = this.matrix = gl.getUniformLocation(program, 'matrix')
      , opacity = gl.getUniformLocation(program, 'opacity')
      , vertexBuffer = gl.createBuffer()
      , vertexArray = new Float32Array(this.verts)
      , byteCount = vertexArray.BYTES_PER_ELEMENT
      ;

    //set the matrix to some that makes 1 unit 1 pixel.
    this.pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(matrix, false, this.pixelsToWebGLMatrix);
    gl.uniform1f(opacity, this.settings.opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

    if (settings.shaderVars !== null) {
      this.settings.attachShaderVars(byteCount, gl, program, settings.shaderVars);
    }

    glLayer.redraw();

    return this;
  }

  resetVertices() {
    //empty verts and repopulate
    this.latLngLookup = {};
    this.verts = [];

    // -- data
    const verts = this.verts
      , settings = this.settings
      , data = settings.data
      , max = data.length
      , latLngLookup = this.latLngLookup
      , latitudeKey = settings.latitudeKey
      , longitudeKey = settings.longitudeKey
      ;
    let colorFn
      , color = settings.color
      , size = settings.size
      , sizeFn
      , dataLatLng
      , pixel
      , lookup
      , key
      , i = 0
      ;

    if (color === null) {
      throw new Error('color is not properly defined');
    } else if (typeof color === 'function') {
      colorFn = color;
      color = undefined;
    }

    if (size === null) {
      throw new Error('size is not properly defined');
    } else if (typeof size === 'function') {
      sizeFn = size;
      size = undefined;
    }

    for (; i < max; i++) {
      dataLatLng = data[i];
      key = dataLatLng[latitudeKey].toFixed(2) + 'x' + dataLatLng[longitudeKey].toFixed(2);
      lookup = latLngLookup[key];
      pixel = settings.map.project(latLng(dataLatLng[latitudeKey], dataLatLng[longitudeKey]), 0);

      if (lookup === undefined) {
        lookup = latLngLookup[key] = [];
      }

      lookup.push(dataLatLng);

      if (colorFn) {
        color = colorFn(i, dataLatLng);
      }

      if (sizeFn) {
        size = sizeFn(i, dataLatLng);
      }

      //-- 2 coord, 3 rgb colors, 1 size interleaved buffer
      verts.push(pixel.x, pixel.y, color.r, color.g, color.b, size);
      if (settings.eachVertex !== null) {
        settings.eachVertex.call(this, dataLatLng, pixel, color);
      }
    }

    return this;
  }

  pointSize(pointIndex) {
    const settings = this.settings,
      map = settings.map,
      size = settings.size,
      pointSize = typeof size === 'function' ? size(pointIndex, null) : size,
      // -- Scale to current zoom
      zoom = map.getZoom();

    return pointSize === null ? Math.max(zoom - 4.0, 1.0) : pointSize;
  }

  drawOnCanvas(): this {
    if (this.gl == null) return this;

    const gl = this.gl,
      canvas = this.canvas,
      settings = this.settings,
      map = settings.map,
      bounds = map.getBounds(),
      topLeft = new LatLng(bounds.getNorth(), bounds.getWest()),
      offset = map.project(topLeft, 0),
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
    gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);
    gl.drawArrays(gl.POINTS, 0, settings.data.length);

    return this;
  }

  lookup(coords): typeof LatLng {
    const xMax = coords.lat + 0.03
      , yMax = coords.lng + 0.03
      , matches = []
      ;
    let x = coords.lat - 0.03
      , y
      , foundI
      , foundMax
      , found
      , key
      ;

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
  }

  static tryClick(e, map) {
    const closestFromEach = []
      , instancesLookup = {}
      ;
    let result
      , settings
      , instance
      , point
      , xy
      , found
      , foundLatLng
      ;

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

    foundLatLng = latLng(found[settings.latitudeKey], found[settings.longitudeKey]);
    xy = map.latLngToLayerPoint(foundLatLng);

    const pointIndex = typeof instance.settings.size === 'function' ? instance.settings.data.indexOf(found) : null;
    if (pointInCircle(xy, e.layerPoint, instance.pointSize(pointIndex) * instance.settings.sensitivity)) {
      result = instance.settings.click(e, found, xy);
      return result !== undefined ? result : true;
    }
  }
}

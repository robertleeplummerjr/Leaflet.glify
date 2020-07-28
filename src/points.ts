import { Feature, Point as GeoPoint } from 'geojson';

import { Base, IBaseSettings } from './base';
import { ICanvasOverlayDrawEvent } from './canvas-overlay';
import { Color, IColor } from './color';
import { LeafletMouseEvent, Map, Point, LatLng, Projection } from './leaflet-bindings';
import { IPixel } from './pixel';
import { locationDistance, pointInCircle } from './utils';
import L from 'leaflet';

export interface IPointsSettings extends IBaseSettings {
  size: ((i: number, latLng: LatLng) => number) | number;
  eachVertex?: (this: Points, latLng: LatLng, pixel: IPixel, color: IColor) => void;
  sensitivity?: number;
  sensitivityHover?: number;
}

const defaults: IPointsSettings = {
  map: null,
  data: [],
  longitudeKey: null,
  latitudeKey: null,
  setupClick: null,
  setupHover: null,
  vertexShaderSource: null,
  fragmentShaderSource: null,
  eachVertex: null,
  click: null,
  hover: null,
  color: Color.random,
  opacity: 0.8,
  size: null,
  className: '',
  sensitivity: 2,
  sensitivityHover: 0.03,
  shaderVariables: {
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

export interface IPointLookup {
  latLng: LatLng;
  pixel: IPixel;
  chosenColor: IColor;
  chosenSize: number;
  key: string;
  feature?: any;
}

export class Points extends Base<IPointsSettings> {
  static instances: Points[] = [];
  static defaults = defaults;
  static maps = [];
  latLngLookup: {
    [key: string]: IPointLookup[];
  };
  allLatLngLookup: IPointLookup[];
  vertices: number[];
  dataFormat: 'Array' | 'GeoJson.FeatureCollection';

  constructor(settings) {
    super(settings);
    Points.instances.push(this);
    this.settings = {...Points.defaults, ...settings};

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');

    this.active = true;

    const { data } = this.settings;
    if (Array.isArray(data)) {
      this.dataFormat = 'Array';
    } else if (data.type === 'FeatureCollection') {
      this.dataFormat = 'GeoJson.FeatureCollection';
    } else {
      throw new Error('unhandled data type. Supported types are Array and GeoJson.FeatureCollection');
    }

    // @ts-ignore
    if (this.settings.map.options.crs.projection.project !== Projection.SphericalMercator.project) {
      console.warn('layer designed for SphericalMercator, alternate detected');
    }

    this
      .setup()
      .render();
  }

  render(): this {

    this.resetVertices();

    //look up the locations for the inputs to our shaders.
    const { gl, settings, canvas, program, layer, vertices, pixelsToWebGLMatrix } = this
      , matrix = this.matrix = gl.getUniformLocation(program, 'matrix')
      , opacity = gl.getUniformLocation(program, 'opacity')
      , vertexBuffer = gl.createBuffer()
      , vertexArray = new Float32Array(vertices)
      , byteCount = vertexArray.BYTES_PER_ELEMENT
      ;

    //set the matrix to some that makes 1 unit 1 pixel.
    pixelsToWebGLMatrix.set([
      2 / canvas.width, 0, 0, 0,
      0, -2 / canvas.height, 0, 0,
      0, 0, 0, 0,
      -1, 1, 0, 1
    ]);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(matrix, false, pixelsToWebGLMatrix);
    gl.uniform1f(opacity, settings.opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

    this.attachShaderVariables(byteCount);

    layer.redraw();

    return this;
  }

  resetVertices() {
    //empty vertices and repopulate
    this.latLngLookup = {};
    this.allLatLngLookup = [];
    this.vertices = [];

    const { vertices, latLngLookup } = this
      , { latitudeKey, longitudeKey, data, map, eachVertex } = this.settings
      ;
    let colorFn: (i: number, latLng: LatLng | any) => IColor
      , { color, size } = this.settings
      , chosenColor
      , chosenSize
      , sizeFn
      , latLng
      , pixel: Point
      , key
      ;

    if (!color) {
      throw new Error('color is not properly defined');
    } else if (typeof color === 'function') {
      colorFn = color as (i: number, latLng: LatLng) => IColor;
    }

    if (!size) {
      throw new Error('size is not properly defined');
    } else if (typeof size === 'function') {
      sizeFn = size;
    }

    if (this.dataFormat === 'Array') {
      const max = data.length;
      for (let i = 0; i < max; i++) {
        latLng = data[i];
        key = latLng[latitudeKey].toFixed(2) + 'x' + latLng[longitudeKey].toFixed(2);
        pixel = map.project(new LatLng(latLng[latitudeKey], latLng[longitudeKey]), 0);

        if (colorFn) {
          chosenColor = colorFn(i, latLng) as IColor;
        } else {
          chosenColor = color as IColor;
        }

        if (sizeFn) {
          chosenSize = sizeFn(i, latLng) as number;
        } else {
          chosenSize = size as number;
        }

        //-- 2 coord, 3 rgb colors, 1 size interleaved buffer
        vertices.push(pixel.x, pixel.y, chosenColor.r, chosenColor.g, chosenColor.b, chosenSize);

        const lookup = { latLng, key, pixel, chosenColor, chosenSize };
        (latLngLookup[key] || (latLngLookup[key] = []))
          .push(lookup);
        this.allLatLngLookup.push(lookup);
        if (eachVertex) {
          eachVertex.call(this, latLng, pixel, chosenSize);
        }
      }
    } else if (this.dataFormat === 'GeoJson.FeatureCollection') {
      const max = data.features.length;
      for (let i = 0; i < max; i++) {
        const feature = data.features[i] as Feature<GeoPoint>;
        latLng = feature.geometry.coordinates;
        key = latLng[latitudeKey].toFixed(2) + 'x' + latLng[longitudeKey].toFixed(2);
        pixel = map.project(new LatLng(latLng[latitudeKey], latLng[longitudeKey]), 0);

        if (colorFn) {
          chosenColor = colorFn(i, feature) as IColor;
        } else {
          chosenColor = color as IColor;
        }

        if (sizeFn) {
          chosenSize = sizeFn(i, latLng) as number;
        } else {
          chosenSize = size as number;
        }

        //-- 2 coord, 3 rgb colors, 1 size interleaved buffer
        vertices.push(pixel.x, pixel.y, chosenColor.r, chosenColor.g, chosenColor.b, chosenSize);

        const lookup = { latLng, key, pixel, chosenColor, chosenSize, feature, };
        (latLngLookup[key] || (latLngLookup[key] = []))
          .push(lookup);
        this.allLatLngLookup.push(lookup);
        if (eachVertex) {
          eachVertex.call(this, latLng, pixel, chosenSize);
        }
      }
    }

    return this;
  }

  pointSize(pointIndex): number {
    const { map, size } = this.settings
      , pointSize = typeof size === 'function' ? size(pointIndex, null) : size
      // -- Scale to current zoom
      , zoom = map.getZoom()
      ;

    return pointSize === null ? Math.max(zoom - 4.0, 1.0) : pointSize;
  }

  drawOnCanvas(e: ICanvasOverlayDrawEvent): this {
    if (!this.gl) return this;

    const { gl, canvas, settings, mapMatrix, matrix, pixelsToWebGLMatrix, vertices } = this
      , map = settings.map
      , { offset } = e
      , zoom = map.getZoom()
      , scale = Math.pow(2, zoom)
      ;

    pixelsToWebGLMatrix.set([
      2 / canvas.width, 0, 0, 0,
      0, -2 / canvas.height, 0, 0,
      0, 0, 0, 0,
      -1, 1, 0, 1
    ]);

    //set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix
      .set(pixelsToWebGLMatrix)
      .scaleMatrix(scale)
      .translateMatrix(-offset.x, -offset.y);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(matrix, false, mapMatrix.array);
    gl.drawArrays(gl.POINTS, 0, vertices.length / 6);

    return this;
  }

  lookup(coords: LatLng): IPointLookup {
    const xMax: number = coords.lat + 0.03
      , yMax: number = coords.lng + 0.03
      , matches: IPointLookup[] = []
      ;
    let x = coords.lat - 0.03
      , y: number
      , foundI: number
      , foundMax: number
      , found: IPointLookup[]
      , key: string
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

    const { map } = this.settings;

    //try matches first, if it is empty, try the data, and hope it isn't too big
    return Points.closest(
      coords,
      matches.length > 0
        ? matches
        : this.allLatLngLookup,
      map
    );
  }

  static closest(targetLocation: LatLng, points: IPointLookup[], map: Map): IPointLookup {
    if (points.length < 1) return null;
    return points.reduce((prev, curr) => {
      const prevDistance = locationDistance(targetLocation, prev.latLng, map)
        , currDistance = locationDistance(targetLocation, curr.latLng, map)
        ;
      return (prevDistance < currDistance) ? prev : curr;
    });
  }

  static tryClick(e: LeafletMouseEvent, map: Map): boolean | void {
    const closestFromEach: IPointLookup[] = []
      , instancesLookup = {}
      ;
    let result
      , settings: IPointsSettings
      , instance: Points
      , pointLookup: IPointLookup
      , xy: Point
      , found: IPointLookup
      , foundLatLng
      ;

    Points.instances.forEach((_instance) => {
      settings = _instance.settings;
      if (!_instance.active) return;
      if (settings.map !== map) return;
      if (!settings.click) return;

      pointLookup = _instance.lookup(e.latlng);
      instancesLookup[pointLookup.key] = _instance;
      closestFromEach.push(pointLookup);
    });

    if (closestFromEach.length < 1) return;
    if (!settings) return;

    found = this.closest(e.latlng, closestFromEach, map);

    if (found === null) return;

    instance = instancesLookup[found.key];
    if (!instance) return;
    const { latitudeKey, longitudeKey, sensitivity, click } = instance.settings;

    foundLatLng = new LatLng(found.latLng[latitudeKey], found.latLng[longitudeKey]);
    xy = map.latLngToLayerPoint(foundLatLng);

    if (pointInCircle(
      xy,
      e.layerPoint,
      found.chosenSize * sensitivity
    )) {
      result = click(e, found.feature || found.latLng, xy);
      return result !== undefined ? result : true;
    }
  }

  static tryHover(e: LeafletMouseEvent, map: Map): boolean | void {
    const closestFromEach: IPointLookup[] = []
      , instancesLookup = {}
      ;
    let result
      , settings: IPointsSettings
      , instance: Points
      , pointLookup: IPointLookup
      , xy: Point
      , found: IPointLookup
      , foundLatLng
      ;

    Points.instances.forEach((_instance) => {
      settings = _instance.settings;
      if (!_instance.active) return;
      if (settings.map !== map) return;
      if (!settings.hover) return;

      pointLookup = _instance.lookup(e.latlng);
      instancesLookup[pointLookup.key] = _instance;
      closestFromEach.push(pointLookup);
    });

    if (closestFromEach.length < 1) return;
    if (!settings) return;

    found = this.closest(e.latlng, closestFromEach, map);

    if (found === null) return;

    instance = instancesLookup[found.key];
    if (!instance) return;
    const { latitudeKey, longitudeKey, sensitivityHover, hover } = instance.settings;

    foundLatLng = new LatLng(found.latLng[latitudeKey], found.latLng[longitudeKey]);
    xy = map.latLngToLayerPoint(foundLatLng);

    var highlight = instance.settings.highlight;

    if (pointInCircle(
      xy,
      e.layerPoint,
      found.chosenSize * sensitivityHover
    )) {
      result = hover(e, found.feature || found.latLng, xy);

      if (highlight) {
        if (map["highlightPoints"]) {
          map["highlightPoints"].remove();
          delete map["highlightPoints"];
        }
        
        map["highlightPoints"] = L.glify.points({
          map: map,
          data: [found.latLng],
          color: highlight.color ? highlight.color : {"r":1, "g":0, "b":0},
          size: Number(instance.settings.size) * (highlight && highlight.size ? highlight.size : 1.5),
          opacity: highlight.opacity ? highlight.opacity : 0.8
        })
      }
      return result !== undefined ? result : true;
    } else {
      // Remove the highlighted Point again if no feature was hovered
      if (highlight && map["highlightPoints"]) {
        map["highlightPoints"].remove();
        delete map["highlightPoints"];
      }   
      return;
    }
  }
}

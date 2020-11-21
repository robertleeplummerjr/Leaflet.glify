import { Feature, Point as GeoPoint } from 'geojson';

import { Base, IBaseSettings } from './base';
import { ICanvasOverlayDrawEvent } from './canvas-overlay';
import { Color, IColor } from './color';
import { LeafletMouseEvent, Map, Point, LatLng, Projection } from 'leaflet';
import { IPixel } from './pixel';
import { locationDistance, pointInCircle } from './utils';

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
    },
    color: {
      type: 'FLOAT',
      start: 2,
      size: 4,
    },
    pointSize: {
      type: 'FLOAT',
      start: 6,
      size: 1,
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
  bytes = 7;
  latLngLookup: {
    [key: string]: IPointLookup[];
  };
  allLatLngLookup: IPointLookup[];
  vertices: number[];
  typedVertices: Float32Array;
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
    const { gl, canvas, layer, vertices, mapMatrix } = this
      , matrix = this.matrix = this.getUniformLocation('matrix')
      , verticesBuffer = this.getBuffer('vertices')
      , verticesTypedArray = this.typedVertices = new Float32Array(vertices)
      , byteCount = verticesTypedArray.BYTES_PER_ELEMENT
      ;

    //set the matrix to some that makes 1 unit 1 pixel.
    mapMatrix.setSize(canvas.width, canvas.height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(matrix, false, mapMatrix.array);
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTypedArray, gl.STATIC_DRAW);

    this.attachShaderVariables(byteCount);

    layer.redraw();

    return this;
  }

  getPointLookup(key: string): IPointLookup[] {
    return (this.latLngLookup[key] || (this.latLngLookup[key] = []));
  }

  addLookup(lookup: IPointLookup): this {
    this.getPointLookup(lookup.key).push(lookup);
    this.allLatLngLookup.push(lookup);
    return this;
  }

  resetVertices(): this {
    //empty vertices and repopulate
    this.latLngLookup = {};
    this.allLatLngLookup = [];
    this.vertices = [];

    const { vertices, settings } = this
      , { latitudeKey, longitudeKey, data, map, eachVertex, color, size, opacity } = settings
      ;
    let colorFn: (i: number, latLng: LatLng | any) => IColor
      , chosenColor: IColor
      , chosenSize: number
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

        chosenColor = { ...chosenColor, a: chosenColor.a || opacity };

        if (sizeFn) {
          chosenSize = sizeFn(i, latLng) as number;
        } else {
          chosenSize = size as number;
        }

        vertices.push(
          // vertex
          pixel.x,
          pixel.y,

          // color
          chosenColor.r,
          chosenColor.g,
          chosenColor.b,
          chosenColor.a,

          // size
          chosenSize
        );
        this.addLookup({
          latLng,
          key,
          pixel,
          chosenColor,
          chosenSize
        });
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

        chosenColor = { ...chosenColor, a: chosenColor.a || opacity };

        if (sizeFn) {
          chosenSize = sizeFn(i, latLng) as number;
        } else {
          chosenSize = size as number;
        }

        vertices.push(
          // vertex
          pixel.x,
          pixel.y,

          // color
          chosenColor.r,
          chosenColor.g,
          chosenColor.b,
          chosenColor.a,

          // size
          chosenSize
        );
        this.addLookup({
          latLng,
          key,
          pixel,
          chosenColor,
          chosenSize,
          feature
        });
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

    const { gl, canvas, settings, mapMatrix, matrix } = this
      , { map } = settings
      , { offset } = e
      , zoom = map.getZoom()
      , scale = Math.pow(2, zoom)
      ;

    //set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix
      .setSize(canvas.width, canvas.height)
      .scaleMatrix(scale)
      .translateMatrix(-offset.x, -offset.y);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(matrix, false, mapMatrix.array);
    gl.drawArrays(gl.POINTS, 0, this.allLatLngLookup.length);

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

    if (pointInCircle(
      xy,
      e.layerPoint,
      found.chosenSize * sensitivityHover
    )) {
      result = hover(e, found.feature || found.latLng, xy);
      return result !== undefined ? result : true;
    }
  }
}

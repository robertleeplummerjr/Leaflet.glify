import { Map } from 'leaflet';
import earcut from 'earcut';
// import {FeatureCollection, GeoJsonObject} from 'geojson';
import PolygonLookup from 'polygon-lookup';
import geojsonFlatten from 'geojson-flatten';

import { LatLng, latLng } from './leaflet-bindings';
import { CanvasOverlay } from './canvasoverlay';
import { MapMatrix } from './map-matrix';
import { Base, IBaseSettings } from './base';

export interface IShapeSettings extends IBaseSettings {
}

const defaults: IShapeSettings = {
  map: null,
  data: [],
  longitudeKey: null,
  latitudeKey: null,
  attachShaderVars: null,
  setupClick: null,
  vertexShaderSource: null,
  fragmentShaderSource: null,
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

export class Shapes extends Base<IShapeSettings> {
  static instances: Shapes[] = [];
  static defaults = defaults;
  static maps: Map[];

  active: boolean;
  settings: IShapeSettings;
  glLayer: CanvasOverlay;
  canvas: HTMLCanvasElement;
  pixelsToWebGLMatrix: Float32Array;
  mapMatrix: MapMatrix;
  matrix: WebGLUniformLocation;
  verts: number[];
  polygonLookup: PolygonLookup;
  aPointSize: number;

  constructor(settings: IShapeSettings) {
    super(settings);
    Shapes.instances.push(this);
    this.settings = { ...Shapes.defaults, ...settings };

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');
    this.polygonLookup = null;

    this
      .setup()
      .render();
  }

  render(): this {
    this.resetVertices();
    // triangles or point count

    const pixelsToWebGLMatrix = this.pixelsToWebGLMatrix
      , settings = this.settings
      , canvas = this.canvas
      , gl = this.gl
      , glLayer = this.glLayer
      , verts = this.verts
      , vertexBuffer = gl.createBuffer()
      , vertArray = new Float32Array(verts)
      , size = vertArray.BYTES_PER_ELEMENT
      , program = this.program
      , vertex = gl.getAttribLocation(program, 'vertex')
      , opacity = gl.getUniformLocation(program, 'opacity')
      ;
    gl.uniform1f(opacity, this.settings.opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, size * 5, 0);
    gl.enableVertexAttribArray(vertex);

    //  gl.disable(gl.DEPTH_TEST);
    // ----------------------------
    // look up the locations for the inputs to our shaders.
    this.matrix = gl.getUniformLocation(program, 'matrix');
    this.aPointSize = gl.getAttribLocation(program, 'pointSize');

    // Set the matrix to some that makes 1 unit 1 pixel.
    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.uniformMatrix4fv(this.matrix, false, pixelsToWebGLMatrix);

    if (settings.shaderVars !== null) {
      settings.attachShaderVars(size, gl, program, settings.shaderVars);
    }

    glLayer.redraw();

    return this;
  }

  resetVertices(): this {
    this.verts = [];
    this.polygonLookup = new PolygonLookup();

    const verts = this.verts
      , polygonLookup = this.polygonLookup
      , settings = this.settings
      , data = settings.data as any
      ;

    let pixel
      , index
      , features
      , feature
      , color = settings.color
      , colorFn
      , coordinates
      , featureIndex = 0
      , featureMax
      , triangles
      , indices
      , flat
      , dim
      ;

    switch (data.type) {
      case 'Feature':
        polygonLookup.loadFeatureCollection({
          type: 'FeatureCollection',
          features: [data]
        });
        features = geojsonFlatten(data);
        break;
      case 'MultiPolygon':
        polygonLookup.loadFeatureCollection({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: { id: 'bar' },
            geometry: { coordinates: data.coordinates }
          }]
        });
        features = geojsonFlatten(data);
        break;
      default:
        polygonLookup.loadFeatureCollection(data);
        features = data.features;
    }
    console.log(features, polygonLookup);
    featureMax = features.length;

    if (color === null) {
      throw new Error('color is not properly defined');
    } else if (typeof color === 'function') {
      colorFn = color;
      color = undefined;
    }

    // -- data
    for (; featureIndex < featureMax; featureIndex++) {
      feature = features[featureIndex];
      triangles = [];

      //use colorFn function here if it exists
      if (colorFn) {
        color = colorFn(featureIndex, feature);
      }

      coordinates = (feature.geometry || feature).coordinates;
      flat = earcut.flatten(coordinates);
      indices = earcut(flat.vertices, flat.holes, flat.dimensions);
      console.log(flat, indices);
      dim = coordinates[0][0].length;
      for (let i = 0, iMax = indices.length; i < iMax; i++) {
        index = indices[i];
        if (typeof flat.vertices[0] === 'number') {
          triangles.push(flat.vertices[index * dim + settings.longitudeKey], flat.vertices[index * dim + settings.latitudeKey]);
        } else {
          throw new Error('unhandled polygon');
        }
      }

      for (let i = 0, iMax = triangles.length; i < iMax; i) {
        pixel = settings.map.project(latLng(triangles[i++], triangles[i++]), 0);
        verts.push(pixel.x, pixel.y, color.r, color.g, color.b);
      }
    }

    return this;
  }

  drawOnCanvas(): this {
    if (!this.gl) return this;

    const settings = this.settings
      , canvas = this.canvas
      , map = settings.map
      , pointSize = Math.max(map.getZoom() - 4.0, 1.0)
      , bounds = map.getBounds()
      , topLeft = new LatLng(bounds.getNorth(), bounds.getWest())
      // -- Scale to current zoom
      , scale = Math.pow(2, map.getZoom())
      , offset = map.project(topLeft, 0)
      , mapMatrix = this.mapMatrix
      , pixelsToWebGLMatrix = this.pixelsToWebGLMatrix
      ;

    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);

    // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix
      .set(pixelsToWebGLMatrix)
      .scaleMatrix(scale)
      .translateMatrix(-offset.x, -offset.y);

    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.vertexAttrib1f(this.aPointSize, pointSize);
    // -- attach matrix value to 'mapMatrix' uniform in shader
    gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);
    gl.drawArrays(gl.TRIANGLES, 0, this.verts.length / 5);

    return this;
  }

  static tryClick(e, map): boolean {
    let result
      , settings
      , feature
      ;

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
  }
}

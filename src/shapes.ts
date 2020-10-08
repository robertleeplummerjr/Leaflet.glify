import earcut from 'earcut';
import geojsonFlatten from 'geojson-flatten';
import PolygonLookup from 'polygon-lookup';

import { Base, IBaseSettings } from './base';
import { ICanvasOverlayDrawEvent } from './canvas-overlay';
import { Color, IColor } from './color';
import { latLonToPixel } from './utils';
import { LatLng, LeafletMouseEvent, Map, Point } from './leaflet-bindings';

export interface IShapeSettings extends IBaseSettings {
  border: boolean
}

export const defaults: IShapeSettings = {
  map: null,
  data: [],
  longitudeKey: null,
  latitudeKey: null,
  setupClick: null,
  vertexShaderSource: null,
  fragmentShaderSource: null,
  click: null,
  color: Color.random,
  border: false,
  className: '',
  opacity: 0.5,
  shaderVariables: {
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
  polygonLookup: PolygonLookup;

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

    const { pixelsToWebGLMatrix, settings, canvas, gl, layer, vertices, vertsLines, program } = this
      // , vertsLines = new Array
      , vertexBuffer = gl.createBuffer()
      , vertArray = new Float32Array(vertices)
      , byteCount = vertArray.BYTES_PER_ELEMENT
      , vertex = gl.getAttribLocation(program, 'vertex')
      , opacity = gl.getUniformLocation(program, 'opacity')
      ;
    gl.uniform1f(opacity, settings.opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, byteCount * 5, 0);
    gl.enableVertexAttribArray(vertex);

    //  gl.disable(gl.DEPTH_TEST);
    // ----------------------------
    // look up the locations for the inputs to our shaders.
    this.matrix = gl.getUniformLocation(program, 'matrix');

    // Set the matrix to some that makes 1 unit 1 pixel.
    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.uniformMatrix4fv(this.matrix, false, pixelsToWebGLMatrix);

    this.attachShaderVariables(byteCount);

    layer.redraw();

    return this;
  }

  resetVertices(): this {
    this.vertices = [];
    this.vertsLines = [];
    this.polygonLookup = new PolygonLookup();

    const { vertices, vertsLines, polygonLookup, settings } = this
      , data = settings.data as any
      ;

    let pixel
      , index
      , features
      , feature
      , { color } = settings
      , colorFn: (i: number, feature: any) => IColor
      , chosenColor: IColor
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
    featureMax = features.length;

    if (!color) {
      throw new Error('color is not properly defined');
    } else if (typeof color === 'function') {
      colorFn = color;
    }

    // -- data
    for (; featureIndex < featureMax; featureIndex++) {
      feature = features[featureIndex];
      triangles = [];

      //use colorFn function here if it exists
      if (colorFn) {
        chosenColor = colorFn(featureIndex, feature);
      } else {
        chosenColor = color as IColor;
      }

      coordinates = (feature.geometry || feature).coordinates;
      flat = earcut.flatten(coordinates);
      indices = earcut(flat.vertices, flat.holes, flat.dimensions);
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
        pixel = settings.map.project(new LatLng(triangles[i++], triangles[i++]), 0);
        vertices.push(pixel.x, pixel.y, chosenColor.r, chosenColor.g, chosenColor.b);
      }

      if (settings.border) {
        let lines = [];
        for (let i = 1, iMax = flat.vertices.length; i < iMax; i=i+2) {
          lines.push(flat.vertices[i], flat.vertices[i-1]);
          lines.push(flat.vertices[i+2], flat.vertices[i+1]);
        }

        for (let i = 0, iMax = lines.length; i < iMax; i) {
          pixel = latLonToPixel(lines[i++],lines[i++]);
          vertsLines.push(pixel.x, pixel.y, chosenColor.r, chosenColor.g, chosenColor.b);
        }
      }
    }

    return this;
  }

  drawOnCanvas(e: ICanvasOverlayDrawEvent): this {
    if (!this.gl) return this;

    const { scale, offset, canvas } = e
      , mapMatrix = this.mapMatrix
      , pixelsToWebGLMatrix = this.pixelsToWebGLMatrix
      ;

    pixelsToWebGLMatrix.set([
      2 / canvas.width, 0, 0, 0,
      0, -2 / canvas.height, 0, 0,
      0, 0, 0, 0,
      -1, 1, 0, 1
    ]);

    // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix
      .set(pixelsToWebGLMatrix)
      .scaleMatrix(scale)
      .translateMatrix(-offset.x, -offset.y);

    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // -- attach matrix value to 'mapMatrix' uniform in shader
    gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);
    
    if (this.settings.border) {
      var vertsLines = this.vertsLines,
      vertexBuffer = gl.createBuffer(),
      vertArray = new Float32Array(vertsLines),
      size = vertArray.BYTES_PER_ELEMENT,
      program = this.program,
      vertex = gl.getAttribLocation(program, 'vertex'),
      opacity = gl.getUniformLocation(program, 'opacity');

      gl.uniform1f(opacity, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER,vertArray, gl.STATIC_DRAW );

      if (this.settings.shaderVariables !== null) {
        this.attachShaderVariables(size);
      }

      gl.vertexAttribPointer(vertex, 3, gl.FLOAT, false, size *5, 0);
      gl.enableVertexAttribArray(vertex);
      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0,0,canvas.width, canvas.height);
      gl.drawArrays(gl.LINES, 0, this.vertsLines.length / 5);
    
      var vertices = this.vertices,
      vertexBuffer = gl.createBuffer(),
      vertArray = new Float32Array(vertices),
      size = vertArray.BYTES_PER_ELEMENT,
      program = this.program,
      vertex = gl.getAttribLocation(program, 'vertex'),
      opacity = gl.getUniformLocation(program, 'opacity');

      gl.uniform1f(opacity, this.settings.opacity);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER,vertArray, gl.STATIC_DRAW );

      if (this.settings.shaderVariables !== null) {
        this.attachShaderVariables(size);
      }

      gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, size *5, 0);
      gl.enableVertexAttribArray(vertex);
      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0,0,canvas.width, canvas.height);
    }

    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 5);

    return this;
  }

  static tryClick(e: LeafletMouseEvent, map: Map): boolean {
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
      if (feature) {
        result = settings.click(e, feature);
      }
    });

    return result !== undefined ? result : true;
  }
}

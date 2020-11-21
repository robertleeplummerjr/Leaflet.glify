import earcut from 'earcut';
import geojsonFlatten from 'geojson-flatten';
import PolygonLookup from 'polygon-lookup';

import { Base, IBaseSettings } from './base';
import { ICanvasOverlayDrawEvent } from './canvas-overlay';
import { Color, IColor } from './color';
import { LatLng, LeafletMouseEvent, Map} from 'leaflet';
import { latLonToPixel } from './utils';

export interface IShapeSettings extends IBaseSettings {
  border?: boolean
}

export const defaults: IShapeSettings = {
  map: null,
  data: [],
  longitudeKey: null,
  latitudeKey: null,
  setupClick: null,
  setupHover: null,
  vertexShaderSource: null,
  fragmentShaderSource: null,
  click: null,
  hover: null,
  color: Color.random,
  className: '',
  opacity: 0.5,
  shaderVariables: {
    color: {
      type: 'FLOAT',
      start: 2,
      size: 4
    }
  },
  border: false
};

export class Shapes extends Base<IShapeSettings> {
  static instances: Shapes[] = [];
  static defaults = defaults;
  static maps: Map[];
  bytes = 6;
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

    const { canvas, gl, layer, vertices, mapMatrix } = this
      , vertexBuffer = this.getBuffer('vertex')
      , vertArray = new Float32Array(vertices)
      , byteCount = vertArray.BYTES_PER_ELEMENT
      , vertex = this.getAttributeLocation('vertex')
      ;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, byteCount * this.bytes, 0);
    gl.enableVertexAttribArray(vertex);

    //  gl.disable(gl.DEPTH_TEST);
    // ----------------------------
    // look up the locations for the inputs to our shaders.
    this.matrix = this.getUniformLocation('matrix');

    // Set the matrix to some that makes 1 unit 1 pixel.
    gl.viewport(0, 0, canvas.width, canvas.height);
    mapMatrix.setSize(canvas.width, canvas.height)
    gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);

    this.attachShaderVariables(byteCount);

    layer.redraw();

    return this;
  }

  resetVertices(): this {
    this.vertices = [];
    this.vertexLines = [];
    this.polygonLookup = new PolygonLookup();

    const { vertices, vertexLines, polygonLookup, settings } = this
      , data = settings.data as any
      ;

    let pixel
      , index
      , features
      , feature
      , { color, opacity } = settings
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
        vertices.push(pixel.x, pixel.y, chosenColor.r, chosenColor.g, chosenColor.b, chosenColor.a || opacity);
      }

      if (settings.border) {
        let lines = [];
        for (let i = 1, iMax = flat.vertices.length; i < iMax; i=i+2) {
          lines.push(flat.vertices[i], flat.vertices[i-1]);
          lines.push(flat.vertices[i+2], flat.vertices[i+1]);
        }

        for (let i = 0, iMax = lines.length; i < iMax; i) {
          pixel = latLonToPixel(lines[i++],lines[i++]);
          vertexLines.push(pixel.x, pixel.y, chosenColor.r, chosenColor.g, chosenColor.b, chosenColor.a || opacity);
        }
      }
    }

    return this;
  }

  drawOnCanvas(e: ICanvasOverlayDrawEvent): this {
    if (!this.gl) return this;

    const { scale, offset, canvas } = e
      , { mapMatrix, gl, vertices, settings, vertexLines } = this
      ;

    // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix
      .setSize(canvas.width, canvas.height)
      .scaleMatrix(scale)
      .translateMatrix(-offset.x, -offset.y);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // -- attach matrix value to 'mapMatrix' uniform in shader
    gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);
    if (settings.border) {
      const vertexLinesBuffer = this.getBuffer('vertexLines')
        , vertexLinesTypedArray = new Float32Array(vertexLines)
        , size = vertexLinesTypedArray.BYTES_PER_ELEMENT
        , vertex = this.getAttributeLocation('vertex')
        ;

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexLinesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertexLinesTypedArray, gl.STATIC_DRAW);

      if (this.settings.shaderVariables !== null) {
        this.attachShaderVariables(size);
      }

      gl.vertexAttribPointer(vertex, 3, gl.FLOAT, false, size * this.bytes, 0);
      gl.enableVertexAttribArray(vertex);
      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.LINES, 0, vertexLines.length / this.bytes);

      const vertexBuffer = this.getBuffer('vertex')
        , verticesTypedArray = new Float32Array(vertices)
        ;

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, verticesTypedArray, gl.STATIC_DRAW);

      if (settings.shaderVariables !== null) {
        this.attachShaderVariables(size);
      }

      gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, size * this.bytes, 0);
      gl.enableVertexAttribArray(vertex);
      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0,0,canvas.width, canvas.height);
    }
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / this.bytes);

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

  static tryHover(e: LeafletMouseEvent, map: Map): boolean {
    let result
      , settings
      , feature
      ;

    Shapes.instances.forEach(function (_instance) {
      settings = _instance.settings;
      if (!_instance.active) return;
      if (settings.map !== map) return;
      if (!settings.hover) return;

      feature = _instance.polygonLookup.search(e.latlng.lng, e.latlng.lat);

      if (feature) {
        result = settings.hover(e, feature);
      }
    });

    return result !== undefined ? result : true;
  }
}

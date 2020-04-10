import { Map } from 'leaflet';
import { FeatureCollection } from 'geojson';

import { CanvasOverlay } from './canvasoverlay';
import { MapMatrix } from './map-matrix';
import { IColor } from './color';

export interface IBaseSettings {
  map: Map;
  shaderVars: {
    [name: string]: {
      type: 'FLOAT';
      start: number;
      size: number;
      bytes?: number;
    }
  }
  data: any;
  longitudeKey?: number;
  latitudeKey?: number;
  attachShaderVars?:
    (byteCount: number,
     gl: WebGLRenderingContext,
     program: WebGLProgram,
     attributes: object) => void;
  setupClick?: (map: Map) => void;
  vertexShaderSource?: (() => string) | string;
  fragmentShaderSource?: (() => string) | string;
  canvas: HTMLCanvasElement;
  click?: (e, feature) => void;
  color?: (featureIndex: number, feature) => void | IColor | string;
  className?: string;
  opacity?: number;
  preserveDrawingBuffer?: boolean;
}

export abstract class Base<T extends IBaseSettings = IBaseSettings> {
  active: boolean;
  fragmentShader: any;
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  glLayer: CanvasOverlay;
  mapMatrix: MapMatrix;
  matrix: WebGLUniformLocation;
  pixelsToWebGLMatrix: Float32Array;
  program: WebGLProgram;
  settings: T;
  vertexShader: any;
  verts: any;

  abstract render();

  constructor(settings: T) {
    this.pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = new MapMatrix();
    this.active = true;
    this.vertexShader = null;
    this.fragmentShader = null;
    this.program = null;
    this.matrix = null;
    this.verts = null;
    const preserveDrawingBuffer = Boolean(settings.preserveDrawingBuffer);
    const glLayer = this.glLayer = new CanvasOverlay(() => {
      this.drawOnCanvas();
    })
      .addTo(settings.map);
    const canvas = this.canvas = glLayer.canvas;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.position = 'absolute';
    if (settings.className) {
      canvas.className += ' ' + settings.className;
    }
    this.gl = (canvas.getContext('webgl', { preserveDrawingBuffer })
      || canvas.getContext('experimental-webgl', { preserveDrawingBuffer })) as WebGLRenderingContext;
  }

  abstract drawOnCanvas(): this;

  setData(data): this {
    this.settings.data = data;
    return this;
  }

  setup() {
    const settings = this.settings;
    if (settings.click) {
      settings.setupClick(settings.map);
    }

    return this
      .setupVertexShader()
      .setupFragmentShader()
      .setupProgram();
  }

  setupVertexShader() {
    const gl = this.gl
      , settings = this.settings
      , vertexShaderSource = typeof settings.vertexShaderSource === 'function'
          ? settings.vertexShaderSource()
          : settings.vertexShaderSource
      , vertexShader = gl.createShader(gl.VERTEX_SHADER)
      ;

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    this.vertexShader = vertexShader;

    return this;
  }

  setupFragmentShader() {
    const gl = this.gl
      , settings = this.settings
      , fragmentShaderSource = typeof settings.fragmentShaderSource === 'function'
          ? settings.fragmentShaderSource()
          : settings.fragmentShaderSource
      , fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      ;

    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    this.fragmentShader = fragmentShader;

    return this;
  }

  setupProgram(): this {
    // link shaders to create our program
    const gl = this.gl
      , program = gl.createProgram()
      ;

    gl.attachShader(program, this.vertexShader);
    gl.attachShader(program, this.fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    this.program = program;

    return this;
  }

  addTo(map) {
    this.glLayer.addTo(map || this.settings.map);
    this.active = true;
    return this.render();
  }

  remove() {
    this.settings.map.removeLayer(this.glLayer as any);
    this.active = false;
    return this;
  }
}
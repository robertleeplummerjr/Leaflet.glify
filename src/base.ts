import { IColor } from './color';
import { Map, Point } from 'leaflet';
import { MapMatrix } from './map-matrix';
import { CanvasOverlay, ICanvasOverlayDrawEvent } from './canvas-overlay';

export interface IShaderVariable {
  type: 'FLOAT';
  start?: number;
  size: number;
  normalize?: boolean;
}

export interface IBaseSettings {
  map: Map;
  data: any;
  shaderVariables?: {
    [name: string]: IShaderVariable
  }
  longitudeKey?: number;
  latitudeKey?: number;
  setupClick?: (map: Map) => void;
  setupHover?: (map: Map, hoverWait: number) => void;
  vertexShaderSource?: (() => string) | string;
  fragmentShaderSource?: (() => string) | string;
  canvas?: HTMLCanvasElement;
  click?: (e, feature, xy: Point) => boolean | void;
  hover?: (e, feature, xy: Point) => boolean | void;
  color?: ((featureIndex: number, feature: any) => IColor) | IColor;
  className?: string;
  opacity?: number;
  preserveDrawingBuffer?: boolean;
  hoverWait?: number;
  pane?: string;
}

export abstract class Base<T extends IBaseSettings = IBaseSettings> {
  bytes: number;
  active: boolean;
  fragmentShader: any;
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  layer: CanvasOverlay;
  mapMatrix: MapMatrix;
  matrix: WebGLUniformLocation;
  program: WebGLProgram;
  settings: T;
  vertexShader: any;
  vertices: any;
  vertexLines: any;

  buffers: { [name: string]: WebGLBuffer } = {};
  attributeLocations: { [name: string]: number } = {};
  uniformLocations: { [name: string]: WebGLUniformLocation } = {};

  abstract render(): this;

  constructor(settings: T) {
    if (!settings.pane) settings.pane = "overlayPane";
    this.mapMatrix = new MapMatrix();
    this.active = true;
    this.vertexShader = null;
    this.fragmentShader = null;
    this.program = null;
    this.matrix = null;
    this.vertices = null;
    this.vertexLines = null;
    const preserveDrawingBuffer = Boolean(settings.preserveDrawingBuffer);
    const layer = this.layer = new CanvasOverlay((context) => {
      return this.drawOnCanvas(context);
    }, settings.pane).addTo(settings.map);
    const canvas = this.canvas = layer.canvas;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.position = 'absolute';
    if (settings.className) {
      canvas.className += ' ' + settings.className;
    }
    this.gl = (
      canvas.getContext('webgl2', { preserveDrawingBuffer })
      || canvas.getContext('webgl', { preserveDrawingBuffer })
      || canvas.getContext('experimental-webgl', { preserveDrawingBuffer })) as WebGLRenderingContext;
  }

  abstract drawOnCanvas(context: ICanvasOverlayDrawEvent): this;

  attachShaderVariables(byteCount: number): this {
    let variableCount = this.getShaderVariableCount();
    if (variableCount === 0) {
      return this;
    }
    const { gl, settings } = this;
    const { shaderVariables } = settings;
    let offset = 0;
    for (const name in shaderVariables) {
      if (!shaderVariables.hasOwnProperty(name)) continue;
      const shaderVariable = shaderVariables[name];
      const loc = this.getAttributeLocation(name);
      if (loc < 0) {
        throw new Error('shader variable ' + name + ' not found');
      }
      gl.vertexAttribPointer(
        loc,
        shaderVariable.size,
        gl[shaderVariable.type],
        !!shaderVariable.normalize,
        this.bytes * byteCount,
        offset * byteCount
      );
      offset += shaderVariable.size;
      gl.enableVertexAttribArray(loc);
    }

    return this;
  }

  getShaderVariableCount(): number {
    return Object.keys(this.settings.shaderVariables).length;
  }

  setData(data): this {
    this.settings.data = data;
    return this;
  }

  setup(): this {
    const settings = this.settings;
    if (settings.click) {
      settings.setupClick(settings.map);
    }
    if (settings.hover) {
      settings.setupHover(settings.map, settings.hoverWait);
    }

    return this
      .setupVertexShader()
      .setupFragmentShader()
      .setupProgram();
  }

  setupVertexShader(): this {
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

  setupFragmentShader(): this {
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

  addTo(map): this {
    this.layer.addTo(map || this.settings.map);
    this.active = true;
    return this.render();
  }

  remove(indices?: number | number[]): this {
    if (indices === undefined) {
      this.settings.map.removeLayer(this.layer as any);
      this.active = false;
    } else {
      const feat = this.settings.data.features || this.settings.data;
      indices = (indices instanceof Array) ? indices : [indices];
      if (typeof indices === "number") indices = [indices];
      indices.sort().reverse();
      indices.forEach((index: number) => {feat.splice(index, 1)});
      this.render();
    }
    return this;
  }

  update(data: any, index: number): this {
    const feat = this.settings.data.features || this.settings.data;
    feat[index] = data;
    this.render();
    return this;
  }

  getBuffer(name: string): WebGLBuffer {
    if (!this.buffers[name]) {
      this.buffers[name] = this.gl.createBuffer();
    }
    return this.buffers[name];
  }

  getAttributeLocation(name: string): number {
    if (this.attributeLocations[name] !== undefined) {
      return this.attributeLocations[name];
    }
    return this.attributeLocations[name] = this.gl.getAttribLocation(this.program, name);
  }

  getUniformLocation(name: string): WebGLUniformLocation {
    if (this.uniformLocations[name] !== undefined) {
      return this.uniformLocations[name];
    }
    return this.uniformLocations[name] = this.gl.getUniformLocation(this.program, name);
  }

}

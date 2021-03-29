import { IColor } from "./color";
import { LeafletMouseEvent, Map } from "leaflet";
import { MapMatrix } from "./map-matrix";
import { CanvasOverlay, ICanvasOverlayDrawEvent } from "./canvas-overlay";

export interface IShaderVariable {
  type: "FLOAT";
  start?: number;
  size: number;
  normalize?: boolean;
}

export interface IBaseGlLayerSettings {
  data: any;
  longitudeKey: number;
  latitudeKey: number;
  pane: string;
  map: Map;
  shaderVariables?: {
    [name: string]: IShaderVariable;
  };
  setupClick?: (map: Map) => void;
  setupHover?: (map: Map, hoverWait?: number, immediate?: false) => void;
  sensitivity?: number;
  sensitivityHover?: number;
  vertexShaderSource?: (() => string) | string;
  fragmentShaderSource?: (() => string) | string;
  canvas?: HTMLCanvasElement;
  click?: (e: LeafletMouseEvent, feature: any) => (boolean | undefined) | void;
  hover?: (e: LeafletMouseEvent, feature: any) => (boolean | undefined) | void;
  hoverOff?: (e: LeafletMouseEvent, feature: any) => (boolean | undefined) | void;
  color?: ((featureIndex: number, feature: any) => IColor) | IColor;
  className?: string;
  opacity?: number;
  preserveDrawingBuffer?: boolean;
  hoverWait?: number;
}

export const defaultPane = 'overlayPane';
export const defaultHoverWait = 250;
const defaults: Partial<IBaseGlLayerSettings> = {
  pane: defaultPane,
};

export abstract class BaseGlLayer<T extends IBaseGlLayerSettings = IBaseGlLayerSettings> {
  bytes = 0;
  active: boolean;
  fragmentShader: any;
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  layer: CanvasOverlay;
  mapMatrix: MapMatrix;
  matrix: WebGLUniformLocation | null;
  program: WebGLProgram | null;
  settings: Partial<IBaseGlLayerSettings>;
  vertexShader: WebGLShader | null;
  vertices: any;
  vertexLines: any;

  buffers: { [name: string]: WebGLBuffer } = {};
  attributeLocations: { [name: string]: number } = {};
  uniformLocations: { [name: string]: WebGLUniformLocation } = {};

  static defaults = defaults;

  abstract render(): this;

  get data(): any {
    if (!this.settings.data) {
      throw new Error("data not defined");
    }
    return this.settings.data;
  }

  get pane(): string {
    return this.settings.pane ?? defaultPane;
  }

  get className(): string {
    return this.settings.className || "";
  }

  get map(): Map {
    if (!this.settings.map) {
      throw new Error("settings.map not defined");
    }
    return this.settings.map;
  }

  get sensitivity(): number {
    if (typeof this.settings.sensitivity !== "number") {
      throw new Error("settings.sensitivity not correctly defined");
    }
    return this.settings.sensitivity;
  }

  get sensitivityHover(): number {
    if (typeof this.settings.sensitivityHover !== "number") {
      throw new Error("settings.sensitivityHover not correctly defined");
    }
    return this.settings.sensitivityHover;
  }

  get hoverWait(): number {
    return this.settings.hoverWait ?? defaultHoverWait;
  }

  get longitudeKey(): number {
    if (typeof this.settings.longitudeKey !== "number") {
      throw new Error("settings.longitudeKey not correctly defined");
    }
    return this.settings.longitudeKey;
  }

  get latitudeKey(): number {
    if (typeof this.settings.latitudeKey !== "number") {
      throw new Error("settings.latitudeKey not correctly defined");
    }
    return this.settings.latitudeKey;
  }

  get opacity(): number {
    if (typeof this.settings.opacity !== "number") {
      throw new Error("settings.opacity not correctly defined");
    }
    return this.settings.opacity;
  }

  get color(): ((featureIndex: number, feature: any) => IColor) | IColor {
    if (!this.settings.color) {
      throw new Error("settings.color not correctly defined");
    }
    return this.settings.color;
  }

  constructor(settings: Partial<IBaseGlLayerSettings>) {
    this.settings = { ...defaults, ...settings };
    this.mapMatrix = new MapMatrix();
    this.active = true;
    this.vertexShader = null;
    this.fragmentShader = null;
    this.program = null;
    this.matrix = null;
    this.vertices = null;
    this.vertexLines = null;
    const preserveDrawingBuffer = Boolean(settings.preserveDrawingBuffer);
    const layer = (this.layer = new CanvasOverlay((context: ICanvasOverlayDrawEvent) => {
      return this.drawOnCanvas(context);
    }, this.pane).addTo(this.map));
    if (!layer.canvas) {
      throw new Error("layer.canvas not correctly defined");
    }
    const canvas = (this.canvas = layer.canvas);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.position = "absolute";
    if (this.className) {
      canvas.className += " " + this.className;
    }
    this.gl = (canvas.getContext("webgl2", { preserveDrawingBuffer }) ||
      canvas.getContext("webgl", { preserveDrawingBuffer }) ||
      canvas.getContext("experimental-webgl", {
        preserveDrawingBuffer,
      })) as WebGLRenderingContext;
  }

  abstract drawOnCanvas(context: ICanvasOverlayDrawEvent): this;

  attachShaderVariables(byteCount: number): this {
    const variableCount = this.getShaderVariableCount();
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
        throw new Error("shader variable " + name + " not found");
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
    return Object.keys(this.settings.shaderVariables ?? {}).length;
  }

  setData(data: any): this {
    this.settings = { ...this.settings, data };
    return this.render();
  }

  setup(): this {
    const settings = this.settings;
    if (settings.click && settings.setupClick) {
      settings.setupClick(this.map);
    }
    if (settings.hover && settings.setupHover) {
      settings.setupHover(this.map, this.hoverWait);
    }

    return this.setupVertexShader().setupFragmentShader().setupProgram();
  }

  setupVertexShader(): this {
    const { gl, settings } = this;
    const vertexShaderSource =
      typeof settings.vertexShaderSource === "function"
        ? settings.vertexShaderSource()
        : settings.vertexShaderSource;
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      throw new Error("Not able to create vertex");
    }
    if (!vertexShaderSource) {
      throw new Error("vertexShaderSource not set");
    }
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    this.vertexShader = vertexShader;

    return this;
  }

  setupFragmentShader(): this {
    const gl = this.gl;
    const settings = this.settings;
    const fragmentShaderSource =
      typeof settings.fragmentShaderSource === "function"
        ? settings.fragmentShaderSource()
        : settings.fragmentShaderSource;
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      throw new Error("Not able to create fragment");
    }
    if (!fragmentShaderSource) {
      throw new Error("fragmentShaderSource not set");
    }
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    this.fragmentShader = fragmentShader;

    return this;
  }

  setupProgram(): this {
    // link shaders to create our program
    const { gl, vertexShader, fragmentShader } = this;
    const program = gl.createProgram();
    if (!program) {
      throw new Error("Not able to create program");
    }
    if (!vertexShader) {
      throw new Error('this.vertexShader not correctly set');
    }
    if (!fragmentShader) {
      throw new Error('this.fragmentShader not correctly set');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    this.program = program;

    return this;
  }

  addTo(map?: Map): this {
    this.layer.addTo(map || this.map);
    this.active = true;
    return this.render();
  }

  remove(indices?: number | number[]): this {
    if (indices === undefined) {
      this.map.removeLayer(this.layer);
      this.active = false;
    } else {
      const features = this.settings.data.features || this.settings.data;
      indices = indices instanceof Array ? indices : [indices];
      if (typeof indices === "number") {
        indices = [indices];
      }
      indices.sort().reverse().forEach((index: number) => {
        features.splice(index, 1);
      });
      this.render();
    }
    return this;
  }

  insert(feature: any, index: number): this {
    const features = this.settings.data.features || this.settings.data;
    features.splice(index, 0, feature);
    return this.render();
  }

  update(feature: any, index: number): this {
    const features = this.settings.data.features || this.settings.data;
    features[index] = feature;
    return this.render();
  }

  getBuffer(name: string): WebGLBuffer {
    if (!this.buffers[name]) {
      const buffer = this.gl.createBuffer();
      if (!buffer) {
        throw new Error("Not able to create buffer");
      }
      this.buffers[name] = buffer;
    }
    return this.buffers[name];
  }

  getAttributeLocation(name: string): number {
    if (!this.program) throw new Error("Program is missing");
    if (this.attributeLocations[name] !== undefined) {
      return this.attributeLocations[name];
    }
    return (this.attributeLocations[name] = this.gl.getAttribLocation(
      this.program,
      name
    ));
  }

  getUniformLocation(name: string): WebGLUniformLocation {
    if (!this.program) throw new Error("Program is missing");
    if (this.uniformLocations[name] !== undefined) {
      return this.uniformLocations[name];
    }
    const loc = this.gl.getUniformLocation(this.program, name);
    if (!loc) {
      throw new Error("Cannot find location");
    }
    return (this.uniformLocations[name] = loc);
  }

  click(e: LeafletMouseEvent, feature: any): boolean | undefined {
    if (!this.settings.click) return;
    const result = this.settings.click(e, feature);
    if (result !== undefined) {
      return result;
    }
  }

  hover(e: LeafletMouseEvent, feature: any): boolean | undefined {
    if (!this.settings.hover) return;
    const result = this.settings.hover(e, feature);
    if (result !== undefined) {
      return result;
    }
  }

  hoverOff(e: LeafletMouseEvent, feature: any): void {

  }
}

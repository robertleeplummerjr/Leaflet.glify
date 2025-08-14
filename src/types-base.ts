// Base type definitions for Leaflet.glify
// This file contains types that don't reference classes to avoid circular imports

import { Map, LeafletMouseEvent } from "leaflet";
import { Feature, FeatureCollection, LineString, MultiLineString, MultiPolygon, Point as GeoPoint } from "geojson";

// Base layer settings interface
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
  setupContextMenu?: (map: Map) => void;
  setupHover?: SetupHoverCallback;
  sensitivity?: number;
  sensitivityHover?: number;
  vertexShaderSource?: (() => string) | string;
  fragmentShaderSource?: (() => string) | string;
  canvas?: HTMLCanvasElement;
  click?: EventCallback;
  contextMenu?: EventCallback;
  hover?: EventCallback;
  hoverOff?: EventCallback;
  color?: ColorCallback | IColor | string | number[] | null;
  className?: string;
  opacity?: number;
  preserveDrawingBuffer?: boolean;
  hoverWait?: number;
}

// Layer-specific settings interfaces
export interface IPointsSettings extends IBaseGlLayerSettings {
  data: number[][] | FeatureCollection<GeoPoint>;
  size?: ((i: number, latLng: any) => number) | number | null;
  eachVertex?: (pointVertex: IPointVertex) => void;
  sensitivity?: number;
  sensitivityHover?: number;
}

export interface ILinesSettings extends IBaseGlLayerSettings {
  data: FeatureCollection<LineString | MultiLineString>;
  weight: WeightCallback | number;
  sensitivity?: number;
  sensitivityHover?: number;
  eachVertex?: (vertices: any) => void;
}

export interface IShapesSettings extends IBaseGlLayerSettings {
  border?: boolean;
  borderOpacity?: number;
  data: Feature | FeatureCollection | MultiPolygon;
}

// Shader interface
export interface IGlifyShader {
  vertex: string;
  fragment: {
    dot: string;
    point: string;
    puck: string;
    simpleCircle: string;
    square: string;
    polygon: string;
  };
}

// WebGL types
export interface IShaderVariable {
  type: "FLOAT";
  start?: number;
  size: number;
  normalize?: boolean;
}

export interface ICanvasOverlayDrawEvent {
  canvas: HTMLCanvasElement;
  bounds: any;
  offset: any;
  scale: number;
  size: any;
  zoomScale: number;
  zoom: number;
}

// Color and callback types
export interface IColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export type ColorCallback = (featureIndex: number, feature: any) => IColor;
export type WeightCallback = (i: number, feature: any) => number;
export type EventCallback = (e: LeafletMouseEvent, feature: any) => boolean | void;
export type SetupHoverCallback = (map: Map, hoverWait?: number, immediate?: false) => void;

// Utility types
export interface IPixel {
  x: number;
  y: number;
}

export interface IPointVertex {
  latLng: any;
  pixel: IPixel;
  chosenColor: IColor;
  chosenSize: number;
  key: string;
  feature?: any;
}

// Coordinate and data types
export type GlifyLayerType = "points" | "lines" | "shapes";
export type GlifyDataFormat = "Array" | "GeoJson.FeatureCollection";
export type GlifyCoordinateOrder = "latFirst" | "lngFirst";

// Coordinate configuration interface
export interface IGlifyCoordinateConfig {
  longitudeKey: number;
  latitudeKey: number;
  order: GlifyCoordinateOrder;
}

// Event callback types
export type GlifyClickCallback<T = any> = (
  e: LeafletMouseEvent,
  feature: T,
  xy?: { x: number; y: number }
) => boolean | void;

export type GlifyHoverCallback<T = any> = (
  e: LeafletMouseEvent,
  feature: T,
  xy?: { x: number; y: number }
) => boolean | void;

export type GlifyHoverOffCallback<T = any> = (
  e: LeafletMouseEvent,
  feature: T
) => boolean | void;

export type GlifyContextMenuCallback<T = any> = (
  e: LeafletMouseEvent,
  feature: T
) => boolean | void;

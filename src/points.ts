import {
  Feature,
  FeatureCollection,
  Point as GeoPoint,
  Position,
} from "geojson";

import { BaseGlLayer, IBaseGlLayerSettings } from "./base-gl-layer";
import { ICanvasOverlayDrawEvent } from "./canvas-overlay";
import * as Color from "./color";
import { LeafletMouseEvent, Map, Point, LatLng } from "leaflet";
import { IPixel } from "./pixel";
import { locationDistance, pixelInCircle } from "./utils";
import glify from "./index";

export interface IPointsSettings extends IBaseGlLayerSettings {
  data: number[][] | FeatureCollection<GeoPoint>;
  size?: ((i: number, latLng: LatLng | null) => number) | number | null;
  eachVertex?: (pointVertex: IPointVertex) => void;
  sensitivity?: number;
  sensitivityHover?: number;
}

const defaults: Partial<IPointsSettings> = {
  color: Color.random,
  opacity: 0.8,
  className: "",
  sensitivity: 2,
  sensitivityHover: 0.03,
  shaderVariables: {
    vertex: {
      type: "FLOAT",
      start: 0,
      size: 2,
    },
    color: {
      type: "FLOAT",
      start: 2,
      size: 4,
    },
    pointSize: {
      type: "FLOAT",
      start: 6,
      size: 1,
    },
  },
};

export interface IPointVertex {
  latLng: LatLng;
  pixel: IPixel;
  chosenColor: Color.IColor;
  chosenSize: number;
  key: string;
  feature?: any;
}

export class Points extends BaseGlLayer<IPointsSettings> {
  static defaults = defaults;
  static maps = [];
  bytes = 7;
  latLngLookup: {
    [key: string]: IPointVertex[];
  } = {};

  allLatLngLookup: IPointVertex[] = [];
  vertices: number[] = [];
  typedVertices: Float32Array = new Float32Array();
  dataFormat: "Array" | "GeoJson.FeatureCollection";
  settings: Partial<IPointsSettings>;
  active: boolean;

  get size(): ((i: number, latLng: LatLng | null) => number) | number | null {
    if (typeof this.settings.size === "number") {
      return this.settings.size;
    }
    if (typeof this.settings.size === "function") {
      return this.settings.size;
    }
    return null;
  }

  constructor(settings: Partial<IPointsSettings>) {
    super(settings);
    this.settings = { ...defaults, ...settings };

    this.active = true;

    const { data, map } = this;
    if (Array.isArray(data)) {
      this.dataFormat = "Array";
    } else if (data.type === "FeatureCollection") {
      this.dataFormat = "GeoJson.FeatureCollection";
    } else {
      throw new Error(
        "unhandled data type. Supported types are Array and GeoJson.FeatureCollection"
      );
    }

    if (map.options.crs?.code !== "EPSG:3857") {
      console.warn("layer designed for SphericalMercator, alternate detected");
    }

    this.setup().render();
  }

  render(): this {
    this.resetVertices();

    // look up the locations for the inputs to our shaders.
    const { gl, canvas, layer, vertices, mapMatrix } = this;
    const matrix = (this.matrix = this.getUniformLocation("matrix"));
    const verticesBuffer = this.getBuffer("vertices");
    const verticesTyped = (this.typedVertices = new Float32Array(vertices));
    const byteCount = verticesTyped.BYTES_PER_ELEMENT;
    // set the matrix to some that makes 1 unit 1 pixel.
    mapMatrix.setSize(canvas.width, canvas.height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(matrix, false, mapMatrix.array);
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTyped, gl.STATIC_DRAW);

    this.attachShaderVariables(byteCount);

    layer.redraw();

    return this;
  }

  getPointLookup(key: string): IPointVertex[] {
    return this.latLngLookup[key] || (this.latLngLookup[key] = []);
  }

  addLookup(lookup: IPointVertex): this {
    this.getPointLookup(lookup.key).push(lookup);
    this.allLatLngLookup.push(lookup);
    return this;
  }

  resetVertices(): this {
    // empty vertices and repopulate
    this.latLngLookup = {};
    this.allLatLngLookup = [];
    this.vertices = [];

    const {
      vertices,
      settings,
      map,
      size,
      latitudeKey,
      longitudeKey,
      color,
      opacity,
      data,
      mapCenterPixels,
    } = this;
    const { eachVertex } = settings;
    let colorFn: ((i: number, latLng: LatLng | any) => Color.IColor) | null =
      null;
    let chosenColor: Color.IColor;
    let chosenSize: number;
    let sizeFn;
    let rawLatLng: [number, number] | Position;
    let latLng: LatLng;
    let pixel: Point;
    let key;

    if (!color) {
      throw new Error("color is not properly defined");
    } else if (typeof color === "function") {
      colorFn = color as (i: number, latLng: LatLng) => Color.IColor;
    }

    if (!size) {
      throw new Error("size is not properly defined");
    } else if (typeof size === "function") {
      sizeFn = size;
    }

    if (this.dataFormat === "Array") {
      const max = data.length;
      for (let i = 0; i < max; i++) {
        rawLatLng = data[i];
        key =
          rawLatLng[latitudeKey].toFixed(2) +
          "x" +
          rawLatLng[longitudeKey].toFixed(2);
        latLng = new LatLng(rawLatLng[latitudeKey], rawLatLng[longitudeKey]);
        pixel = map.project(latLng, 0);

        if (colorFn) {
          chosenColor = colorFn(i, latLng);
        } else {
          chosenColor = color as Color.IColor;
        }

        chosenColor = { ...chosenColor, a: chosenColor.a ?? opacity ?? 0 };

        if (sizeFn) {
          chosenSize = sizeFn(i, latLng);
        } else {
          chosenSize = size as number;
        }

        vertices.push(
          // vertex
          pixel.x - mapCenterPixels.x,
          pixel.y - mapCenterPixels.y,

          // color
          chosenColor.r,
          chosenColor.g,
          chosenColor.b,
          chosenColor.a ?? 0,

          // size
          chosenSize
        );
        const vertex = {
          latLng,
          key,
          pixel,
          chosenColor,
          chosenSize,
          feature: rawLatLng,
        };
        this.addLookup(vertex);
        if (eachVertex) {
          eachVertex(vertex);
        }
      }
    } else if (this.dataFormat === "GeoJson.FeatureCollection") {
      const max = data.features.length;
      for (let i = 0; i < max; i++) {
        const feature = data.features[i] as Feature<GeoPoint>;
        rawLatLng = feature.geometry.coordinates;
        key =
          rawLatLng[latitudeKey].toFixed(2) +
          "x" +
          rawLatLng[longitudeKey].toFixed(2);
        latLng = new LatLng(rawLatLng[latitudeKey], rawLatLng[longitudeKey]);
        pixel = map.project(latLng, 0);

        if (colorFn) {
          chosenColor = colorFn(i, feature);
        } else {
          chosenColor = color as Color.IColor;
        }

        chosenColor = { ...chosenColor, a: chosenColor.a ?? opacity ?? 0 };

        if (sizeFn) {
          chosenSize = sizeFn(i, latLng);
        } else {
          chosenSize = size as number;
        }

        vertices.push(
          // vertex
          pixel.x - mapCenterPixels.x,
          pixel.y - mapCenterPixels.y,

          // color
          chosenColor.r,
          chosenColor.g,
          chosenColor.b,
          chosenColor.a ?? 0,

          // size
          chosenSize
        );
        const vertex: IPointVertex = {
          latLng,
          key,
          pixel,
          chosenColor,
          chosenSize,
          feature,
        };
        this.addLookup(vertex);
        if (eachVertex) {
          eachVertex(vertex);
        }
      }
    }

    return this;
  }

  removeInstance(): this {
    const index = glify.pointsInstances.findIndex(
      (element) => element.layer._leaflet_id === this.layer._leaflet_id
    );
    if (index !== -1) {
      glify.pointsInstances.splice(index, 1);
    }
    return this;
  }

  // TODO: remove?
  pointSize(pointIndex: number): number {
    const { map, size } = this;
    const pointSize =
      typeof size === "function" ? size(pointIndex, null) : size;
    // -- Scale to current zoom
    const zoom = map.getZoom();
    return pointSize === null ? Math.max(zoom - 4.0, 1.0) : pointSize;
  }

  drawOnCanvas(e: ICanvasOverlayDrawEvent): this {
    if (!this.gl) return this;

    const {
      gl,
      canvas,
      mapMatrix,
      matrix,
      map,
      allLatLngLookup,
      mapCenterPixels,
    } = this;
    const { offset } = e;
    const zoom = map.getZoom();
    const scale = Math.pow(2, zoom);
    // set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix
      .setSize(canvas.width, canvas.height)
      .scaleTo(scale)
      .translateTo(
        -offset.x + mapCenterPixels.x,
        -offset.y + mapCenterPixels.y
      );

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(matrix, false, mapMatrix.array);
    gl.drawArrays(gl.POINTS, 0, allLatLngLookup.length);

    return this;
  }

  lookup(coords: LatLng): IPointVertex | null {
    const latMax: number = coords.lat + 0.03;
    const lngMax: number = coords.lng + 0.03;
    const matches: IPointVertex[] = [];
    let lat = coords.lat - 0.03;
    let lng: number;
    let foundI: number;
    let foundMax: number;
    let found: IPointVertex[];
    let key: string;

    for (; lat <= latMax; lat += 0.01) {
      lng = coords.lng - 0.03;
      for (; lng <= lngMax; lng += 0.01) {
        key = lat.toFixed(2) + "x" + lng.toFixed(2);
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

    const { map } = this;

    // try matches first, if it is empty, try the data, and hope it isn't too big
    return Points.closest(
      coords,
      matches.length > 0 ? matches : this.allLatLngLookup,
      map
    );
  }

  static closest(
    targetLocation: LatLng,
    points: IPointVertex[],
    map: Map
  ): IPointVertex | null {
    if (points.length < 1) return null;
    return points.reduce((prev, curr) => {
      const prevDistance = locationDistance(targetLocation, prev.latLng, map);
      const currDistance = locationDistance(targetLocation, curr.latLng, map);
      return prevDistance < currDistance ? prev : curr;
    });
  }

  // attempts to click the top-most Points instance
  static tryClick(
    e: LeafletMouseEvent,
    map: Map,
    instances: Points[]
  ): boolean | undefined {
    const closestFromEach: IPointVertex[] = [];
    const instancesLookup: { [key: string]: Points } = {};
    let result;
    let settings: Partial<IPointsSettings> | null = null;
    let pointLookup: IPointVertex | null;

    instances.forEach((_instance: Points) => {
      settings = _instance.settings;
      if (!_instance.active) return;
      if (_instance.map !== map) return;

      pointLookup = _instance.lookup(e.latlng);
      if (pointLookup === null) return;
      instancesLookup[pointLookup.key] = _instance;
      closestFromEach.push(pointLookup);
    });

    if (closestFromEach.length < 1) return;
    if (!settings) return;

    const found = this.closest(e.latlng, closestFromEach, map);

    if (!found) return;

    const instance = instancesLookup[found.key];
    if (!instance) return;
    const { sensitivity } = instance;
    const foundLatLng = found.latLng;
    const xy = map.latLngToLayerPoint(foundLatLng);

    if (
      pixelInCircle(xy, e.layerPoint, found.chosenSize * (sensitivity ?? 1))
    ) {
      result = instance.click(e, found.feature || found.latLng);
      return result !== undefined ? result : true;
    }
  }

  // attempts to click the top-most Points instance
  static tryContextMenu(
    e: LeafletMouseEvent,
    map: Map,
    instances: Points[]
  ): boolean | undefined {
    const closestFromEach: IPointVertex[] = [];
    const instancesLookup: { [key: string]: Points } = {};
    let result;
    let settings: Partial<IPointsSettings> | null = null;
    let pointLookup: IPointVertex | null;

    instances.forEach((_instance: Points) => {
      settings = _instance.settings;
      if (!_instance.active) return;
      if (_instance.map !== map) return;

      pointLookup = _instance.lookup(e.latlng);
      if (pointLookup === null) return;
      instancesLookup[pointLookup.key] = _instance;
      closestFromEach.push(pointLookup);
    });

    if (closestFromEach.length < 1) return;
    if (!settings) return;

    const found = this.closest(e.latlng, closestFromEach, map);

    if (!found) return;

    const instance = instancesLookup[found.key];
    if (!instance) return;
    const { sensitivity } = instance;
    const foundLatLng = found.latLng;
    const xy = map.latLngToLayerPoint(foundLatLng);

    if (
      pixelInCircle(xy, e.layerPoint, found.chosenSize * (sensitivity ?? 1))
    ) {
      result = instance.contextMenu(e, found.feature || found.latLng);
      return result !== undefined ? result : true;
    }
  }

  hoveringFeatures: Array<Feature<GeoPoint>> = [];
  // hovers all touching Points instances
  static tryHover(
    e: LeafletMouseEvent,
    map: Map,
    instances: Points[]
  ): Array<boolean | undefined> {
    const results: boolean[] = [];
    instances.forEach((instance: Points): void => {
      const { sensitivityHover, hoveringFeatures } = instance;
      if (!instance.active) return;
      if (instance.map !== map) return;
      const oldHoveredFeatures = hoveringFeatures;
      const newHoveredFeatures: Array<Feature<GeoPoint>> = [];
      instance.hoveringFeatures = newHoveredFeatures;

      const pointLookup = instance.lookup(e.latlng);
      if (!pointLookup) return;
      if (
        pixelInCircle(
          map.latLngToLayerPoint(pointLookup.latLng),
          e.layerPoint,
          pointLookup.chosenSize * sensitivityHover * 30
        )
      ) {
        let feature = pointLookup.feature || pointLookup.latLng;
        if (!newHoveredFeatures.includes(feature)) {
          newHoveredFeatures.push(feature);
        }
        const result = instance.hover(e, feature);
        if (result !== undefined) {
          results.push(result);
        }
      }
      for (let i = 0; i < oldHoveredFeatures.length; i++) {
        const feature = oldHoveredFeatures[i];
        if (!newHoveredFeatures.includes(feature)) {
          instance.hoverOff(e, feature);
        }
      }
    });
    return results;
  }
}

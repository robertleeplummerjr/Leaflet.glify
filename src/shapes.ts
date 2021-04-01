import earcut from "earcut";
import PolygonLookup from "polygon-lookup";

import { BaseGlLayer, IBaseGlLayerSettings } from "./base-gl-layer";
import { ICanvasOverlayDrawEvent } from "./canvas-overlay";
import * as Color from "./color";
import { LatLng, LeafletMouseEvent, Map } from "leaflet";
import { latLonToPixel } from "./utils";
import { Geometry, Polygon } from "geojson";
import geojsonFlatten from "geojson-flatten";

export interface IShapesSettings extends IBaseGlLayerSettings {
  border?: boolean;
}

export const defaults: Partial<IShapesSettings> = {
  data: [],
  color: Color.random,
  className: "",
  opacity: 0.5,
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
  },
  border: false,
};

export class Shapes extends BaseGlLayer {
  static defaults = defaults;
  static maps: Map[];
  settings: Partial<IShapesSettings>;
  bytes = 6;
  polygonLookup: PolygonLookup | null = null;

  get border(): boolean {
    if (typeof this.settings.border !== "boolean") {
      throw new Error("settings.boarder not defined");
    }
    return this.settings.border;
  }

  constructor(settings: Partial<IShapesSettings>) {
    super(settings);
    this.settings = { ...Shapes.defaults, ...settings };

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map)
      throw new Error('no leaflet "map" object setting defined');

    this.setup().render();
  }

  render(): this {
    this.resetVertices();
    // triangles or point count

    const { canvas, gl, layer, vertices, mapMatrix } = this;
    const vertexBuffer = this.getBuffer("vertex");
    const vertArray = new Float32Array(vertices);
    const byteCount = vertArray.BYTES_PER_ELEMENT;
    const vertex = this.getAttributeLocation("vertex");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
      vertex,
      2,
      gl.FLOAT,
      false,
      byteCount * this.bytes,
      0
    );
    gl.enableVertexAttribArray(vertex);

    //  gl.disable(gl.DEPTH_TEST);
    // ----------------------------
    // look up the locations for the inputs to our shaders.
    this.matrix = this.getUniformLocation("matrix");

    // Set the matrix to some that makes 1 unit 1 pixel.
    gl.viewport(0, 0, canvas.width, canvas.height);
    mapMatrix.setSize(canvas.width, canvas.height);
    gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);

    this.attachShaderVariables(byteCount);

    layer.redraw();

    return this;
  }

  resetVertices(): this {
    this.vertices = [];
    this.vertexLines = [];
    this.polygonLookup = new PolygonLookup();

    const {
      vertices,
      vertexLines,
      polygonLookup,
      settings,
      map,
      border,
      opacity,
      color,
    } = this;
    const data = settings.data;
    let pixel;
    let index;
    let features;
    let feature;
    let colorFn: ((i: number, feature: any) => Color.IColor) | null = null;
    let chosenColor: Color.IColor;
    let coordinates;
    let featureIndex = 0;
    let triangles;
    let indices;
    let flat;
    let dim;

    switch (data.type) {
      case "Feature":
        polygonLookup.loadFeatureCollection({
          type: "FeatureCollection",
          features: [data],
        });
        features = geojsonFlatten(data);
        break;
      case "MultiPolygon": {
        const geometry: Geometry = {
          type: "MultiPolygon",
          coordinates: data.coordinates,
        };
        polygonLookup.loadFeatureCollection({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature" as const,
              properties: { id: "bar" },
              geometry,
            },
          ],
        });
        features = geojsonFlatten(data);
        break;
      }
      default:
        polygonLookup.loadFeatureCollection(data);
        features = data.features;
    }
    const featureMax = features.length;

    if (!color) {
      throw new Error("color is not properly defined");
    } else if (typeof color === "function") {
      colorFn = color;
    }

    // -- data
    for (; featureIndex < featureMax; featureIndex++) {
      feature = features[featureIndex];
      triangles = [];

      // use colorFn function here if it exists
      if (colorFn !== null) {
        chosenColor = colorFn(featureIndex, feature);
      } else {
        chosenColor = color as Color.IColor;
      }

      coordinates = (feature.geometry || feature).coordinates;
      flat = earcut.flatten(coordinates);
      indices = earcut(flat.vertices, flat.holes, flat.dimensions);
      dim = coordinates[0][0].length;
      const { longitudeKey, latitudeKey } = this;
      for (let i = 0, iMax = indices.length; i < iMax; i++) {
        index = indices[i];
        if (typeof flat.vertices[0] === "number") {
          triangles.push(
            flat.vertices[index * dim + longitudeKey],
            flat.vertices[index * dim + latitudeKey]
          );
        } else {
          throw new Error("unhandled polygon");
        }
      }

      for (let i = 0, iMax = triangles.length; i < iMax; i) {
        pixel = map.project(new LatLng(triangles[i++], triangles[i++]), 0);
        vertices.push(
          pixel.x,
          pixel.y,
          chosenColor.r,
          chosenColor.g,
          chosenColor.b,
          chosenColor.a ?? opacity
        );
      }

      if (border) {
        const lines = [];
        for (let i = 1, iMax = flat.vertices.length; i < iMax; i = i + 2) {
          lines.push(flat.vertices[i], flat.vertices[i - 1]);
          lines.push(flat.vertices[i + 2], flat.vertices[i + 1]);
        }

        for (let i = 0, iMax = lines.length; i < iMax; i) {
          pixel = latLonToPixel(lines[i++], lines[i++]);
          vertexLines.push(
            pixel.x,
            pixel.y,
            chosenColor.r,
            chosenColor.g,
            chosenColor.b,
            chosenColor.a ?? opacity
          );
        }
      }
    }

    return this;
  }

  drawOnCanvas(e: ICanvasOverlayDrawEvent): this {
    if (!this.gl) return this;

    const { scale, offset, canvas } = e;
    const { mapMatrix, gl, vertices, settings, vertexLines, border } = this;
    // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix
      .setSize(canvas.width, canvas.height)
      .scaleTo(scale)
      .translateTo(-offset.x, -offset.y);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // -- attach matrix value to 'mapMatrix' uniform in shader
    gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);
    if (border) {
      const vertexLinesBuffer = this.getBuffer("vertexLines");
      const vertexLinesTypedArray = new Float32Array(vertexLines);
      const size = vertexLinesTypedArray.BYTES_PER_ELEMENT;
      const vertex = this.getAttributeLocation("vertex");
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

      const vertexBuffer = this.getBuffer("vertex");
      const verticesTypedArray = new Float32Array(vertices);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, verticesTypedArray, gl.STATIC_DRAW);

      if (settings.shaderVariables !== null) {
        this.attachShaderVariables(size);
      }

      gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, size * this.bytes, 0);
      gl.enableVertexAttribArray(vertex);
      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / this.bytes);

    return this;
  }

  // attempts to click the top-most Shapes instance
  static tryClick(
    e: LeafletMouseEvent,
    map: Map,
    instances: Shapes[]
  ): boolean | undefined {
    let foundPolygon: Polygon | null = null;
    let foundShapes: Shapes | null = null;
    instances.forEach(function (_instance: Shapes): void {
      if (!_instance.active) return;
      if (_instance.map !== map) return;
      if (!_instance.polygonLookup) return;

      const polygon = _instance.polygonLookup.search(
        e.latlng.lng,
        e.latlng.lat
      );
      if (polygon) {
        foundShapes = _instance;
        foundPolygon = polygon;
      }
    });

    if (foundShapes && foundPolygon) {
      const result = (foundShapes as Shapes).click(e, foundPolygon);
      return result !== undefined ? result : undefined;
    }
  }

  // hovers all touching Shapes instances
  static tryHover(
    e: LeafletMouseEvent,
    map: Map,
    instances: Shapes[]
  ): Array<boolean | undefined> {
    const results: boolean[] = [];
    let feature;

    instances.forEach((_instance: Shapes): void => {
      if (!_instance.active) return;
      if (_instance.map !== map) return;
      if (!_instance.polygonLookup) return;

      feature = _instance.polygonLookup.search(e.latlng.lng, e.latlng.lat);

      if (feature) {
        const result = _instance.hover(e, feature);
        if (result !== undefined) {
          results.push(result);
        }
      }
    });

    return results;
  }
}

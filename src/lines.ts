import { BaseGlLayer, IBaseGlLayerSettings } from "./base-gl-layer";
import { ICanvasOverlayDrawEvent } from "./canvas-overlay";
import * as color from "./color";
import { Map, LeafletMouseEvent, geoJSON } from "leaflet";
import { LineFeatureVertices } from "./line-feature-vertices";
import { pixelDistance, inBounds } from "./utils";
import { Feature, LineString, MultiLineString } from "geojson";

export interface ILinesSettings extends IBaseGlLayerSettings {
  weight: ((i: number, feature: any) => number) | number;
  sensitivity?: number;
  sensitivityHover?: number;
}

const defaults: Partial<ILinesSettings> = {
  data: [],
  color: color.random,
  className: "",
  opacity: 0.5,
  weight: 2,
  sensitivity: 0.1,
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
  },
};

export class Lines extends BaseGlLayer<ILinesSettings> {
  static defaults = defaults;

  bytes = 6;
  allVertices: number[];
  vertices: LineFeatureVertices[] = [];
  aPointSize = -1;
  settings: Partial<ILinesSettings>;

  get weight(): ((i: number, feature: any) => number) | number {
    if (!this.settings.weight) {
      throw new Error("settings.weight not correctly defined");
    }
    return this.settings.weight;
  }

  constructor(settings: Partial<ILinesSettings>) {
    super(settings);
    this.settings = { ...Lines.defaults, ...settings };

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map)
      throw new Error('no leaflet "map" object setting defined');

    this.active = true;
    this.allVertices = [];

    this.setup().render();
  }

  render(): this {
    this.resetVertices();

    const { canvas, gl, layer, vertices, mapMatrix } = this;
    const vertexBuffer = this.getBuffer("vertex");
    const vertexLocation = this.getAttributeLocation("vertex");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    /*
    Transforming lines according to the rule:
    1. Take one line (single feature)
    [[0,0],[1,1],[2,2]]
    2. Split the line in segments, duplicating all coordinates except first and last one
    [[0,0],[1,1],[2,2]] => [[0,0],[1,1],[1,1],[2,2]]
    3. Do this for all lines and put all coordinates in array
    */
    let size = vertices.length;
    const allVertices = [];
    for (let i = 0; i < size; i++) {
      const vertexArray = vertices[i].array;
      const length = vertexArray.length / this.bytes;
      for (let j = 0; j < length; j++) {
        const vertexIndex = j * this.bytes;
        if (j !== 0 && j !== length - 1) {
          allVertices.push(
            vertexArray[vertexIndex],
            vertexArray[vertexIndex + 1],
            vertexArray[vertexIndex + 2],
            vertexArray[vertexIndex + 3],
            vertexArray[vertexIndex + 4],
            vertexArray[vertexIndex + 5]
          );
        }
        allVertices.push(
          vertexArray[vertexIndex],
          vertexArray[vertexIndex + 1],
          vertexArray[vertexIndex + 2],
          vertexArray[vertexIndex + 3],
          vertexArray[vertexIndex + 4],
          vertexArray[vertexIndex + 5]
        );
      }
    }

    this.allVertices = allVertices;

    const vertArray = new Float32Array(allVertices);
    size = vertArray.BYTES_PER_ELEMENT;
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
      vertexLocation,
      2,
      gl.FLOAT,
      false,
      size * this.bytes,
      0
    );
    gl.enableVertexAttribArray(vertexLocation);

    //  gl.disable(gl.DEPTH_TEST);
    // ----------------------------
    // look up the locations for the inputs to our shaders.
    this.matrix = this.getUniformLocation("matrix");
    this.aPointSize = this.getAttributeLocation("pointSize");

    // Set the matrix to some that makes 1 unit 1 pixel.
    mapMatrix.setSize(canvas.width, canvas.height);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);

    this.attachShaderVariables(size);

    layer.redraw();

    return this;
  }

  resetVertices(): this {
    this.allVertices = [];
    this.vertices = [];

    const { vertices, map, opacity, color, latitudeKey, longitudeKey } = this;
    const settings = this.settings;
    const data = settings.data;
    const features = data.features;
    const featureMax = features.length;
    let feature: Feature<LineString | MultiLineString>;
    let colorFn: ((i: number, feature: any) => color.IColor) | null = null;
    let chosenColor: color.IColor;
    let featureIndex = 0;
    if (!color) {
      throw new Error("color is not properly defined");
    } else if (typeof color === "function") {
      colorFn = color;
    }

    // -- data
    for (; featureIndex < featureMax; featureIndex++) {
      feature = features[featureIndex];
      // use colorFn function here if it exists
      if (colorFn) {
        chosenColor = colorFn(featureIndex, feature);
      } else {
        chosenColor = color as color.IColor;
      }

      const featureVertices = new LineFeatureVertices({
        project: map.project.bind(map),
        latitudeKey,
        longitudeKey,
        color: chosenColor,
        opacity,
      });
      featureVertices.fillFromCoordinates(feature.geometry.coordinates);
      vertices.push(featureVertices);
    }

    return this;
  }

  drawOnCanvas(e: ICanvasOverlayDrawEvent): this {
    if (!this.gl) return this;

    const {
      gl,
      settings,
      canvas,
      mapMatrix,
      matrix,
      allVertices,
      vertices,
      weight,
    } = this;
    const { scale, offset, zoom } = e;
    const pointSize = Math.max(zoom - 4.0, 4.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.vertexAttrib1f(this.aPointSize, pointSize);
    mapMatrix.setSize(canvas.width, canvas.height).scaleMatrix(scale);
    if (zoom > 18) {
      mapMatrix.translateMatrix(-offset.x, -offset.y);
      // -- attach matrix value to 'mapMatrix' uniform in shader
      gl.uniformMatrix4fv(matrix, false, mapMatrix.array);

      gl.drawArrays(gl.LINES, 0, allVertices.length / this.bytes);
    } else if (typeof weight === "number") {
      // Now draw the lines several times, but like a brush, taking advantage of the half pixel line generally used by cards
      for (let yOffset = -weight; yOffset < weight; yOffset += 0.5) {
        for (let xOffset = -weight; xOffset < weight; xOffset += 0.5) {
          // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
          mapMatrix.translateMatrix(
            -offset.x + xOffset / scale,
            -offset.y + yOffset / scale
          );
          // -- attach matrix value to 'mapMatrix' uniform in shader
          gl.uniformMatrix4fv(matrix, false, mapMatrix.array);

          gl.drawArrays(gl.LINES, 0, allVertices.length / this.bytes);
        }
      }
    } else if (typeof weight === "function") {
      let allVertexCount = 0;
      const features = settings.data.features;
      for (let i = 0; i < vertices.length; i++) {
        const featureVertices = vertices[i];
        const vertexCount = featureVertices.vertexCount;
        const weightValue = weight(i, features[i]);
        // Now draw the lines several times, but like a brush, taking advantage of the half pixel line generally used by cards
        for (
          let yOffset = -weightValue;
          yOffset < weightValue;
          yOffset += 0.5
        ) {
          for (
            let xOffset = -weightValue;
            xOffset < weightValue;
            xOffset += 0.5
          ) {
            // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
            mapMatrix.translateMatrix(
              -offset.x + xOffset / scale,
              -offset.y + yOffset / scale
            );
            // -- attach matrix value to 'mapMatrix' uniform in shader
            gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);

            gl.drawArrays(gl.LINES, allVertexCount, vertexCount);
          }
        }
        allVertexCount += vertexCount;
      }
    }
    return this;
  }

  // attempts to click the top-most Lines instance
  static tryClick(e: LeafletMouseEvent, map: Map, instances: Lines[]): boolean | undefined {
    let foundFeature: Feature<LineString> | null = null;
    let foundLines: Lines | null = null;
    let settings;
    instances.forEach((_instance: Lines): void => {
      settings = _instance.settings;
      const { latitudeKey, longitudeKey, sensitivity } = _instance;
      if (!_instance.active) return;
      if (_instance.map !== map) return;

      settings.data.features.forEach((feature: Feature<LineString>): void => {
        const { coordinates } = feature.geometry;
        for (let i = 1; i < coordinates.length; i++) {
          const distance = pixelDistance(
            e.latlng.lng,
            e.latlng.lat,
            coordinates[i - 1][latitudeKey],
            coordinates[i - 1][longitudeKey],
            coordinates[i][latitudeKey],
            coordinates[i][longitudeKey]
          );
          if (distance < sensitivity) {
            foundFeature = feature;
            foundLines = _instance;
          }
        }
      });
    });

    if (foundLines && foundFeature) {
      const result = (foundLines as Lines).click(e, foundFeature);
      return result !== undefined ? result : undefined;
    }
  }

  // hovers all touching Lines instances
  static tryHover(e: LeafletMouseEvent, map: Map, instances: Lines[]): Array<boolean | undefined> {
    const results: Array<boolean | undefined> = [];
    instances.forEach((_instance: Lines): void => {
      const { settings } = _instance;
      const { sensitivityHover, latitudeKey, longitudeKey } = _instance;
      if (!_instance.active) return;
      if (map !== _instance.map) return;
      // Check if e.latlng is inside the bbox of the features
      const bounds = geoJSON(settings.data.features).getBounds();

      if (inBounds(e.latlng, bounds)) {
        settings.data.features.forEach((feature: Feature<LineString>): void => {
          for (let i = 1; i < feature.geometry.coordinates.length; i++) {
            const { coordinates } = feature.geometry;
            const distance = pixelDistance(
              e.latlng.lng,
              e.latlng.lat,
              coordinates[i - 1][latitudeKey],
              coordinates[i - 1][longitudeKey],
              coordinates[i][latitudeKey],
              coordinates[i][longitudeKey]
            );

            if (distance < sensitivityHover) {
              const result = _instance.hover(e, feature);
              if (result !== undefined) {
                results.push(result);
              }
            }
          }
        });
      }
    });
    return results;
  }
}

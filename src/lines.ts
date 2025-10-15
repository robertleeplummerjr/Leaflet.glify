import type {
  Map,
  LeafletMouseEvent,
  LatLngBounds,
  LatLng,
} from "leaflet";
import {
  latLng, // L.latLng()
  latLngBounds, // L.latLngBounds()
} from "leaflet";

import {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  Position,
} from "geojson";

import {
  BaseGlLayer,
  ColorCallback,
  IBaseGlLayerSettings,
} from "./base-gl-layer";
import { ICanvasOverlayDrawEvent } from "./canvas-overlay";
import * as color from "./color";
import { LineFeatureVertices } from "./line-feature-vertices";
import { latLngDistance, inBounds } from "./utils";
import glify from "./index";
import { getChosenColor } from "./color";

export type WeightCallback = (i: number, feature: any) => number;

export interface ILinesSettings extends IBaseGlLayerSettings {
  data: FeatureCollection<LineString | MultiLineString>;
  weight: WeightCallback | number;
  sensitivity?: number;
  sensitivityHover?: number;
  eachVertex?: (vertices: LineFeatureVertices) => void;
}

const defaults: Partial<ILinesSettings> = {
  data: {
    type: "FeatureCollection",
    features: [],
  },
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

  scale = Infinity;
  bytes = 6;
  allVertices: number[] = [];
  allVerticesTyped: Float32Array = new Float32Array(0);
  vertices: LineFeatureVertices[] = [];
  aPointSize = -1;
  settings: Partial<ILinesSettings>;

  get weight(): WeightCallback | number {
    if (!this.settings.weight) {
      throw new Error("settings.weight not correctly defined");
    }
    return this.settings.weight;
  }

  constructor(settings: Partial<ILinesSettings>) {
    super(settings);
    this.settings = { ...Lines.defaults, ...settings }; // as ILinesSettings;

    if (!settings.data) {
      throw new Error('"data" is missing');
    }
    this.active = true;
    this.setup().render();
  }

  render(): this {
    this.resetVertices();

    const { canvas, gl, layer, mapMatrix } = this;
    const vertexBuffer = this.getBuffer("vertex");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    const size = this.allVerticesTyped.BYTES_PER_ELEMENT;
    gl.bufferData(gl.ARRAY_BUFFER, this.allVerticesTyped, gl.STATIC_DRAW);
    const vertexLocation = this.getAttributeLocation("vertex");
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
    const {
      map,
      opacity,
      color,
      weight,
      latitudeKey,
      longitudeKey,
      data,
      bytes,
      settings,
      mapCenterPixels,
    } = this;
    const { eachVertex } = settings;
    const { features } = data;
    const featureMax = features.length;
    let feature: Feature<LineString | MultiLineString>;
    let colorFn: ColorCallback | null = null;
    let weightFn: WeightCallback | null = null;
    let chosenColor: color.IColor;
    let featureIndex = 0;
    let coordinates: Position[] | Position[][];

    if (typeof color === "function") {
      colorFn = color;
    }
    if (typeof weight === "function") {
      weightFn = weight;
    }

    const project = map.project.bind(map);
    // -- data
    const vertices: LineFeatureVertices[] = [];
    for (; featureIndex < featureMax; featureIndex++) {
      feature = features[featureIndex];
      // use colorFn function here if it exists
      if (colorFn) {
        chosenColor = colorFn(featureIndex, feature);
      } else {
        chosenColor = color as color.IColor;
      }
      chosenColor = getChosenColor(chosenColor);

      const chosenWeight: number = weightFn
        ? weightFn(featureIndex, feature)
        : (weight as number);

      //coorinates Array Structure depends on whether feature is multipart or not.
      //Multi: [ [[],[],[]...], [[],[],[]...], [[],[],[]...]... ], Single: [ [[],[],[]...] ]
      //Wrap Single Array to treat two types with same method
      coordinates = (feature.geometry || feature).coordinates;
      if (feature.geometry.type !== "MultiLineString") {
        coordinates = [coordinates as Position[]];
      }

      for (const coordinate of coordinates) {
        const featureVertices = new LineFeatureVertices({
          project,
          latitudeKey,
          longitudeKey,
          color: chosenColor,
          weight: chosenWeight,
          opacity,
          mapCenterPixels,
        });
        featureVertices.fillFromCoordinates(coordinate as Position[]);
        vertices.push(featureVertices);
        if (eachVertex) {
          eachVertex(featureVertices);
        }
      }
    }

    /*
    Transforming lines according to the rule:
    1. Take one line (single feature)
    [[0,0],[1,1],[2,2]]
    2. Split the line in segments, duplicating all coordinates except first and last one
    [[0,0],[1,1],[2,2]] => [[0,0],[1,1],[1,1],[2,2]]
    3. Do this for all lines and put all coordinates in array
    */
    const size = vertices.length;
    const allVertices = [];
    for (let i = 0; i < size; i++) {
      const vertexArray = vertices[i].array;
      const length = vertexArray.length / bytes;
      for (let j = 0; j < length; j++) {
        const vertexIndex = j * bytes;
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

    this.vertices = vertices;
    this.allVertices = allVertices;
    this.allVerticesTyped = new Float32Array(allVertices);

    return this;
  }

  removeInstance(): this {
    const index = glify.linesInstances.findIndex(
      (element) => element.layer._leaflet_id === this.layer._leaflet_id
    );
    if (index !== -1) {
      glify.linesInstances.splice(index, 1);
    }
    return this;
  }

  drawOnCanvas(e: ICanvasOverlayDrawEvent): this {
    if (!this.gl) return this;

    const {
      gl,
      data,
      canvas,
      mapMatrix,
      matrix,
      allVertices,
      vertices,
      weight,
      aPointSize,
      bytes,
      mapCenterPixels,
    } = this;
    const { scale, offset, zoom } = e;
    this.scale = scale;
    const pointSize = Math.max(zoom - 4.0, 4.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.vertexAttrib1f(aPointSize, pointSize);
    mapMatrix.setSize(canvas.width, canvas.height).scaleTo(scale);
    if (zoom > 18) {
      mapMatrix.translateTo(
        -offset.x + mapCenterPixels.x,
        -offset.y + mapCenterPixels.y
      );
      // -- attach matrix value to 'mapMatrix' uniform in shader
      gl.uniformMatrix4fv(matrix, false, mapMatrix.array);

      gl.drawArrays(gl.LINES, 0, allVertices.length / bytes);
    } else if (typeof weight === "number") {
      // Now draw the lines several times, but like a brush, taking advantage of the half pixel line generally used by cards
      for (let yOffset = -weight; yOffset <= weight; yOffset += 0.5) {
        for (let xOffset = -weight; xOffset <= weight; xOffset += 0.5) {
          // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
          mapMatrix.translateTo(
            -offset.x + mapCenterPixels.x + xOffset / scale,
            -offset.y + mapCenterPixels.y + yOffset / scale
          );
          // -- attach matrix value to 'mapMatrix' uniform in shader
          gl.uniformMatrix4fv(matrix, false, mapMatrix.array);

          gl.drawArrays(gl.LINES, 0, allVertices.length / bytes);
        }
      }
    } else if (typeof weight === "function") {
      let allVertexCount = 0;
      const { features } = data;
      for (let i = 0; i < vertices.length; i++) {
        const featureVertices = vertices[i];
        const { vertexCount } = featureVertices;
        const weightValue = weight(i, features[i]);
        // Now draw the lines several times, but like a brush, taking advantage of the half pixel line generally used by cards
        for (
          let yOffset = -weightValue;
          yOffset <= weightValue;
          yOffset += 0.5
        ) {
          for (
            let xOffset = -weightValue;
            xOffset <= weightValue;
            xOffset += 0.5
          ) {
            // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
            mapMatrix.translateTo(
              -offset.x + mapCenterPixels.x + xOffset / scale,
              -offset.y + mapCenterPixels.y + yOffset / scale
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

  // cache, to not recalculate bounds on each tryHover
  private _lastFeatureCount: number = 0;
  private _cachedBounds?: LatLngBounds;

  /**
   * Calculates and returns the bounding box (`LatLngBounds`) for all features in the current dataset (`settings.data.features`).
   *
   * The bounds are computed by iterating through each feature's geometry and determining the minimum and maximum
   * latitude and longitude values. The result is cached (for performance optimization) and recalculated only if the number of features changes.
   *
   * @returns {LatLngBounds} The calculated bounding box containing all feature coordinates.
   */
  getBounds(): LatLngBounds {
    const me = this;
    const features = me.settings.data?.features!; // settings.data is always declared in constructor. Avoiding warnings.
    const featuresCount = features.length;

    if (me._lastFeatureCount !== featuresCount) {
      me._lastFeatureCount = featuresCount;

      let minLat = Infinity, minLng = Infinity;
      let maxLat = -Infinity, maxLng = -Infinity;

      for (const feature of features) {
        for (const line of feature.geometry.type === 'LineString'
                                        ? [feature.geometry.coordinates]
                                        : feature.geometry.coordinates as Position[][]) {
          for (const coord of line) {
            const lat = coord[me.latitudeKey];
            const lng = coord[me.longitudeKey];
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
          }
        }
      }

      // set cached bounds
      me._cachedBounds = latLngBounds( // L.latLngBounds()
        { lat: minLat, lng: minLng }, // sw
        { lat: maxLat, lng: maxLng }  // ne
      );
    }

    return me._cachedBounds!; // guarantee that bounds are calculated
  }

  /**
   * Expands the given bounding box by a specified sensitivity and the line weight.
   * It's not really accurate if weight is a function, but it works for most cases.
   *
   * @param sensitivity - The amount to expand the bounds by, in map units.
   * @param bounds - Optional. The bounding box to expand. If not provided, uses the object's bounds.
   * @returns A new `LatLngBounds` object representing the expanded bounding box.
   */
  incBounds(sensitivity: number, bounds?: LatLngBounds): LatLngBounds {
    const bBox = bounds ?? this.getBounds();

    // increase the bounding box of the features by sensitivity + weight
    const pad = sensitivity
                    + (typeof this.weight === "function" ? 0 : this.weight) / this.scale;
    const sw = latLng(bBox.getSouth() - pad, bBox.getWest() - pad);
    const ne = latLng(bBox.getNorth() + pad, bBox.getEast() + pad);

    return latLngBounds(sw, ne);
  }

  // attempts to click the top-most Lines instance
  static tryClick(
    e: LeafletMouseEvent,
    map: Map,
    instances: Lines[]
  ): boolean | undefined {
    let foundFeature: Feature<LineString | MultiLineString> | null = null;
    let foundLines: Lines | null = null;

    instances.forEach((instance: Lines): void => {
      const {
        latitudeKey,
        longitudeKey,
        sensitivity,
        data,
        weight,
        scale,
        active
      } = instance;

      const features: Feature<LineString | MultiLineString>[] = data.features;
      const featuresLen: number = features.length;

      if (!active
            || map !== instance.map
            || !featuresLen) {
        return;
      }

      function checkClick(
        coordinate: Position,
        prevCoordinate: Position,
        feature: Feature<LineString | MultiLineString>,
        chosenWeight: number
      ): void {
        const distance = latLngDistance(
          e.latlng.lng,
          e.latlng.lat,
          prevCoordinate[longitudeKey],
          prevCoordinate[latitudeKey],
          coordinate[longitudeKey],
          coordinate[latitudeKey]
        );

        if (distance <= sensitivity + chosenWeight / scale) {
          foundFeature = feature;
          foundLines = instance;
        }
      }

      features.forEach(
        (feature: Feature<LineString | MultiLineString>, i: number): void => {
          const chosenWeight = typeof weight === "function" ? weight(i, feature) : weight;
          const { coordinates, type } = feature.geometry;
          if (type === "LineString") {
            for (let i = 1; i < coordinates.length; i++) {
              checkClick(
                coordinates[i] as Position,
                coordinates[i - 1] as Position,
                feature,
                chosenWeight
              );
            }
          } else if (type === "MultiLineString") {
            // TODO: Unit test
            for (let i = 0; i < coordinates.length; i++) {
              const coordinate = coordinates[i];
              for (let j = 0; j < coordinate.length; j++) {
                if (j === 0 && i > 0) {
                  const prevCoordinates = coordinates[i - 1];
                  const lastPositions =
                    prevCoordinates[prevCoordinates.length - 1];
                  checkClick(
                    lastPositions as Position,
                    coordinates[i][j] as Position,
                    feature,
                    chosenWeight
                  );
                } else if (j > 0) {
                  checkClick(
                    coordinates[i][j] as Position,
                    coordinates[i][j - 1] as Position,
                    feature,
                    chosenWeight
                  );
                }
              }
            }
          }
        }
      );
    });

    if (foundLines && foundFeature) {
      const result = (foundLines as Lines).click(e, foundFeature);
      return result; // same as: return result !== undefined ? result : undefined;
    }
  }

  // attempts to click the top-most Lines instance
  static tryContextMenu(
    e: LeafletMouseEvent,
    map: Map,
    instances: Lines[]
  ): boolean | undefined {
    let foundFeature: Feature<LineString | MultiLineString> | null = null;
    let foundLines: Lines | null = null;

    instances.forEach((instance: Lines): void => {
      const {
        latitudeKey,
        longitudeKey,
        sensitivity,
        data,
        weight,
        scale,
        active
      } = instance;

      const features: Feature<LineString | MultiLineString>[] = data.features;
      const featuresLen: number = features.length;

      if (!active
            || map !== instance.map
            || !featuresLen) {
        return;
      }

      function checkContextMenu(
        coordinate: Position,
        prevCoordinate: Position,
        feature: Feature<LineString | MultiLineString>,
        chosenWeight: number
      ): void {
        const distance = latLngDistance(
          e.latlng.lng,
          e.latlng.lat,
          prevCoordinate[longitudeKey],
          prevCoordinate[latitudeKey],
          coordinate[longitudeKey],
          coordinate[latitudeKey]
        );
        if (distance <= sensitivity + chosenWeight / scale) {
          foundFeature = feature;
          foundLines = instance;
        }
      }

      features.forEach(
        (feature: Feature<LineString | MultiLineString>, i: number): void => {
          const chosenWeight = typeof weight === "function" ? weight(i, feature) : weight;
          const { coordinates, type } = feature.geometry;
          if (type === "LineString") {
            for (let i = 1; i < coordinates.length; i++) {
              checkContextMenu(
                coordinates[i] as Position,
                coordinates[i - 1] as Position,
                feature,
                chosenWeight
              );
            }
          } else if (type === "MultiLineString") {
            // TODO: Unit test
            for (let i = 0; i < coordinates.length; i++) {
              const coordinate = coordinates[i];
              for (let j = 0; j < coordinate.length; j++) {
                if (j === 0 && i > 0) {
                  const prevCoordinates = coordinates[i - 1];
                  const lastPositions =
                    prevCoordinates[prevCoordinates.length - 1];
                  checkContextMenu(
                    lastPositions as Position,
                    coordinates[i][j] as Position,
                    feature,
                    chosenWeight
                  );
                } else if (j > 0) {
                  checkContextMenu(
                    coordinates[i][j] as Position,
                    coordinates[i][j - 1] as Position,
                    feature,
                    chosenWeight
                  );
                }
              }
            }
          }
        }
      );
    });

    if (foundLines && foundFeature) {
      const result = (foundLines as Lines).contextMenu(e, foundFeature);
      return result; // same as: return result !== undefined ? result : undefined;
    }
  }

  hoveringFeatures: Array<Feature<LineString | MultiLineString>> = [];

  // hovers all touching Lines instances
  static tryHover(
    e: LeafletMouseEvent,
    map: Map,
    instances: Lines[]
  ): Array<boolean | undefined> {
    const results: Array<boolean | undefined> = [];

    instances.forEach((instance: Lines): void => {
      const {
        sensitivityHover,
        latitudeKey,
        longitudeKey,
        data,
        hoveringFeatures,
        weight,
        scale,
        active
      } = instance;

      const features: Feature<LineString | MultiLineString>[] = data.features;
      const featuresLen: number = features.length;

      if (!active
            || map !== instance.map
            || !featuresLen
            || (!instance.hover && !instance.hoverOff)) { // if none of these method are used, no need to do all the calculations below to check whether mouse hovers some feature.
        return;
      }

      function checkHover(
        coordinate: Position,
        prevCoordinate: Position,
        feature: Feature<LineString | MultiLineString>,
        chosenWeight: number
      ): boolean {
        const distance = latLngDistance(
          e.latlng.lng,
          e.latlng.lat,
          prevCoordinate[longitudeKey],
          prevCoordinate[latitudeKey],
          coordinate[longitudeKey],
          coordinate[latitudeKey]
        );

        if (distance <= sensitivityHover + chosenWeight / scale) {
          if (!newHoveredFeatures.includes(feature)) {
            newHoveredFeatures.push(feature);
          }
          if (!oldHoveredFeatures.includes(feature)) {
            return true;
          }
        }
        return false;
      }

      const oldHoveredFeatures = hoveringFeatures;
      const newHoveredFeatures: Array<Feature<LineString | MultiLineString>> = [];
      instance.hoveringFeatures = newHoveredFeatures;

      // AK 2025-07-21: this is check for performance optimization, if point is outside of boundaries of all features but feel free to comment out the inBounds check.
      // Use incBounds to increase the bounding box of the features by sensitivityHover + weight
      if (inBounds(e.latlng, instance.incBounds(sensitivityHover))) { // Check if e.latlng is inside the boundaries of all the features (BTW, don't use Leaflet's geoJSON, it has swapped lat/lng)
        features.forEach(
          (feature: Feature<LineString | MultiLineString>, i: number): void => {
            const chosenWeight = typeof weight === "function" ? weight(i, feature) : weight;
            const { coordinates, type } = feature.geometry;
            let isHovering = false;
            if (type === "LineString") {
              for (let i = 1; i < coordinates.length; i++) {
                isHovering = checkHover(
                  coordinates[i] as Position,
                  coordinates[i - 1] as Position,
                  feature,
                  chosenWeight
                );
                if (isHovering) break;
              }
            } else if (type === "MultiLineString") {
              // TODO: Unit test
              for (let i = 0; i < coordinates.length; i++) {
                const coordinate = coordinates[i];
                for (let j = 0; j < coordinate.length; j++) {
                  if (j === 0 && i > 0) {
                    const prevCoordinates = coordinates[i - 1];
                    const lastPositions =
                      prevCoordinates[prevCoordinates.length - 1];
                    isHovering = checkHover(
                      lastPositions as Position,
                      coordinates[i][j] as Position,
                      feature,
                      chosenWeight
                    );
                    if (isHovering) break;

                  } else if (j > 0) {
                    isHovering = checkHover(
                      coordinates[i][j] as Position,
                      coordinates[i][j - 1] as Position,
                      feature,
                      chosenWeight
                    );
                    if (isHovering) break;
                  }
                }
              }
            }
            if (isHovering) {
              const result = instance.hover(e, feature);
              if (result !== undefined) {
                results.push(result);
              }
            }
          }
        );
      }

      // call `hoverOff()` only if it's really used in current instance.
      if (instance.hoverOff) {
        for (const oldHoveredFeature of oldHoveredFeatures) {
          if (!newHoveredFeatures.includes(oldHoveredFeature)) {
            instance.hoverOff(e, oldHoveredFeature);
          }
        }
      }
    });
    return results;
  }
}

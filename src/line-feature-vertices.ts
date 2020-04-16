import { LatLng } from './leaflet-bindings';
import { IColor } from './color';
import { IPixel } from './pixel';

interface ILineFeatureVerticesSettings {
  project: (coordinates: LatLng, distance: number) => IPixel;
  color: IColor;
  latitudeKey?: number;
  longitudeKey?: number;
}

export class LineFeatureVertices {
  project: (coordinates: LatLng, distance: number) => IPixel;
  latitudeKey?: number;
  longitudeKey?: number;
  color: IColor;
  vertexCount: number;
  array: number[];
  length: number;

  constructor(settings: ILineFeatureVerticesSettings) {
    Object.assign(this, settings);
    this.vertexCount = 0;
    this.array = [];
    this.length = 0;
  }

  fillFromCoordinates(coordinates) {
    const { color } = this;
    for (let i = 0; i < coordinates.length; i++) {
      if (Array.isArray(coordinates[i][0])) {
        this.fillFromCoordinates(coordinates[i]);
        continue;
      }
      const pixel = this.project(
        new LatLng(
          coordinates[i][this.latitudeKey],
          coordinates[i][this.longitudeKey]
        ), 0);
      this.push(pixel.x, pixel.y, color.r, color.g, color.b);
      if (i !== 0 && i !== coordinates.length - 1) {
        this.vertexCount += 1;
      }
      this.vertexCount += 1;
    }
  }

  push(...args) {
    this.array.push(...args);
    this.length = this.array.length;
  }
}
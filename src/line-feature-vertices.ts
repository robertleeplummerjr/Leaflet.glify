import { LatLng } from 'leaflet';
import { IColor } from './color';
import { IPixel } from './pixel';

interface ILineFeatureVerticesSettings {
  project: (coordinates: LatLng, distance: number) => IPixel;
  color: IColor;
  latitudeKey?: number;
  longitudeKey?: number;
  opacity: number;
}

export class LineFeatureVertices {
  settings: ILineFeatureVerticesSettings;
  vertexCount: number;
  array: number[];
  length: number;

  constructor(settings: ILineFeatureVerticesSettings) {
    this.settings = settings;
    this.vertexCount = 0;
    this.array = [];
    this.length = 0;
  }

  fillFromCoordinates(coordinates) {
    const { color, opacity, project, latitudeKey, longitudeKey } = this.settings;
    for (let i = 0; i < coordinates.length; i++) {
      if (Array.isArray(coordinates[i][0])) {
        this.fillFromCoordinates(coordinates[i]);
        continue;
      }
      const pixel = project(
        new LatLng(
          coordinates[i][latitudeKey],
          coordinates[i][longitudeKey]
        ), 0);
      this.push(pixel.x, pixel.y, color.r, color.g, color.b, color.a || opacity);
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

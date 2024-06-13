import { LatLng } from "leaflet";
import { Position } from "geojson";
import { IColor } from "./color";
import { IPixel } from "./pixel";

interface ILineFeatureVerticesSettings {
  project: (coordinates: LatLng, distance: number) => IPixel;
  color: IColor;
  weight: number;
  latitudeKey: number;
  longitudeKey: number;
  opacity: number;
  mapCenterPixels: IPixel;
}

export class LineFeatureVertices {
  settings: ILineFeatureVerticesSettings;
  vertexCount: number;
  array: number[];
  pixels: IPixel[] = [];
  latLngs: LatLng[] = [];
  get length(): number {
    return this.array.length;
  }

  constructor(settings: ILineFeatureVerticesSettings) {
    this.settings = settings;
    this.vertexCount = 0;
    this.array = [];
  }

  fillFromCoordinates(coordinates: Position[] | Position[][]): void {
    const {
      color,
      opacity,
      project,
      latitudeKey,
      longitudeKey,
      mapCenterPixels,
    } = this.settings;
    for (let i = 0; i < coordinates.length; i++) {
      if (Array.isArray(coordinates[i][0])) {
        this.fillFromCoordinates(coordinates[i] as Position[]);
        continue;
      }
      const flatterCoordinates: Position[] = coordinates as Position[];
      const latLng = new LatLng(
        flatterCoordinates[i][latitudeKey],
        flatterCoordinates[i][longitudeKey]
      );
      this.latLngs.push(latLng);
      const pixel = project(latLng, 0);
      this.pixels.push(pixel);
      this.push(
        pixel.x - mapCenterPixels.x,
        pixel.y - mapCenterPixels.y,
        color.r,
        color.g,
        color.b,
        color.a ?? opacity
      );
      if (i !== 0 && i !== coordinates.length - 1) {
        this.vertexCount += 1;
      }
      this.vertexCount += 1;
    }
  }

  push(...args: number[]) {
    this.array.push(...args);
  }
}

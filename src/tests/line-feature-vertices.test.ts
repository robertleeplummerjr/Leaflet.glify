import { LineFeatureVertices } from "../line-feature-vertices";
import { LatLng } from "leaflet";
import { IPixel } from "../pixel";
import { Position } from "geojson";

describe("LineFeatureVertices", () => {
  const settings = {
    project: (coordinates: LatLng, distance: number): IPixel => {
      return { x: coordinates.lat, y: coordinates.lng };
    },
    color: { r: 1, g: 1, b: 1, a: 1 },
    latitudeKey: 0,
    longitudeKey: 1,
    opacity: 1,
    weight: 1,
    mapCenterPixels: {x:0,y:0},
  };
  describe("constructor", () => {
    it("sets this.settings, this.vertexCount, and this.array correctly", () => {
      const lfv = new LineFeatureVertices(settings);
      expect(lfv.settings).toBe(settings);
      expect(lfv.vertexCount).toBe(0);
      expect(lfv.array).toEqual([]);
    });
  });
  describe("fillFromCoordinates", () => {
    describe("using coordinates: Position[][]", () => {
      it("recursively flattens them", () => {
        const positions: Position[][] = [[[1, 2]], [[3, 4]]];
        const lfv = new LineFeatureVertices(settings);
        lfv.fillFromCoordinates(positions);
        expect(lfv.vertexCount).toBe(2);
        const { color } = settings;
        expect(lfv.array).toEqual([
          /* x */ 1,
          /* y */ 2,
          color.r,
          color.g,
          color.b,
          color.a,
          /* x */ 3,
          /* y */ 4,
          color.r,
          color.g,
          color.b,
          color.a,
        ]);
      });
    });
    describe("using coordinates: Position[]", () => {
      it("recursively flattens them", () => {
        const positions: Position[] = [
          [1, 2],
          [3, 4],
        ];
        const lfv = new LineFeatureVertices(settings);
        lfv.fillFromCoordinates(positions);
        expect(lfv.vertexCount).toBe(2);
        const { color } = settings;
        expect(lfv.array).toEqual([
          /* x */ 1,
          /* y */ 2,
          color.r,
          color.g,
          color.b,
          color.a,
          /* x */ 3,
          /* y */ 4,
          color.r,
          color.g,
          color.b,
          color.a,
        ]);
        expect(lfv.vertexCount).toBe(2);
      });
    });
  });
  describe("push", () => {
    it("pushes to this.array", () => {
      const lfv = new LineFeatureVertices(settings);
      lfv.push(1, 2, 3);
      expect(lfv.array).toEqual([1, 2, 3]);
    });
  });

  describe("length", () => {
    it("provides the length from this.array", () => {
      const lfv = new LineFeatureVertices(settings);
      lfv.push(1, 2, 3);
      expect(lfv.length).toEqual(3);
    });
  });
});

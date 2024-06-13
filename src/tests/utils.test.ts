import {
  latLonToPixel,
  latLngDistance,
  pixelInCircle,
  vectorDistance,
} from "../utils";

describe("utils", () => {
  describe("latLonToPixel", () => {
    it("converts latitude longitude to pixel", () => {
      const pixel = latLonToPixel(5, 10);
      expect(pixel.x).toBeCloseTo(135.11111);
      expect(pixel.y).toBeCloseTo(124.43992);
    });
  });

  describe("pointInCircle", () => {
    describe("when a point is within the defined circle", () => {
      it("returns true", () => {
        expect(pixelInCircle({ x: 5, y: 5 }, { x: 5, y: 5 }, 1)).toBeTruthy();
      });
    });
    describe("when a point is outside the defined circle", () => {
      it("returns false", () => {
        expect(pixelInCircle({ x: 5, y: 5 }, { x: 2, y: 2 }, 1)).toBeFalsy();
      });
    });
  });

  describe("latLngDistance", () => {
    describe("when used with positive numbers", () => {
      it("calculates the distance correctly", () => {
        expect(latLngDistance(1, 1, 2, 2, 3, 3)).toBeCloseTo(1.41421);
      });
    });
    describe("when used with negative numbers", () => {
      it("calculates the distance correctly", () => {
        expect(latLngDistance(-1, -1, -2, -2, -3, -3)).toBeCloseTo(1.41421);
      });
    });
  });

  describe("vectorDistance", () => {
    it("calculates square root vector distance", () => {
      expect(vectorDistance(2, 4)).toBeCloseTo(4.472135);
    });
  });
});

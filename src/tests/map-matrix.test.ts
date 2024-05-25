import { MapMatrix } from "../map-matrix";

describe("MapMatrix", () => {
  describe("constructor", () => {
    it("sets this.array with empty typed array", () => {
      const mapMatrix = new MapMatrix();
      expect(mapMatrix.array).toEqual(new Float32Array(16));
    });
  });
  describe("setSize", () => {
    it("sets size correctly", () => {
      const mapMatrix = new MapMatrix();
      mapMatrix.setSize(1, 2);
      const row1 = [2, 0, 0, 0];
      const row2 = [0, -1, 0, 0];
      const row3 = [0, 0, 0, 0];
      const row4 = [-1, 1, 0, 1];
      expect(mapMatrix.array).toEqual(
        new Float32Array([...row1, ...row2, ...row3, ...row4])
      );
    });
  });
  describe("translateTo", () => {
    it("translates correctly", () => {
      const mapMatrix = new MapMatrix();
      mapMatrix.array = new Float32Array([
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
      ]);
      mapMatrix.translateTo(10, 10);
      const row1 = [1, 2, 3, 4];
      const row2 = [5, 6, 7, 8];
      const row3 = [9, 10, 11, 12];
      const row4 = [9, 61, 15, 16];
      expect(mapMatrix.array).toEqual(
        new Float32Array([...row1, ...row2, ...row3, ...row4])
      );
    });
  });
});

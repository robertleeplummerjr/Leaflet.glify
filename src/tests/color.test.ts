import { blue, fromHex, getChosenColor, green, hexToRgbNormalized, pallet, random, red, teal, yellow } from "../color";

describe("color", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("fromHex", () => {
    expect(fromHex("#ffffff")).toEqual({
      r: 1,
      g: 1,
      b: 1,
      a: 1,
    });
    expect(fromHex("#00000")).toEqual({
      r: 0,
      g: 0,
      b: 0,
      a: 1,
    });
    // Invalid inputs
    expect(fromHex("")).toBeNull();
    expect(fromHex("#")).toBeNull();
    expect(fromHex("#fff")).toBeNull();
    expect(fromHex("#1234")).toBeNull();
  });

  test("random", () => {
    const color = random();
    expect(color.r).toBeLessThan(1);
    expect(color.r).toBeGreaterThan(0);
    expect(color.g).toBeLessThan(1);
    expect(color.g).toBeGreaterThan(0);
    expect(color.b).toBeLessThan(1);
    expect(color.b).toBeGreaterThan(0);
    expect(color.a).toBeLessThan(1);
    expect(color.a).toBeGreaterThan(0);
  });

  describe("pallet", () => {
    const validColors = [green, red, blue, teal, yellow];

    test("pallet", () => {
      const color = pallet();
      expect(color.r).toBeLessThan(1.01);
      expect(color.r).toBeGreaterThan(-0.01);
      expect(color.g).toBeLessThan(1.01);
      expect(color.g).toBeGreaterThan(-0.01);
      expect(color.b).toBeLessThan(1.01);
      expect(color.b).toBeGreaterThan(-0.01);
      expect(color.a).toBeLessThan(1.01);
      expect(color.a).toBeGreaterThan(-0.01);
    });
    test("should return a valid IColor object", () => {
      const color = pallet();
      expect(color.r).toBeGreaterThanOrEqual(0);
      expect(color.r).toBeLessThanOrEqual(1);
      expect(color.g).toBeGreaterThanOrEqual(0);
      expect(color.g).toBeLessThanOrEqual(1);
      expect(color.b).toBeGreaterThanOrEqual(0);
      expect(color.b).toBeLessThanOrEqual(1);
      if (color.a !== undefined) {
        expect(color.a).toBeGreaterThanOrEqual(0);
        expect(color.a).toBeLessThanOrEqual(1);
      }
    });

    test("should return one of the predefined colors", () => {
      const color = pallet();
      expect(validColors).toContainEqual(color);
    });

    test("should return each predefined color over multiple calls", () => {
      const occurrences = { green: 0, red: 0, blue: 0, teal: 0, yellow: 0 };

      // Call `pallet` multiple times to ensure each color is returned
      for (let i = 0; i < 1000; i++) {
        const color = pallet();
        if (color === green) occurrences.green++;
        else if (color === red) occurrences.red++;
        else if (color === blue) occurrences.blue++;
        else if (color === teal) occurrences.teal++;
        else if (color === yellow) occurrences.yellow++;
      }

      // Ensure each color appears at least once
      Object.values(occurrences).forEach((count) => {
        expect(count).toBeGreaterThan(0);
      });
    });

    test("should return yellow as default for unexpected cases", () => {
      // Mock Math.random to simulate an unexpected case
      const originalMathRandom = Math.random;
      Math.random = () => 5; // Out of range
      const color = pallet();
      expect(color).toEqual(yellow);
      Math.random = originalMathRandom; // Restore Math.random
    });
  });

  describe("hexToRgbNormalized", () => {

    it("converts a 6-character hex to normalized RGB", () => {
      expect(hexToRgbNormalized("#ff5733")).toEqual({
        r: 1,
        g: 0.3411764705882353,
        b: 0.2,
      });
    });

    it("converts a 3-character hex to normalized RGB", () => {
      expect(hexToRgbNormalized("#f53")).toEqual({
        r: 1,
        g: 0.3333333333333333,
        b: 0.2,
      });
    });

    it("handles an 8-character hex with alpha", () => {
      expect(hexToRgbNormalized("#ff5733a3")).toEqual({
        r: 1,
        g: 0.3411764705882353,
        b: 0.2,
        a: 0.6392156862745098,
      });
    });

    it("returns default gray for invalid input", () => {
      expect(hexToRgbNormalized("invalid")).toEqual({
        r: 0.5,
        g: 0.5,
        b: 0.5,
        a: 1,
      });
    });

    it("handles missing '#' in hex string", () => {
      expect(hexToRgbNormalized("ff5733")).toEqual({
        r: 1,
        g: 0.3411764705882353,
        b: 0.2,
      });
    });
  });

  describe("getChosenColor", () => {
    it("returns RGB object for a valid 6-character hex string", () => {
      expect(getChosenColor("#ff5733")).toEqual({
        r: 1,
        g: 0.3411764705882353,
        b: 0.2,
      });
    });

    it("returns RGBA object for an 8-character hex string with alpha", () => {
      expect(getChosenColor("#ff5733a3")).toEqual({
        r: 1,
        g: 0.3411764705882353,
        b: 0.2,
        a: 0.6392156862745098,
      });
    });

    it("handles an RGB array with 3 elements", () => {
      expect(getChosenColor([0.1, 0.4, 0.8])).toEqual({
        r: 0.1,
        g: 0.4,
        b: 0.8,
      });
    });

    it("handles an RGBA array with 4 elements", () => {
      expect(getChosenColor([0.1, 0.4, 0.8, 0.6])).toEqual({
        r: 0.1,
        g: 0.4,
        b: 0.8,
        a: 0.6,
      });
    });

    it("handles an RGB object without alpha", () => {
      expect(
        getChosenColor({
          r: 0.1,
          g: 0.4,
          b: 0.8,
        })
      ).toEqual({
        r: 0.1,
        g: 0.4,
        b: 0.8,
      });
    });

    it("handles an RGB object with alpha", () => {
      expect(
        getChosenColor({
          r: 0.1,
          g: 0.4,
          b: 0.8,
          a: 0.5,
        })
      ).toEqual({
        r: 0.1,
        g: 0.4,
        b: 0.8,
        a: 0.5,
      });
    });

    it("throws an error for invalid array length", () => {
      // @ts-ignore
      expect(() => getChosenColor([0.1, 0.4])).toThrow(
        "Invalid array length for RGB or RGBA values."
      );
    });

    it("returns default gray for invalid hex string", () => {
      expect(getChosenColor("invalid")).toEqual({
        r: 0.5,
        g: 0.5,
        b: 0.5,
        a: 1,
      });
    });
  });

});

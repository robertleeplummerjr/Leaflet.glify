import { fromHex, pallet, random } from "../color";

describe("color", () => {
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
});

import { notProperlyDefined } from "../errors";

describe("notProperlyDefined", () => {
  it("uses properly defined message", () => {
    expect(notProperlyDefined("prop")).toEqual('"prop" not properly defined');
  });
});

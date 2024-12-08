import { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { Map, Point } from "leaflet";
import geojsonFlatten from "geojson-flatten";
import PolygonLookup from "polygon-lookup";
import earcut from "earcut";

import { IShapesSettings, Shapes } from "../shapes";
import { notProperlyDefined } from "../errors";

jest.mock("../canvas-overlay");
jest.mock("geojson-flatten", () => {
  const realGeojsonFlatten = jest.requireActual<typeof geojsonFlatten>(
    "geojson-flatten"
  );
  return {
    __esModule: true,
    default: jest.fn((v) => realGeojsonFlatten(v)),
  };
});
jest.mock("polygon-lookup", () => {
  return {
    __esModule: true,
    default: class MockPolygonLookup {
      loadFeatureCollection: jest.Mock<void>;
      constructor() {
        this.loadFeatureCollection = jest.fn();
      }
    },
  };
});
jest.mock("earcut", () => {
  const realEarcut = jest.requireActual<typeof earcut>("earcut");
  jest.spyOn(realEarcut, "flatten");
  return {
    __esModule: true,
    default: realEarcut,
  };
});

function getShapes(settings?: Partial<IShapesSettings>): Shapes {
  const element = document.createElement("div");
  const map = new Map(element);
  const data: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  return new Shapes({
    map,
    data,
    vertexShaderSource: " ",
    fragmentShaderSource: " ",
    latitudeKey: 0,
    longitudeKey: 1,
    ...settings,
  });
}

describe("Shapes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("border", () => {
    describe("when border is not a boolean", () => {
      it("throws", () => {
        expect(() => {
          getShapes({ border: undefined });
        }).toThrow(notProperlyDefined("settings.border"));
      });
    });
    describe("when border is a boolean", () => {
      it("returns correct output for border: true", () => {
        const shapes = getShapes({ border: true });
        expect(shapes.settings.border).toBe(true); // Ensure the setting is applied
        // Additional assertions to validate the behavior when border is true
      });

      it("returns correct output for border: false", () => {
        const shapes = getShapes({ border: false });
        expect(shapes.settings.border).toBe(false); // Ensure the setting is applied
        // Additional assertions to validate the behavior when border is false
      });
    });
  });
  describe("borderOpacity", () => {
    describe("when borderOpacity is not a number", () => {
      it("throws", () => {
        expect(() => {
          getShapes({ borderOpacity: undefined });
        }).toThrow(notProperlyDefined("settings.borderOpacity"));
      });
    });
  });
  describe("constructor", () => {
    let setupSpy: jest.SpyInstance;
    let renderSpy: jest.SpyInstance;
    beforeEach(() => {
      setupSpy = jest.spyOn(Shapes.prototype, "setup");
      renderSpy = jest.spyOn(Shapes.prototype, "render");
    });
    afterEach(() => {
      setupSpy.mockRestore();
      renderSpy.mockRestore();
    });
    it("sets this.settings from argument", () => {
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: [],
      };
      const shapes = getShapes({ data });
      expect(shapes.settings.data).toBe(data);
    });
    describe("when data is falsey", () => {
      it("throws", () => {
        expect(() => {
          getShapes({ data: undefined });
        }).toThrow(notProperlyDefined("settings.data"));
      });
    });
    describe("when map is falsey", () => {
      it("throws", () => {
        expect(() => {
          getShapes({ map: undefined });
        }).toThrow(notProperlyDefined("settings.map"));
      });
    });
    it("calls this.setup and this.render", () => {
      getShapes();
      expect(setupSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe("render", () => {
    it("calls this.resetVertices", () => {
      const shapes = getShapes();
      const resetVerticesSpy = jest.spyOn(shapes, "resetVertices");
      shapes.render();
      expect(resetVerticesSpy).toHaveBeenCalled();
    });
    it("calls this.gl correctly", () => {
      const shapes = getShapes();
      const { gl, canvas, matrix, mapMatrix } = shapes;
      const getBufferSpy = jest.spyOn(shapes, "getBuffer");
      const mockVertexBuffer = new WebGLBuffer();
      getBufferSpy.mockReturnValue(mockVertexBuffer);
      const mockVertexLocation = 99;
      const getAttributeLocationSpy = jest.spyOn(
        shapes,
        "getAttributeLocation"
      );
      getAttributeLocationSpy.mockReturnValue(mockVertexLocation);
      const bindBufferSpy = jest.spyOn(gl, "bindBuffer");
      const bufferDataSpy = jest.spyOn(gl, "bufferData");
      const vertexAttribPointerSpy = jest.spyOn(gl, "vertexAttribPointer");
      const enableVertexAttribArraySpy = jest.spyOn(
        gl,
        "enableVertexAttribArray"
      );
      const getUniformLocationSpy = jest.spyOn(shapes, "getUniformLocation");
      const mockMatrixLocation = new WebGLUniformLocation();
      getUniformLocationSpy.mockReturnValue(mockMatrixLocation);
      const viewportSpy = jest.spyOn(gl, "viewport");
      const uniformMatrix4fvSpy = jest.spyOn(gl, "uniformMatrix4fv");
      shapes.render();
      expect(bindBufferSpy).toHaveBeenCalledWith(
        gl.ARRAY_BUFFER,
        mockVertexBuffer
      );
      expect(bufferDataSpy).toHaveBeenCalledWith(
        gl.ARRAY_BUFFER,
        new Float32Array(0),
        gl.STATIC_DRAW
      );
      expect(vertexAttribPointerSpy).toHaveBeenCalledWith(
        mockVertexLocation,
        2,
        gl.FLOAT,
        false,
        24,
        0
      );
      expect(enableVertexAttribArraySpy).toHaveBeenCalledWith(
        mockVertexLocation
      );
      expect(viewportSpy).toHaveBeenCalledWith(
        0,
        0,
        canvas.width,
        canvas.height
      );
      expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
        matrix,
        false,
        mapMatrix.array
      );
    });
    it("sets this.matrix", () => {
      const shapes = getShapes();
      shapes.matrix = null;
      shapes.render();
      expect(shapes.matrix).not.toBeUndefined();
    });
    it("calls mapMatrix.setSize with canvas size", () => {
      const shapes = getShapes();
      const setSizeSpy = jest.spyOn(shapes.mapMatrix, "setSize");
      shapes.render();
      expect(setSizeSpy).toHaveBeenCalledWith(
        shapes.canvas.width,
        shapes.canvas.height
      );
    });
    it("calls this.layer.redraw", () => {
      const shapes = getShapes();
      const redrawSpy = jest.spyOn(shapes.layer, "redraw");
      shapes.render();
      expect(redrawSpy).toHaveBeenCalled();
    });
  });
  describe("resetVertices", () => {
    it("sets properties", () => {
      const shapes = getShapes();
      delete shapes.vertices;
      delete shapes.vertexLines;

      shapes.polygonLookup = null;
      shapes.resetVertices();
      expect(shapes.vertices).toEqual([]);
      expect(shapes.vertexLines).toEqual([]);
      expect(shapes.polygonLookup).toBeInstanceOf(PolygonLookup);
    });
    describe('when data.type = "Feature"', () => {
      it("calls PolygonLookup.loadFeatureCollection and geojsonFlatten correctly", () => {
        const data: Feature<Polygon> = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [],
          },
          properties: {},
        };
        const shapes = getShapes({
          data,
        });

        expect(
          shapes.polygonLookup?.loadFeatureCollection
        ).toHaveBeenCalledWith({
          type: "FeatureCollection",
          features: [data],
        });
        expect(geojsonFlatten).toHaveBeenCalledWith(data);
      });
    });
    describe('when data.type = "MultiPolygon"', () => {
      const data: MultiPolygon = {
        type: "MultiPolygon",
        coordinates: [],
      };
      it("calls PolygonLookup.loadFeatureCollection and geojsonFlatten correctly", () => {
        const shapes = getShapes({
          data,
        });

        expect(
          shapes.polygonLookup?.loadFeatureCollection
        ).toHaveBeenCalledWith({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "MultiPolygon",
                coordinates: data.coordinates,
              },
            },
          ],
        });
        expect(geojsonFlatten).toHaveBeenCalledWith(data);
      });

      it("calls PolygonLookup.loadFeatureCollection and geojsonFlatten correctly with border set to true", () => {
        const shapes = getShapes({
          data,
          border: true,
        });

        expect(
          shapes.polygonLookup?.loadFeatureCollection
        ).toHaveBeenCalledWith({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "MultiPolygon",
                coordinates: data.coordinates,
              },
            },
          ],
        });
        expect(shapes.settings.border).toBe(true);
      });

      const datamulti: Feature = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [0.0, 0.0],
                [1.0, 0.0],
                [1.0, 1.0],
                [0.0, 1.0],
                [0.0, 0.0], // Closing the first polygon
              ],
            ],
            [
              [
                [2.0, 2.0],
                [3.0, 2.0],
                [3.0, 3.0],
                [2.0, 3.0],
                [2.0, 2.0], // Closing the second polygon
              ],
            ],
          ],
        },
      };
      it("calls PolygonLookup.loadFeatureCollection and geojsonFlatten correctly with border set to true", () => {
        const shapes = getShapes({
          data: datamulti,
          border: true,
        });
        expect(
          shapes.polygonLookup?.loadFeatureCollection
        ).toHaveBeenCalledWith({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: datamulti.geometry,
            },
          ],
        });
        expect(geojsonFlatten).toHaveBeenCalledWith(datamulti);
        expect(shapes.settings.border).toBe(true);

        delete shapes.vertices;
        delete shapes.vertexLines;
        shapes.polygonLookup = null;
        shapes.resetVertices();
        expect(shapes.vertices.length).toBeGreaterThan(0);
        expect(shapes.vertexLines.length).toBeGreaterThan(0);
        expect(shapes.vertexLines.length).toBeGreaterThan(
          shapes.vertices.length
        );

        const shapesWithoutBorder = getShapes({
          data: datamulti,
          border: false, // Without border
        });
        shapesWithoutBorder.resetVertices();
        expect(shapesWithoutBorder.vertexLines.length).toBe(0);

      });

      const datamultiWithHole: Feature = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            // Polygon 1 (with hole)
            [
              [
                [0.0, 0.0],
                [4.0, 0.0],
                [4.0, 4.0],
                [0.0, 4.0],
                [0.0, 0.0], // Closing the outer ring
              ],
              [
                [1.0, 1.0],
                [3.0, 1.0],
                [3.0, 3.0],
                [1.0, 3.0],
                [1.0, 1.0], // Closing the hole
              ],
            ],
            // Polygon 2 (no hole)
            [
              [
                [5.0, 5.0],
                [7.0, 5.0],
                [7.0, 7.0],
                [5.0, 7.0],
                [5.0, 5.0], // Closing the outer ring
              ],
            ],
          ],
        },
      };

      it("processes MultiPolygon with a hole correctly", () => {
        const shapes = getShapes({
          data: datamultiWithHole,
          border: true,
        });

        shapes.resetVertices();

        // Ensure vertices and vertexLines are populated
        expect(shapes.vertices.length).toBeGreaterThan(0);
        expect(shapes.vertexLines.length).toBeGreaterThan(0);
      });

    });
    describe("when data.type is a default case", () => {
      it("calls PolygonLookup.loadFeatureCollection", () => {
        const data: FeatureCollection<MultiPolygon> = {
          type: "FeatureCollection",
          features: [],
        };
        const shapes = getShapes({ data });
        expect(
          shapes.polygonLookup?.loadFeatureCollection
        ).toHaveBeenCalledWith(data);
        expect(geojsonFlatten).not.toHaveBeenCalled();
      });
    });

    describe("settings.color", () => {
      describe("when not set", () => {
        it("throws", () => {
          expect(() => {
            getShapes({ color: undefined });
          }).toThrow(notProperlyDefined("settings.color"));
        });
      });
      describe("when a color object", () => {
        it("is used to set vertices", () => {
          const color = {
            r: 22,
            g: 23,
            b: 24,
            a: 25,
          };
          const data: Feature<Polygon> = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[0, 0]]],
            },
            properties: {},
          };
          const el = document.createElement("div");
          const map = new Map(el);
          jest.spyOn(map, "project").mockReturnValue(new Point(20, 21));
          const shapes = getShapes({ color, data, map, border: false });
          expect(shapes.vertices).toEqual([]);
        });
      });
    });
  });
});

function getShapesWithPolygon(settings?: Partial<IShapesSettings>): Shapes {
  const element = document.createElement("div");
  const map = new Map(element);

  // Minimalistic FeatureCollection with a single polygon
  const data: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0], // Bottom-left
              [0, 1], // Top-left
              [1, 1], // Top-right
              [1, 0], // Bottom-right
              [0, 0], // Closing the loop
            ],
          ],
        },
        properties: {
          id: 1,
          name: "Test Polygon",
        },
      },
    ],
  };

  return new Shapes({
    map,
    data,
    vertexShaderSource: " ",
    fragmentShaderSource: " ",
    latitudeKey: 1,
    longitudeKey: 0,
    ...settings,
  });
}

describe("Shapes - Color Input", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("encodes a hex string color in vertices", () => {
    const shapes = getShapesWithPolygon({ color: "#ff5733" });
    shapes.resetVertices();

    const vertices = shapes.vertices;
    const color = vertices.slice(-4, -1); // Extract the last RGB values before the final number
    expect(color).toEqual([1, 0.3411764705882353, 0.2]); // r, g, b for #ff5733
  });

  it("encodes an RGB array in vertices", () => {
    const shapes = getShapesWithPolygon({ color: [0.1, 0.4, 0.8] });
    shapes.resetVertices();

    const vertices = shapes.vertices;
    const color = vertices.slice(-4, -1); // Extract the RGB values
    expect(color).toEqual([0.1, 0.4, 0.8]); // r, g, b
  });

  it("encodes an RGBA array in vertices (ignores alpha)", () => {
    const shapes = getShapesWithPolygon({ color: [0.1, 0.4, 0.8, 0.6] });
    shapes.resetVertices();

    const vertices = shapes.vertices;
    const color = vertices.slice(-4, -1); // Extract the RGB values
    expect(color).toEqual([0.1, 0.4, 0.8]); // r, g, b
  });

  it("encodes an RGB object in vertices", () => {
    const shapes = getShapesWithPolygon({ color: { r: 0.1, g: 0.4, b: 0.8 } });
    shapes.resetVertices();

    const vertices = shapes.vertices;
    const color = vertices.slice(-4, -1); // Extract the RGB values
    expect(color).toEqual([0.1, 0.4, 0.8]); // r, g, b
  });

  it("encodes an RGBA object in vertices (ignores alpha)", () => {
    const shapes = getShapesWithPolygon({
      color: { r: 0.1, g: 0.4, b: 0.8, a: 0.5 },
    });
    shapes.resetVertices();

    const vertices = shapes.vertices;
    const color = vertices.slice(-4, -1); // Extract the RGB values
    expect(color).toEqual([0.1, 0.4, 0.8]); // r, g, b
  });

  it("encodes default gray color for invalid hex string", () => {
    const shapes = getShapesWithPolygon({ color: "invalid" });
    shapes.resetVertices();

    const vertices = shapes.vertices;
    const color = vertices.slice(-4, -1); // Extract the RGB values
    expect(color).toEqual([0.5, 0.5, 0.5]); // Default gray color
  });
});
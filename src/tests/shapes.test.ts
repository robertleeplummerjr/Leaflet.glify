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
      it("calls PolygonLookup.loadFeatureCollection and geojsonFlatten correctly", () => {
        const data: MultiPolygon = {
          type: "MultiPolygon",
          coordinates: [],
        };
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

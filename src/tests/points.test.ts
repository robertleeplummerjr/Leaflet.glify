import { LatLng, LatLngBounds, Map, Point } from "leaflet";
import { FeatureCollection, Point as GeoPoint } from "geojson";
import { IPointVertex, IPointsSettings, Points } from "../points";
import { ICanvasOverlayDrawEvent } from "../canvas-overlay";

jest.mock("../canvas-overlay");

function getPoints(settings?: Partial<IPointsSettings>): Points {
  const element = document.createElement("div");
  const map = new Map(element);
  const data = [[1, 1]];
  return new Points({
    size: 5,
    map,
    data,
    vertexShaderSource: " ",
    fragmentShaderSource: " ",
    latitudeKey: 0,
    longitudeKey: 1,
    ...settings,
  });
}

describe("Points", () => {
  describe("size", () => {
    describe("when this.settings.size is falsey", () => {
      it("returns null", () => {
        const points = getPoints();
        delete points.settings.size;
        expect(points.size).toBeNull();
      });
    });
  });
  describe("constructor", () => {
    let setupSpy: jest.SpyInstance;
    let renderSpy: jest.SpyInstance;
    beforeEach(() => {
      setupSpy = jest.spyOn(Points.prototype, "setup");
      renderSpy = jest.spyOn(Points.prototype, "render");
    });
    afterEach(() => {
      setupSpy.mockRestore();
      renderSpy.mockRestore();
    });
    it("sets this.settings", () => {
      const points = getPoints();
      expect(points.settings.color).toBe(Points.defaults.color);
    });
    it("sets this.active = true", () => {
      const points = getPoints();
      expect(points.active).toBe(true);
    });
    describe("when settings.data is an array", () => {
      it('sets this.dataFormat to "Array"', () => {
        expect(getPoints({ data: [[1, 1]] }).dataFormat).toEqual("Array");
      });
    });
    describe("when settings.data is a FeatureCollection", () => {
      it('sets this.dataFormat to "Array"', () => {
        const data: FeatureCollection<GeoPoint> = {
          type: "FeatureCollection",
          features: [],
        };
        expect(
          getPoints({
            data,
          }).dataFormat
        ).toEqual("GeoJson.FeatureCollection");
      });
    });
    describe("when settings.data is unknown", () => {
      it("throws", () => {
        expect(() => {
          getPoints({
            data: undefined,
          });
        }).toThrow();
      });
    });
    describe("when the map projector is not SphericalMercator", () => {
      let warnSpy: jest.SpyInstance;
      beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn");
      });
      afterEach(() => {
        warnSpy.mockRestore();
      });
      it("warns", () => {
        const element = document.createElement("div");
        const map = new Map(element);
        expect(map.options.crs).not.toBeFalsy();
        (map.options.crs ?? { code: "" }).code = "123";
        getPoints({ map });
        expect(warnSpy).toHaveBeenCalledWith(
          "layer designed for SphericalMercator, alternate detected"
        );
      });
    });
    it("calls this.setup", () => {
      getPoints();
      expect(setupSpy).toHaveBeenCalled();
    });
    it("calls this.render", () => {
      getPoints();
      expect(renderSpy).toHaveBeenCalled();
    });
  });
  describe("render", () => {
    let resetVerticesSpy: jest.SpyInstance;
    beforeEach(() => {
      resetVerticesSpy = jest.spyOn(Points.prototype, "resetVertices");
    });
    afterEach(() => {
      resetVerticesSpy.mockRestore();
    });
    it("calls this.resetVertices", () => {
      const points = getPoints();
      resetVerticesSpy.mockReset();
      points.render();
      expect(resetVerticesSpy).toHaveBeenCalled();
    });
    it('sets this.matrix from this.getUniformLocation("matrix")', () => {
      const points = getPoints();
      points.matrix = null;
      points.render();
      expect(points.matrix).toBe(points.uniformLocations.matrix);
    });
    it("sets this.typedVertices correctly", () => {
      const points = getPoints();
      points.typedVertices = new Float32Array(0);
      points.render();
      expect(points.typedVertices).toEqual(new Float32Array(points.vertices));
    });
    it("sets this.mapMatrix size to canvas", () => {
      const points = getPoints();
      const setSizeSpy = jest.spyOn(points.mapMatrix, "setSize");
      points.render();
      expect(setSizeSpy).toHaveBeenCalledWith(
        points.canvas.width,
        points.canvas.height
      );
    });
    it("calls this.gl.viewport correctly", () => {
      const points = getPoints();
      const viewportSpy = jest.spyOn(points.gl, "viewport");
      points.render();
      expect(viewportSpy).toHaveBeenCalledWith(
        0,
        0,
        points.canvas.width,
        points.canvas.height
      );
    });
    it("calls this.gl.uniformMatrix4fv correctly", () => {
      const points = getPoints();
      const uniformMatrix4fvSpy = jest.spyOn(points.gl, "uniformMatrix4fv");
      points.render();
      expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
        points.matrix,
        false,
        points.mapMatrix.array
      );
    });
    it("calls this.gl.bindBuffer correctly", () => {
      const points = getPoints();
      const bindBufferSpy = jest.spyOn(points.gl, "bindBuffer");
      points.render();
      expect(bindBufferSpy).toHaveBeenCalledWith(
        points.gl.ARRAY_BUFFER,
        points.buffers.vertices
      );
    });
    it("calls this.gl.bufferData correctly", () => {
      const points = getPoints();
      const bufferDataSpy = jest.spyOn(points.gl, "bufferData");
      points.render();
      expect(bufferDataSpy).toHaveBeenCalledWith(
        points.gl.ARRAY_BUFFER,
        points.typedVertices,
        points.gl.STATIC_DRAW
      );
    });
    it("calls this.attachShaderVariables correctly", () => {
      const points = getPoints();
      const attachShaderVariablesSpy = jest.spyOn(
        points,
        "attachShaderVariables"
      );
      points.render();
      expect(attachShaderVariablesSpy).toHaveBeenCalledWith(4);
    });
    it("calls layer.redraw", () => {
      const points = getPoints();
      const redrawSpy = jest.spyOn(points.layer, "redraw");
      points.render();
      expect(redrawSpy).toHaveBeenCalled();
    });
  });

  describe("getPointLookup", () => {
    describe("when key is not defined on this.latLngLookup", () => {
      it("sets this.latLngLookup as key and returns defined array", () => {
        const points = getPoints();
        delete points.latLngLookup.key;
        const result = points.getPointLookup("key");
        expect(result).toEqual([]);
        expect(points.latLngLookup.key).toBe(result);
      });
    });
    describe("when key is defined on this.latLngLookup", () => {
      it("returns defined array", () => {
        const points = getPoints();
        const value = (points.latLngLookup.key = []);
        const result = points.getPointLookup("key");
        expect(result).toBe(value);
      });
    });
  });

  describe("addLookup", () => {
    it("pushes lookup to this.latLngLookup and this.allLatLngLookup", () => {
      const points = getPoints();
      const lookup: IPointVertex = {
        latLng: new LatLng(1, 2),
        pixel: { x: 0, y: 1 },
        chosenColor: {
          r: 1,
          g: 1,
          b: 1,
          a: 1,
        },
        chosenSize: 1,
        key: "key",
      };
      expect(points.latLngLookup.key).toBeUndefined();
      points.addLookup(lookup);
      expect(points.latLngLookup.key).toContain(lookup);
      expect(points.allLatLngLookup).toContain(lookup);
    });
  });

  describe("resetVertices", () => {
    it("empties this.latLngLookup", () => {
      const points = getPoints();
      const oldValue = points.latLngLookup;
      points.resetVertices();
      expect(points.latLngLookup).not.toBe(oldValue);
    });
    it("empties this.allLatLngLookup", () => {
      const points = getPoints();
      const oldValue = points.allLatLngLookup;
      points.resetVertices();
      expect(points.allLatLngLookup).not.toBe(oldValue);
    });
    it("empties this.vertices", () => {
      const points = getPoints();
      const oldValue = points.vertices;
      points.resetVertices();
      expect(points.vertices).not.toBe(oldValue);
    });
    describe("when no color is returned", () => {
      it("throws", () => {
        const points = getPoints();
        points.settings.color = null;
        expect(() => {
          points.resetVertices();
        }).toThrow("color is not properly defined");
      });
    });
    describe("when no size is returned", () => {
      it("throws", () => {
        const points = getPoints();
        points.settings.size = null;
        expect(() => {
          points.resetVertices();
        }).toThrow("size is not properly defined");
      });
    });
    describe('when this.dataFormat is "Array"', () => {
      describe("when settings.color is a function", () => {
        it("calls and uses the result in vertices and projects", () => {
          const color = jest.fn((i: number, latlng: LatLng) => {
            return {
              r: 2,
              g: 3,
              b: 4,
              a: 5,
            };
          });
          const points = getPoints({ data: [[1, 2]], color });
          expect(points.dataFormat).toBe("Array");
          color.mockClear();
          points.resetVertices();
          expect(color).toHaveBeenCalledWith(0, new LatLng(1, 2));
          expect(points.vertices.slice(2, 6)).toEqual([2, 3, 4, 5]);
        });
      });
      describe("when settings.color is a color", () => {
        it("uses the color in vertices and projects", () => {
          const color = {
            r: 2,
            g: 3,
            b: 4,
            a: 5,
          };
          const points = getPoints({ data: [[1, 2]], color });
          expect(points.dataFormat).toBe("Array");
          points.resetVertices();
          expect(points.vertices.slice(2, 6)).toEqual([2, 3, 4, 5]);
        });
      });
      describe("when settings.size is a function", () => {
        it("calls and uses the result", () => {
          const size = jest.fn((i: number, latlng: LatLng | null) => {
            return 6;
          });
          const points = getPoints({ data: [[1, 2]], size });
          expect(points.dataFormat).toBe("Array");
          size.mockClear();
          points.resetVertices();
          expect(size).toHaveBeenCalledWith(0, new LatLng(1, 2));
          expect(points.vertices[6]).toEqual(6);
        });
      });
      describe("when settings.size is a number", () => {
        it("calls and uses the result", () => {
          const size = 6;
          const points = getPoints({ data: [[1, 2]], size });
          expect(points.dataFormat).toBe("Array");
          points.resetVertices();
          expect(points.vertices[6]).toEqual(6);
        });
      });
      it("projects", () => {
        const points = getPoints({ data: [[1, 2]] });
        expect(points.dataFormat).toBe("Array");
        const project = (points.map.project = jest.fn(
          (latlng: LatLng, zoom: number) => {
            return new Point(0, 1);
          }
        ));
        points.resetVertices();
        const expectedLatlng = new LatLng(1, 2);
        expect(project).toHaveBeenCalledWith(expectedLatlng, 0);
      });
      it("calls this.addLookup with vertex", () => {
        const color = {
          r: 1,
          g: 2,
          b: 3,
          a: 4,
        };
        const size = 6;
        const points = getPoints({ data: [[1, 2]], color, size });
        const addLookupSpy = jest.spyOn(points, "addLookup");
        points.map.project = jest.fn((latlng: LatLng, zoom: number) => {
          return new Point(0, 1);
        });
        points.resetVertices();
        const expected: IPointVertex = {
          latLng: new LatLng(1, 2),
          key: "1.00x2.00",
          pixel: new Point(0, 1),
          chosenColor: color,
          chosenSize: size,
          feature: [1, 2],
        };
        expect(addLookupSpy).toHaveBeenCalledWith(expected);
      });
      describe("when this.settings.eachVertex is defined", () => {
        it("is called with vertex", () => {
          const color = {
            r: 1,
            g: 2,
            b: 3,
            a: 4,
          };
          const size = 6;
          const eachVertex = jest.fn((vertex: IPointVertex) => {});
          const points = getPoints({ data: [[1, 2]], color, size, eachVertex });
          expect(points.dataFormat).toEqual("Array");
          points.map.project = jest.fn((latlng: LatLng, zoom: number) => {
            return new Point(0, 1);
          });
          points.resetVertices();
          const expected: IPointVertex = {
            latLng: new LatLng(1, 2),
            key: "1.00x2.00",
            pixel: new Point(0, 1),
            chosenColor: color,
            chosenSize: size,
            feature: [1, 2],
          };
          expect(eachVertex).toHaveBeenCalledWith(expected);
        });
      });
    });
    describe('when this.dataFormat is "GeoJson.FeatureCollection"', () => {
      const geoJson: FeatureCollection<GeoPoint> = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [1, 2],
            },
            properties: {
              id: 1,
            },
          },
        ],
      };
      describe("when settings.color is a function", () => {
        it("calls and uses the result in vertices and projects", () => {
          const color = jest.fn((i: number, latlng: LatLng) => {
            return {
              r: 2,
              g: 3,
              b: 4,
              a: 5,
            };
          });
          const points = getPoints({ data: geoJson, color });
          expect(points.dataFormat).toBe("GeoJson.FeatureCollection");
          color.mockClear();
          points.resetVertices();
          expect(color).toHaveBeenCalledWith(0, geoJson.features[0]);
          expect(points.vertices.slice(2, 6)).toEqual([2, 3, 4, 5]);
        });
      });
      describe("when settings.color is a color", () => {
        it("uses the color in vertices and projects", () => {
          const color = {
            r: 2,
            g: 3,
            b: 4,
            a: 5,
          };
          const points = getPoints({ data: geoJson, color });
          expect(points.dataFormat).toBe("GeoJson.FeatureCollection");
          points.resetVertices();
          expect(points.vertices.slice(2, 6)).toEqual([2, 3, 4, 5]);
        });
      });
      describe("when settings.size is a function", () => {
        it("calls and uses the result", () => {
          const size = jest.fn((i: number, latlng: LatLng | null) => {
            return 6;
          });
          const points = getPoints({ data: geoJson, size });
          expect(points.dataFormat).toBe("GeoJson.FeatureCollection");
          size.mockClear();
          points.resetVertices();
          expect(size).toHaveBeenCalledWith(0, new LatLng(1, 2));
          expect(points.vertices[6]).toEqual(6);
        });
      });
      describe("when settings.size is a number", () => {
        it("calls and uses the result", () => {
          const size = 6;
          const points = getPoints({ data: geoJson, size });
          expect(points.dataFormat).toBe("GeoJson.FeatureCollection");
          points.resetVertices();
          expect(points.vertices[6]).toEqual(6);
        });
      });
      it("projects", () => {
        const points = getPoints({ data: geoJson });
        expect(points.dataFormat).toBe("GeoJson.FeatureCollection");
        const project = (points.map.project = jest.fn(
          (latlng: LatLng, zoom: number) => {
            return new Point(0, 1);
          }
        ));
        points.resetVertices();
        const expectedLatlng = new LatLng(1, 2);
        expect(project).toHaveBeenCalledWith(expectedLatlng, 0);
      });
      it("calls this.addLookup with vertex", () => {
        const color = {
          r: 1,
          g: 2,
          b: 3,
          a: 4,
        };
        const size = 6;
        const points = getPoints({ data: geoJson, color, size });
        expect(points.dataFormat).toEqual("GeoJson.FeatureCollection");
        const addLookupSpy = jest.spyOn(points, "addLookup");
        points.map.project = jest.fn((latlng: LatLng, zoom: number) => {
          return new Point(0, 1);
        });
        points.resetVertices();
        const expected: IPointVertex = {
          latLng: new LatLng(1, 2),
          key: "1.00x2.00",
          pixel: new Point(0, 1),
          chosenColor: color,
          chosenSize: size,
          feature: geoJson.features[0],
        };
        expect(addLookupSpy).toHaveBeenCalledWith(expected);
      });
      describe("when this.settings.eachVertex is defined", () => {
        it("is called with vertex", () => {
          const color = {
            r: 1,
            g: 2,
            b: 3,
            a: 4,
          };
          const size = 6;
          const eachVertex = jest.fn((vertex: IPointVertex) => {});
          const points = getPoints({ data: geoJson, color, size, eachVertex });

          points.map.project = jest.fn((latlng: LatLng, zoom: number) => {
            return new Point(0, 1);
          });
          points.resetVertices();
          const expected: IPointVertex = {
            latLng: new LatLng(1, 2),
            key: "1.00x2.00",
            pixel: new Point(0, 1),
            chosenColor: color,
            chosenSize: size,
            feature: geoJson.features[0],
          };
          expect(eachVertex).toHaveBeenCalledWith(expected);
        });
      });
    });
  });

  describe("drawOnCanvas", () => {
    const event: ICanvasOverlayDrawEvent = {
      canvas: document.createElement("canvas"),
      bounds: new LatLngBounds(new LatLng(1, 2), new LatLng(1, 2)),
      offset: new Point(0, 0),
      scale: 1,
      size: new Point(1, 1),
      zoomScale: 1,
      zoom: 1,
    };
    describe("when this.gl is falsey", () => {
      it("returns early", () => {
        const points = getPoints();
        // @ts-expect-error in case webgl throws or is incompatible
        delete points.gl;
        expect(points.drawOnCanvas(event)).toEqual(points);
      });
    });
    describe("when this.gl is truthy", () => {
      it("calls this.mapMatrix correctly", () => {
        const points = getPoints();
        const { mapMatrix } = points;
        jest.spyOn(points.map, "getZoom").mockReturnValue(1);
        const setSizeSpy = jest.spyOn(mapMatrix, "setSize");
        const scaleToSpy = jest.spyOn(mapMatrix, "scaleTo");
        const translateToSpy = jest.spyOn(mapMatrix, "translateTo");
        points.drawOnCanvas(event);
        expect(setSizeSpy).toHaveBeenCalledWith(0, 0);
        expect(scaleToSpy).toHaveBeenCalledWith(2);
        expect(translateToSpy).toHaveBeenCalledWith(-0, -0);
      });
      it("calls this.gl correctly", () => {
        const points = getPoints();
        const { gl, canvas, matrix, mapMatrix, allLatLngLookup } = points;
        const clearSpy = jest.spyOn(gl, "clear");
        const viewportSpy = jest.spyOn(gl, "viewport");
        const uniformMatrix4fvSpy = jest.spyOn(gl, "uniformMatrix4fv");
        const drawArraysSpy = jest.spyOn(gl, "drawArrays");
        points.drawOnCanvas(event);
        expect(clearSpy).toHaveBeenCalledWith(gl.COLOR_BUFFER_BIT);
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
        expect(drawArraysSpy).toHaveBeenCalledWith(
          gl.POINTS,
          0,
          allLatLngLookup.length
        );
      });
    });
  });
  describe("lookup", () => {
    let closestSpy: jest.SpyInstance;
    beforeEach(() => {
      closestSpy = jest.spyOn(Points, "closest");
    });
    describe("when matches", () => {
      it("calls Points.closest with coords and matches", () => {
        const points = getPoints({ data: [] });
        const pointVertex: IPointVertex = {
          latLng: new LatLng(0, 0),
          pixel: {
            x: 0,
            y: 0,
          },
          chosenColor: {
            r: 1,
            g: 1,
            b: 1,
            a: 1,
          },
          chosenSize: 1,
          key: "key",
          feature: {},
        };
        points.latLngLookup = {
          "-0.03x-0.03": [pointVertex],
        };
        const coords = new LatLng(0, 0);
        points.lookup(coords);
        expect(closestSpy).toHaveBeenCalledWith(
          coords,
          [pointVertex],
          points.map
        );
      });
    });
    describe("when not matches", () => {
      it("calls Points.closest with coords and matches", () => {
        const points = getPoints({ data: [] });
        const pointVertex: IPointVertex = {
          latLng: new LatLng(0, 0),
          pixel: {
            x: 0,
            y: 0,
          },
          chosenColor: {
            r: 1,
            g: 1,
            b: 1,
            a: 1,
          },
          chosenSize: 1,
          key: "key",
          feature: {},
        };
        points.allLatLngLookup.push(pointVertex);
        const coords = new LatLng(0, 0);
        points.lookup(coords);
        expect(closestSpy).toHaveBeenCalledWith(
          coords,
          points.allLatLngLookup,
          points.map
        );
      });
    });
  });

  // TODO: tryClick
  // TODO: tryHover
});

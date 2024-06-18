import { LatLng, LatLngBounds, LeafletMouseEvent, Map, Point } from "leaflet";
import { Feature, FeatureCollection, LineString } from "geojson";
import { MapMatrix } from "../map-matrix";
import { ICanvasOverlayDrawEvent } from "../canvas-overlay";
import { ILinesSettings, Lines, WeightCallback } from "../lines";

jest.mock("../canvas-overlay");
jest.mock("../utils", () => {
  return {
    inBounds: () => true,
    latLngDistance: () => 2,
  };
});

const mockFeatureCollection: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
      },
    },
  ],
};

function getSettings(
  settings?: Partial<ILinesSettings>
): Partial<ILinesSettings> {
  const element = document.createElement("div");
  const map = new Map(element);
  return {
    map,
    data: mockFeatureCollection,
    vertexShaderSource: " ",
    fragmentShaderSource: " ",
    latitudeKey: 0,
    longitudeKey: 1,
    color: { r: 3, g: 4, b: 5, a: 6 },
    ...settings,
  };
}

describe("Lines", () => {
  describe("weight", () => {
    describe("when settings.weight is falsey", () => {
      it("throws", () => {
        const settings = getSettings({ weight: 0 });
        let weight: WeightCallback | number | null = null;
        expect(() => {
          weight = new Lines(settings).weight;
        }).toThrow();
        expect(weight).toBeNull();
      });
    });
    describe("when settings.weight is truthy", () => {
      expect(new Lines(getSettings()).weight).toBe(Lines.defaults.weight);
    });
  });
  describe("constructor", () => {
    let element: HTMLElement;
    let map: Map;
    let data: FeatureCollection<LineString>;
    let settings: Partial<ILinesSettings>;
    let setupSpy: jest.SpyInstance;
    let renderSpy: jest.SpyInstance;
    beforeEach(() => {
      element = document.createElement("div");
      map = new Map(element);
      data = {
        type: "FeatureCollection",
        features: [],
      };
      settings = {
        className: "lines-class",
        map,
        data,
        vertexShaderSource: " ",
        fragmentShaderSource: " ",
        latitudeKey: 0,
        longitudeKey: 1,
      };
      setupSpy = jest.spyOn(Lines.prototype, "setup");
      renderSpy = jest.spyOn(Lines.prototype, "render");
    });
    afterEach(() => {
      setupSpy.mockRestore();
      renderSpy.mockRestore();
    });
    it("sets this.settings", () => {
      const lines = new Lines(settings);
      expect(lines.settings).toEqual({ ...Lines.defaults, ...settings });
    });
    describe("when missing settings.data", () => {
      it("throws", () => {
        delete settings.data;
        let lines: Lines | null = null;
        expect(() => {
          lines = new Lines(settings);
        }).toThrow('"data" is missing');
        expect(lines).toBeNull();
      });
    });
    it("sets this.active to true", () => {
      const lines = new Lines(settings);
      expect(lines.active).toBe(true);
    });
    it("calls this.setup and this.render", () => {
      const lines = new Lines(settings);
      expect(lines).toBeInstanceOf(Lines);
      expect(setupSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
    });
  });
  describe("render", () => {
    let element: HTMLElement;
    let map: Map;
    let data: FeatureCollection<LineString>;
    let settings: Partial<ILinesSettings>;
    let resetVerticesSpy: jest.SpyInstance;
    let getBufferSpy: jest.SpyInstance;
    let getAttributeLocationSpy: jest.SpyInstance;
    beforeEach(() => {
      element = document.createElement("div");
      map = new Map(element);
      data = {
        type: "FeatureCollection",
        features: [],
      };
      settings = {
        className: "lines-class",
        color: { r: 3, g: 4, b: 5, a: 6 }, // these should be between 0 and 1, but for the same of the test
        map,
        data,
        vertexShaderSource: " ",
        fragmentShaderSource: " ",
        latitudeKey: 0,
        longitudeKey: 1,
      };
      resetVerticesSpy = jest.spyOn(Lines.prototype, "resetVertices");
      getBufferSpy = jest.spyOn(Lines.prototype, "getBuffer");
      getAttributeLocationSpy = jest.spyOn(
        Lines.prototype,
        "getAttributeLocation"
      );
    });
    afterEach(() => {
      resetVerticesSpy.mockRestore();
      getBufferSpy.mockRestore();
      getAttributeLocationSpy.mockRestore();
    });
    it("calls this.resetVertices()", () => {
      const lines = new Lines(settings);
      resetVerticesSpy.mockReset();
      lines.render();
      expect(resetVerticesSpy).toHaveBeenCalled();
    });
    it("calls gl.bindBuffer correctly", () => {
      const lines = new Lines(settings);
      const vertexBuffer = new WebGLBuffer();
      getBufferSpy.mockReturnValue(vertexBuffer);
      const bindBufferSpy = jest.spyOn(lines.gl, "bindBuffer");
      lines.render();
      expect(bindBufferSpy).toHaveBeenCalledWith(
        lines.gl.ARRAY_BUFFER,
        vertexBuffer
      );
    });
    it("calls gl.bufferData correctly", () => {
      const lines = new Lines({
        ...settings,
        data: mockFeatureCollection,
      });
      const { gl } = lines;
      const bufferDataSpy = jest.spyOn(gl, "bufferData");
      lines.render();
      expect(bufferDataSpy).toHaveBeenCalledWith(
        gl.ARRAY_BUFFER,
        lines.allVerticesTyped,
        gl.STATIC_DRAW
      );
    });
    it("calls gl.vertexAttribPointer correctly", () => {
      const lines = new Lines(settings);
      const { gl } = lines;
      jest.spyOn(lines, "getAttributeLocation").mockReturnValue(42);
      const vertexAttribPointerSpy = jest.spyOn(gl, "vertexAttribPointer");
      lines.render();
      expect(vertexAttribPointerSpy).toHaveBeenCalledWith(
        42,
        2,
        gl.FLOAT,
        false,
        24,
        0
      );
    });
    it("calls gl.enableVertexAttribArray correctly", () => {
      const lines = new Lines(settings);
      getAttributeLocationSpy.mockReturnValue(42);
      const enableVertexAttribArraySpy = jest.spyOn(
        lines.gl,
        "enableVertexAttribArray"
      );
      lines.render();
      expect(enableVertexAttribArraySpy).toHaveBeenCalledWith(42);
    });
    it("calls mapMatrix.setSize() correctly", () => {
      const lines = new Lines(settings);
      const mapMatrix = (lines.mapMatrix = new MapMatrix());
      const setSizeSpy = jest.spyOn(mapMatrix, "setSize");
      lines.render();
      expect(setSizeSpy).toHaveBeenCalledWith(
        lines.canvas.width,
        lines.canvas.height
      );
    });
    it("calls gl.viewport() correctly", () => {
      const lines = new Lines(settings);
      const { gl } = lines;
      const viewportSpy = jest.spyOn(gl, "viewport");
      lines.render();
      expect(viewportSpy).toHaveBeenCalledWith(
        0,
        0,
        lines.canvas.width,
        lines.canvas.height
      );
    });
    it("calls gl.uniformMatrix4fv() correctly", () => {
      const lines = new Lines(settings);
      const { gl } = lines;
      const uniformMatrix4fvSpy = jest.spyOn(gl, "uniformMatrix4fv");
      lines.render();
      expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
        lines.matrix,
        false,
        lines.mapMatrix.array
      );
    });
    it("calls this.attachShaderVariables() correctly", () => {
      const lines = new Lines(settings);
      const attachShaderVariablesSpy = jest.spyOn(
        lines,
        "attachShaderVariables"
      );
      lines.render();
      expect(attachShaderVariablesSpy).toHaveBeenCalledWith(4);
    });
    it("calls layer.redraw()", () => {
      const lines = new Lines(settings);
      const redrawSpy = jest.spyOn(lines.layer, "redraw");
      lines.render();
      expect(redrawSpy).toHaveBeenCalled();
    });
  });
  describe("resetVertices", () => {
    describe("when settings.color is a function", () => {
      it("is called with index and feature", () => {
        const lines = new Lines(
          getSettings({
            color: jest.fn(() => {
              return { r: 1, g: 1, b: 1, a: 1 };
            }),
          })
        );
        lines.resetVertices();
        expect(lines.color).toHaveBeenCalledWith(0, lines.data.features[0]);
      });
    });
    it("accumulates this.vertices, this.allVertices and this.allVerticesTyped correctly", () => {
      const lines = new Lines(getSettings());
      jest.spyOn(lines.map, "project").mockReturnValue(new Point(1, 2));
      lines.resetVertices();
      const expected = [
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
      ];
      const expectedVerticesArray = [
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
      ];
      expect(lines.vertices.length).toBe(1);
      expect(lines.vertices[0].array).toEqual(expectedVerticesArray);
      expect(lines.vertices[0].settings.longitudeKey).toEqual(
        lines.longitudeKey
      );
      expect(lines.vertices[0].settings.latitudeKey).toEqual(lines.latitudeKey);
      expect(lines.vertices[0].settings.color).toEqual(lines.settings.color);
      expect(lines.vertices[0].settings.opacity).toEqual(
        lines.settings.opacity
      );
      expect(lines.allVertices).toEqual(expected);
      expect(lines.allVerticesTyped).toEqual(new Float32Array(expected));
    });
  });
  describe("drawOnCanvas", () => {
    function callDrawOnCanvas(
      lines: Lines,
      event?: Partial<ICanvasOverlayDrawEvent>
    ): void {
      lines.drawOnCanvas({
        canvas: lines.canvas,
        bounds: new LatLngBounds(new LatLng(1, 1), new LatLng(2, 2)),
        offset: new Point(1, 1),
        scale: 1,
        size: new Point(10, 10),
        zoomScale: 1,
        zoom: 1,
        ...event,
      });
    }
    it("calls gl.clear() correctly", () => {
      const lines = new Lines(getSettings());
      const { gl } = lines;
      const clearSpy = jest.spyOn(gl, "clear");
      callDrawOnCanvas(lines);
      expect(clearSpy).toHaveBeenCalledWith(gl.COLOR_BUFFER_BIT);
    });
    it("calls gl.viewport() correctly", () => {
      const lines = new Lines(getSettings());
      const { gl } = lines;
      const viewportSpy = jest.spyOn(gl, "viewport");
      callDrawOnCanvas(lines);
      expect(viewportSpy).toHaveBeenCalledWith(
        0,
        0,
        lines.canvas.width,
        lines.canvas.height
      );
    });
    it("calls gl.vertexAttrib1f() correctly", () => {
      const lines = new Lines(getSettings());
      const { gl } = lines;
      const vertexAttrib1fSpy = jest.spyOn(gl, "vertexAttrib1f");
      callDrawOnCanvas(lines);
      expect(vertexAttrib1fSpy).toHaveBeenCalledWith(lines.aPointSize, 4);
    });
    it("calls mapMatrix.setSize and mapMatrix.scaleMatrix correctly", () => {
      const lines = new Lines(getSettings());
      const setSizeSpy = jest.spyOn(lines.mapMatrix, "setSize");
      const scaleMatrixSpy = jest.spyOn(lines.mapMatrix, "scaleTo");
      callDrawOnCanvas(lines);
      expect(setSizeSpy).toHaveBeenCalledWith(
        lines.canvas.width,
        lines.canvas.height
      );
      expect(scaleMatrixSpy).toHaveBeenCalledWith(1);
    });
    describe("when zoom is greater than 18", () => {
      it("draws arrays once", () => {
        const lines = new Lines(getSettings());
        const uniformMatrix4fvSpy = jest.spyOn(lines.gl, "uniformMatrix4fv");
        const drawArraysSpy = jest.spyOn(lines.gl, "drawArrays");
        const setSizeSpy = jest.spyOn(lines.mapMatrix, "setSize");
        const scaleToSpy = jest.spyOn(lines.mapMatrix, "scaleTo");
        const translateToSpy = jest.spyOn(lines.mapMatrix, "translateTo");
        const offset = new Point(5, 5);
        const zoom = 19;
        callDrawOnCanvas(lines, { zoom, offset });
        expect(setSizeSpy).toHaveBeenCalledTimes(1);
        expect(setSizeSpy).toHaveBeenCalledWith(
          lines.canvas.width,
          lines.canvas.height
        );
        expect(scaleToSpy).toHaveBeenCalledTimes(1);
        expect(scaleToSpy).toHaveBeenCalledWith(1);
        expect(translateToSpy).toHaveBeenCalledTimes(1);
        expect(translateToSpy).toHaveBeenCalledWith(-offset.x, -offset.y);
        expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
          lines.matrix,
          false,
          lines.mapMatrix.array
        );
        expect(drawArraysSpy).toHaveBeenCalledWith(lines.gl.LINES, 0, 4);
      });
    });
    describe("when zoom is less than 19", () => {
      describe("when weight is a number", () => {
        it("draws arrays using weight", () => {
          const lines = new Lines({ ...getSettings(), weight: 1 });
          const uniformMatrix4fvSpy = jest.spyOn(lines.gl, "uniformMatrix4fv");
          const drawArraysSpy = jest.spyOn(lines.gl, "drawArrays");
          const setSizeSpy = jest.spyOn(lines.mapMatrix, "setSize");
          const scaleToSpy = jest.spyOn(lines.mapMatrix, "scaleTo");
          const translateToSpy = jest.spyOn(lines.mapMatrix, "translateTo");
          const offset = new Point(5, 5);
          const zoom = 18;
          callDrawOnCanvas(lines, { zoom, offset });
          expect(setSizeSpy).toHaveBeenCalledTimes(1);
          expect(setSizeSpy).toHaveBeenCalledWith(
            lines.canvas.width,
            lines.canvas.height
          );
          expect(scaleToSpy).toHaveBeenCalledTimes(1);
          expect(scaleToSpy).toHaveBeenCalledWith(1);
          expect(translateToSpy).toHaveBeenCalledTimes(25);
          expect(translateToSpy).toHaveBeenCalledWith(-offset.x, -offset.y);
          expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
            lines.matrix,
            false,
            lines.mapMatrix.array
          );
          expect(drawArraysSpy).toHaveBeenCalledWith(lines.gl.LINES, 0, 4);
        });
      });
      describe("when weight is a function", () => {
        it("draws arrays using weight function", () => {
          const lines = new Lines({
            ...getSettings(),
            weight: (i: number, feature: LineString): number => {
              return 2;
            },
          });
          const uniformMatrix4fvSpy = jest.spyOn(lines.gl, "uniformMatrix4fv");
          const drawArraysSpy = jest.spyOn(lines.gl, "drawArrays");
          const setSizeSpy = jest.spyOn(lines.mapMatrix, "setSize");
          const scaleToSpy = jest.spyOn(lines.mapMatrix, "scaleTo");
          const translateToSpy = jest.spyOn(lines.mapMatrix, "translateTo");
          const offset = new Point(5, 5);
          const zoom = 18;
          callDrawOnCanvas(lines, { zoom, offset });
          expect(setSizeSpy).toHaveBeenCalledTimes(1);
          expect(setSizeSpy).toHaveBeenCalledWith(
            lines.canvas.width,
            lines.canvas.height
          );
          expect(scaleToSpy).toHaveBeenCalledTimes(1);
          expect(scaleToSpy).toHaveBeenCalledWith(1);
          expect(translateToSpy).toHaveBeenCalledTimes(81);
          expect(translateToSpy).toHaveBeenCalledWith(-offset.x, -offset.y);
          expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
            lines.matrix,
            false,
            lines.mapMatrix.array
          );
          expect(drawArraysSpy).toHaveBeenCalledWith(lines.gl.LINES, 0, 4);
        });
      });
    });
  });
  describe("tryClick", () => {
    let lines: Lines;
    let settings: Partial<ILinesSettings>;
    let map: Map;
    let mockClick: LeafletMouseEvent;
    let forEachSpy: jest.SpyInstance;
    beforeEach(() => {
      settings = getSettings({
        click: jest.fn(() => {
          return true;
        }),
      });
      lines = new Lines(settings);
      lines.scale = 1;
      map = lines.map;
      forEachSpy = jest.spyOn(lines.data.features, "forEach");
      const latlngArray =
        mockFeatureCollection.features[0].geometry.coordinates[0];
      const latlng = new LatLng(latlngArray[0], latlngArray[1]);
      mockClick = {
        type: "click",
        target: map,
        sourceTarget: map,
        propagatedFrom: "mock",
        layer: lines,
        latlng,
        layerPoint: new Point(1, 1),
        containerPoint: new Point(1, 1),
        originalEvent: new MouseEvent("click"),
        popup: "",
      };
    });
    afterEach(() => {
      forEachSpy.mockRestore();
    });
    describe("when layer has been removed", () => {
      it("is not checked for click", () => {
        lines.remove();
        Lines.tryClick(mockClick, map, [lines]);
        expect(forEachSpy).not.toHaveBeenCalled();
      });
    });
    describe("when map is not same as instance.map", () => {
      it("is not checked for click", () => {
        Lines.tryClick(mockClick, new Map(document.createElement("div")), [
          lines,
        ]);
        expect(forEachSpy).not.toHaveBeenCalled();
      });
    });
    describe("when map is same", () => {
      it("is checked for click", () => {
        Lines.tryClick(mockClick, lines.map, [lines]);
        expect(forEachSpy).toHaveBeenCalled();
      });
      describe("when a feature is near point", () => {
        it("calls settings.click", () => {
          Lines.tryClick(mockClick, lines.map, [lines]);
          expect(lines.settings.click).toHaveBeenCalledWith(
            mockClick,
            lines.data.features[0]
          );
        });
        it("returns the response from settings.click", () => {
          const result = Lines.tryClick(mockClick, lines.map, [lines]);
          expect(result).toBe(true);
        });
      });
      describe("when a feature is not near point", () => {
        // distance = 2
        // sensitivity = 0.1
        // weight = 2
        // distance < sensitivity + weight / scale
        // 2 < 0.01 + 2 / 1
        // 2 < 0.01 + 2 / 1 (2.01)
        it("does not call settings.click", () => {
          lines.settings.sensitivity = -0.01;
          Lines.tryClick(mockClick, lines.map, [lines]);
          expect(lines.settings.click).not.toHaveBeenCalled();
        });
      });
    });
  });
  describe("tryHover", () => {
    let lines: Lines;
    let settings: Partial<ILinesSettings>;
    let map: Map;
    let mockHover: LeafletMouseEvent;
    let forEachSpy: jest.SpyInstance;
    let hoverMock: jest.Mock;
    beforeEach(() => {
      hoverMock = jest.fn(() => {
        return true;
      });
      settings = getSettings({
        hover: hoverMock,
      });
      lines = new Lines(settings);
      lines.scale = 1;
      map = lines.map;
      forEachSpy = jest.spyOn(lines.data.features, "forEach");
      const latlngArray =
        mockFeatureCollection.features[0].geometry.coordinates[0];
      const latlng = new LatLng(latlngArray[0], latlngArray[1]);
      mockHover = {
        type: "mousemove",
        target: map,
        sourceTarget: map,
        propagatedFrom: "mock",
        layer: lines,
        latlng,
        layerPoint: new Point(1, 1),
        containerPoint: new Point(1, 1),
        originalEvent: new MouseEvent("mousemove"),
        popup: "",
      };
    });
    afterEach(() => {
      forEachSpy.mockRestore();
    });
    describe("when layer has been removed", () => {
      it("is not checked for hover", () => {
        lines.remove();
        Lines.tryHover(mockHover, map, [lines]);
        expect(forEachSpy).not.toHaveBeenCalled();
      });
    });
    describe("when map is not same as instance.map", () => {
      it("is not checked for hover", () => {
        Lines.tryHover(mockHover, new Map(document.createElement("div")), [
          lines,
        ]);
        expect(forEachSpy).not.toHaveBeenCalled();
      });
    });
    describe("when map is same", () => {
      it("is checked for hover", () => {
        Lines.tryHover(mockHover, lines.map, [lines]);
        expect(forEachSpy).toHaveBeenCalled();
      });
      describe("when a feature is near point", () => {
        describe("when lines.hoverFeatures does not contain the feature being hovered", () => {
          it("it is added a new array in lines.hoveringFeatures", () => {
            const oldHoveringFeatures = lines.hoveringFeatures;
            expect(oldHoveringFeatures).toEqual([]);
            Lines.tryHover(mockHover, lines.map, [lines]);
            const newHoveringFeatures = lines.hoveringFeatures;
            expect(oldHoveringFeatures).not.toBe(newHoveringFeatures);
            expect(newHoveringFeatures).toEqual([lines.data.features[0]]);
          });
          it("calls settings.hover", () => {
            Lines.tryHover(mockHover, lines.map, [lines]);
            expect(hoverMock).toHaveBeenCalledWith(
              mockHover,
              lines.data.features[0]
            );
          });
        });
        describe("when a feature is not near point", () => {
          // distance = 2
          // sensitivityHover = 0.1
          // weight = 2
          // distance < sensitivityHover + weight / scale
          // 2 < 0.01 + 2 / 1
          // 2 < 0.01 + 2 / 1 (2.01)
          it("does not call settings.hover", () => {
            lines.settings.sensitivityHover = -0.01;
            Lines.tryHover(mockHover, lines.map, [lines]);
            expect(lines.settings.hover).not.toHaveBeenCalled();
          });
        });
        describe("when lines.hoverFeatures does contain the feature being hovered", () => {
          it("it is added a new array in lines.hoveringFeatures", () => {
            Lines.tryHover(mockHover, lines.map, [lines]);
            const oldHoveringFeatures = lines.hoveringFeatures;
            expect(oldHoveringFeatures).toEqual([lines.data.features[0]]);
            Lines.tryHover(mockHover, lines.map, [lines]);
            const newHoveringFeatures = lines.hoveringFeatures;
            expect(oldHoveringFeatures).not.toBe(newHoveringFeatures);
            expect(newHoveringFeatures).toEqual([lines.data.features[0]]);
          });
          it("does not calls settings.hover", () => {
            Lines.tryHover(mockHover, lines.map, [lines]);
            hoverMock.mockReset();
            Lines.tryHover(mockHover, lines.map, [lines]);
            expect(hoverMock).not.toHaveBeenCalled();
          });
        });
        it("returns the responses from settings.hover", () => {
          const result = Lines.tryHover(mockHover, lines.map, [lines]);
          expect(result).toEqual([true]);
        });
      });
      describe("when a feature is no longer hovered", () => {
        it("the instance.hoverOff is called with event and feature", () => {
          const fakeFeature: Feature<LineString> = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [[5, 6]],
            },
          };
          lines.hoveringFeatures.push(fakeFeature);
          const hoverOff = (lines.settings.hoverOff = jest.fn(() => {}));
          Lines.tryHover(mockHover, lines.map, [lines]);
          expect(hoverOff).toHaveBeenCalledWith(mockHover, fakeFeature);
        });
      });
    });
  });
});

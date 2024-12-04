import {
  BaseGlLayer,
  defaultHoverWait,
  defaultPane,
  EventCallback,
  IBaseGlLayerSettings,
} from "../base-gl-layer";
import { ICanvasOverlayDrawEvent } from "../canvas-overlay";
import { LatLng, LatLngBounds, LeafletMouseEvent, Map, Point } from "leaflet";

jest.mock("../canvas-overlay");

describe("BaseGlLayer", () => {
  interface ITestLayerSettings extends IBaseGlLayerSettings {}
  class TestLayer extends BaseGlLayer<ITestLayerSettings> {
    drawOnCanvas(context: ICanvasOverlayDrawEvent): this {
      return this;
    }

    render(): this {
      return this;
    }

    removeInstance(): this {
      return this;
    }
  }
  const defaultSettings: Partial<ITestLayerSettings> = {
    longitudeKey: 1,
    latitudeKey: 0,
    data: {},
    pane: "",
  };
  function getGlLayer(settings?: Partial<ITestLayerSettings>) {
    const element = document.createElement("div");
    const map = new Map(element);
    const vertexShaderSource = ` `;
    const fragmentShaderSource = ` `;
    return new TestLayer({
      ...defaultSettings,
      map,
      vertexShaderSource,
      fragmentShaderSource,
      ...settings,
    });
  }
  function fakeEvent(layer: TestLayer): LeafletMouseEvent {
    return {
      type: "fake event",
      latlng: new LatLng(1, 1),
      layerPoint: new Point(1, 1),
      containerPoint: new Point(1, 1),
      originalEvent: new MouseEvent("fake event"),
      target: "",
      sourceTarget: "",
      propagatedFrom: "",
      popup: "",
      layer,
    };
  }
  describe("data", () => {
    describe("when settings.data is falsey", () => {
      it("throws", () => {
        const data = null;
        const layer = getGlLayer({ data });
        expect(() => {
          layer.data;
        }).toThrow();
      });
    });
    describe("when settings.data is defined", () => {
      it("is returned", () => {
        const data = { features: [] };
        const layer = getGlLayer({ data });
        expect(layer.data).toBe(data);
      });
    });
  });
  describe("pane", () => {
    describe("when not defined in settings.pane", () => {
      it("returns defaultPane value", () => {
        const layer = getGlLayer({ pane: undefined });
        expect(layer.settings.pane).toBe(undefined);
        expect(layer.pane).toBe(defaultPane);
      });
    });

    describe("when defined in settings.pane", () => {
      it("returns settings.pane", () => {
        const layer = getGlLayer({ pane: "pane" });
        expect(layer.settings.pane).toBe("pane");
        expect(layer.pane).toBe("pane");
      });
    });
  });

  describe("className", () => {
    describe("when not defined in settings.className", () => {
      it("returns empty string", () => {
        const layer = getGlLayer({ className: undefined });
        expect(layer.className).toBe("");
      });
    });
    describe("when defined in settings.className", () => {
      it("is returned", () => {
        const layer = getGlLayer({ className: "className" });
        expect(layer.className).toBe("className");
      });
    });
  });

  describe("map", () => {
    describe("when settings.map is not defined", () => {
      it("throws", () => {
        const layer = getGlLayer();
        delete layer.settings.map;
        expect(() => {
          layer.map;
        }).toThrow();
      });
    });
    describe("when settings.map is defined", () => {
      it("is returned", () => {
        const layer = getGlLayer();
        expect(layer.settings.map).not.toBeFalsy();
        expect(layer.map).toBe(layer.settings.map);
      });
    });
  });

  describe("sensitivity", () => {
    describe("when settings.sensitivity is not defined", () => {
      it("throws", () => {
        const layer = getGlLayer();
        delete layer.settings.sensitivity;
        expect(() => {
          layer.sensitivity;
        }).toThrow();
      });
    });
    describe("when settings.sensitivity is defined", () => {
      it("is returned", () => {
        const layer = getGlLayer({ sensitivity: 1 });
        expect(layer.settings.sensitivity).toBe(1);
        expect(layer.sensitivity).toBe(layer.settings.sensitivity);
      });
    });
  });

  describe("sensitivityHover", () => {
    describe("when settings.sensitivityHover is not defined", () => {
      it("throws", () => {
        const layer = getGlLayer();
        delete layer.settings.sensitivityHover;
        expect(() => {
          layer.sensitivityHover;
        }).toThrow();
      });
    });
    describe("when settings.sensitivityHover is defined", () => {
      it("is returned", () => {
        const layer = getGlLayer({ sensitivityHover: 1 });
        expect(layer.settings.sensitivityHover).toBe(1);
        expect(layer.sensitivityHover).toBe(layer.settings.sensitivityHover);
      });
    });
  });

  describe("hoverWait", () => {
    describe("when not defined in settings.hoverWait", () => {
      it("returns empty string", () => {
        const layer = getGlLayer({ hoverWait: undefined });
        expect(layer.hoverWait).toBe(defaultHoverWait);
      });
    });
    describe("when defined in settings.hoverWait", () => {
      it("is returned", () => {
        const layer = getGlLayer({ hoverWait: 123 });
        expect(layer.hoverWait).toBe(123);
      });
    });
  });

  describe("longitudeKey", () => {
    describe("when settings.longitudeKey is not defined", () => {
      it("throws", () => {
        const layer = getGlLayer();
        delete layer.settings.longitudeKey;
        expect(() => {
          layer.longitudeKey;
        }).toThrow();
      });
    });
    describe("when settings.longitudeKey is defined", () => {
      it("is returned", () => {
        const layer = getGlLayer({ longitudeKey: 1 });
        expect(layer.settings.longitudeKey).toBe(1);
        expect(layer.longitudeKey).toBe(layer.settings.longitudeKey);
      });
    });
  });

  describe("latitudeKey", () => {
    describe("when settings.latitudeKey is not defined", () => {
      it("throws", () => {
        const layer = getGlLayer();
        delete layer.settings.latitudeKey;
        expect(() => {
          layer.latitudeKey;
        }).toThrow();
      });
    });
    describe("when settings.longitudeKey is defined", () => {
      it("is returned", () => {
        const layer = getGlLayer({ latitudeKey: 1 });
        expect(layer.settings.latitudeKey).toBe(1);
        expect(layer.latitudeKey).toBe(layer.settings.latitudeKey);
      });
    });
  });

  describe("opacity", () => {
    describe("when settings.opacity is not defined", () => {
      it("throws", () => {
        const layer = getGlLayer();
        delete layer.settings.opacity;
        expect(() => {
          layer.opacity;
        }).toThrow();
      });
    });
    describe("when settings.opacity is defined", () => {
      it("is returned", () => {
        const layer = getGlLayer({ opacity: 1 });
        expect(layer.settings.opacity).toBe(1);
        expect(layer.opacity).toBe(layer.settings.opacity);
      });
    });
  });

  describe("color", () => {
    describe("when settings.color is not defined", () => {
      it("returns null", () => {
        const layer = getGlLayer();
        delete layer.settings.color;
        expect(layer.color).toBeNull();
      });
    });
    describe("when settings.color is defined", () => {
      it("is returned", () => {
        const color = { r: 1, g: 1, b: 1, a: 1 };
        const layer = getGlLayer({ color });
        expect(layer.settings.color).toBe(color);
        expect(layer.color).toBe(layer.settings.color);
      });
    });
  });

  describe("constructor", () => {
    it("sets settings from first argument", () => {
      const element = document.createElement("div");
      const map = new Map(element);
      const layer = new TestLayer({ ...defaultSettings, map });
      expect(layer.settings.map).toBe(map);
    });
    it("calls this.canvas.getContext, with preserveDrawingBuffer as boolean and sets this.gl", () => {
      const element = document.createElement("div");
      const map = new Map(element);
      const layer = new TestLayer({
        ...defaultSettings,
        map,
        preserveDrawingBuffer: true,
      });
      expect(layer.canvas.getContext).toHaveBeenCalledWith("webgl2", {
        preserveDrawingBuffer: true,
      });
      expect(layer.gl).toBeInstanceOf(WebGLRenderingContext);
    });
    it("provides a drawOnCanvas lambda, that calls layer.drawOnCanvas", () => {
      const layer = getGlLayer();
      jest.spyOn(layer, "drawOnCanvas");
      const event: ICanvasOverlayDrawEvent = {
        canvas: document.createElement("canvas"),
        bounds: new LatLngBounds(new LatLng(1, 1), new LatLng(10, 10)),
        offset: new Point(1, 1),
        scale: 1,
        size: new Point(10, 10),
        zoomScale: 1,
        zoom: 1,
      };
      layer.layer._userDrawFunc(event);
      expect(layer.drawOnCanvas).toHaveBeenCalledWith(event);
    });
  });

  describe("attachShaderVariables", () => {
    describe("shaderVariableCount is 0", () => {
      it("return early", () => {
        const element = document.createElement("div");
        const map = new Map(element);
        const layer = new TestLayer({ ...defaultSettings, map });
        jest.spyOn(layer, "getAttributeLocation");
        expect(layer.attachShaderVariables(4)).toBe(layer);
        expect(layer.getAttributeLocation).not.toHaveBeenCalled();
      });
    });
    describe("shaderVariableCount is 2", () => {
      it("attaches and enables variables", () => {
        const element = document.createElement("div");
        const map = new Map(element);
        const layer = new TestLayer({
          ...defaultSettings,
          map,
          shaderVariables: {
            one: {
              type: "FLOAT",
              start: 0,
              size: 2,
            },
            two: {
              type: "FLOAT",
              start: 3,
              size: 4,
            },
          },
        });
        jest.spyOn(layer, "getAttributeLocation");
        jest.spyOn(layer.gl, "getAttribLocation").mockReturnValue(999);
        jest.spyOn(layer.gl, "vertexAttribPointer");
        jest.spyOn(layer.gl, "enableVertexAttribArray");
        layer.program = new WebGLProgram();
        expect(layer.attachShaderVariables(4)).toBe(layer);
        expect(layer.getAttributeLocation).toHaveBeenCalledWith("one");
        expect(layer.getAttributeLocation).toHaveBeenCalledWith("two");
        expect(layer.gl.vertexAttribPointer).toHaveBeenCalledWith(
          999,
          2,
          layer.gl.FLOAT,
          false,
          0,
          0
        );
        expect(layer.gl.vertexAttribPointer).toHaveBeenCalledWith(
          999,
          4,
          layer.gl.FLOAT,
          false,
          0,
          8
        );
        expect(layer.gl.enableVertexAttribArray).toHaveBeenCalledWith(999);
        expect(layer.gl.enableVertexAttribArray).toHaveBeenCalledWith(999);
      });
    });

    describe("getShaderVariableCount", () => {
      it("returns the count of shaderVariables", () => {
        const element = document.createElement("div");
        const map = new Map(element);
        const layer0 = new TestLayer({ ...defaultSettings, map });
        expect(layer0.getShaderVariableCount()).toBe(0);

        const layer1 = new TestLayer({
          ...defaultSettings,
          map,
          shaderVariables: {
            one: {
              type: "FLOAT",
              start: 0,
              size: 2,
            },
          },
        });
        expect(layer1.getShaderVariableCount()).toBe(1);
      });
    });
  });
  describe("setData", () => {
    it("sets up settings with new data", () => {
      const element = document.createElement("div");
      const map = new Map(element);
      const layer = new TestLayer({ ...defaultSettings, map });
      const { settings } = layer;
      const data = {};
      layer.setData(data);
      expect(settings).not.toBe(layer.settings);
      expect(layer.data).toBe(data);
    });
    it("calls this.render()", () => {
      const layer = getGlLayer();
      jest.spyOn(layer, "render");
      layer.setData([]);
      expect(layer.render).toHaveBeenCalled();
    });
  });
  describe("setup", () => {
    describe("when settings.click and settings.setupClick are truth", () => {
      it("calls settings.setupClick with this.map", () => {
        const click = () => {};
        const setupClick = jest.fn();
        const layer = getGlLayer({
          click,
          setupClick,
        });
        expect(layer.setup()).toBe(layer);
        expect(setupClick).toHaveBeenCalledWith(layer.map);
      });
    });
    describe("when settings.contextMenu and settings.setupContextMenu are truth", () => {
      it("calls settings.setupContextMenu with this.map", () => {
        const contextMenu = () => {};
        const setupContextMenu = jest.fn();
        const layer = getGlLayer({
          contextMenu,
          setupContextMenu,
        });
        expect(layer.setup()).toBe(layer);
        expect(setupContextMenu).toHaveBeenCalledWith(layer.map);
      });
    });
    describe("when settings.hover and settings.setupHover are truthy", () => {
      it("calls settings.setupHover with this.map and settings.hoverWait", () => {
        const hover: EventCallback = () => {};
        const setupHover = jest.fn();
        const hoverWait = 12;
        const layer = getGlLayer({
          hover,
          setupHover,
          hoverWait,
        });
        expect(layer.setup()).toBe(layer);
        expect(setupHover).toHaveBeenCalledWith(layer.map, hoverWait);
      });
    });
    it("calls this.setupVertexShader, this.setupFragmentShader, and this.setupProgram", () => {
      const layer = getGlLayer();
      jest.spyOn(layer, "setupVertexShader");
      jest.spyOn(layer, "setupFragmentShader");
      jest.spyOn(layer, "setupProgram");
      layer.setup();
      expect(layer.setupVertexShader).toHaveBeenCalled();
      expect(layer.setupFragmentShader).toHaveBeenCalled();
      expect(layer.setupProgram).toHaveBeenCalled();
    });
  });

  describe("setupVertexShader", () => {
    it("sets this.vertexShader", () => {
      const layer = getGlLayer();
      layer.setupVertexShader();
      expect(layer.vertexShader).not.toBe(null);
    });
    describe("when typeof settings.vertexShaderSource is a function", () => {
      it("calls it, and calls gl.shaderSource with returned value", () => {
        const vertexShaderSource = () => "vertex";
        const layer = getGlLayer({ vertexShaderSource });
        jest.spyOn(layer.gl, "shaderSource");
        layer.setupVertexShader();
        expect(layer.gl.shaderSource).toHaveBeenCalledWith(
          layer.vertexShader,
          "vertex"
        );
      });
    });
    describe("when typeof settings.vertexShaderSource is a string", () => {
      it("calls gl.shaderSource with it", () => {
        const vertexShaderSource = "vertex";
        const layer = getGlLayer({ vertexShaderSource });
        jest.spyOn(layer.gl, "shaderSource");
        layer.setupVertexShader();
        expect(layer.gl.shaderSource).toHaveBeenCalledWith(
          layer.vertexShader,
          "vertex"
        );
      });
    });
    describe("when vertexShader returns null", () => {
      it("throws", () => {
        const layer = getGlLayer();
        jest.spyOn(layer.gl, "createShader").mockReturnValue(null);
        expect(() => {
          layer.setupVertexShader();
        }).toThrow();
      });
    });
    describe("when vertexShaderSource is undefined", () => {
      it("throws", () => {
        const layer = getGlLayer({ vertexShaderSource: undefined });
        expect(() => {
          layer.setupVertexShader();
        }).toThrow();
      });
    });
    it("calls gl.compileShader with vertexShader", () => {
      const layer = getGlLayer();
      jest.spyOn(layer.gl, "compileShader");
      layer.setupVertexShader();
      expect(layer.gl.compileShader).toBeCalledWith(layer.vertexShader);
    });
  });

  describe("setupFragmentShader", () => {
    it("sets this.fragmentShader", () => {
      const layer = getGlLayer();
      layer.setupFragmentShader();
      expect(layer.fragmentShader).not.toBe(null);
    });
    describe("when typeof settings.fragmentShaderSource is a function", () => {
      it("calls it, and calls gl.shaderSource with returned value", () => {
        const fragmentShaderSource = () => "fragment";
        const layer = getGlLayer({ fragmentShaderSource });
        jest.spyOn(layer.gl, "shaderSource");
        layer.setupFragmentShader();
        expect(layer.gl.shaderSource).toHaveBeenCalledWith(
          layer.fragmentShader,
          "fragment"
        );
      });
    });
    describe("when typeof settings.fragmentShaderSource is a string", () => {
      it("calls gl.shaderSource with it", () => {
        const fragmentShaderSource = "fragment";
        const layer = getGlLayer({ fragmentShaderSource });
        jest.spyOn(layer.gl, "shaderSource");
        layer.setupFragmentShader();
        expect(layer.gl.shaderSource).toHaveBeenCalledWith(
          layer.fragmentShader,
          "fragment"
        );
      });
    });
    describe("when fragmentShader returns null", () => {
      it("throws", () => {
        const layer = getGlLayer();
        jest.spyOn(layer.gl, "createShader").mockReturnValue(null);
        expect(() => {
          layer.setupFragmentShader();
        }).toThrow();
      });
    });
    describe("when fragmentShaderSource is undefined", () => {
      it("throws", () => {
        const layer = getGlLayer({ fragmentShaderSource: undefined });
        expect(() => {
          layer.setupFragmentShader();
        }).toThrow();
      });
    });
    it("calls gl.compileShader with fragmentShader", () => {
      const layer = getGlLayer();
      jest.spyOn(layer.gl, "compileShader");
      layer.setupFragmentShader();
      expect(layer.gl.compileShader).toBeCalledWith(layer.fragmentShader);
    });
  });

  describe("setupProgram", () => {
    describe("when setupProgram returns null", () => {
      it("throws", () => {
        const layer = getGlLayer();
        jest.spyOn(layer.gl, "createProgram").mockReturnValue(null);
        expect(() => {
          layer.setupProgram();
        }).toThrow();
      });
    });
    describe("when this.vertexShader null", () => {
      it("throws", () => {
        const layer = getGlLayer();
        expect(layer.vertexShader).toBe(null);
        expect(() => {
          layer.setupProgram();
        }).toThrow();
      });
    });
    describe("when this.fragmentShader null", () => {
      it("throws", () => {
        const layer = getGlLayer();
        layer.setupVertexShader();
        expect(layer.fragmentShader).toBe(null);
        expect(() => {
          layer.setupProgram();
        }).toThrow();
      });
    });
    it("sets this.program from gl.createProgram", () => {
      const layer = getGlLayer().setupVertexShader().setupFragmentShader();
      expect(layer.program).toBe(null);
      layer.setupProgram();
      expect(layer.program).not.toBe(null);
    });
    it("calls attachShader with vertexShader", () => {
      const layer = getGlLayer().setupVertexShader().setupFragmentShader();
      jest.spyOn(layer.gl, "attachShader");
      layer.setupProgram();
      expect(layer.gl.attachShader).toBeCalledWith(
        layer.program,
        layer.vertexShader
      );
    });
    it("calls attachShader with fragmentShader", () => {
      const layer = getGlLayer().setupVertexShader().setupFragmentShader();
      jest.spyOn(layer.gl, "attachShader");
      layer.setupProgram();
      expect(layer.gl.attachShader).toBeCalledWith(
        layer.program,
        layer.fragmentShader
      );
    });
    it("calls gl.linkProgram with program", () => {
      const layer = getGlLayer().setupVertexShader().setupFragmentShader();
      jest.spyOn(layer.gl, "linkProgram");
      layer.setupProgram();
      expect(layer.gl.linkProgram).toHaveBeenCalledWith(layer.program);
    });
    it("calls gl.useProgram with program", () => {
      const layer = getGlLayer().setupVertexShader().setupFragmentShader();
      jest.spyOn(layer.gl, "useProgram");
      layer.setupProgram();
      expect(layer.gl.useProgram).toHaveBeenCalledWith(layer.program);
    });
    it("calls gl.blendFunc with gl.SRC_ALPHA and gl.ONE_MINUS_SRC_ALPHA", () => {
      const layer = getGlLayer().setupVertexShader().setupFragmentShader();
      jest.spyOn(layer.gl, "blendFuncSeparate");
      layer.setupProgram();
      expect(layer.gl.blendFuncSeparate).toHaveBeenCalledWith(
        layer.gl.SRC_ALPHA,
        layer.gl.ONE_MINUS_SRC_ALPHA,
        layer.gl.ONE,
        layer.gl.ONE_MINUS_SRC_ALPHA
      );
    });
    it("calls gl.enable with gl.BLEND", () => {
      const layer = getGlLayer().setupVertexShader().setupFragmentShader();
      jest.spyOn(layer.gl, "enable");
      layer.setupProgram();
      expect(layer.gl.enable).toHaveBeenCalledWith(layer.gl.BLEND);
    });
  });
  describe("addTo", () => {
    describe("when map argument is omitted", () => {
      it("calls this.layer.addTo with this.map", () => {
        const layer = getGlLayer();
        jest.spyOn(layer.layer, "addTo");
        layer.addTo();
        expect(layer.layer.addTo).toHaveBeenCalledWith(layer.map);
      });
    });
    describe("when map argument is present", () => {
      it("calls this.layer.addTo with map", () => {
        const element = document.createElement("div");
        const map = new Map(element);
        const layer = getGlLayer();
        jest.spyOn(layer.layer, "addTo");
        layer.addTo(map);
        expect(layer.layer.addTo).toHaveBeenCalledWith(map);
      });
    });
    it("sets this.active to true", () => {
      const layer = getGlLayer();
      layer.active = false;
      layer.addTo();
      expect(layer.active).toBe(true);
    });
    it("calls and returns this.render", () => {
      const layer = getGlLayer();
      jest.spyOn(layer, "render");
      layer.addTo();
      expect(layer.render).toHaveBeenCalled();
    });
  });
  describe("remove", () => {
    describe("when indices argument is undefined", () => {
      it("calls this.map.removeLayer and sets this.active to false", () => {
        const layer = getGlLayer();
        jest.spyOn(layer.map, "removeLayer");
        layer.remove();
        expect(layer.map.removeLayer).toHaveBeenCalledWith(layer.layer);
        expect(layer.active).toBe(false);
      });
    });
    describe("when indices argument is a number", () => {
      it("removes it from the data and calls this.render", () => {
        const feature1 = {};
        const feature2 = {};
        const data = {
          features: [feature1, feature2],
        };
        const layer = getGlLayer({ data });
        jest.spyOn(layer, "render");
        layer.remove(0);
        expect(layer.data).toEqual({ features: [feature2] });
        expect(layer.render).toHaveBeenCalled();
      });
    });
    describe("when indices argument is a number[]", () => {
      it("removes them from the data and calls this.render", () => {
        const feature1 = {};
        const feature2 = {};
        const feature3 = {};
        const data = {
          features: [feature1, feature2, feature3],
        };
        const layer = getGlLayer({ data });
        jest.spyOn(layer, "render");
        layer.remove([0, 2]);
        expect(layer.data).toEqual({ features: [feature2] });
        expect(layer.render).toHaveBeenCalled();
      });
    });
    describe("when this.settings.data is an array", () => {
      it("is used, rather than this.settings.data.features", () => {
        const feature1 = {};
        const feature2 = {};
        const data = [feature1, feature2];
        const layer = getGlLayer({ data });
        layer.remove(0);
        expect(layer.data).toEqual([feature2]);
      });
    });
  });

  describe("insert", () => {
    describe("when data has a features property", () => {
      it("inserts data into defined index", () => {
        const feature1 = {};
        const feature2 = {};
        const feature3 = {};

        const data = { features: [feature1, feature3] };
        const layer = getGlLayer({ data });
        layer.insert(feature2, 1);
        expect(layer.data).toEqual({
          features: [feature1, feature2, feature3],
        });
      });
    });
    describe("when data is an array", () => {
      it("inserts data into defined index", () => {
        const feature1 = {};
        const feature2 = {};
        const feature3 = {};

        const data = [feature1, feature3];
        const layer = getGlLayer({ data });
        layer.insert(feature2, 1);
        expect(layer.data).toEqual([feature1, feature2, feature3]);
      });
    });
    it("calls this.render()", () => {
      const data = [{}];
      const layer = getGlLayer({ data });
      jest.spyOn(layer, "render");
      layer.insert({}, 0);
      expect(layer.render).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    describe("when data has a features property", () => {
      it("replaces data at defined index", () => {
        const feature1 = {};
        const feature2 = {};
        const feature3 = {};

        const data = { features: [feature1, feature3] };
        const layer = getGlLayer({ data });
        layer.update(feature2, 1);
        expect(layer.data).toEqual({ features: [feature1, feature2] });
      });
    });
    describe("when data is an array", () => {
      it("replaces data at defined index", () => {
        const feature1 = {};
        const feature2 = {};
        const feature3 = {};

        const data = [feature1, feature3];
        const layer = getGlLayer({ data });
        layer.update(feature2, 1);
        expect(layer.data).toEqual([feature1, feature2]);
      });
    });
    it("calls this.render()", () => {
      const data = [{}];
      const layer = getGlLayer({ data });
      jest.spyOn(layer, "render");
      layer.update({}, 0);
      expect(layer.render).toHaveBeenCalled();
    });
  });
  describe("getBuffer", () => {
    describe("when there is not a buffer on this.buffers with name", () => {
      it("calls this.gl.createBuffer and sets it on this.buffers", () => {
        const layer = getGlLayer();
        expect(layer.buffers.buffer1).toBeUndefined();
        jest.spyOn(layer.gl, "createBuffer");
        const buffer = layer.getBuffer("buffer1");
        expect(buffer).toBeTruthy();
        expect(layer.gl.createBuffer).toHaveBeenCalled();
        expect(layer.buffers.buffer1).toBe(buffer);
      });
      describe("when this.gl.createBuffer returns null", () => {
        it("throws", () => {
          const layer = getGlLayer();
          jest.spyOn(layer.gl, "createBuffer").mockReturnValue(null);
          expect(() => {
            layer.getBuffer("buffer1");
          }).toThrow();
        });
      });
    });
    describe("when there is not a buffer on this.buffers with name", () => {
      it("returns this.buffers with name", () => {
        const layer = getGlLayer();
        jest.spyOn(layer.gl, "createBuffer");
        layer.buffers.buffer1 = new WebGLBuffer();
        const buffer = layer.getBuffer("buffer1");
        expect(buffer).toBe(layer.buffers.buffer1);
        expect(layer.gl.createBuffer).not.toHaveBeenCalled();
      });
    });
  });

  describe("getAttributeLocation", () => {
    describe("when this.program is null", () => {
      it("throws", () => {
        const layer = getGlLayer();
        expect(layer.program).toBe(null);
        expect(() => {
          layer.getAttributeLocation("attribute1");
        }).toThrow();
      });
    });
    describe("when this.attributeLocations[name] is not defined", () => {
      it("sets this.attributeLocations[name] and returns the attributeLocation", () => {
        const layer = getGlLayer();
        layer.program = new WebGLProgram();
        expect(layer.attributeLocations.attribute1).toBeUndefined();
        jest.spyOn(layer.gl, "getAttribLocation");
        const attribute = layer.getAttributeLocation("attribute1");
        expect(attribute).toBeTruthy();
        expect(layer.gl.getAttribLocation).toHaveBeenCalledWith(
          layer.program,
          "attribute1"
        );
        expect(layer.attributeLocations.attribute1).toBe(attribute);
      });
    });
  });

  describe("getUniformLocation", () => {
    describe("when this.program is null", () => {
      it("throws", () => {
        const layer = getGlLayer();
        expect(layer.program).toBe(null);
        expect(() => {
          layer.getUniformLocation("uniformLocation1");
        }).toThrow();
      });
    });
    describe("when this.uniformLocations[name] is not defined", () => {
      it("sets this.uniformLocations[name] and returns the uniformLocation", () => {
        const layer = getGlLayer();
        layer.program = new WebGLProgram();
        expect(layer.uniformLocations.uniformLocation1).toBeUndefined();
        jest.spyOn(layer.gl, "getUniformLocation");
        const uniformLocation = layer.getUniformLocation("uniformLocation1");
        expect(uniformLocation).not.toBeFalsy();
        expect(layer.gl.getUniformLocation).toHaveBeenCalledWith(
          layer.program,
          "uniformLocation1"
        );
        expect(layer.uniformLocations.uniformLocation1).toBe(uniformLocation);
      });
    });
    describe("when this.gl.getUniformLocation returns null", () => {
      it("throws", () => {
        const layer = getGlLayer();
        jest.spyOn(layer.gl, "getUniformLocation").mockReturnValue(null);
        expect(() => {
          layer.getUniformLocation("uniformLocation1");
        }).toThrow();
      });
    });
  });

  describe("click", () => {
    describe("when this.settings.click is undefined", () => {
      it("does not throw", () => {
        const layer = getGlLayer();
        expect(layer.settings.click).toBeUndefined();
        expect(() => {
          layer.click(fakeEvent(layer), {});
        }).not.toThrow();
      });
    });
    describe("when this.settings.click is defined", () => {
      describe("when it does not return a value", () => {
        it("calls this.settings.click and returns void", () => {
          const click = jest.fn(() => {
            return undefined;
          });
          const layer = getGlLayer({ click });
          const event = fakeEvent(layer);
          const feature = {};
          const result = layer.click(event, feature);
          expect(click).toHaveBeenCalledWith(event, feature);
          expect(result).toBeUndefined();
        });
      });
      describe("when it does return a value", () => {
        it("calls this.settings.click and returns void", () => {
          const click = jest.fn(() => {
            return true;
          });
          const layer = getGlLayer({ click });
          const event = fakeEvent(layer);
          const feature = {};
          const result = layer.click(event, feature);
          expect(click).toHaveBeenCalledWith(event, feature);
          expect(result).toBeTruthy();
        });
      });
    });
  });

  describe("hover", () => {
    describe("when this.settings.hover is undefined", () => {
      it("does not throw", () => {
        const layer = getGlLayer();
        expect(layer.settings.hover).toBeUndefined();
        expect(() => {
          layer.hover(fakeEvent(layer), {});
        }).not.toThrow();
      });
    });
    describe("when this.settings.hover is defined", () => {
      describe("when it does not return a value", () => {
        it("calls this.settings.hover and returns void", () => {
          const hover = jest.fn(() => {
            return undefined;
          });
          const layer = getGlLayer({ hover });
          const event = fakeEvent(layer);
          const feature = {};
          const result = layer.hover(event, feature);
          expect(hover).toHaveBeenCalledWith(event, feature);
          expect(result).toBeUndefined();
        });
      });
      describe("when it does return a value", () => {
        it("calls this.settings.hover and returns void", () => {
          const hover = jest.fn(() => {
            return true;
          });
          const layer = getGlLayer({ hover });

          const feature = {};
          const event = fakeEvent(layer);
          const result = layer.hover(event, feature);
          expect(hover).toHaveBeenCalledWith(event, feature);
          expect(result).toBeTruthy();
        });
      });
    });
  });

  describe("hoverOff", () => {
    describe("when this.settings.hoverOff is undefined", () => {
      it("does not throw", () => {
        const layer = getGlLayer();
        expect(layer.settings.hoverOff).toBeUndefined();
        expect(() => {
          layer.hover(fakeEvent(layer), {});
        }).not.toThrow();
      });
    });
    describe("when this.settings.hoverOff is defined", () => {
      describe("when it does not return a value", () => {
        it("calls this.settings.hoverOff and returns void", () => {
          const hoverOff = jest.fn(() => {
            return undefined;
          });
          const layer = getGlLayer({ hoverOff });
          const event = fakeEvent(layer);
          const feature = {};
          layer.hoverOff(event, feature);
          expect(hoverOff).toHaveBeenCalledWith(event, feature);
        });
      });
    });
  });
});

import { ICanvasOverlayDrawEvent } from "../canvas-overlay";
import { Map } from "leaflet";

export class CanvasOverlay {
  _userDrawFunc: (e: ICanvasOverlayDrawEvent) => void;
  constructor(userDrawFunc: (e: ICanvasOverlayDrawEvent) => void) {
    this._userDrawFunc = userDrawFunc;
  }

  canvas: HTMLCanvasElement = (() => {
    const canvas = document.createElement("canvas");
    jest.spyOn(canvas, "getContext");
    return canvas;
  })();

  addTo(map: Map): this {
    return this;
  }

  redraw(): void {}
}

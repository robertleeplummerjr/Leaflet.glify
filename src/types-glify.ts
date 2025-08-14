// Glify interface definitions that reference classes
// This file imports the actual classes to ensure type consistency

import { IBaseGlLayerSettings, IPointsSettings, ILinesSettings, IShapesSettings } from './types-base';
import { BaseGlLayer } from './base-gl-layer';
import { Points } from './points';
import { Lines } from './lines';
import { Shapes } from './shapes';

// Core glify interface
export interface IGlify {
  longitudeKey: number;
  latitudeKey: number;
  clickSetupMaps: any[];
  contextMenuSetupMaps: any[];
  hoverSetupMaps: any[];
  shader: any;

  // Class constructors - these are the actual classes
  Points: typeof Points;
  Shapes: typeof Shapes;
  Lines: typeof Lines;

  // Instance arrays - these contain actual instances
  pointsInstances: Points[];
  shapesInstances: Shapes[];
  linesInstances: Lines[];

  // Coordinate order methods
  longitudeFirst(): this;
  latitudeFirst(): this;
  readonly instances: (Points | Lines | Shapes)[];

  // Factory methods that return instances
  points(settings: Partial<IPointsSettings>): Points;
  lines(settings: Partial<ILinesSettings>): Lines;
  shapes(settings: Partial<IShapesSettings>): Shapes;

  // Setup methods
  setupClick(map: any): void;
  setupContextMenu(map: any): void;
  setupHover(map: any, hoverWait?: number, immediate?: false): void;

  // Coordinate order methods
  getCoordinateOrder(): any;
  setCoordinateOrder(order: any): this;
}

// Utility types that reference the classes
export type GlifyInstance = Points | Lines | Shapes;

# Leaflet.glify ![Leaflet.glify logo](logo.svg)

web gl renderer plugin for leaflet in typescript

_Pronounced leaflet-G.L.-Ify, or leaflet-glify, or L.-G.L.-Ify, or L-glify, or elglify_

inspired by http://bl.ocks.org/Sumbera/c6fed35c377a46ff74c3 & need.

[![Backers on Open Collective](https://opencollective.com/leafletglify/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/leafletglify/sponsors/badge.svg)](#sponsors)

## Objective

- To provide a means of rendering a massive amount of data visually in a way that does not degrade user experience
- Remaining as simple as possible with current fastest libs
- Providing the same sort of user experience one would get using standard html and elements

## Usage

### Browser

```html
<script src="dist/glify-browser.js"></script>
<script>
  // namespace
  L.glify;
</script>
```

### Typescript

```ts
import glify from 'leaflet.glify';
// namespace
glify
```

### Node
```js
const { glify } = require('leaflet.glify');
// namespace
glify
```

### Simple Points Usage
```ts
L.glify.points({
  map,
  data: pointsOrGeoJson,
  click: (e, pointOrGeoJsonFeature, xy): boolean | void => {
    // do something when a point is clicked
    // return false to continue traversing
  },
  hover: (e, pointOrGeoJsonFeature, xy): boolean | void => {
    // do something when a point is hovered
  },
});
```

### Simple Lines Usage
```ts
L.glify.lines({
  map: map,
  data: geojson,
  size: 2,
  click: (e, feature): boolean | void => {
    // do something when a line is clicked
    // return false to continue traversing
  },
  hover: (e, feature): boolean | void => {
    // do something when a line is hovered
  },
  hoverOff: (e, feature): boolean | void => {
    // do something when a line is hovered off
  },
});
```

### Simple Polygon Usage
```ts
L.glify.shapes({
  map,
  data: geoJson,
  click: (e, feature): boolean | void => {
    // do something when a shape is clicked
    // return false to continue traversing
  },
  hover: (e, feature): boolean | void => {
    // do something when a shape is hovered
  }
});
```

## API
**`L.glify` methods**
* [`points(options)`](#lglifypointsoptions-object)
* [`lines(options)`](#lglifylinesoptions-object)
* [`shapes(options)`](#lglifyshapesoptions-object)
* [`longitudeFirst()`](#longitudefirst)
* [`latitudeFirst()`](#latitudefirst)

**`L.glify` properties**
* [`pointsInstances`](#pointsinstances)
* [`linesInstances`](#linesinstances)
* [`shapesInstances`](#shapesinstances)

---
### `L.glify.points(options: object)`
Adds point data passed in `options.data` to the Leaflet map instance passed in `options.map`.
#### Returns
`L.glify.Points` instance
#### Options
* `map` `{Object}` required leaflet map
* `data` `{Object}` required geojson `FeatureCollection` object or an array of `[lat: number, lng: number]` arrays
* `vertexShaderSource` `{String|Function}` optional glsl vertex shader source, defaults to use `L.glify.shader.vertex`
* `fragmentShaderSource` `{String|Function}` optional glsl fragment shader source, defaults to use `L.glify.shader.fragment.point`
* `click` `{Function}` optional event handler for clicking a point
* `hover` `{Function}` optional event handler for hovering a point
* `color` `{Function|Object|String}` optional, default is 'random'
  * When `color` is a `Function` its arguments are the `index`:`number` and the `point`:`array` that is being colored, opacity can optionally be included as `{ a: number }`.
    The result should be of interface `IColor`, example: `{r: number, g: number, b: number, a: number }`.
* `opacity` `{Number}` a value from 0 to 1, default is 0.8.  Only used when opacity isn't included on color.
* `className` `{String}` a class name applied to canvas, default is ''
* `size` `{Number|Function}` pixel size of point
  * When `size` is a `Function` its arguments are `index`:`number`, and the `point`:`array` that is being sized
* `sensitivity` `{Number}` exaggerates the size of the clickable area to make it easier to click a point
* `sensitivityHover` `{Number}` exaggerates the size of the hoverable area to make it easier to hover a point
* `preserveDrawingBuffer` `{Boolean}` optional, default `false`, perverse draw buffer on webgl context.
  * CAUTION: May cause performance issue with large data sets.
* `pane` `{String}` optional, default is `overlayPane`. Can be set to a custom pane.
---
### `L.glify.lines(options: object)`
Adds line data passed in `options.data` to the Leaflet map instance passed in `options.map`.
#### Returns
`L.glify.Lines` instance
#### Options
* `map` `{Object}` required leaflet map
* `data` `{Object}` required geojson `FeatureCollection` object with `geometry.coordinates` arrays being in a `[lat: number, lng: number]` format
* `vertexShaderSource` `{String|Function}` optional glsl vertex shader source, defaults to use `L.glify.shader.vertex`
* `fragmentShaderSource` `{String|Function}` optional glsl fragment shader source, defaults to use `L.glify.shader.fragment.point`
* `click` `{Function}` optional event handler for clicking a line
* `hover` `{Function}` optional event handler for hovering a line
* `hoverOff` `{Function}` optional event handler for hovering off a line
* `color` `{Function|Object|String}` optional, default is 'random'
  * When `color` is a `Function` its arguments are the `index`:`number` and the `feature`:`object` that is being colored, opacity can optionally be included as `{ a: number }`.
    The result should be of interface `IColor`, example: `{r: number, g: number, b: number, a: number }`.
* `opacity` `{Number}` a value from 0 to 1, default is 0.5.  Only used when opacity isn't included on color.
* `className` `{String}` a class name applied to canvas, default is ''
* `sensitivity` `{Number}` exaggerates the size of the clickable area to make it easier to click a line
* `sensitivityHover` `{Number}` exaggerates the size of the hoverable area to make it easier to hover a line
* `preserveDrawingBuffer` `{Boolean}` optional, default `false`, perverse draw buffer on webgl context.
  * CAUTION: May cause performance issue with large data sets. 
* `weight` `{Number|Function}` a value in pixels of how thick lines should be drawn
  * When `weight` is a `Function` its arguments are gets the `index`:`number`, and the `feature`:`object` that is being drawn
  * CAUTION: Zoom of more than 18 will turn weight internally to 1 to prevent WebGL precision rendering issues.
* `pane` `{String}` optional, default is `overlayPane`. Can be set to a custom pane.
---
### `L.glify.shapes(options: object)`
Adds polygon data passed in `options.data` to the Leaflet map instance passed in `options.map`.
#### Returns
`L.glify.Shapes` instance
#### Options
* `map` `{Object}` required leaflet map
* `data` `{Object}` required geojson `FeatureCollection` object with `geometry.coordinates` arrays being in a `[lng: number, lat: number]` format *Note: `lat` and `lng` are expected in a different order than in `.points()` and `.lines()`*
* `vertexShaderSource` `{String|Function}` optional glsl vertex shader source, defaults to use `L.glify.shader.vertex`
* `fragmentShaderSource` `{String|Function}` optional glsl fragment shader source, defaults to use `L.glify.shader.fragment.polygon`
* `click` `{Function}` optional event handler for clicking a shape
* `hover` `{Function}` optional event handler for hovering a shape
* `color` `{Function|Object|String}` optional, default is 'random'
  * When `color` is a `Function` its arguments are the `index`:`number` and the `feature`:`object` that is being colored, opacity can optionally be included as `{ a: number }`.
    The result should be of interface `IColor`, example: `{r: number, g: number, b: number, a: number }`.
* `opacity` `{Number}` a value from 0 to 1, default is 0.5.   Only used when opacity isn't included on color.
* `className` `{String}` a class name applied to canvas, default is ''
* `border` `{Boolean}` optional, default `false`. When set to `true`, a border with an opacity of `settings.borderOpacity` is displayed.
* `borderOpacity` `{Number}` optional, default `false`. Border opacity for when `settings.boarder` is `true`.  Default is 1.
* `preserveDrawingBuffer` `{Boolean}` optional, default `1`, adjusts the border opacity separate from `opacity`.
  * CAUTION: May cause performance issue with large data sets.
* `pane` `{String}` optional, default is `overlayPane`. Can be set to a custom pane.
---
### `longitudeFirst()`
Sets the expecetd order of arrays in the `coordinates` array of GeoJSON passed to `options.data` to be `[lng, lat]`
#### Returns
The updated `L.glify` instance it was called on

---
### `latitudeFirst()`
Sets the expecetd order of arrays in the `coordinates` array of GeoJSON passed to `options.data` to be `[lat, lng]`
#### Returns
The updated `L.glify` instance it was called on

---
### `pointsInstances`  
All of the `L.glify.Points` instances

---
### `linesInstances`
All of the `L.glify.Lines` instances

---
### `shapesInstances`
All of the `L.glify.Shapes` instances


## Building

You can build the library by running `yarn run build` or `npm run build`

## Developing

Use `yarn serve` or `npm run serve`

## Testing

Use `yarn test` or `npm run test`

## Update & Remove Data
`L.glify` instances can be updated using the `update(data, index)` method.
* `data` `{Object}` Lines and Shapes require a single GeoJSON feature. Points require the same data structure as the original object and therefore also accept an array of coordinates.
* `index` `{number}` An integer indicating the index of the element to be updated.

An object or some elements of an object are removed using the `remove(index)` method.

- `index` `{number|Array}` optional - An integer or an array of integers specifying the indices of the elements to be removed.

- `index` `{number|Array}` optional - An integer or an array of integers specifying the indices of the elements to be removed.
  If `index` is not defined, the entire object is removed.
  
### Example
```ts
let newPoints = L.glify.points({
  map: leafletMap,
  data: geojsonFeatureCollection,
  size: 30
});

// Update the third feature
newPoints.update({
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Point",
      "coordinates": [
        34.072204277521394
        -118.44255208969116
      ]
    }
  }]
}, 2);

// Now remove it
newPoints.remove(2);
```

## Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/robertleeplummerjr/Leaflet.glify/graphs/contributors"><img src="https://opencollective.com/leafletglify/contributors.svg?width=890&button=false" /></a>

## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/leafletglify#backer)]

<a href="https://opencollective.com/leafletglify#backers" target="_blank"><img src="https://opencollective.com/leafletglify/backers.svg?width=890"></a>

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/leafletglify#sponsor)]

<a href="https://opencollective.com/leafletglify/sponsor/0/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/leafletglify/sponsor/1/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/leafletglify/sponsor/2/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/leafletglify/sponsor/3/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/leafletglify/sponsor/4/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/leafletglify/sponsor/5/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/leafletglify/sponsor/6/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/leafletglify/sponsor/7/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/leafletglify/sponsor/8/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/leafletglify/sponsor/9/website" target="_blank"><img src="https://opencollective.com/leafletglify/sponsor/9/avatar.svg"></a>

# Leaflet.glify
web gl renderer plugin for leaflet in typescript

_Pronounced leaflet-G.L.-Ify, or leaflet-glify, or L.-G.L.-Ify, or L-glify, or elglify_

inspired by http://bl.ocks.org/Sumbera/c6fed35c377a46ff74c3 & need.

[![Backers on Open Collective](https://opencollective.com/leafletglify/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/leafletglify/sponsors/badge.svg)](#sponsors)

## Objective
* To provide a means of rendering a massive amount of data visually in a way that does not degrade user experience
* Remaining as simple as possible with current fastest libs
* Providing the same sort of user experience one would get using standard html and elements

## Usage
### Browser
```html
<script src="dist/glify-browser.js"></script>
<script>
  // namespace
  L.glify
</script>
```
### Typescript
```ts
import glify from 'leaflet.glify';
```
### Node
```html
const { glify } = require('leaflet.glify');
```

## Simple Polygon Usage
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

## Simple Points Usage
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
  }
});
```

## Simple Lines Usage
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
  }
});
```

## `L.glify.shapes` Options
* `map` `{Object}` required leaflet map
* `data` `{Object}` required geojson data
* `vertexShaderSource` `{String|Function}` optional glsl vertex shader source, defaults to use `L.glify.shader.vertex`
* `fragmentShaderSource` `{String|Function}` optional glsl fragment shader source, defaults to use `L.glify.shader.fragment.polygon`
* `click` `{Function}` optional event handler for clicking a shape
* `hover` `{Function}` optional event handler for hovering a shape
* `color` `{Function|Object|String}` optional, default is 'random'
  * When `color` is a `Function` its arguments are gets the `index`:`number`, and the `feature`:`object` that is being colored
* `opacity` {Number} a value from 0 to 1, default is 0.5
* `className` {String} a class name applied to canvas, default is ''
* `preserveDrawingBuffer` {Boolean} optional, default `false`, perverse draw buffer on webgl context.
  * CAUTION: May cause performance issue with large data sets.

## `L.glify.points` Options
* `map` `{Object}` required leaflet map
* `data` `{Object}` required geojson data
* `vertexShaderSource` `{String|Function}` optional glsl vertex shader source, defaults to use `L.glify.shader.vertex`
* `fragmentShaderSource` `{String|Function}` optional glsl fragment shader source, defaults to use `L.glify.shader.fragment.point`
* `click` `{Function}` optional event handler for clicking a point
* `hover` `{Function}` optional event handler for hovering a point
* `color` `{Function|Object|String}` optional, default is 'random'
  * When `color` is a `Function` its arguments are gets the `index`:`number`, and the `point`:`array` that is being colored 
* `opacity` {Number} a value from 0 to 1, default is 0.8
* `className` {String} a class name applied to canvas, default is ''
* `size` {Number|Function} pixel size of point
  * When `size` is a `Function` its arguments are `index`:`number`, and the `point`:`array` that is being sized
* `sensitivity` {Number} exaggerates the size of the clickable area to make it easier to click a point
* `sensitivityHover` {Number} exaggerates the size of the hoverable area to make it easier to hover a point
* `preserveDrawingBuffer` {Boolean} optional, default `false`, perverse draw buffer on webgl context.
  * CAUTION: May cause performance issue with large data sets.

## `L.glify.lines` Options
* `map` `{Object}` required leaflet map
* `data` `{Object}` required geojson data
* `vertexShaderSource` `{String|Function}` optional glsl vertex shader source, defaults to use `L.glify.shader.vertex`
* `fragmentShaderSource` `{String|Function}` optional glsl fragment shader source, defaults to use `L.glify.shader.fragment.point`
* `click` `{Function}` optional event handler for clicking a line
* `hover` `{Function}` optional event handler for hovering a line
* `color` `{Function|Object|String}` optional, default is 'random'
  * When `color` is a `Function` its arguments are gets the `index`:`number`, and the `point`:`array` that is being colored 
* `opacity` {Number} a value from 0 to 1, default is 0.5
* `className` {String} a class name applied to canvas, default is ''
* `sensitivity` {Number} exaggerates the size of the clickable area to make it easier to click a line
* `sensitivityHover` {Number} exaggerates the size of the hoverable area to make it easier to hover a line
* `preserveDrawingBuffer` {Boolean} optional, default `false`, perverse draw buffer on webgl context.
  * CAUTION: May cause performance issue with large data sets. 
* `weight` {Number|Function} a value in pixels of how thick lines should be drawn
  * When `weight` is a `Function` its arguments are gets the `index`:`number`, and the `feature`:`object` that is being drawn
  * CAUTION: Zoom of more than 18 will turn weight internally to 1 to prevent WebGL precision rendering issues.

## `L.glify` methods
* `longitudeFirst()`
* `latitudeFirst()`
* `instances`
* `points(options)`
* `shapes(options)`
* `lines(options)`

## Building

There are two ways to package this application: Parcel and WebPack.

You can build the parcel version by running ``yarn run build-browser``
You can build the webpack version by running ``yarn run build-browser-webpack``

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

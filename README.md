# Leaflet.glify
web gl renderer plugin for leaflet

_Pronounced leaflet-G.L.-Ify, or leaflet-glify, or L.-G.L.-Ify, or L-glify, or elglify_

inspired by http://bl.ocks.org/Sumbera/c6fed35c377a46ff74c3 & need.

## Objective
* To provide a means of rendering a massive amount of data visually in a way that does not degrade user experience
* Remaining as simple as possible with current fastest libs
* Providing the same sort of user experience one would get using standard html and elements


## Simple Polygon Usage
```javascript
L.glify.shapes({
  map: map,
  data: geoJson,
  click: function(e, feature) {
    //do something when a shape is clicked
  }
});
```

## Simple Points Usage
```javascript
L.glify.points({
  map: map,
  data: points,
  click: function(e, point, xy) {
    //do something when a point is clicked
  }
});
```

## Simple Lines Usage
```javascript
L.glify.lines({
  map: map,
  data: geojson,
  click: function(e, feature, xy) {
    //do something when a line is clicked
  }
});
```

## `L.glify.shapes` Options
* `map` `{Object}` required leaflet map
* `data` `{Object}` required geojson data
* `vertexShaderSource` `{String|Function}` optional glsl vertex shader source, defaults to use `L.glify.shader.vertex`
* `fragmentShaderSource` `{String|Function}` optional glsl fragment shader source, defaults to use `L.glify.shader.fragment.polygon`
* `click` `{Function}` optional event handler for clicking a shape
* `color` `{Function|Object|String}` optional, default is 'random'
  * When `color` is a `Function` its arguments are gets the `index`:`number`, and the `feature`:`object` that is being colored
* `className` {String} a class name applied to canvas, default is ''

## `L.glify.points` Options
* `map` `{Object}` required leaflet map
* `data` `{Object}` required geojson data
* `vertexShaderSource` `{String|Function}` optional glsl vertex shader source, defaults to use `L.glify.shader.vertex`
* `fragmentShaderSource` `{String|Function}` optional glsl fragment shader source, defaults to use `L.glify.shader.fragment.point`
* `click` `{Function}` optional event handler for clicking a point
* `color` `{Function|Object|String}` optional, default is 'random'
  * When `color` is a `Function` its arguments are gets the `index`:`number`, and the `point`:`array` that is being colored 
* `opacity` {Number} a value from 0 to 1, default is 0.8
* `className` {String} a class name applied to canvas, default is ''
* `size` {Number|Function} pixel size of point
* `sensitivity` {Number} exagurates the size of the clickable area to make it easier to click a point

## `L.glify` methods
* `longitudeFirst()`
* `latitudeFirst()`
* `instances`
* `points(options)`
* `shapes(options)`
* `flattenData(data)`
* `latLonToPixel(lat, lon)`


## Roadmap
Soon to come: limitless styles.

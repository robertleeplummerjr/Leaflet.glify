# polygon-lookup

[![Build Status](https://travis-ci.org/pelias/polygon-lookup.svg?branch=master)](https://travis-ci.org/pelias/polygon-lookup)

[![NPM](https://nodei.co/npm/polygon-lookup.png)](https://nodei.co/npm/polygon-lookup/)

A data-structure for performing fast, accurate point-in-polygon intersections against (potentially very large) sets of
polygons. `PolygonLookup` builds an [R-tree](http://en.wikipedia.org/wiki/R-tree), or bounding-box spatial index, for its
polygons and uses it to quickly narrow down the set of candidate polygons for any given point. If there are any
ambiguities, it'll perform point-in-polygon intersections to identify the one that *really* intersects. `PolygonLookup`
operates entirely in memory, and works best for polygons with little overlap.

## API

##### `PolygonLookup(featureCollection)`
  * `featureCollection` (**optional**): A GeoJSON collection to optionally immediately load with `.loadFeatureCollection()`.

##### `PolygonLookup.search(x, y)`
Narrows down the candidate polygons by bounding-box, and then performs point-in-polygon intersections to identify the
first container polygon (and only the first, even if multiple polygons really do intersect).

  * `x`: the x-coordinate to search for
  * `y`: the y-coordinate to search for
  * `return`: the intersecting polygon if one was found; otherwise, `undefined`.

##### `PolygonLookup.loadFeatureCollection(featureCollection)`
Stores a feature collection in this `PolygonLookup`, and builds a spatial index for it. The polygons and rtree can be
accessed via the `.polygons` and `.rtree` properties.

  * `featureCollection` (**optional**): A GeoJSON collection containing some Polygons/MultiPolygons. Note that
    MultiPolygons will get expanded into multiple polygons.

## example usage

```javascript
var PolygonLookup = require( 'polygon-lookup' );
var featureCollection = {
	type: 'FeatureCollection',
	features: [{
		type: 'Feature',
		properties: { id: 'bar' },
		geometry: {
			type: 'Polygon',
			coordinates: [ [ [ 0, 1 ], [ 2, 1 ], [ 3, 4 ], [ 1, 5 ] ] ]
		}
	}]
};
var lookup = new PolygonLookup( featureCollection );
var poly = lookup.search( 1, 2 );
console.log( poly.properties.id ); // bar
```

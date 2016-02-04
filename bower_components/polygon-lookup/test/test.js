/**
 * @file The package's unit tests.
 */

'use strict';

var tape = require( 'tape' );
var PolygonLookup = require( '../index' );
var rbush = require( 'rbush' );
var polygonUtils = require( '../lib/polygon_utils' );
var util = require( 'util' );

tape( 'Exports a function', function ( test ){
  test.equal( typeof PolygonLookup, 'function', 'Is a function.' );
  test.end();
});

tape( 'PolygonLookup() constructor accepts optional argument', function ( test ){
  test.plan( 3 );
  test.equal( PolygonLookup.length, 1, 'Accepts 1 argument.' );

  /**
   * Hackishly mock away `loadFeatureCollection()` to test that it gets called
   * by PolygonLookup().
   */
  var originalFunc = PolygonLookup.prototype.loadFeatureCollection;
  PolygonLookup.prototype.loadFeatureCollection = function mock(arg){
    test.deepEqual( arg, featureCollection, 'Argument matches expected.' );
    test.pass( 'loadFeatureCollection() called.' );
  };

  var featureCollection = {};
  var lookup = new PolygonLookup(featureCollection); // jshint ignore:line
  PolygonLookup.prototype.loadFeatureCollection = originalFunc;
});

tape( 'PolygonLookup.loadFeatureCollection() sets properties.', function ( test ){
  var collection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [ 0, 1 ],
            [ 2, 1 ],
          ]]
        }
      }
    ]
  };

  var lookup = new PolygonLookup();
  lookup.loadFeatureCollection( collection );
  test.ok( lookup.rtree instanceof rbush, 'Sets `rtree`.' );
  test.deepEqual( lookup.polygons, collection.features, 'Sets `polygons`.' );
  test.end();
});

tape( 'PolygonLookup.search() searches correctly.', function ( test ){
  var collection = {
    type: 'FeatureCollection',
    features: [
      geojsonPoly(
        [ [ [ 2, 2 ], [ 6, 4 ], [ 4, 7 ] ] ],
        { id: 1 }
      ),
      geojsonPoly(
        [ [ [ 3, 0 ], [ 7, 2 ], [ 4, 4 ] ] ],
        { id: 2 }
      ),
      geojsonPoly(
        [ [ [ 8, 5 ], [ 10, 6 ], [ 9, 7 ] ] ],
        { id: 3 }
      )
    ]
  };

  var lookup = new PolygonLookup( collection );
  var testCases = [
    { point: [ 1, 5 ] },
    { point: [ 6, 3 ] },
    { point: [ 4, 6 ], id: 1 },
    { point: [ 3.5, 3.5 ], id: 1 },
    { point: [ 5.5, 3.5 ] },
    { point: [ 4, 1 ], id: 2 },
    { point: [ 9, 6 ], id: 3 },
    { point: [ 9.7, 6.7 ] },
    { point: [ 10, 11 ] },
  ];

  testCases.forEach( function ( testCase ){
    var pt = testCase.point;
    var poly = lookup.search( pt[ 0 ], pt[ 1 ] );
    if( 'id' in testCase ){
      test.equal(
        poly.properties.id, testCase.id,
        'Intersected correct polygon for: ' + pt
      );
    }
    else {
      test.equal( poly, undefined, 'No intersected polygon for: ' + pt );
    }
  });
  test.end();
});

tape( 'PolygonLookup.search() handles polygons with multiple rings.', function ( test ){
  var poly1Hole = [ [ 3, 3 ], [ 6, 3 ], [ 6, 7 ], [ 4, 6 ] ];
  var collection = {
    type: 'FeatureCollection',
    features: [
      geojsonPoly(
        [
          [ [ 1, 12 ], [ 0, 0 ], [ 15, -1 ], [ 15, 13 ] ],
          [ [ 2, 11 ], [ 1, 2 ], [ 6, 0 ], [ 14, 0 ], [ 14, 11 ] ]
        ],
        { id: 0 }
      ),
      geojsonPoly(
        [
          [ [ 1, 2 ], [ 7, 1 ], [ 8, 9 ], [ 3, 7 ] ],
          poly1Hole
        ],
        { id: 1 }
      ),
      geojsonPoly(
        [ poly1Hole ],
        { id: 2 }
      )
    ]
  };
  var lookup = new PolygonLookup( collection );

  var testCases = [
    { point: [ 10, 12 ], id: 0 },
    { point: [ 5, 4 ], id: 2 },
    { point: [ 2, 3 ], id: 1 },
    { point: [ 13, 4 ] }
  ];

  testCases.forEach( function ( testCase ){
    var pt = testCase.point;
    var poly = lookup.search( pt[ 0 ], pt[ 1 ] );
    if( !( 'id' in testCase ) ){
      test.equal( poly, undefined, 'No intersected polygon for: ' + pt );
    }
    else {
      test.equal(
        poly.properties.id, testCase.id,
        util.format( 'Id %d matches expected %d.', poly.properties.id, testCase.id )
      );
    }
  });
  test.end();
});

tape( 'getBoundingBox() finds correct bounding boxes.', function ( test ){
  var testCases = [
    {
      poly: [ [ 2, 2 ], [ 6, 4 ], [ 4, 7 ] ],
      bbox: [ 2, 2, 6, 7 ]
    },
    {
      poly: [ [ 0, 0 ], [ 2, 1 ], [ 3, -1 ], [ 5, 1 ], [ 6, 4 ], [ 3, 5 ] ],
      bbox: [ 0, -1, 6, 5 ]
    },
    {
      poly: [ [ 2, 1 ], [ 3, 0 ], [ 4, 3 ], [ 0, 5 ], [ 1, -3 ] ],
      bbox: [ 0, -3, 4, 5 ]
    }
  ];

  testCases.forEach( function ( testCase ){
    var bbox = polygonUtils.getBoundingBox( testCase.poly );
    test.deepEqual( bbox, testCase.bbox, 'Bounding box matches expected.' );
  });

  test.end();
});

/**
 * Convenience function for creating a GeoJSON polygon.
 */
function geojsonPoly( coords, props ){
  return {
    type: 'Feature',
    properties: props || {},
    geometry: {
      type: 'Polygon',
      coordinates: coords
    }
  };
}

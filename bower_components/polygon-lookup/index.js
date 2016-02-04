/**
 * Exports a `PolygonLookup` constructor, which constructs a data-structure for
 * quickly finding the polygon that a point intersects in a (potentially very
 * large) set.
 */

'use strict';

var rbush = require( 'rbush' );
var pointInPolygon = require( 'point-in-polygon' );
var polygonUtils = require( './lib/polygon_utils' );

/**
 * @property {rbush} rtree A spatial index for `this.polygons`.
 * @property {object} polgons A GeoJSON feature collection.
 *
 * @param {object} [featureCollection] An optional GeoJSON feature collection
 *    to pass to `loadFeatureCollection()`.
 */
function PolygonLookup( featureCollection ){
  if( featureCollection !== undefined ){
    this.loadFeatureCollection( featureCollection );
  }
}

/**
 * Find the polygon that a point intersects. Execute a bounding-box search to
 * narrow down the candidate polygons to a small subset, and then perform
 * additional point-in-polygon intersections to resolve any ambiguities.
 *
 * @param {number} x The x-coordinate of the point.
 * @param {number} y The y-coordinate of the point.
 * @return {undefined|object} If one or more bounding box intersections are
 *    found, return the first polygon that intersects (`x`, `y`); otherwise,
 *    `undefined`.
 */
PolygonLookup.prototype.search = function search( x, y ){
  var bboxes = this.rtree.search( [ x, y, x, y ] );
  var pt = [ x, y ];
  for( var ind = 0; ind < bboxes.length; ind++ ){
    var polyObj = this.polygons[ bboxes[ ind ].polyId ];
    var polyCoords = polyObj.geometry.coordinates[ 0 ];
    if( pointInPolygon( pt, polyCoords ) ){
      var inHole = false;
      for( var subPolyInd = 1; subPolyInd < polyObj.geometry.coordinates.length; subPolyInd++ ){
        if( pointInPolygon( pt, polyObj.geometry.coordinates[ subPolyInd ] ) ){
          inHole = true;
          break;
        }
      }

      if( !inHole ){
        return polyObj;
      }
    }
  }
};

/**
 * Build a spatial index for a set of polygons, and store both the polygons and
 * the index in this `PolygonLookup`.
 *
 * @param {object} collection A GeoJSON-formatted FeatureCollection.
 */
PolygonLookup.prototype.loadFeatureCollection = function loadFeatureCollection( collection ){
  var bboxes = [];
  var polygons = [];
  var polyId = 0;

  function indexPolygon( poly ){
    polygons.push(poly);
    var bbox = polygonUtils.getBoundingBox( poly.geometry.coordinates[ 0 ] );
    bbox.polyId = polyId++;
    bboxes.push(bbox);
  }

  function indexFeature( poly ){
    if( poly.geometry.coordinates[ 0 ] !== undefined &&
        poly.geometry.coordinates[ 0 ].length > 0){
      switch( poly.geometry.type ){
        case 'Polygon':
          indexPolygon( poly );
          break;

        case 'MultiPolygon':
          var childPolys = poly.geometry.coordinates;
          for( var ind = 0; ind < childPolys.length; ind++ ){
            var childPoly = {
              type: 'Feature',
              properties: poly.properties,
              geometry: {
                type: 'Polygon',
                coordinates: childPolys[ ind ]
              }
            };
            indexPolygon( childPoly );
          }
          break;
      }
    }
  }

  collection.features.forEach( indexFeature );
  this.rtree = new rbush().load( bboxes );
  this.polygons = polygons;
};

module.exports = PolygonLookup;

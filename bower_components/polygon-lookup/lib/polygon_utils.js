/**
 * Miscellaneous polygon utilities.
 */

'use strict';

/**
 * @param {2d array of number} poly An array of 2D point arrays.
 * @return {array of numbe} The bounding box of the polygon, in
 *    `minX, minY, maxX, maxY` format.
 */
function getBoundingBox( poly ){
  var firstPt = poly[ 0 ];
  var bbox = [
    firstPt[ 0 ], firstPt[ 1 ],
    firstPt[ 0 ], firstPt[ 1 ]
  ];

  for( var ind = 1; ind < poly.length; ind++ ){
    var pt = poly[ ind ];

    var x = pt[ 0 ];
    if( x < bbox[ 0 ] ){
      bbox[ 0 ] = x;
    }
    else if( x > bbox[ 2 ] ){
      bbox[ 2 ] = x;
    }

    var y = pt[ 1 ];
    if( y < bbox[ 1 ] ){
      bbox[ 1 ] = y;
    }
    else if( y > bbox[ 3 ] ){
      bbox[ 3 ] = y;
    }
  }

  return bbox;
}

module.exports = {
  getBoundingBox: getBoundingBox
};

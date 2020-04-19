/* It was tried to allow for better tree shaking to import leaflet's src files one by one,
 * but this caused node not to work, because leaflet uses import/export.  So it was easier to
 * simply import it directly.  It causes a 70kb growth in the bundle, but the current time to
 * manage vs size ratio didn't justify continuing.
 */
import * as L from 'leaflet';

let exports = L;

if (window && window.L) {
  exports = window.L;
}

module.exports = exports;
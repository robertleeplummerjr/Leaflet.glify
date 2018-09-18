module.exports = function mapMatrix() {
  var _mapMatrix = new Float32Array(16);

  _mapMatrix._set = _mapMatrix.set;
  _mapMatrix.set = function() {
    _mapMatrix._set.apply(this, arguments);
    return this;
  };
  /**
   *
   * @param tx
   * @param ty
   * @returns {mapMatrix}
   */
  _mapMatrix.translateMatrix = function (tx, ty) {
    // translation is in last column of matrix
    this[12] += this[0] * tx + this[4] * ty;
    this[13] += this[1] * tx + this[5] * ty;
    this[14] += this[2] * tx + this[6] * ty;
    this[15] += this[3] * tx + this[7] * ty;

    return this;
  };

  /**
   *
   * @param scale
   * @returns {mapMatrix}
   */
  _mapMatrix.scaleMatrix = function (scale) {
    // scaling x and y, which is just scaling first two columns of matrix
    this[0] *= scale;
    this[1] *= scale;
    this[2] *= scale;
    this[3] *= scale;

    this[4] *= scale;
    this[5] *= scale;
    this[6] *= scale;
    this[7] *= scale;

    return this;
  };

  return _mapMatrix;
}

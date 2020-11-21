export class MapMatrix {
  array: Float32Array;
  constructor() {
    this.array = new Float32Array(16);
  }

  setSize(width: number, height: number, offset?: number): this {
    this.array.set([
      2 / width, 0, 0, 0,
      0, -2 / height, 0, 0,
      0, 0, 0, 0,
      -1, 1, 0, 1
    ]);
    return this;
  }

  translateMatrix(tx: number, ty: number): this {
    const { array } = this;
    // translation is in last column of matrix
    array[12] += array[0] * tx + array[4] * ty;
    array[13] += array[1] * tx + array[5] * ty;
    array[14] += array[2] * tx + array[6] * ty;
    array[15] += array[3] * tx + array[7] * ty;

    return this;
  }
  scaleMatrix(scale: number) {
    const { array } = this;
    // scaling x and y, which is just scaling first two columns of matrix
    array[0] *= scale;
    array[1] *= scale;
    array[2] *= scale;
    array[3] *= scale;

    array[4] *= scale;
    array[5] *= scale;
    array[6] *= scale;
    array[7] *= scale;

    return this;
  }
}

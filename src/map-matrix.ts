export class MapMatrix {
  array: Float32Array;
  constructor() {
    this.array = new Float32Array(16);
  }

  setSize(width: number, height: number): this {
    this.array.set([
      2 / width,
      0,
      0,
      0,
      0,
      -2 / height,
      0,
      0,
      0,
      0,
      0,
      0,
      -1,
      1,
      0,
      1,
    ]);
    return this;
  }

  translateTo(x: number, y: number): this {
    const { array } = this;
    // translation is in last column of matrix
    array[12] += array[0] * x + array[4] * y;
    array[13] += array[1] * x + array[5] * y;
    array[14] += array[2] * x + array[6] * y;
    array[15] += array[3] * x + array[7] * y;

    return this;
  }

  scaleTo(scale: number): this {
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

uniform mat4 uMatrix;
attribute vec4 aVertex;
attribute float aPointSize;
attribute vec4 aColor;
varying vec4 vColor;

void main() {
    // Set the size of the point
    glPointSize =  aPointSize;

    // multiply each vertex by a matrix.
    glPosition = uMatrix * aVertex;

    // pass the color to the fragment shader
    vColor = aColor;
}
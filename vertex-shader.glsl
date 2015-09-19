uniform mat4 u_matrix;
attribute vec4 a_vertex;
attribute float a_pointSize;
attribute vec4 a_color;
varying vec4 v_color;

void main() {
    // Set the size of the point
    gl_PointSize =  a_pointSize;

    // multiply each vertex by a matrix.
    gl_Position = u_matrix * a_vertex;

    // pass the color to the fragment shader
    v_color = a_color;
}
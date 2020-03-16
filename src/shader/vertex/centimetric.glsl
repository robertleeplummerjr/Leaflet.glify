precision highp float;

uniform mat4 matrix;
uniform vec3 eyepos;
uniform vec3 eyeposLow;

attribute vec3 vertex;
attribute vec3 vertexLow;
attribute float pointSize;

attribute vec4 color;
varying vec4 _color;
        
void main() {
    // inspired a lot by https://prideout.net/emulating-double-precision
    vec3 t1 = vertexLow - eyeposLow;
    vec3 e = t1 - vertexLow;
    vec3 t2 = ((-eyeposLow - e) + (vertexLow - (t1 - e))) + vertex - eyepos;
    vec3 high_delta = t1 + t2;
    vec3 low_delta = t2 - (high_delta - t1);
    vec3 p = high_delta + low_delta;
    gl_Position = matrix * vec4(p, 1.0);

    gl_PointSize =  pointSize;
    // pass the color to the fragment shader
    _color = color;
}
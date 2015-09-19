precision mediump float;
varying vec4 v_color;

void main() {

    float border = 0.05;
    float radius = 0.5;
    vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 color1 = vec4(v_color[0], v_color[1], v_color[2], 0.2);

    vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5);
    float dist = radius - sqrt(m.x * m.x + m.y * m.y);

    float t = 0.0;
    if (dist > border) {
        t = 1.0;
    } else if (dist > 0.0) {
        t = dist / border;
    }

    // float centerDist = length(gl_PointCoord - 0.5);
    // works for overlapping circles if blending is enabled

    gl_FragColor = mix(color0, color1, t);

    /*
    // -- another way for circle
    float centerDist = length(gl_PointCoord - 0.5);
    float radius = 0.5;
    // works for overlapping circles if blending is enabled
    gl_FragColor = vec4(v_color[0], v_color[1], v_color[2], 0.2 * step(centerDist, radius));
    */

    /*
    // simple circles
    float d = distance (gl_PointCoord, vec2(0.5,0.5));
    if (d < 0.5 ){
        gl_FragColor =vec4(v_color[0], v_color[1], v_color[2], 0.2);
    } else {
        discard;
    }
    */

    // -- squares
    //gl_FragColor = v_color;
    //gl_FragColor =vec4(v_color[0], v_color[1], v_color[2], 0.2); // v_color;
}
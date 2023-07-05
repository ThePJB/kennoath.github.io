#version 300 es
precision mediump float;

in vec2 uv;

out vec4 frag_colour;

#define PI 3.1415926535897932384626433832795
#define ROOT2INV 0.70710678118654752440084436210484903928

uniform float time;
uniform vec2 dimensions;
uniform sampler2D prev;
uniform vec2 resolution;
uniform vec2 mouse;

// you could make a kaleidoscope of a song, theres no reason you couldn't

// lol mix with GoL

// is there a shift and abs way of doing this?
// maybe do with 2x period only
float triangle_mod(float t, float period) {
    float phase1 = mod(t, period);
    float phase2 = mod(t, 2.0*period);
    if (phase2 > period) {
        return period - phase1;
    } else {
        return phase1;
    }
}

float triangle_mod2(float t, float period) {
    float phase2 = mod(t, 2.0*period);
    return abs(phase2 - period);
}

void main() {
    // n sides can change over time for trippiness
    // yo how was super hexagon made

    float n_sides = 16.0;

    vec2 uv_screen = (2.0 * (uv - vec2(0.5, 0.5))) / resolution.yy * resolution;
    float x = uv_screen.x;
    float y = uv_screen.y;
    float r = sqrt(x*x+y*y);
    float theta = atan(y,x);
    // theta will have a + time component for sure
    // float thetat = mod(theta, 2.0*PI/n_sides);
    float thetat = triangle_mod(theta + time, 2.0*PI/n_sides);
    // so this is like saw wave but how to get triangle wave?

    vec4 final_colour = vec4(0.0, 0.0, 0.0, 1.0);
    final_colour.x = 2.0*thetat;
    final_colour.y = r;

    frag_colour = final_colour;
}


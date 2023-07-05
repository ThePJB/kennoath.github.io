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

void main() {
    frag_colour = vec4(mouse.x, 0.0, mouse.y, 1.0);
}


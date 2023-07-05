#version 300 es

#define M_PI 3.1415926535897932384626433832795

precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform sampler2D prev;
uniform vec2 mouse;


in vec2 uv;
out vec4 frag_colour;

float hash1( float n ) { return fract(sin(n)*43758.5453); }
vec2  hash2( vec2  p ) { p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) ); return fract(sin(p)*43758.5453); }

//	Classic Perlin 3D Noise 
//	by Stefan Gustavson
//
vec4 permutesg(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permutesg(permutesg(ix) + iy);
  vec4 ixy0 = permutesg(ixy + iz0);
  vec4 ixy1 = permutesg(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+10.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 acolour(float t) {
  return vec4(hsv2rgb(vec3(t, 1, 1)), 1);
}

float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

float dCircles(vec2 p, float t) {
  float r_spread = 0.25;
  float r_circ = 0.03;

  float t1 = t;
  float t2 = t1 + (2.0*M_PI)/3.0;
  float t3 = t2 + (2.0*M_PI)/3.0;

  vec2 p1 = vec2(0.5 + cos(t1)*r_spread, 0.5 + sin(t1)*r_spread);
  vec2 p2 = vec2(0.5 + cos(t2)*r_spread, 0.5 + sin(t2)*r_spread);
  vec2 p3 = vec2(0.5 + cos(t3)*r_spread, 0.5 + sin(t3)*r_spread);

  float d1 = length(p-p1) - r_circ;
  float d2 = length(p-p2) - r_circ;
  float d3 = length(p-p3) - r_circ;
  
  return min(min(d1, d2), d3);
}

float dLine(vec2 p, float t) {
  float x1 = snoise(vec2(t, 0.0));
  float y1 = snoise(vec2(t, 4.0));
  float x2 = snoise(vec2(t, 8.0));
  float y2 = snoise(vec2(t, 12.0));

  return sdSegment(p, vec2(x1, y1), vec2(x2, y2));
}

// some number of circles pop in
// so we have a number of tries every interval, within each interval
// float dCircles(vec2 p, float t) {

// }

void main() {
  vec2 dx = vec2(1.0/resolution.x, 0);
  vec2 dy = vec2(0, 1.0/resolution.y);
  vec2 uv_screen = (2.0 * (uv - vec2(0.5, 0.5))) / resolution.yy * resolution;
  // float d = dLine(uv_screen, time * 0.2);

  float t = time * 2.0;
  // vec2 center = vec2(sin(t*1239137.0), cos(t*1239137.0));
  vec2 center = 0.5 * vec2(sin(t), cos(t));
  float d = length(center - uv_screen);

  if (d <= 0.2) {
    frag_colour = vec4(1.0, 1.0, 1.0, 1.0);
  } else {
      vec4 s_orig = texture(prev, uv);
      vec4 s_x = texture(prev, uv + dx);
      vec4 s_y = texture(prev, uv + dy);
      vec4 s_mx = texture(prev, uv - dx);
      vec4 s_my = texture(prev, uv - dy);

      // float oval = (s_orig.x + s_orig.y + s_orig.z) / 3.0;
      float xval = (s_x.x + s_x.y + s_x.z) / 3.0;
      float yval = (s_y.x + s_y.y + s_y.z) / 3.0;
      float mxval = (s_mx.x + s_mx.y + s_mx.z) / 3.0;
      float myval = (s_my.x + s_my.y + s_my.z) / 3.0;

      // float xdiff = oval - xval;
      float xdiff = xval - mxval;
      float ydiff = yval - myval;

      vec2 delta = vec2(xdiff, ydiff);
      float mag = length(delta);
      vec2 v = normalize(delta);
      // scale that shit for aspect
      v.x *= dx.x;
      v.y *= dy.y;
      // v.y *= dy.y;
      v.y += dy.y;

      vec4 s1 = texture(prev, uv - v) * 0.99;
      // v *= 2.0;
      vec4 s2 = texture(prev, uv - v);

      vec2 roll = hash2(uv_screen + time);
      float nz = (roll.x) * 0.01;
      s2 -= nz;

      s1.w = 1.0;
      s2.w = 1.0;

      vec4 prev = texture(prev, uv);
      // v -= dy;
      // frag_colour = mix(mix(s1, s2, 1.0), prev, 0.5);
      // frag_colour = s2;
      frag_colour = roll.y < 1.0 ? s2 : prev;
  }
}

// how to slow it down - probability to do this behaviour but otherwise do identity?
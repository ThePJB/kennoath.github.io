{
    let gl;
    let canvas;
    let timeUniformLocation;
    let resolutionUniformLocation;
    let mouseUniformLocation;
    let joyUniformLocation;

    let fbTexture = new Array(2);
    let fb = new Array(2);
    let texUnit = new Array(2);
    let texUnitUf = new Array(2);
    let textureUniformLocation;
    let curr_fb = 0;

    let lmb = false;

    let pgm;

    // maybe the association of framebuffers and textures needs to be reversed

    async function init() {
        canvas = document.getElementById("canvas-90-kaleidoscope");
        gl = canvas.getContext("webgl2", { antialias: false });
        if (!gl) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
            return;
        }

        texUnit = [gl.TEXTURE0, gl.TEXTURE1];
        texUnitUf = [0, 1];

        window.addEventListener("resize", resizeCanvas);
        canvas.addEventListener("mousemove", mouseMove);
        window.addEventListener("mousedown", lmbdown);

        window.addEventListener("mouseup", function (event) {
            if (event.button === 0) {
                lmb = false;
            }
        });
        window.addEventListener("mouseleave", function (event) {
            if (event.button === 0) {
                lmb = false;
            }
        });
        // js bug reading canvas width canvas height from wrong thing?
        console.log("making canvas with width" + canvas.width + "and height" + canvas.height);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1.0, 0.0, 0.0, 1.0);
        gl.disable(gl.BLEND);

        {
            const vertexShaderSource = `#version 300 es

in vec3 in_pos;
in vec2 in_uv;

out vec2 uv;

void main() {
    uv = in_uv;
    gl_Position = vec4(in_pos, 1.0);
}`;
            const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
            const fragmentShaderSource = `#version 300 es
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

`;
            const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
            pgm = linkProgram(vertexShader, fragmentShader);
        }
        gl.useProgram(pgm);

        const positionAttributeLocation = gl.getAttribLocation(pgm, "in_pos");
        const uvAttributeLocation = gl.getAttribLocation(pgm, "in_uv");
        timeUniformLocation = gl.getUniformLocation(pgm, 'time');
        textureUniformLocation = gl.getUniformLocation(pgm, 'prev');
        resolutionUniformLocation = gl.getUniformLocation(pgm, 'resolution');
        mouseUniformLocation = gl.getUniformLocation(pgm, 'mouse');
        joyUniformLocation = gl.getUniformLocation(pgm, 'joy');


        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // const positions = [    0.0, 0.5, 0.0,    -0.5, -0.5, 0.0,    0.5, -0.5, 0.0  ];
        // const positions = [    -1.0, -1.0, 0.0, 0.0, 0.0,    1.0, -1.0, 0.0, 1.0, 0.0,    1.0, 1.0, 0.0, 1.0, 1.0,   -1.0, 1.0, 0.0, 0.0, 1.0  ];
        const vertex_data = [
            // position     // texture coordinates
            -1.0, -1.0, 0.0, 0.0, 0.0,
            1.0, -1.0, 0.0, 1.0, 0.0,
            -1.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 4 * 5, 0);
        gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 4 * 5, 4 * 3);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.enableVertexAttribArray(uvAttributeLocation);

        resizeCanvas();

        // Render the scene
        render();
    }

    function render() {
        const time = performance.now() / 1000;

        gl.useProgram(pgm);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb[curr_fb]);
        gl.activeTexture(texUnit[1 - curr_fb]);
        gl.bindTexture(gl.TEXTURE_2D, fbTexture[1 - curr_fb]);
        gl.uniform1f(timeUniformLocation, time);
        gl.uniform1i(textureUniformLocation, texUnitUf[1 - curr_fb]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb[curr_fb]);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.blitFramebuffer(0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        const error = gl.getError();
        if (gl.getError() !== gl.NO_ERROR) {
            console.error(`OpenGL error: ${error}`);
        }

        curr_fb = 1 - curr_fb;

        requestAnimationFrame(render);
    }

    function lmbdown(event) {
        if (event.button === 0) {
            lmb = true;
            var rect = canvas.getBoundingClientRect();
            var offsetX = event.clientX - rect.left;
            var offsetY = event.clientY - rect.top;
          
            // Check if the event coordinates are within the canvas boundaries
            if (offsetX >= 0 && offsetX < canvas.width && offsetY >= 0 && offsetY < canvas.height) {
                var x = (event.clientX - rect.left) / rect.width;
                var y = (event.clientY - rect.top) / rect.height;
                gl.uniform2f(mouseUniformLocation, x, y);
            }
        }
    }

    function mouseMove(event) {
        if (!lmb) {
            return;
        }
        var rect = canvas.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        gl.uniform2f(mouseUniformLocation, x, y);
    }

    function resizeCanvas() {
        const canvas = document.getElementById("canvas-90-kaleidoscope");
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        gl.viewport(0, 0, canvas.width, canvas.height);
        fbTexture[0] = gl.createTexture();
        gl.activeTexture(texUnit[0]);
        gl.bindTexture(gl.TEXTURE_2D, fbTexture[0]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // set up framebuffer
        fb[0] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb[0]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture[0], 0);
        console.assert(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        fbTexture[1] = gl.createTexture();
        gl.activeTexture(texUnit[1]);
        gl.bindTexture(gl.TEXTURE_2D, fbTexture[1]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // set up framebuffer
        fb[1] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb[1]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture[1], 0);
        console.assert(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    init();
    // Helper function to compile a shader
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Helper function to link a program
    function linkProgram(vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Unable to link the program:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }
}

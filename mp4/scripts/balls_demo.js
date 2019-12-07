/**
 * @fileoverview This file contains the 3D terrain demo with blinn-phong shading.
 */

/** @global Toggle for whether to use the sphere visualization option */
var useSphere = false;

/** @global Model spinning angular velocity */
var model_angular_velocity = glMatrix.vec3.create();
/** @global Current model rotation quaternion */
var model_rotation = glMatrix.quat.create();

/** @global Collection of balls */
var balls = [];

class Ball {
    constructor(x,y,z, xv, yv, zv){
        this.pos = glMatrix.vec3.fromValues(x,y,z);
        this.vel = glMatrix.vec3.fromValues(xv,yv,zv);
        this.color = glMatrix.vec3.fromValues(Math.random(), Math.random(), Math.random());
        this.radius = Math.random() + 0.5;
    }
}

// This is not really a function, it's just the
// mechanism for organizing the terrain demo as a
// separate pseudo-"module".
// The sketchy VanillaJS equivalent of module.exports
balls_demo = function() {

    /**
     * Runs the environment mapping demo
     * @returns void
     */
    var runDemo = async function(){
        
        // Set up WebGL context
        var canvas = document.getElementById("myGLCanvas");
        var gl = WebGLUtils.setupWebGL(canvas);

        const faceInfos = [
            {
              target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
              url: 'envmap/pos-x.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
              url: 'envmap/neg-x.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
              url: 'envmap/pos-y.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
              url: 'envmap/neg-y.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
              url: 'envmap/pos-z.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
              url: 'envmap/neg-z.jpg',
            },
        ];

        // Box shader program
        var boxShaderProgram; 
        var boxShaderUniforms = [
            "u_modelview",
            "u_projection",
            "u_normalMatrix",
            "u_modelMatrix3",
            "u_shininess",
            "u_baseColor",
            "u_cubemap",
            "u_worldCameraPosition",
            "u_time",
            "u_use_blinnphong",
            "u_use_reflective",
            "u_use_refractive"
        ]
        var boxShaderAttributes = [
            "aVertexPosition",
            "aVertexNormal"
        ];
        boxShaderProgram = setupShaders(gl, "box-shader-vs", "box-shader-fs", boxShaderUniforms, boxShaderAttributes);
        if(boxShaderProgram == null){
            alert("shader program is null");
        }

        // Sky shader program
        var skyShaderProgram; 
        var skyShaderUniforms = [
            "u_vpInverse",
            "u_cubemap"
        ]
        var skyShaderAttributes = [
            "aVertexPosition",
            "aVertexNormal"
        ];
        skyShaderProgram = setupShaders(gl, "sky-shader-vs", "sky-shader-fs", skyShaderUniforms, skyShaderAttributes);
        if(skyShaderProgram == null){
            alert("shader program is null");
        }
        
        // WebGL buffer holding vertex positions
        var vertexPositionBuffer;
        // WebGL buffer holding indices
        var vertexIndexBuffer;
        // WebGL buffer holding normals
        var vertexNormalBuffer;
        

        // Setup buffers and extract references
        var bufferResult = await setupBuffers(gl.STATIC_DRAW, gl);
        vertexPositionBuffer = bufferResult.positions;
        vertexIndexBuffer = bufferResult.indices;
        vertexNormalBuffer = bufferResult.normals;
        var rotateX = 0;
        var rotateY = 0;
        
        setupCubemap(faceInfos, gl);
        
        gl.useProgram(boxShaderProgram);
        gl.uniform1i(boxShaderProgram.uniforms["u_cubemap"], 0);
        gl.useProgram(skyShaderProgram);
        gl.uniform1i(skyShaderProgram.uniforms["u_cubemap"], 0);

        spawn_ball();

        var last_time = Date.now();

        function render(now) {

            compute_keyboard_input();
            //spawn_ball();

            compute_physics((now - last_time) * 0.001);
            last_time = now;

            // Compute angular velocity delta (framerate based... ew)
            model_angular_velocity[0] += pitch_input * 0.05;
            model_angular_velocity[1] += yaw_input * 0.05;
            model_angular_velocity[2] += roll_input * 0.05;

            // Dampen angular velocity (also framerate based, yuck)
            glMatrix.vec3.scale(model_angular_velocity, model_angular_velocity, 0.99);

            // Draw scene, pass in buffers
            //draw(rotateX, dollyY * 0.001, bufferResult, boxShaderProgram, gl);
            
            draw_sky(rotateX * 0.01, rotateY * 0.01, bufferResult, skyShaderProgram, gl);
            draw_model(rotateX * 0.01, rotateY * 0.01, bufferResult, boxShaderProgram, gl);

            gl.uniform1f(boxShaderProgram.uniforms["u_time"], now);

            // Set the uniform value for the shininess based on slider input.
            gl.uniform1f(boxShaderProgram.uniforms["u_shininess"], 10 - document.getElementById("shininess").value * 0.01);

            gl.uniform1i(boxShaderProgram.uniforms["u_use_blinnphong"], 0);
            gl.uniform1i(boxShaderProgram.uniforms["u_use_reflective"], 0);
            gl.uniform1i(boxShaderProgram.uniforms["u_use_refractive"], 0);

            switch(document.querySelector('input[name="shading"]:checked').value){
                case "blinn-phong":
                    gl.uniform1i(boxShaderProgram.uniforms["u_use_blinnphong"], 1);
                    break;
                case "reflect":
                    gl.uniform1i(boxShaderProgram.uniforms["u_use_reflective"], 1);
                    break;
                case "refract":
                    gl.uniform1i(boxShaderProgram.uniforms["u_use_refractive"], 1);
                    break;
            }

            gl.uniform4fv(boxShaderProgram.uniforms["u_baseColor"], [0.5, 0.5, 0.6, 1.0]);

            
            rotateX += mouseVelX;
            mouseVelX *= 0.95;
            
            var factor = ((Math.PI/2 - Math.abs(rotateY * 0.01)) / (Math.PI/2))
            rotateY += 0.4 * mouseVelY * (1-Math.pow(1-factor, 6));
            mouseVelY *= 0.95 * (1-Math.pow(1-factor, 6));
            rotateY = clamp(rotateY * 0.01, -Math.PI/2.2, Math.PI/2.2) * 100;
            
            

            animationID = requestAnimationFrame(render);
        }
        animationID = requestAnimationFrame(render);
    };

    var spawn_ball = function(){
        balls.push(new Ball(Math.random() * 12.0 - 6.0, Math.random() * 12.0, Math.random() * 12.0 - 6.0,
                            Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0));
        console.log("spawned, new length = " + balls);
    }

    var compute_physics = function(time_delta){

        

        balls.forEach((ball) => {

            let radius = 1.0;
            
            // Perform drag integration
            glMatrix.vec3.multiply(ball.vel, ball.vel, glMatrix.vec3.fromValues(Math.pow(0.15,time_delta),Math.pow(0.15,time_delta),Math.pow(0.15,time_delta)));

            var flag;
            if(ball.pos[1] - radius < -4.0 || ball.pos[1] + radius > 15.0) {
                glMatrix.vec3.multiply(ball.vel, ball.vel, glMatrix.vec3.fromValues(1, -0.95, 1));
                //ball.pos[1] = 
                if(ball.pos[1] - radius < -4.0) flag = true;
            }
            if(ball.pos[0] - radius < -9.0 || ball.pos[0] + radius > 9.0) {
                glMatrix.vec3.multiply(ball.vel, ball.vel, glMatrix.vec3.fromValues(-0.95, 1, 1));
                //flag = true;
            }
            if(ball.pos[2] - radius < -9.0 || ball.pos[2] + radius > 9.0) {
                glMatrix.vec3.multiply(ball.vel, ball.vel, glMatrix.vec3.fromValues(1, 1, -0.95));
                //flag = true;
            }
            
            if(!flag){
                glMatrix.vec3.add(ball.vel, ball.vel, glMatrix.vec3.fromValues(0, -1.81 * time_delta, 0));
            }
            //ball.vel = glMatrix.vec3.fromValues(0, -0.01, 0);
            glMatrix.vec3.add(ball.pos, ball.pos, ball.vel);
        });
    }

    var collide = function(ball){
        

        return flag;
    }


    /**
     * Calculates transformation matrices and applies them to the given
     * shader program.
     * @param {number} x X rotation (used to spin terrain)
     * @param {number} y Y factor (used to dolly-zoom the camera)
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns set of matrices
     */
    var calculate_matrices = function(x, y, ballpos, shaderProgram, gl){

        // Construct perspective projection matrix.
        var projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projectionMatrix, Math.PI/3, gl.canvas.width/ gl.canvas.height, 0.1,2000);

        // Initialize view matrix.
        var viewMatrix = glMatrix.mat4.create();

        
        var eyePos = glMatrix.vec3.fromValues(0,0,32);

        glMatrix.vec3.rotateX(eyePos, eyePos, [0,0,0], y);
        glMatrix.vec3.rotateY(eyePos, eyePos, [0,0,0], -x);

        glMatrix.mat4.lookAt(viewMatrix, eyePos, [0,0,0], [0,1,0]);

        //glMatrix.mat4.rotateY(viewMatrix, viewMatrix, x);


        gl.uniform3fv(shaderProgram.uniforms["u_worldCameraPosition"], eyePos);

        
        
        // Spin the model
        // Create three quaternions, for each of the input axes.
        var model_pitch = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(model_pitch, [1, 0, 0], model_angular_velocity[0] * 0.01);
        var model_roll = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(model_roll, [0, 0, 1], model_angular_velocity[2] * 0.01);
        var model_yaw = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(model_yaw, [0, 1, 0], model_angular_velocity[1] * 0.005);

        // Multiply the three input quaternions together, against the current user rotation quaternion.
        glMatrix.quat.multiply(model_rotation, model_pitch, model_rotation);
        glMatrix.quat.multiply(model_rotation, model_roll, model_rotation);
        glMatrix.quat.multiply(model_rotation, model_yaw, model_rotation);

        var rotate_quat = glMatrix.mat4.create();
        glMatrix.mat4.fromQuat(rotate_quat, model_rotation);

        // Init model matrix
        var modelMatrix4 = glMatrix.mat4.create();
        glMatrix.mat4.multiply(modelMatrix4, modelMatrix4, rotate_quat);
        glMatrix.mat4.translate(modelMatrix4, modelMatrix4, ballpos);
        
        var modelMatrix3 = glMatrix.mat3.create();
        glMatrix.mat3.fromMat4(modelMatrix3, modelMatrix4);

        // Init model-view matrix
        var modelViewMatrix = glMatrix.mat4.create();

        // Construct model-view from model and view (duh)
        glMatrix.mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix4);

        // Construct normal matrix, which is simply the inverse transpose of the modelview.
        var normalMatrix = glMatrix.mat3.create();
        glMatrix.mat3.fromMat4(normalMatrix, modelViewMatrix);
        glMatrix.mat3.transpose(normalMatrix, normalMatrix);
        glMatrix.mat3.invert(normalMatrix, normalMatrix);

        var newViewMatrix = glMatrix.mat4.clone(viewMatrix);
        newViewMatrix[12] = 0;
        newViewMatrix[13] = 0;
        newViewMatrix[14] = 0;

        var invViewProjMatrix = glMatrix.mat4.create();

        glMatrix.mat4.multiply(invViewProjMatrix, projectionMatrix, newViewMatrix);
        glMatrix.mat4.invert(invViewProjMatrix, invViewProjMatrix);

        return {
            modelview: modelViewMatrix,
            invViewProj: invViewProjMatrix,
            projection: projectionMatrix,
            model: modelMatrix3,
            normal: normalMatrix
        }
    };
    
    
    /**
     * Loads and compiles the shaders specified by vertexShader and fragmentShader,
     * and then links the shader program, and grabs the uniform locations
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @param {string} vertexShader Name of the vertex shader
     * @param {string} fragmentShader Name of the fragment shader
     * @param {Array} uniforms Array of uniforms to map
     * @param {Array} attributes Array of attributes to map
     * @returns {WebGLProgram} The newly created shader program.
     */
    var setupShaders = function(gl, vertexShaderName, fragmentShaderName, uniforms, attributes) {
        vertexShader = loadShader(vertexShaderName, gl);
        fragmentShader = loadShader(fragmentShaderName, gl);

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
    
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
        }
    
        gl.useProgram(shaderProgram);

        shaderProgram.uniforms = {};

        for(var uniform of uniforms){
            shaderProgram.uniforms[uniform] = gl.getUniformLocation(shaderProgram, uniform);
        }

        shaderProgram.attributes = {};

        for(var attr of attributes){
            shaderProgram.attributes[attr] = gl.getAttribLocation(shaderProgram, attr);
        }

        return shaderProgram;
    };

        
    /**
     *  Sets up buffers with sphere mesh data
     * @param {number} drawMode Drawing mode (STATIC_DRAW, DYNAMIC_DRAW)
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns {object} Object with the position and index WebGLBuffers
     */
    var setupBuffers = async function(drawMode, gl){

        // Construct the actual WebGL buffers.

        var vertexPositionBuffer = gl.createBuffer();
        var vertexIndexBuffer = gl.createBuffer();
        var vertexNormalBuffer = gl.createBuffer();

        var vertexArray = [];
        var indexArray = [];
        var normalArray = [];

        // Create the sphere mesh
        sphereFromSubdivision(4, vertexArray, indexArray, normalArray);

        
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), drawMode);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), drawMode);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalArray), drawMode);
        
        return { positions: vertexPositionBuffer,
                 indices: vertexIndexBuffer,
                 normals: vertexNormalBuffer,
                 numIndices: indexArray.length };
    };

    /**
     *  Sets up cubemap texture.
     * @param {number} faces Collection of cubemap face data
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    var setupCubemap = function(faces, gl) {
        var texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        faces.forEach((info) => {

            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 512;
            const height = 512;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;

            gl.texImage2D(info.target, level, internalFormat, width, height, 0, format, type, null);

            const image = new Image();
            image.src = info.url;
            image.onload = () => {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.texImage2D(info.target, level, internalFormat, format, type, image);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            };

        });

        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
    

    /**
     * Draws the balls!
     * @param {number} x Rotation factor
     * @param {number} y Dolly zoom factor
     * @param {number} num_polys Number of triangles to draw
     * @param {WebGLBuffer} vertexPositionBuffer WebGLBuffer for vertex position data
     * @param {WebGLBuffer} vertexIndexBuffer WebGLBuffer for vertex index data
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    function draw_model(x, y, buffers, shaderProgram, gl){

        gl.useProgram(shaderProgram);

        // Compute the various matrices for this frame
        var matResult = calculate_matrices(x, y, glMatrix.vec3.fromValues(0,0,0), shaderProgram, gl);

        gl.uniformMatrix4fv(shaderProgram.uniforms["u_modelview"], false, matResult.modelview);
        gl.uniformMatrix4fv(shaderProgram.uniforms["u_projection"], false, matResult.projection);
        gl.uniformMatrix3fv(shaderProgram.uniforms["u_normalMatrix"], false, matResult.normal);
        gl.uniformMatrix3fv(shaderProgram.uniforms["u_modelMatrix3"], false, matResult.model);

        // Face culling is off by artistic choice, it looks kind of neat
        // to be able to see the underside of the terrain!
        //gl.enable(gl.CULL_FACE);



        // Configure all our buffers and attributes

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positions);
        gl.vertexAttribPointer(shaderProgram.attributes["aVertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.attributes["aVertexPosition"]);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
        gl.vertexAttribPointer(shaderProgram.attributes["aVertexNormal"], 
                                    3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.attributes["aVertexNormal"])


        balls.forEach((ball) => {
            matResult = calculate_matrices(x, y, ball.pos, shaderProgram, gl);

            gl.uniformMatrix4fv(shaderProgram.uniforms["u_modelview"], false, matResult.modelview);
            gl.uniformMatrix3fv(shaderProgram.uniforms["u_modelMatrix3"], false, matResult.model);
            gl.uniform4fv(shaderProgram.uniforms["u_baseColor"], [ball.color[0], ball.color[1], ball.color[2], 1.0]);
            console.log(ball.pos);
            gl.drawElements(gl.TRIANGLES, buffers.numIndices, gl.UNSIGNED_SHORT, 0);
        });
        // Go draw 'em!


    };

    /**
     * Draws the terrain demo.
     * @param {number} x Rotation factor
     * @param {number} y Dolly zoom factor
     * @param {number} num_polys Number of triangles to draw
     * @param {WebGLBuffer} vertexPositionBuffer WebGLBuffer for vertex position data
     * @param {WebGLBuffer} vertexIndexBuffer WebGLBuffer for vertex index data
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    function draw_sky(x, y, buffers, shaderProgram, gl){

        gl.useProgram(shaderProgram);

        var matResult = calculate_matrices(x, y, glMatrix.vec3.fromValues(0,0,0), shaderProgram, gl);

        gl.uniformMatrix4fv(shaderProgram.uniforms["u_vpInverse"], false, matResult.invViewProj);

        // Set all the GL flags we need
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1.);
        gl.enable(gl.DEPTH_TEST);
        gl.depthRange(0.0, 1.0);

        // Construct skybox plane
        var plane = new Float32Array(
        [
            -1, -1, 
            1, -1, 
            -1,  1, 
            -1,  1,
            1, -1,
            1,  1,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, plane, gl.STATIC_DRAW);
        gl.vertexAttribPointer(shaderProgram.attributes["aVertexPosition"],
                                2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.attributes["aVertexPosition"]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        


    };

    // The sketchy VanillaJS equivalent of module.exports
    return {
        runDemo: runDemo,
        spawn_ball: spawn_ball
    };

}();
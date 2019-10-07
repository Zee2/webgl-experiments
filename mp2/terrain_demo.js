/**
 * @fileoverview This file contains the 3D terrain demo with blinn-phong shading.
 */

/**
 * Helper function that performs basic clamping operations
 * @param {number} x Value to be clamped
 * @param {number} a Minimum clamp value
 * @param {number} b Maximum clamp value
 * @returns clamped number
 */
function clamp(x, a, b){
    return Math.max(a, Math.min(x, b));
}

/** @global Toggle for whether to use the sphere visualization option */
var useSphere = false;

/** @global Flag for changed sphere state */
var regenModel = false;

document.getElementById("toggle_sphere").onclick = () => {
    useSphere = !useSphere;
    regenModel = true;
}

// This is not really a function, it's just the
// mechanism for organizing the 3d logo demo as a
// separate module.
terrain_demo = function() {


    /**
     * Runs the terrain demo
     * @returns void
     */
    var runDemo = function(){

        
        var logoCanvas = document.getElementById("myGLCanvas");
        var logoGL = WebGLUtils.setupWebGL(logoCanvas);
        var terrainShaderProgram; // shader program
        var vertexPositionBuffer; // WebGL buffer holding vertex positions
        var vertexIndexBuffer; // WebGL buffer holding indices
        var vertexNormalBuffer; // WebGL buffer holding normals

        terrainShaderProgram = setupShaders(logoGL);
        if(terrainShaderProgram == null){
            alert("shader program is null");
        }

        // Setup buffers and extract references
        var bufferResult = setupBuffers(logoGL.STATIC_DRAW, useSphere, logoGL);
        vertexPositionBuffer = bufferResult.positions;
        vertexIndexBuffer = bufferResult.indices;
        vertexNormalBuffer = bufferResult.normals;
        var rotateX = 0;
        var rotateY = 1000;
        function render(now) {
            rotateX += mouseVelX;
            mouseVelX += -mouseVelX * 0.05;
            rotateY += mouseVelY;
            rotateY = clamp(rotateY, 500, 5000);
            mouseVelY += -mouseVelY * 0.05;
            draw(rotateX, rotateY * 0.001, bufferResult.numIndices, vertexPositionBuffer, vertexIndexBuffer, vertexNormalBuffer, terrainShaderProgram, logoGL);
            logoGL.uniform1f(terrainShaderProgram.shiny, document.getElementById("shininess").value);

            if(document.querySelector('input[name="use_blinnphong"]:checked').value == "yes"){
                console.log("Using blinn-phong");
                logoGL.uniform1f(terrainShaderProgram.useBlinnPhong, 1.0);
            } else {
                logoGL.uniform1f(terrainShaderProgram.useBlinnPhong, 0.0);
            }

            if(regenModel){
                regenModel = false;
                bufferResult = setupBuffers(logoGL.STATIC_DRAW, useSphere, logoGL);
                vertexPositionBuffer.length = 0;
                vertexIndexBuffer.length = 0;
                vertexNormalBuffer.length = 0;
                vertexPositionBuffer = bufferResult.positions;
                vertexIndexBuffer = bufferResult.indices;
                vertexNormalBuffer = bufferResult.normals;
            }

            logoGL.uniform1f(terrainShaderProgram.time, now);
            animationID = requestAnimationFrame(render);
        }
        animationID = requestAnimationFrame(render);
    };


    /**
     * Calculates transformation matrices and applies them to the given
     * shader program.
     * @param {number} x X rotation
     * @param {number} y Y angle
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    var calculate_matrices = function(x, y, shaderProgram, gl){
        var modelViewMatrix = glMatrix.mat4.create();

        var projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projectionMatrix, Math.PI/5, gl.canvas.width/ gl.canvas.height, 1,150);

        var eyePos = glMatrix.vec3.fromValues(y*10,y**1.5 * 5,y*10);
        
        //glMatrix.vec3.scale(eyePos, eyePos, 1.0 + x/100);
        
        //glMatrix.mat4.rotateY(perspective, perspective, x/100);
        //glMatrix.mat4.rotateX(perspective, perspective, y/100);
        
        //alert("eyepos: " + eyePos);

        
        //glMatrix.mat4.translate(matrix, matrix, [0, 0, 5]);
        

        //var local = glMatrix.mat4.create();
        //glMatrix.mat4.rotateX(local, local, x/200);

        
        glMatrix.mat4.lookAt(modelViewMatrix, eyePos, [0,1,0], [0,1,0]);
        glMatrix.mat4.rotateY(modelViewMatrix, modelViewMatrix, x/200);
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-(terrain_dim * 0.1 * 0.5), 0, -(terrain_dim * 0.1 * 0.5)]);
        //


        var normalMatrix = glMatrix.mat3.create();
        glMatrix.mat3.fromMat4(normalMatrix, modelViewMatrix);
        glMatrix.mat3.transpose(normalMatrix, normalMatrix);
        glMatrix.mat3.invert(normalMatrix, normalMatrix);
        
        //glMatrix.mat4.scale(local, local, [0.5, 0.5, 0.5]);
        gl.uniformMatrix4fv(shaderProgram.modelview, false, modelViewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projection, false, projectionMatrix);
        gl.uniformMatrix3fv(shaderProgram.normalMatrix, false, normalMatrix);
    };
    
    
    /**
     * Loads and compiles the shaders, as well as attaching them to a new shader program.
     * Much of this is borrowed from the HelloColor/HelloTriangle example.
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns {WebGLProgram} The newly created shader program.
     */
    var setupShaders = function(gl) {
        vertexShader = loadShader("shader-vs", gl);
        fragmentShader = loadShader("shader-fs", gl);

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
    
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
        }
    
        gl.useProgram(shaderProgram);
        shaderProgram.scaleFactor = gl.getUniformLocation(shaderProgram, "u_scaleFactor");
        shaderProgram.scaleFactor2 = gl.getUniformLocation(shaderProgram, "u_scaleFactor2");
        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        shaderProgram.modelview = gl.getUniformLocation(shaderProgram, "u_modelview");
        shaderProgram.projection = gl.getUniformLocation(shaderProgram, "u_projection");
        shaderProgram.normalMatrix = gl.getUniformLocation(shaderProgram, "u_normalMatrix");
        shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor"); 
        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        shaderProgram.time = gl.getUniformLocation(shaderProgram, "time");
        shaderProgram.shiny = gl.getUniformLocation(shaderProgram, "u_shininess");
        shaderProgram.useBlinnPhong = gl.getUniformLocation(shaderProgram, "u_useBlinnPhong");

        return shaderProgram;
    };

    /**
     * Draws the logo.
     * @param {number} time Current time variable used for animation
     * @param {number} num_polys Number of triangles to draw
     * @param {WebGLBuffer} vertexPositionBuffer WebGLBuffer for vertex position data
     * @param {WebGLBuffer} vertexIndexBuffer WebGLBuffer for vertex index data
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    function draw(x, y, num_polys, vertexPositionBuffer, vertexIndexBuffer, vertexNormalBuffer, shaderProgram, gl){
        calculate_matrices(x - 250, y, shaderProgram, gl);
        //gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        //gl.depthMask(gl.GL_TRUE);
        //gl.depthFunc(gl.LEQUAL);
        gl.depthRange(-1.0, 1.0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1);


        gl.uniform1f(shaderProgram.scaleFactor, 0.5);
        gl.uniform1f(shaderProgram.scaleFactor2, 0.5);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);

        
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                                    3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute)
        
                    
        gl.drawElements(gl.TRIANGLES, num_polys, gl.UNSIGNED_SHORT, 0);
    };
    


    return {
        runDemo: runDemo
    };

}();
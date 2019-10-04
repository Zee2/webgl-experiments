/**
 * @fileoverview This file contains the 3D logo demo.
 */

var mouseX = 0;
var mouseY = 150;

var mouseVelX = 0;
var mouseVelY = 0;

var mouseState = 0;
document.body.onmouseup = () => {
    mouseState--
}

document.body.ontouchend = () => {
    mouseState--
}

var lastMouse = [0,0]

document.body.onmousedown = (e) => {
    mouseState++
}
document.body.ontouchstart = (e) => {
    mouseState++
}
var canvas = document.getElementById("myGLCanvas");
document.onmousemove = function(e){
    updateMouse(e);
}
document.ontouchmove = function(e){
    updateTouch(e);
}

function updateTouch(e){
    if(mouseState){
        mouseX += e.touches[0].clientX - lastMouse[0];
        mouseY += e.touches[0].clientY - lastMouse[1];
        mouseVelX += (e.touches[0].clientX - lastMouse[0]) * 0.1;
        mouseVelY += (e.touches[0].clientY - lastMouse[1]) * -0.4;
    }
    lastMouse = [e.clientX, e.clientY];
}

function updateMouse(e){
    if(mouseState){
        mouseX += e.clientX - lastMouse[0];
        mouseY += e.clientY - lastMouse[1];
        mouseVelX += (e.clientX - lastMouse[0]) * 0.1;
        mouseVelY += (e.clientY - lastMouse[1]) * -0.4;
    }
    lastMouse = [e.clientX, e.clientY];
}

function clamp(x, a, b){
    return Math.max(a, Math.min(x, b));
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
        logoGL.clearColor(0.7, 0.7, 0.7, 1.0);

        var terrainShaderProgram; // shader program
        var vertexPositionBuffer; // WebGL buffer holding vertex positions
        var vertexIndexBuffer; // WebGL buffer holding indices
        var vertexNormalBuffer; // WebGL buffer holding normals

        terrainShaderProgram = setupShaders(logoGL);
        if(terrainShaderProgram == null){
            alert("shader program is null");
        }

        // Setup buffers and extract references
        var bufferResult = setupBuffers(logoGL.STATIC_DRAW, logoGL);
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

        glMatrix.mat4.lookAt(modelViewMatrix, eyePos, [0,1,0], [0,1,0]);
        //glMatrix.mat4.translate(matrix, matrix, [0, 0, 5]);
        

        var local = glMatrix.mat4.create();
        //glMatrix.mat4.rotateX(local, local, x/200);
        glMatrix.mat4.rotateY(local, local, x/200);
        glMatrix.mat4.translate(local, local, [-(terrain_dim * 0.1 * 0.5), 0, -(terrain_dim * 0.1 * 0.5)]);
        //
        
        
        //glMatrix.mat4.scale(local, local, [0.5, 0.5, 0.5]);
        gl.uniformMatrix4fv(shaderProgram.modelview, false, modelViewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projection, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderProgram.localTransform, false, local);
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
        shaderProgram.localTransform = gl.getUniformLocation(shaderProgram, "u_localTransform");
        shaderProgram.modelview = gl.getUniformLocation(shaderProgram, "u_modelview");
        shaderProgram.projection = gl.getUniformLocation(shaderProgram, "u_projection");
        shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor"); 
        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");

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
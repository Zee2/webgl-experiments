/**
 * @fileoverview This file contains the 2D logo demo.
 */

/** @global Array of vertex position data */
var dynamic_vertex_data = [];


// This is not really a function, it's just the
// mechanism for organizing the 2d logo demo as a
// separate module.
logo2d_demo = function() {


    /**
     * Runs the 2D logo demo.
     * No args, no return value
     */
    var runDemo = function(){


        var logoCanvas = document.getElementById("myGLCanvas");
        var logoGL = WebGLUtils.setupWebGL(logoCanvas);
        logoGL.clearColor(0.265, 0.265, 0.265, 1.0);

        var logoShaderProgram; // block-I shader program
        var vertexPositionBuffer; // WebGL buffer holding vertex positions

        var vertexIndexBuffer1; // WebGL buffer holding indices
        var vertexIndexBuffer2;

        dynamic_vertex_data = [];
        // Init our dynamic data with a copy-by-value to not corrupt our original copy
        dynamic_vertex_data = logo2d_vertex_data.slice(0);

        
        logoShaderProgram = setupShaders(logoGL);
        if(logoShaderProgram == null){
            alert("shader program is null");
        }

        
        // Setup buffers and extract references
        var bufferResult = setupBuffersMultiMaterial(dynamic_vertex_data, logo2d_group0_poly_data, logo2d_group1_poly_data, logoGL.DYNAMIC_DRAW,logoGL);
        vertexPositionBuffer = bufferResult.positions;
        vertexIndexBuffer1 = bufferResult.indices1;
        vertexIndexBuffer2 = bufferResult.indices2;

        function render(now) {
            mess_with_vertices(now);
            logoGL.bindBuffer(logoGL.ARRAY_BUFFER, vertexPositionBuffer);
            logoGL.bufferSubData(logoGL.ARRAY_BUFFER, 0, new Float32Array(dynamic_vertex_data));
            draw_logo(now/200, logo2d_group0_poly_data.length, logo2d_group1_poly_data.length, vertexPositionBuffer, vertexIndexBuffer1, vertexIndexBuffer2, logoShaderProgram, logoGL);
            animationID = requestAnimationFrame(render);
        }
        animationID = requestAnimationFrame(render);
    };

    /**
     *  Sets up buffers with provided data
     *  Much of this is borrowed from the HelloColor/HelloTriangle example.
     * @param {array} positionDataArray Array of vertices (positions)
     * @param {array} indexDataArray Array of indices for faces
     * @param {number} drawMode Drawing mode (STATIC_DRAW, DYNAMIC_DRAW)
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns {object} Object with the position and index WebGLBuffers
     */
    function setupBuffersMultiMaterial(positionDataArray, indexDataArray1, indexDataArray2, drawMode, gl){

        // Setup the position buffers
        var vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionDataArray), drawMode);

        // Setup the index buffers
        var vertexIndexBuffer1 = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer1);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexDataArray1), drawMode);

        var vertexIndexBuffer2 = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer2);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexDataArray2), drawMode);

        return {positions: vertexPositionBuffer, indices1: vertexIndexBuffer1, indices2: vertexIndexBuffer2};
    }


    /**
     * Calculates transformation matrices and applies them to the given
     * shader program.
     * @param {number} factor Animation variable
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    var calculateMatrices = function(factor, shaderProgram, gl){
        

        // Calculate some fun local transforms
        var localTransforms = glMatrix.mat4.create();
        glMatrix.mat4.rotateZ(localTransforms, localTransforms, factor);
        glMatrix.mat4.scale(localTransforms, localTransforms, glMatrix.vec3.fromValues(0.2,0.2 + (Math.sin(factor * 10.0) * 0.03),0.2));
        //glMatrix.mat4.rotateX(localTransforms, localTransforms, angle + Math.PI/2);

        // Update uniform matrices
        gl.uniformMatrix4fv(shaderProgram.localTransform, false, localTransforms);
    };

    /**
     * Does strange things to the vertex arrays.
     * @param {number} time Current time variable used for animation
     */
    function mess_with_vertices(time){
        for(var i = 0; i < dynamic_vertex_data.length; i++){
            if(i%3 == 0){
                dynamic_vertex_data[i] = logo2d_vertex_data[i] + 0.26*Math.sin(time/100 + logo2d_vertex_data[i+1]/0.7);
            }
        }
    }
    
    /**
     * Draws the logo.
     * @param {number} time Current time variable used for animation
     * @param {number} num_polys1 Number of triangles to draw for first material group
     * @param {number} num_polys2 Number of triangles to draw for second material group
     * @param {WebGLBuffer} vertexPositionBuffer WebGLBuffer for vertex position data
     * @param {WebGLBuffer} vertexIndexBuffer1 WebGLBuffer for vertex index data
     * @param {WebGLBuffer} vertexIndexBuffer2 WebGLBuffer for vertex index data
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    function draw_logo(time, num_polys1, num_polys2, vertexPositionBuffer, vertexIndexBuffer1, vertexIndexBuffer2, shaderProgram, gl){
        calculateMatrices(time/10, shaderProgram, gl);
        
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1);

        

        // Bind the vertex position buffer and enable the attrib array with the correct pointer settings
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        
        // Bind the index buffer for one color
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer1);
        // Set the color
        gl.uniform4fv(shaderProgram.logoColor, [1.0, 0.5, 0.0, 1.0]);
        // Draw
        gl.drawElements(gl.TRIANGLES, num_polys1, gl.UNSIGNED_SHORT, 0);
        
        // Bind the index buffer for the other color
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer2);
        // Set the other color
        gl.uniform4fv(shaderProgram.logoColor, [0.1, 0.5, 0.9, 1.0]);
        // Draw
        gl.drawElements(gl.TRIANGLES, num_polys2, gl.UNSIGNED_SHORT, 0);
        
    };
    
    /**
     * Loads and compiles the shaders, as well as attaching them to a new shader program.
     * Much of this is borrowed from the HelloColor/HelloTriangle example.
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns {WebGLProgram} The newly created shader program.
     */
    var setupShaders = function(gl) {
        
        vertexShader = loadShader("2d-basic-shader-vs", gl);
        fragmentShader = loadShader("2d-basic-shader-fs", gl);

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
    
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
        }
        
        gl.useProgram(shaderProgram);
        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        shaderProgram.localTransform = gl.getUniformLocation(shaderProgram, "u_localTransform");
        shaderProgram.logoColor = gl.getUniformLocation(shaderProgram, "u_logo_color");

        return shaderProgram;
    };


    return {
        runDemo: runDemo
    };

}();
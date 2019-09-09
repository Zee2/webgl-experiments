/**
 * @fileoverview This file contains the 2D logo demo.
 */

 var dynamic_vertex_data = [];


// This is not really a function, it's just the
// mechanism for organizing the 2d logo demo as a
// separate module.
logo2d_demo = function() {


    /**
     * Runs the 2D logo demo.
     */
    var runDemo = function(){


        var logoCanvas = document.getElementById("myGLCanvas");
        var logoGL = WebGLUtils.setupWebGL(logoCanvas);
        logoGL.clearColor(0.265, 0.265, 0.265, 1.0);

        var logoShaderProgram; // block-I shader program
        var vertexPositionBuffer; // WebGL buffer holding vertex positions
        var vertexIndexBuffer; // WebGL buffer holding indices

        // Init our dynamic data
        dynamic_vertex_data = logo2d_vertex_data;

        
        logoShaderProgram = setupShaders(logoGL);
        if(logoShaderProgram == null){
            alert("shader program is null");
        }

        
        // Setup buffers and extract references
        var bufferResult = setupBuffers(logo2d_vertex_data, logo2d_poly_data, logoGL.DYNAMIC_DRAW,logoGL);
        vertexPositionBuffer = bufferResult.positions;
        vertexIndexBuffer = bufferResult.indices;

        function render(now) {
            mess_with_vertices(now);
            logoGL.bindBuffer(logoGL.ARRAY_BUFFER, vertexPositionBuffer);
            logoGL.bufferSubData(logoGL.ARRAY_BUFFER, 0, new Float32Array(dynamic_vertex_data));
            draw_logo(now/200, logo2d_poly_data.length, vertexPositionBuffer, vertexIndexBuffer, logoShaderProgram, logoGL);
            animationID = requestAnimationFrame(render);
        }
        animationID = requestAnimationFrame(render);
    };


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
        glMatrix.mat4.scale(localTransforms, localTransforms, glMatrix.vec3.fromValues(0.1,0.1 + (Math.sin(factor * 10.0) * 0.05),0.1));
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
                dynamic_vertex_data[i] = logo2d_vertex_data[i] + 0.06*Math.sin(time/100 + logo2d_vertex_data[i+1]/1.0);
            }
        }
    }
    
    /**
     * Draws the logo.
     * @param {number} time Current time variable used for animation
     * @param {number} num_polys Number of triangles to draw
     * @param {WebGLBuffer} vertexPositionBuffer WebGLBuffer for vertex position data
     * @param {WebGLBuffer} vertexIndexBuffer WebGLBuffer for vertex index data
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    function draw_logo(time, num_polys, vertexPositionBuffer, vertexIndexBuffer, shaderProgram, gl){
        calculateMatrices(time/10, shaderProgram, gl);
        
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1);

        // Set some fun colors!
        gl.uniform4fv(shaderProgram.logoColor, [1.0, 0.5, 0.0, 1.0]);

        // Bind the vertex position buffer and enable the attrib array with the correct pointer settings
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        // Bind the index buffer (wow, that's easy!)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
        gl.drawElements(gl.TRIANGLES, num_polys, gl.UNSIGNED_SHORT, 0);
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
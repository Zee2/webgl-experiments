/**
 * @fileoverview This file contains the 3D terrain demo with blinn-phong shading.
 */

/** @global Toggle for whether to use the sphere visualization option */
var useSphere = false;

/** @global Flag for changed sphere state */
var regenModel = false;

/** @global Constant for terrain tile size (terrain_dim x terrain_dim tiles) */
const terrain_dim = 128;

var user_pos = glMatrix.vec3.create();
var user_rotation = glMatrix.quat.create();
var user_velocity = 0.005;
var user_angular_velocity = glMatrix.vec3.create();

var skyboxVertexPosArray = [];
var skyboxIndexArray = [];
var skyboxNormalArray = [];
var skybox_vertexPositionBuffer;
var skybox_vertexIndexBuffer;
var skybox_vertexNormalBuffer



// Assign the toggle sphere button onclick callback to a lambda that
// toggles the sphere model flag and triggers model regeneration
document.getElementById("toggle_sphere").onclick = () => {
    useSphere = !useSphere;
    regenModel = true;
}

// This is not really a function, it's just the
// mechanism for organizing the terrain demo as a
// separate pseudo-"module".
// The sketchy VanillaJS equivalent of module.exports
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
        var dollyY = 1200;
        
        user_pos = glMatrix.vec3.fromValues(-10, 3, -10);
        function render(now) {

            // Compute per-frame mouse input
            rotateX += mouseVelX;
            mouseVelX += -mouseVelX * 0.05;
            dollyY += mouseVelY;
            dollyY = clamp(dollyY, 500, 5000);
            mouseVelY += -mouseVelY * 0.05;

            
            var forward_vector = glMatrix.vec3.fromValues(0,0,1);
            var inverted = glMatrix.quat.create();
            glMatrix.vec3.transformQuat(forward_vector, forward_vector, glMatrix.quat.invert(inverted, user_rotation));
            glMatrix.vec3.multiply(forward_vector, forward_vector, [user_velocity, -user_velocity, user_velocity]);
            glMatrix.vec3.add(user_pos, user_pos, forward_vector);

            user_angular_velocity[0] += y_input * 0.05;
            user_angular_velocity[1] += yaw_input * 0.05;
            user_angular_velocity[2] += x_input * 0.05;

            glMatrix.vec3.scale(user_angular_velocity, user_angular_velocity, 0.99);

            user_velocity += throttle * 0.0001;
            

            // Compute per-frame keyboard input
            compute_keyboard_input();

            // Draw scene, pass in buffers
            draw(rotateX, dollyY * 0.001, bufferResult.numIndices, vertexPositionBuffer, vertexIndexBuffer, vertexNormalBuffer, terrainShaderProgram, logoGL);
            
            // Set the uniform value for the shininess based on slider input.
            logoGL.uniform1f(terrainShaderProgram.shiny, document.getElementById("shininess").value);

            // Get blinn/phong toggle status and set the shader accordingly
            if(document.querySelector('input[name="use_blinnphong"]:checked').value == "yes"){
                logoGL.uniform1f(terrainShaderProgram.useBlinnPhong, 1.0);
            } else {
                logoGL.uniform1f(terrainShaderProgram.useBlinnPhong, 0.0);
            }

            // If the regen_model flag was set, we regenerate the buffers with the useSphere flag,
            // and then refresh all the other buffers.
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

            // Set the time uniform variable so that the lights can animate/spin smoothly around the scene :)
            logoGL.uniform1f(terrainShaderProgram.time, now);
            animationID = requestAnimationFrame(render);
        }
        animationID = requestAnimationFrame(render);
    };


    /**
     * Calculates transformation matrices and applies them to the given
     * shader program.
     * @param {number} x X rotation (used to spin terrain)
     * @param {number} y Y factor (used to dolly-zoom the camera)
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns void
     */
    var calculate_matrices = function(x, y, shaderProgram, gl){

        // Construct perspective projection matrix.
        var projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projectionMatrix, Math.PI/3, gl.canvas.width/ gl.canvas.height, 0.01,40);

        // Calculate a good eyepos to look at the terrain from.
        // var eyePos = glMatrix.vec3.fromValues(y*10,y**1.5 * 5,y*10);

        // Construct modelview matrix using a lookat and a y-rotation, plus a translation to
        // give us some distance from the model.
        var viewMatrix = glMatrix.mat4.create();

        
        var user_pitch = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(user_pitch, [1, 0, 0], user_angular_velocity[0] * 0.01);
        var user_roll = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(user_roll, [0, 0, 1], user_angular_velocity[2] * 0.01);
        var user_yaw = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(user_yaw, [0, 1, 0], user_angular_velocity[1] * 0.005);

        //var user_attitude = glMatrix.quat.create();
        //glMatrix.quat.multiply(user_attitude, user_pitch, user_roll);

        glMatrix.quat.multiply(user_rotation, user_pitch, user_rotation);
        glMatrix.quat.multiply(user_rotation, user_roll, user_rotation);
        glMatrix.quat.multiply(user_rotation, user_yaw, user_rotation);
        var user_rot_matrix = glMatrix.mat4.create();
        glMatrix.mat4.fromQuat(user_rot_matrix, user_rotation);

        glMatrix.mat4.multiply(viewMatrix, viewMatrix, user_rot_matrix);

        var flipped_user_pos = glMatrix.vec3.fromValues(user_pos[0], -user_pos[1], user_pos[2]);

        //glMatrix.mat4.lookAt(modelViewMatrix, eyePos, [0,1,0], [0,1,0]);
        //glMatrix.mat4.rotateY(modelViewMatrix, modelViewMatrix, x/200);
        glMatrix.mat4.translate(viewMatrix, viewMatrix, flipped_user_pos);
        //glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-(terrain_dim * 0.1 * 0.5), 0, -(terrain_dim * 0.1 * 0.5)]);
        
        //glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [1, -1, 1]);

        var modelMatrix = glMatrix.mat4.create();

        var modelViewMatrix = glMatrix.mat4.create();

        glMatrix.mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

        

        // Construct normal matrix, which is simply the inverse transpose of the modelview.
        var normalMatrix = glMatrix.mat3.create();
        glMatrix.mat3.fromMat4(normalMatrix, modelViewMatrix);
        glMatrix.mat3.transpose(normalMatrix, normalMatrix);
        glMatrix.mat3.invert(normalMatrix, normalMatrix);
        
        // Load the matrices into the shader program!
        gl.uniformMatrix4fv(shaderProgram.modelview, false, modelViewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projection, false, projectionMatrix);
        gl.uniformMatrix3fv(shaderProgram.normalMatrix, false, normalMatrix);
        gl.uniform3fv(shaderProgram.worldCameraPosition, user_pos);
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
        shaderProgram.worldCameraPosition = gl.getUniformLocation(shaderProgram, "u_worldCameraPosition");
        shaderProgram.skyboxDraw = gl.getUniformLocation(shaderProgram, "u_skyboxDraw");

        return shaderProgram;
    };

        
    /**
     *  Sets up buffers with provided data
     *  Much of this is borrowed from the HelloColor/HelloTriangle example.
     * @param {number} drawMode Drawing mode (STATIC_DRAW, DYNAMIC_DRAW)
     * @param {boolean} generateSphere Whether to override the terrain gen and just do a sphere!
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns {object} Object with the position and index WebGLBuffers
     */
    var setupBuffers = function(drawMode, generateSphere, gl){
        // Various mesh data we will be generating.
        var vertexNormals = [];
        var modelData = [];
        var modelIndices = [];

        if(generateSphere == false){

            // Create an "adjacency map", similar to an adjacency matrix,
            // but is a hashmap mapping each vertex to the other vertices
            // that share a triangle with the hash key.
            // This allows us to reduce the algorithmic complexity of the inverse
            // lookup of shared polygons/edges, which is otherwise a quadratic complexity problem.
            // There is a more clever way to do it than with an inverse
            // mapping hashmap, but this should actually be relatively generalizable
            // to other meshes that are not our restrictive planes/terrain meshes.
            // This represents an absurd exponential efficiency improvement.
            var adjacency_map = new Object();

            // Construct the base plane vertex data, terrain_dim x terrain_dim
            for(var y = 0; y < terrain_dim; y++){
                for(var x = 0; x < terrain_dim; x++){
                
                    modelData.push(x*0.1, 0, y*0.1);
                }
            }
            console.log(modelData.length/3 + " vertices");

            // Construct the index/element array, while building up the nifty adjacency mapping
            // while we link the vertices together. (That way, we only have to do that logic once.)
            // We iterate through our already created terrain vertex array...
            for(var y = 0; y < terrain_dim-1; y++){
                for(var x = 0; x < terrain_dim-1; x++){

                    // Calculate array index based on current x/y 2D indexing into the terrain
                    var index = x + y * terrain_dim;

                    // Push the actual indices. (Constructs two triangles, sharing two vertices
                    // each. This is important....)
                    modelIndices.push(index, index + terrain_dim, index + 1);
                    modelIndices.push(index + terrain_dim, index + 1 + terrain_dim, index + 1);

                    // Construct the "adjacency map" for BOTH of the current polygons, essentially
                    // providing a constant-time adjacency lookup for all vertices, to find
                    // their neighbors for normal calculations.
                    adjacency_map[index] = [modelIndices.length-3, modelIndices.length -6];
                    adjacency_map[index + terrain_dim] = [modelIndices.length-3, modelIndices.length -6];
                    adjacency_map[index + terrain_dim + 1] = [modelIndices.length-3, modelIndices.length -6];
                    adjacency_map[index + 1] = [modelIndices.length-3, modelIndices.length -6];
                }   
            }
            console.log(modelIndices.length/3 + " triangles");

            // Deform the terrain..
            deform_terrain(modelData, terrain_dim, 1024);

            // Squish the terrain altitude to [0,1], makes
            // the whole color mapping thing a bit easier to wrangle.
            normalize_mesh_height(modelData);


            // Calculate face normals
            var tri_norms = [];

            // Iterate through all triangles
            for(var tri_idx = 0; tri_idx < modelIndices.length; tri_idx += 3){

                // Compute face/triangle normal
                var tri_norm = compute_tri_normal(
                    modelData.slice(modelIndices[tri_idx] * 3, modelIndices[tri_idx] * 3 + 3),
                    modelData.slice(modelIndices[tri_idx+1] * 3, modelIndices[tri_idx+1] * 3 + 3),
                    modelData.slice(modelIndices[tri_idx+2] * 3, modelIndices[tri_idx+2] * 3 + 3))

                tri_norms.push(tri_norm);
            }

            // Calculate vertex normals
            // Iterate through every vertex
            for(var y = 0; y < terrain_dim; y++){
                for(var x = 0; x < terrain_dim; x++){

                    // Calculate the array index
                    var vertex_index = x + y * terrain_dim;

                    var normal_sum = glMatrix.vec3.create();

                    // Iterate through all adjacent (connected) vertices, aka,
                    // the vertices which share a triangle with this vertex.
                    // For each of the connected vert
                    adjacency_map[vertex_index].forEach((tri_idx) => {
                        glMatrix.vec3.add(normal_sum, normal_sum, tri_norms[tri_idx/3]);
                    });
                    
                    // Normalize vertex normal.
                    glMatrix.vec3.normalize(normal_sum, normal_sum);

                    vertexNormals.push(normal_sum[0], normal_sum[1], normal_sum[2]);
                }
            }
        } else { // Else, if generateSphere == true

            // Generate basic sphere. (Also generates element indices and normals)
            sphereFromSubdivision(4, modelData, modelIndices, vertexNormals);
            console.log(modelData.length/3 + " vertices");
            console.log(modelIndices.length/3 + " triangles");

            for(var i = 0; i < modelData.length; i+=3){
                modelData[i] += terrain_dim*0.05;
                modelData[i+1] += 1.2;
                modelData[i+2] += terrain_dim*0.05;
            }
        }
        
        // Construct the actual WebGL buffers.

        var vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData), drawMode);

        var vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelIndices), drawMode);

        var vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), drawMode);

        // Construct skybox sphere
        sphereFromSubdivision(5, skyboxVertexPosArray, skyboxIndexArray, skyboxNormalArray);

        for(var i = 0; i < skyboxVertexPosArray.length; i++){
            skyboxVertexPosArray[i] *= 20.0;
        }
        
        skybox_vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, skybox_vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyboxVertexPosArray), drawMode);

        skybox_vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skybox_vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(skyboxIndexArray), drawMode);

        skybox_vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, skybox_vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyboxNormalArray), drawMode);
        
        return {positions: vertexPositionBuffer, indices: vertexIndexBuffer, normals: vertexNormalBuffer, numIndices: modelIndices.length};
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
    function draw(x, y, num_polys, vertexPositionBuffer, vertexIndexBuffer, vertexNormalBuffer, shaderProgram, gl){

        // Compute the various matrices for this frame
        calculate_matrices(x - 250, y, shaderProgram, gl);

        // Face culling is off by artistic choice, it looks kind of neat
        // to be able to see the underside of the terrain!
        //gl.enable(gl.CULL_FACE);


        // Set all the GL flags we need
        gl.enable(gl.DEPTH_TEST);
        gl.depthRange(-1.0, 1.0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1);

        // Configure all our buffers and attributes

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                                    3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute)
        
        gl.uniform1f(shaderProgram.skyboxDraw, 0.0);
        // Go draw 'em!
        gl.drawElements(gl.TRIANGLES, num_polys, gl.UNSIGNED_SHORT, 0);

        
        // Draw skybox
        
        gl.bindBuffer(gl.ARRAY_BUFFER, skybox_vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skybox_vertexIndexBuffer);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, skybox_vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                                    3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute)
        
        gl.uniform1f(shaderProgram.skyboxDraw, 1.0);
        // Go draw 'em!
        gl.drawElements(gl.TRIANGLES, skyboxIndexArray.length, gl.UNSIGNED_SHORT, 0);

    };

    // The sketchy VanillaJS equivalent of module.exports
    return {
        runDemo: runDemo
    };

}();
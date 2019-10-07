

/**
 * @fileoverview This file contains additional helper functions.
 */


 /**
 *  Loads Shaders from the DOM, given a DOM id
 *  Much of this is borrowed from the HelloColor/HelloTriangle example.
 * @param {string} id ID string of the DOM element containing the shader.
 * @param {WebGLRenderingContext} gl Reference to the WebGL context
 * @returns {WebGLShader} Compiled shader
 */
function loadShader(id, gl){
    var shaderScript = document.getElementById(id);
    if(!shaderScript){ return null; }

    // Large string containing all the shader source code we will
    // build from the various DOM scripts
    var shaderSource = "";

    // Traverse the element's children and collect all the related scripts
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
        shaderSource += currentChild.textContent;
        console.log(currentChild.textContent);
        }
        currentChild = currentChild.nextSibling;
    }

    // Create either vertex or fragment shader depending on script type
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    // Set our large shader string as the source of the shaders
    gl.shaderSource(shader, shaderSource);

    // Let WebGL compile our shaders from source
    gl.compileShader(shader);

    // Verify that the shader compiled correctly.
    // If not, alert the programmer
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

/**
 *  Sets up buffers with provided data
 *  Much of this is borrowed from the HelloColor/HelloTriangle example.
 * @param {boolean} generateSphere Whether to override the terrain gen and just do a sphere!
 * @param {number} drawMode Drawing mode (STATIC_DRAW, DYNAMIC_DRAW)
 * @param {WebGLRenderingContext} gl Reference to the WebGL context
 * @returns {object} Object with the position and index WebGLBuffers
 */
function setupBuffers(drawMode, generateSphere, gl){

    
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionDataArray), drawMode,);


    terrain_dim = 128;

    var inverseMapping = new Object();

    modelData = [];
    for(var y = 0; y < terrain_dim; y++){
        for(var x = 0; x < terrain_dim; x++){
        
            modelData.push(x*0.1, 0, y*0.1);
        }
    }
    console.log(modelData.length/3 + " vertices");
    modelIndices = [];
    
    for(var y = 0; y < terrain_dim-1; y++){
        for(var x = 0; x < terrain_dim-1; x++){
            var index = x + y * terrain_dim;
            modelIndices.push(index, index + terrain_dim, index + 1);
            modelIndices.push(index + terrain_dim, index + 1 + terrain_dim, index + 1);

            inverseMapping[index] = [modelIndices.length-3, modelIndices.length -6];
            inverseMapping[index + terrain_dim] = [modelIndices.length-3, modelIndices.length -6];
            inverseMapping[index + terrain_dim + 1] = [modelIndices.length-3, modelIndices.length -6];
            inverseMapping[index + 1] = [modelIndices.length-3, modelIndices.length -6];
        }   
    }
    console.log(modelIndices.length/3 + " triangles");

    // Generate terrain pattern.

    modelData = mutate_terrain(modelData, terrain_dim, 1024);
/*
    for(var i = 0; i < modelData.length; i+=3){
        modelData[i+1] = Math.sin(modelData[i]);
    }
  */  
    
    //rand_point = glMatrix.vec2.fromValues(0.5 * terrain_dim * 0.1, 0.5 * terrain_dim * 0.1);
    
    
    

    var min = 100000, max = -100000;
    for(var i = 0; i < modelData.length; i+=3){
        if(modelData[i+1] > max) max = modelData[i+1]
        if(modelData[i+1] < min) min = modelData[i+1]
    }
    for(var i = 0; i < modelData.length; i+=3){
        modelData[i+1] = ((modelData[i+1] - min) / (max-min)) * 3.0;
    }


    // Calculate face normals
    var tri_norms = [];
    for(var tri_idx = 0; tri_idx < modelIndices.length; tri_idx += 3){

        // Found a connected triangle! Compute triangle normal

        var tri_norm = compute_tri_normal(
            modelData.slice(modelIndices[tri_idx] * 3, modelIndices[tri_idx] * 3 + 3),
            modelData.slice(modelIndices[tri_idx+1] * 3, modelIndices[tri_idx+1] * 3 + 3),
            modelData.slice(modelIndices[tri_idx+2] * 3, modelIndices[tri_idx+2] * 3 + 3))

        tri_norms.push(tri_norm);

        if(modelIndices.slice(tri_idx, tri_idx+3).includes(vertex_index)){

            
            // Add triangle normal to sum.
            glMatrix.vec3.add(normal_sum, normal_sum, tri_norm);
        }
    }

    // Calculate vertex normals

    var vertexNormals = [];
    for(var y = 0; y < terrain_dim; y++){
        for(var x = 0; x < terrain_dim; x++){
            var vertex_index = x + y * terrain_dim;

            var normal_sum = glMatrix.vec3.create();

            inverseMapping[vertex_index].forEach((tri_idx) => {
                glMatrix.vec3.add(normal_sum, normal_sum, tri_norms[tri_idx/3]);
            });
            /*
            for(var tri_idx = 0; tri_idx < modelIndices.length; tri_idx += 3){
                if(modelIndices.slice(tri_idx, tri_idx+3).includes(vertex_index)){
                    // Add triangle normal to sum.
                    glMatrix.vec3.add(normal_sum, normal_sum, tri_norms[tri_idx/3]);
                }
            }
            */
            // Normalize vertex normal.
            glMatrix.vec3.normalize(normal_sum, normal_sum);

            vertexNormals.push(normal_sum[0], normal_sum[1], normal_sum[2]);
        }
    }
    
    

    if(generateSphere){
        vertexNormals.length = 0;
        modelData.length = 0;
        modelIndices.length = 0;

        sphereFromSubdivision(4, modelData, modelIndices, vertexNormals);
        console.log(modelData.length/3 + " vertices");
        console.log(modelIndices.length/3 + " triangles");

        for(var i = 0; i < modelData.length; i+=3){
            modelData[i] += terrain_dim*0.05;
            modelData[i+1] += 1.2;
            modelData[i+2] += terrain_dim*0.05;
        }
    }
    
    

    // Setup the position buffer.
    var vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData), drawMode);
    //vertexPositionBuffer.itemSize = 3;
    //vertexPositionBuffer.numberOfItems = 3;

    var vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelIndices), drawMode);
    //vertexIndexBuffer.itemSize = 3;
    //vertexIndexBuffer.numberOfItems = modelIndices/3;

    var vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), drawMode);


    return {positions: vertexPositionBuffer, indices: vertexIndexBuffer, normals: vertexNormalBuffer, numIndices: modelIndices.length};
}


function mutate_terrain(mesh, dim, iter){
    

    
    for(var i = 0; i < iter; i++){
        var rand_point = glMatrix.vec2.fromValues(Math.random(), Math.random());
        var theta = Math.random() * Math.PI * 2;
        var rand_vec = glMatrix.vec2.fromValues(Math.cos(theta), Math.sin(theta));
        //console.log("Rand point: x: " + rand_point[0] + ", y: " + rand_point[1]);
        for(var idx = 0; idx < mesh.length; idx += 3){
            //console.log("x: " + modelData[idx] + ", z: " + modelData[idx+2]);
            var vertex = glMatrix.vec2.fromValues(mesh[idx] / (dim * 0.1), mesh[idx+2] / (dim * 0.1));
            /*
            if(vertex[0] > rand_point[0]){
                modelData[idx+1] += 1;
            } else {
                modelData[idx+1] -= 1;
            }
            */
            var subbed = glMatrix.vec2.create();
            glMatrix.vec2.sub(subbed, vertex, rand_point)
            var dotFactor = glMatrix.vec2.dot(subbed, rand_vec)
            //modelData[idx+1] += 0.1 * Math.pow(((iter - i) / iter), 2) * (glMatrix.vec2.dot(subbed, rand_vec) > 0 ? 1 : -1);
            modelData[idx+1] += 0.1 * ((iter - i) / iter)**1 * Math.atan((i / iter)**2 * 400.0 * dotFactor);

            /*
            if(glMatrix.vec2.dot(subbed, rand_vec) > 0){
                modelData[idx+1] += 0.05 * ((iter - i) / iter);
            } else {
                modelData[idx+1] -= 0.05 * ((iter - i) / iter);
            }
            */
        }
    }

    return mesh;
}


function compute_normals(vertices, indices){
    for(var index = 0; index < indices.length; index += 3){
        var sum = glMatrix.vec3.create();

        var tri1 = vertices.slice(indices[index] * 3, indices[index] * 3 + 3);
        var normal1 = compute_tri_normal(tri1[0], tri1[1], tri1[2]);

        var tri2 = vertices.slice(indices[index] * 3, indices[index] * 3 + 3);
        var normal2 = compute_tri_normal(tri1[0], tri1[1], tri1[2]);

        var tri3 = vertices.slice(indices[index] * 3, indices[index] * 3 + 3);
        var normal3 = compute_tri_normal(tri1[0], tri1[1], tri1[2]);

        var tri4 = vertices.slice(indices[index] * 3, indices[index] * 3 + 3);
        var normal4 = compute_tri_normal(tri1[0], tri1[1], tri1[2]);
        glMatrix.vec3.add()
    }
}

function compute_tri_normal(a, b, c){
    var p1 = glMatrix.vec3.fromValues(a[0], a[1], a[2]);
    var p2 = glMatrix.vec3.fromValues(b[0], b[1], b[2]);
    var p3 = glMatrix.vec3.fromValues(c[0], c[1], c[2]);

    var v1 = glMatrix.vec3.create();
    glMatrix.vec3.sub(v1, p2, p1);
    var v2 = glMatrix.vec3.create();
    glMatrix.vec3.sub(v2, p3, p1);
    
    var result = glMatrix.vec3.create();
    glMatrix.vec3.cross(result, v1, v2);
    return result;
}

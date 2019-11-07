

/**
 * @fileoverview This file contains additional helper functions.
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

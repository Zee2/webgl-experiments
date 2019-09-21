// Model data located in separate files.

/** @global ID of animation currently running */
var animationID;

/**
 * Startup function called on canvas load.
 * @params void
 */
function startup(){

    // Grab the radiobuttons and add callback lambdas
    var radiobuttons = document.getElementsByTagName("input");
    for(let button of radiobuttons){
        button.onclick = function() {
            switchDemo(button.value);
        };
    }
    if(logo3d_demo.runDemo == null){
        alert("null");
    }
    switchDemo("2dlogo");
}

/**
 * Runs the selected demo.
 * @param {string} demo Which demo to run.
 * @returns void
 */
function switchDemo(demo){
    if(animationID != null){
        cancelAnimationFrame(animationID);
    }
    if(demo == "teapot"){
        logo3d_demo.runDemo(true);
    } else if(demo == "3dlogo"){
        logo3d_demo.runDemo(false);
    } else {
        logo2d_demo.runDemo();
    }
}
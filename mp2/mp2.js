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
    if(terrain_demo.runDemo == null){
        alert("null");
    }
    switchDemo("terrain");
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
    if(demo == "terrain"){
        terrain_demo.runDemo();
    } else {
        terrain_demo.runDemo();
    }
}
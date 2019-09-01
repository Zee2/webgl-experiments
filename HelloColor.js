
var slider = document.getElementById("myRange");

var slider2 = document.getElementById("myRange2");
var canvas = document.getElementById("myGLCanvas");
var initted = false;

var mouseX = 0;
var mouseY = 150;

var mouseState = 0;
document.body.onmouseup = () => {mouseState--}

var lastMouse = [0,0]

document.body.onmousedown = (e) => {
    mouseState++
}

canvas.onmousemove = function(e){
    
    if(mouseState){
        mouseX += e.clientX - lastMouse[0];
        mouseY += e.clientY - lastMouse[1];
    }
    lastMouse = [e.clientX, e.clientY];
}
/**
 * Startup function called from html code to start program.
 */
function startup() {
    var heightmap = new Image();
    heightmap.src = "heightmap.png";
    heightmap.onload = () => {
        console.log("No bugs so far...");
        canvas = document.getElementById("myGLCanvas");
        gl = createGLContext(canvas);
        setupShaders(); 
        setupBuffers(heightmap);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        initted = true;
    }
    
    
    
    
    var then = 0;
    // Draw the scene repeatedly
    function render(now) {
        now *= 0.1;  // convert to seconds
        const deltaTime = now - then;
        then = now;
        if(initted){
            draw(mouseX, mouseY, slider.value / 100, slider2.value / 100.0);
        }
            

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
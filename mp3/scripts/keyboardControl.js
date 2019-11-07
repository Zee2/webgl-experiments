/**
 * @fileoverview This file supports keyboard input.
 */

/** @global Roll input axis */
var roll_input = 0.0;
/** @global Pitch input axis */
var pitch_input = 0.0;
/** @global Yaw input axis */
var yaw_input = 0.0;
/** @global Throttle input axis */
var throttle_input = 0.0;

/** @global Dictionary that keeps track of all pressed keys. */
var pressed_keys = {};

// Set the document's onkeydown callback
document.onkeydown = (e) => {
    pressed_keys[e.code] = true;
}
// Set the document's onkeyup callback
document.onkeyup = (e) => {
    pressed_keys[e.code] = false;
}

/**
 *  Checks pressed keys, updates input vectors accordingly
 * @returns void
 */
function compute_keyboard_input() {
    let modified = {};

    if(pressed_keys["ArrowLeft"]){
        roll_input += (-1.0 - roll_input) * 0.1;
        modified["x"] = true;
    }
    if(pressed_keys["ArrowRight"]){
        roll_input += (1.0 - roll_input) * 0.1;
        modified["x"] = true;
    }
    if(pressed_keys["ArrowUp"]){
        pitch_input += (1.0 - pitch_input) * 0.1;
        modified["y"] = true;
    }
    if(pressed_keys["ArrowDown"]){
        pitch_input += (-1.0 - pitch_input) * 0.1;
        modified["y"] = true;
    }
    if(pressed_keys["KeyE"]){
        yaw_input += (1.0 - yaw_input) * 0.1;
        modified["yaw"] = true;
    }
    if(pressed_keys["KeyQ"]){
        yaw_input += (-1.0 - yaw_input) * 0.1;
        modified["yaw"] = true;
    }
    if(pressed_keys["Equal"]){
        throttle_input += (1.0 - throttle_input) * 0.1;
        modified["throttle"] = true;
    }
    if(pressed_keys["Minus"]){
        throttle_input += (-1.0 - throttle_input) * 0.1;
        modified["throttle"] = true;
    }

    if(!modified["x"])        { roll_input   *= 0.9; }
    if(!modified["y"])        { pitch_input   *= 0.9; }
    if(!modified["yaw"])      { yaw_input *= 0.9; }
    if(!modified["throttle"]) { throttle_input  *= 0.9; }
    
}
let canvas = document.getElementsByTagName("canvas")[0];
let canvasContainer = document.getElementsByClassName("canvas-container")[0] 
let ctx = canvas.getContext("2d");
let cameraX = 0;
let cameraY = 0;
let cellSize = 40;
let holding = false;
let currentCellType = "producer"


let dragstartX
let dragstartY
canvasContainer.addEventListener("mousedown", (event) => {
    if (event.button != 1) {
        return
    }
    dragstartX = event.clientX
    dragstartY = event.clientY
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
});
let cellButtons = document.getElementsByClassName("editor-button")
for (i = 0; i < cellButtons.length; i++) {
    let cellButton = cellButtons[i]
    cellButton.addEventListener("mousedown", (event) => {
        if (event.button != 0) {
            return
        }
        for (i=0; i < cellButtons.length; i++) {
            let otherCell = cellButtons[i]
            delete otherCell.dataset.active
            console.log(otherCell)
        }
        cellButton.dataset.active = ""
        currentCellType = cellButton.dataset.cell
    })
}


function onMouseMove(event) {
    let draggedX = event.clientX - dragstartX
    let draggedY = event.clientY - dragstartY
    dragstartX = event.clientX
    dragstartY = event.clientY
    cameraX -= draggedX
    cameraY += draggedY
    canvas.style.top = `${cameraY}px`
    canvas.style.right = `${cameraX}px`
}
function onMouseUp(event) {
    dragstartX = event.clientX
    dragstartY = event.clientY
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup", onMouseUp)
}

canvas.addEventListener("mousedown", (event) => {
    if (event.button != 0) {
        return
    }
    let canvasRect = canvas.getBoundingClientRect();
    let x = event.clientX - canvasRect.left
    let y = event.clientY - canvasRect.top
    let tileX = Math.round((x / cellSize)-0.5)
    let tileY = Math.round((y / cellSize)-0.5)
    console.log(x,y,tileX,tileY)
    let cell = { }
    cell["loc_col"] = tileY
    cell["loc_row"] = tileX
    cell["state"] = {"name":currentCellType}
    organism.anatomy.cells.push(cell)
    drawCells()
    updateGraph()
})

const CELL_NAMES = {
    "producer":"green",
    "mouth":"orange",
    "killer":"red",
    "mover":"blue",
    "eye":"grey",
    "armor":"purple"
}
const COLORS = {
    "orange":"#DEB14D",
    "green": "#15DE59",
    "red":"#F82380",
    "grey":"#B7C1EA",
    "purple":"#7230DB",
    "blue":"#60D4FF",
    "black":"#000"
}
let organism = {
    "c":7,
    "r":7,
    "lifetime":0,
    "food_collected":0,
    "living":true,
    "direction":2,
    "rotation":0,
    "can_rotate":true,
    "move_count":0,
    "move_range":4,
    "ignore_brain_for":0,
    "mutability":1,
    "damage":0,   
    "anatomy":{
        "birth_distance":50,
        "is_producer":true,
        "is_mover":false,
        "has_eyes":true,
        "cells":[{"loc_col":1,"loc_row":1,"state":{"name":"producer"}},{"loc_col":1,"loc_row":2,"state":{"name":"mouth"}}]
    },
    "species_name":""
}

// {"loc_col":1,"loc_row":1,"state":{"name":"producer"}}
// producer, mouth, killer, mover, eye, armor

function drawCells() {
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let cellLength = organism.anatomy.cells.length
    for (let index = 0; index < cellLength; index++) {
        cell = organism.anatomy.cells[index]
        let colorname = CELL_NAMES[cell.state.name]
        ctx.fillStyle = COLORS[colorname]
        let cellX = cell.loc_row * cellSize // - cameraX
        let cellY = cell.loc_col * cellSize // - cameraY
        ctx.fillRect(cellX, cellY, cellSize, cellSize)
    }
}
function updateGraph() {
    let top_corners = []
    let bottom_corners = []
    let left_corners = []
    let right_corners = []
    let startX = 0 // canvas.width % cellSize
    for (let x = startX; x < canvas.width; x += cellSize) {
        top_corners.push([x, 0])
        bottom_corners.push([x, canvas.height])
    }
    let startY = 0 // canvas.height % cellSize
    for (let y = startY; y < canvas.height; y += cellSize) {
        left_corners.push([0, y])
        right_corners.push([canvas.width, y])
    }
    ctx.strokeStyle = COLORS["black"]  // ctx.fillStyle
    for (let index = 0; index < top_corners.length; index += 1) {
        let coord1
        let coord2
        coord1 = top_corners[index]
        coord2 = bottom_corners[index]
        ctx.moveTo(coord1[0], coord1[1])
        ctx.lineTo(coord2[0], coord2[1])
        ctx.stroke()
    }
    for (let index = 0; index < left_corners.length; index += 1) {
        let coord1
        let coord2
        coord1 = right_corners[index]
        coord2 = left_corners[index]
        ctx.moveTo(coord1[0], coord1[1])
        ctx.lineTo(coord2[0], coord2[1])
        ctx.stroke()
    }
}

drawCells()
updateGraph()
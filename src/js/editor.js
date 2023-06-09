// Variables

const canvas = document.querySelector("canvas");
const canvasContainer = document.querySelector(".canvas-container");
const ctx = canvas.getContext("2d");
const exportBtn = document.querySelector("#jsonexport");
const importBtn = document.querySelector("#jsonimport");
const githubBtn = document.querySelector("#opengithub");
const resizeBtn = document.querySelector("#canvas-resize");
const nameInput = document.querySelector("#org-name");
const foodInput = document.querySelector("#org-food");
const directionInput = document.querySelector("#org-direction");
const mutationInput = document.querySelector("#org-mutation");
const canvasWidthInput = document.querySelector("#canvas-width");
const canvasHeightInput = document.querySelector("#canvas-height");
const cellSizeInput = document.querySelector("#canvas-cellSize");
const eyeDirectionInput = document.querySelector("#eye-direction");

const cellNames = {
    producer: "green",
    mouth: "orange",
    killer: "red",
    mover: "blue",
    eye: "grey",
    armor: "purple",
};

const colors = {
    orange: "#DEB14D",
    green: "#15DE59",
    red: "#F82380",
    grey: "#B7C1EA",
    purple: "#7230DB",
    blue: "#60D4FF",
    black: "#222",
    gray: "#333",
};

let cameraX = 0;
let cameraY = 0;
let cellSize = 50;
let holding = false;
let currentCellType = "producer";
let halfGridWidth;
let halfGridHeight;
let zoom = 2;

let topcenter =
  canvasContainer.getBoundingClientRect().height / 2 -
  canvas.getBoundingClientRect().height / 2;
let leftcenter =
  canvasContainer.getBoundingClientRect().width / 2 -
  canvas.getBoundingClientRect().width / 2;
canvas.style.top = `${topcenter}px`;
canvas.style.left = `${leftcenter}px`;
cameraX = -leftcenter;
cameraY = topcenter;

// let modify_cell_stack = [ ]

let organism = {
  c: 7, // Don't change these
  r: 7, // Don't change these
  lifetime: 0,
  food_collected: 0,
  living: true,
  direction: 2,
  rotation: 0,
  can_rotate: true,
  move_count: 0,
  move_range: 4,
  ignore_brain_for: 0,
  mutability: 1,
  damage: 0,
  anatomy: {
    birth_distance: 50,
    is_producer: true,
    is_mover: false,
    has_eyes: true,
    cells: [],
  },
  species_name: "",
};

// Functions

canvasContainer.addEventListener("contextmenu", event => event.preventDefault());

// Quick fix for organisms having offset when importing to life engine, see #13 in github 
function offsetOrganism(org, offset) {
  for (let i = 0; i < org.anatomy.cells.length; i++) {
    [org.anatomy.cells[i].loc_col, org.anatomy.cells[i].loc_row] = [
      org.anatomy.cells[i].loc_row + offset,
      org.anatomy.cells[i].loc_col + offset,
    ];
  }
  return org;
}

function ensureOdd(num) {
  if (num % 2 === 0) {
    return num + 1;
  } else {
    return num;
  }
}

resizeBtn.addEventListener("click", resizeCanvas);
function resizeCanvas(event) {
  event.preventDefault(); // Prevents page refresh
  cellSize = parseInt(cellSizeInput.value);
  canvasWidthInput.value = ensureOdd(parseInt(canvasWidthInput.value));
  canvasHeightInput.value = ensureOdd(parseInt(canvasHeightInput.value));
  canvas.width = canvasWidthInput.value * cellSize * 2 + cellSize;
  canvas.height = canvasHeightInput.value * cellSize * 2 + cellSize;
  halfGridWidth = Math.round(canvas.width / 4 / cellSize);
  halfGridHeight = Math.round(canvas.height / 4 / cellSize);
  canvas.style.transform = `scale(${zoom})`;
  drawCells();
  updateGraph();
}

canvasContainer.addEventListener("wheel", (event) => {
  if (event.deltaY > 0) {
    zoom -= Math.max(event.deltaY * -0.06, 0.06);
  } else if (event.deltaY < 0) {
    zoom -= Math.min(event.deltaY * -0.06, -0.06);
  }
  zoom = Math.min(Math.max(0.125, zoom), 4);
  canvas.style.transform = `scale(${zoom})`;
});

function updateOrganism() {
  organism.species_name = nameInput.value;
  organism.food_collected = parseInt(foodInput.value);
  organism.direction = parseInt(directionInput.value);
  organism.mutability = parseInt(mutationInput.value);
}

exportBtn.addEventListener("click", (event) => {
  updateOrganism();
  let organismToExport = JSON.parse(JSON.stringify(organism)); // deep copy
  organismToExport = offsetOrganism(organismToExport, 1);
  let dataStr = JSON.stringify(organismToExport);
  let dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  let exportFileDefaultName;
  if (nameInput.value === "") {
    exportFileDefaultName = "organism.json";
  } else {
    exportFileDefaultName = `${nameInput.value}.json`;
  }
  exportBtn.setAttribute("href", dataUri);
  exportBtn.setAttribute("download", exportFileDefaultName);
});

let form = document.querySelector("#upload");
let file = document.querySelector("#file");

importBtn.addEventListener("click", (event) => {
  file.click(); // Simulate a click on the file input button
  file.addEventListener("change", importJson); // Make the file submit the form
});

githubBtn.addEventListener("click", event => {
  event.preventDefault();  // Prevents current page from going to the repository
  window.open(githubBtn.getAttribute("href"), "_blank");  // Opens the repository in a new tab
});

function parseFile(event) {
  let str = event.target.result;
  let json = JSON.parse(str);
  organism = json;
  organism = offsetOrganism(organism, -1);

  nameInput.value = organism.species_name;
  foodInput.value = organism.food_collected;
  directionInput.value = organism.direction;
  mutationInput.value = organism.mutability;

  drawCells();
  updateGraph();
}

function importJson(event) {
  event.preventDefault();
  if (!file.value.length) return;
  let reader = new FileReader();
  reader.onload = parseFile;
  reader.readAsText(file.files[0]);
}

let dragstartX;
let dragstartY;
canvasContainer.addEventListener("mousedown", (event) => {
  if (event.button != 1) {
    return;
  }
  dragstartX = event.clientX;
  dragstartY = event.clientY;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

let cellButtons = document.getElementsByClassName("editor-cellbutton");
for (let i = 0; i < cellButtons.length; i++) {
  let cellButton = cellButtons[i];
  cellButton.addEventListener("mousedown", (event) => {
    if (event.button != 0) {
      return;
    }
    for (let i = 0; i < cellButtons.length; i++) {
      let otherCell = cellButtons[i];
      delete otherCell.dataset.active;
    }
    cellButton.dataset.active = "";
    currentCellType = cellButton.dataset.cell;
  });
}

function onMouseMove(event) {
  canvas.style.left = "";
  let draggedX = event.clientX - dragstartX;
  let draggedY = event.clientY - dragstartY;
  dragstartX = event.clientX;
  dragstartY = event.clientY;
  cameraX -= draggedX;
  cameraY += draggedY;
  canvas.style.top = `${cameraY}px`;
  canvas.style.right = `${cameraX}px`;
}

function onMouseUp(event) {
  dragstartX = event.clientX;
  dragstartY = event.clientY;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

canvas.addEventListener("mousedown", event => {
  if (event.button != 0 && event.button != 2) {
    return;
  }
  let canvasRect = canvas.getBoundingClientRect();
  let x = (event.clientX - canvasRect.left) / zoom;
  let y = (event.clientY - canvasRect.top) / zoom;
  let tileX = Math.round(x / cellSize - 0.5) - Math.round(halfGridWidth * 2);
  let tileY = Math.round(y / cellSize - 0.5) - Math.round(halfGridHeight * 2);
  let modifiedBefore = false;
  /*
  modify_cell_stack.forEach((cellpos) => {
    if (tileX == cellpos[0] && tileY == cellpos[1]) {
      modifiedBefore = true;
      return;
    }
  });
  if (modifiedBefore) {
    return;
  }
  */
  let cell = {};
  cell["loc_col"] = tileY;
  cell["loc_row"] = tileX;
  cell["state"] = {};
  if (currentCellType == "eye") {
    cell["direction"] = parseInt(eyeDirectionInput.value);
  }
  if (event.button == 0) {
    cell["state"] = { name: currentCellType };
    organism.anatomy.cells.push(cell);
    console.log(organism.anatomy.cells.length);
    // modify_cell_stack.push([tileX, tileY])
  } else if (event.button == 2) {
    for (let i = organism.anatomy.cells.length-1; i > -1; i--) {
      let c = organism.anatomy.cells[i];
      if (c.loc_col == tileY && c.loc_row == tileX) {
        organism.anatomy.cells.splice(i, 1);
        // modify_cell_stack.push([tileX, tileY])
        break;
      }
    }
  }
  drawCells();
  updateGraph();
});

function drawCells() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = colors.gray;
  let middleX = Math.floor(canvas.width / (2 * cellSize));
  let middleY = Math.floor(canvas.height / (2 * cellSize));
  ctx.fillRect(middleX * cellSize, middleY * cellSize, cellSize, cellSize);

  let cellLength = organism.anatomy.cells.length;
  for (let index = 0; index < cellLength; index++) {
    let cell = organism.anatomy.cells[index];
    let colorName = cellNames[cell.state.name];
    ctx.fillStyle = colors[colorName];
    let cellX = cell.loc_row * cellSize + halfGridWidth * 2 * cellSize; // - cameraX
    let cellY = cell.loc_col * cellSize + halfGridHeight * 2 * cellSize; // - cameraY
    ctx.fillRect(cellX, cellY, cellSize, cellSize);
    if (cell.state.name == "eye") { 
      ctx.fillStyle = colors["black"];
      if (cell.direction == 0) {
        ctx.fillRect(cellX + (0.3 * cellSize), cellY, (0.4*cellSize), cellSize*0.6);
      }
      else if (cell.direction == 2) {
        ctx.fillRect(cellX + (0.3 * cellSize), (cellY + (cellSize*0.4) ), (0.4*cellSize), cellSize*0.6);
      }
      else if (cell.direction == 3) {
        ctx.fillRect(cellX, cellY + (0.3 * cellSize), cellSize*0.6, (0.4*cellSize));
      }
      else if (cell.direction == 1) {
        ctx.fillRect((cellX + (cellSize * 0.4)), cellY + (0.3 * cellSize), cellSize*0.6, (0.4*cellSize));
      }
    }
  }

  ctx.fillStyle = "#555";
  ctx.beginPath();
  ctx.arc(
    middleX * cellSize + cellSize / 2,
    middleY * cellSize + cellSize / 2,
    cellSize * 0.3,
    0,
    2 * Math.PI
  );
  ctx.fill();
  ctx.closePath();
}

function updateGraph() {
  let top_corners = [];
  let bottom_corners = [];
  let left_corners = [];
  let right_corners = [];
  let startX = 0; // canvas.width % cellSize
  for (let x = startX; x < canvas.width; x += cellSize) {
    top_corners.push([x, 0]);
    bottom_corners.push([x, canvas.height]);
  }
  let startY = 0; // canvas.height % cellSize
  for (let y = startY; y < canvas.height; y += cellSize) {
    left_corners.push([0, y]);
    right_corners.push([canvas.width, y]);
  }
  ctx.strokeStyle = colors["black"]; // ctx.fillStyle
  ctx.beginPath();
  for (let index = 0; index < top_corners.length; index += 1) {
    let coord1;
    let coord2;
    coord1 = top_corners[index];
    coord2 = bottom_corners[index];
    ctx.moveTo(coord1[0], coord1[1]);
    ctx.lineTo(coord2[0], coord2[1]);
    ctx.stroke();
  }
  for (let index = 0; index < left_corners.length; index += 1) {
    let coord1;
    let coord2;
    coord1 = left_corners[index];
    coord2 = right_corners[index];
    ctx.moveTo(coord1[0], coord1[1]);
    ctx.lineTo(coord2[0], coord2[1]);
    ctx.stroke();
  }
  ctx.closePath();
}

document.addEventListener(
  "DOMContentLoaded",
  (event) => resizeCanvas(event),
  drawCells(),
  updateGraph()
);

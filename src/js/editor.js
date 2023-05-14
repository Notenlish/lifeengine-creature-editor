const canvas = document.querySelector("canvas");
const canvasContainer = document.querySelector(".canvas-container");
const ctx = canvas.getContext("2d");
const exportBtn = document.querySelector(".jsonexport");
const nameInput = document.querySelector("#org-name");
let cameraX = 0;
let cameraY = 0;
let cellSize = 40;
let holding = false;
let currentCellType = "producer";

// I shouldnt forget to update this when resizing the canvas
let halfGridWidth = Math.round(canvas.width / 4 / cellSize);
let halfGridHeight = Math.round(canvas.height / 4 / cellSize);

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
  black: "#000",
  gray: "#333",
};

let organism = {
  c: 7,
  r: 7,
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

// for some reason the organisms are flipped so i have to fix it ig?
function flipOrganism(org) {
  for (i = 0; i < org.anatomy.cells.length; i++) {
    [org.anatomy.cells[i].loc_col, org.anatomy.cells[i].loc_row] = [
      org.anatomy.cells[i].loc_row,
      org.anatomy.cells[i].loc_col,
    ];
  }
  return org;
}

exportBtn.addEventListener("click", (event) => {
  organism.species_name = nameInput.value;
  let organismToExport = JSON.parse(JSON.stringify(organism)); // deep copy
  organismToExport = flipOrganism(organismToExport);
  let dataStr = JSON.stringify(organismToExport);
  let dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  let exportFileDefaultName = `${nameInput.value}.json`;
  if (nameInput.value == "") {
    exportFileDefaultName = "organism.json";
  }
  exportBtn.setAttribute("href", dataUri);
  exportBtn.setAttribute("download", exportFileDefaultName);
  exportBtn.click();
});

let form = document.querySelector("#upload");
let file = document.querySelector("#file");
form.addEventListener("submit", importJson);

function parseFile(event) {
  let str = event.target.result;
  let json = JSON.parse(str);
  organism = json;
  organism = flipOrganism(organism);
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
for (i = 0; i < cellButtons.length; i++) {
  let cellButton = cellButtons[i];
  cellButton.addEventListener("mousedown", (event) => {
    if (event.button != 0) {
      return;
    }
    for (i = 0; i < cellButtons.length; i++) {
      let otherCell = cellButtons[i];
      delete otherCell.dataset.active;
    }
    cellButton.dataset.active = "";
    currentCellType = cellButton.dataset.cell;
  });
}

function onMouseMove(event) {
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

canvas.addEventListener("mousedown", (event) => {
  if (event.button != 0) {
    return;
  }
  let canvasRect = canvas.getBoundingClientRect();
  let x = event.clientX - canvasRect.left;
  let y = event.clientY - canvasRect.top;
  let tileX = Math.round(x / cellSize - 0.5) - Math.round(halfGridWidth * 2);
  let tileY = Math.round(y / cellSize - 0.5) - Math.round(halfGridHeight * 2);
  let cell = {};
  cell["loc_col"] = tileY;
  cell["loc_row"] = tileX;
  cell["state"] = {};
  if (currentCellType != "remove") {
    cell["state"] = { name: currentCellType };
    organism.anatomy.cells.push(cell);
  } else {
    for (i = 0; i < organism.anatomy.cells.length; i++) {
      let c = organism.anatomy.cells[i];
      if (c.loc_col == tileY && c.loc_row == tileX) {
        organism.anatomy.cells.splice(i, 1);
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
  let middleX = Math.round(canvas.width / (2 * cellSize)) * cellSize;
  let middleY = Math.round(canvas.height / (2 * cellSize)) * cellSize;
  ctx.fillRect(middleX, middleY, cellSize, cellSize);

  let cellLength = organism.anatomy.cells.length;
  for (let index = 0; index < cellLength; index++) {
    let cell = organism.anatomy.cells[index];
    let colorName = cellNames[cell.state.name];
    ctx.fillStyle = colors[colorName];
    let cellX = cell.loc_row * cellSize + halfGridWidth * 2 * cellSize; // - cameraX
    let cellY = cell.loc_col * cellSize + halfGridHeight * 2 * cellSize; // - cameraY
    ctx.fillRect(cellX, cellY, cellSize, cellSize);
  }

  ctx.fillStyle = "#555";
  ctx.beginPath();
  ctx.arc(
    middleX + cellSize / 2,
    middleY + cellSize / 2,
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

drawCells();
updateGraph();

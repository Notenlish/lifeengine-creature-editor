export const canvas = document.querySelector("canvas");
export const canvasContainer = document.querySelector(".canvas-container");
export const ctx = canvas.getContext("2d");
export const exportBtn = document.querySelector("#jsonexport");
export const importBtn = document.querySelector("#jsonimport");
export const resizeBtn = document.querySelector("#canvas-resize");
export const nameInput = document.querySelector("#org-name");
export const foodInput = document.querySelector("#org-food");
export const directionInput = document.querySelector("#org-direction");
export const mutationInput = document.querySelector("#org-mutation");
export const canvasWidthInput = document.querySelector("#canvas-width");
export const canvasHeightInput = document.querySelector("#canvas-height");
export const cellSizeInput = document.querySelector("#canvas-cellSize");
export const eyeDirectionInput = document.querySelector("#eye-direction");

export const cellNames = {
    producer: "green",
    mouth: "orange",
    killer: "red",
    mover: "blue",
    eye: "grey",
    armor: "purple",
  };
  
export const colors = {
    orange: "#DEB14D",
    green: "#15DE59",
    red: "#F82380",
    grey: "#B7C1EA",
    purple: "#7230DB",
    blue: "#60D4FF",
    black: "#222",
    gray: "#333",
};
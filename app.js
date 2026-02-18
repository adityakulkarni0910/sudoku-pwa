let selectedCell = null;
let mistakes = 0;
let seconds = 0;
let timerInterval = null;
let currentDifficulty = "easy";
let darkMode = false;


function solveSudoku(board) {

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {

      if (board[row][col] === null) {

        let numbers = [1,2,3,4,5,6,7,8,9];
        numbers.sort(() => Math.random() - 0.5);

        for (let num of numbers) {

          if (isSafe(board, row, col, num)) {
            board[row][col] = num;

            if (solveSudoku(board)) {
              return true;
            }

            board[row][col] = null;
          }
        }

        return false;
      }
    }
  }

  return true;
}

function getCandidates(board, row, col) {
  let candidates = [];

  for (let num = 1; num <= 9; num++) {
    if (isSafe(board, row, col, num)) {
      candidates.push(num);
    }
  }

  return candidates;
}

function humanSolveDifficulty(board) {

  let difficultyScore = 0;
  let copy = board.map(r => r.slice());
  let progress = true;

  while (progress) {
    progress = false;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {

        if (copy[row][col] === null) {

          let candidates = getCandidates(copy, row, col);

          if (candidates.length === 1) {
            copy[row][col] = candidates[0];
            difficultyScore += 1;
            progress = true;
          } else {
            difficultyScore += candidates.length * 0.5;
          }
        }
      }
    }
  }

  return difficultyScore;
}



function isSafe(board, row, col, num) {

  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

function generateFullBoard() {

  console.log("Generating full board");

  let board = Array.from({ length: 9 }, () => Array(9).fill(null));
  solveSudoku(board);
  return board;
}

function generatePuzzle(targetDifficulty) {

  let attempts = 0;
  let board;  // declare outside loop so we can return it later

  while (attempts < 20) {
    attempts++;

    // 1️⃣ Generate full solved board
    board = generateFullBoard();

    // 2️⃣ Set removal count by difficulty
    let cellsToRemove;

    if (targetDifficulty === "easy") cellsToRemove = 30;
    if (targetDifficulty === "medium") cellsToRemove = 40;
    if (targetDifficulty === "hard") cellsToRemove = 50;

    while (cellsToRemove > 0) {

      let row = Math.floor(Math.random() * 9);
      let col = Math.floor(Math.random() * 9);

      if (board[row][col] !== null) {

        let backup = board[row][col];
        board[row][col] = null;

        let copy = board.map(r => r.slice());

        if (countSolutions(copy) !== 1) {
          board[row][col] = backup;
        } else {
          cellsToRemove--;
        }
      }
    }

    // 3️⃣ Grade difficulty
    let score = humanSolveDifficulty(board);

    if (
      (targetDifficulty === "easy" && score < 25) ||
      (targetDifficulty === "medium" && score >= 25 && score < 60) ||
      (targetDifficulty === "hard" && score >= 60)
    ) {
      return board;   // ✅ RETURN IF MATCH FOUND
    }

    // otherwise loop again
  }

  // ✅ FALLBACK RETURN (prevents infinite loop freeze)
  return board;
}





function toggleDarkMode() {
  darkMode = !darkMode;

  if (darkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}




function loadPuzzle(difficulty) {
  console.log("Loading puzzle:", difficulty);
  clearHighlights();
  selectedCell = null;

  const board = document.getElementById("board");
  board.innerHTML = "";

  const puzzle = generatePuzzle(difficulty);

  puzzle.forEach((row, r) => {
    row.forEach((value, c) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;

      // 3x3 borders
     if (c % 3 === 0) cell.classList.add("box-left");
if (r % 3 === 0) cell.classList.add("box-top");
if ((c + 1) % 3 === 0) cell.classList.add("box-right");
if ((r + 1) % 3 === 0) cell.classList.add("box-bottom");

if (value) {
  cell.textContent = value;
  cell.classList.add("prefilled");
}

// Attach click listener to ALL cells
cell.addEventListener("click", () => selectCell(cell));

      board.appendChild(cell);
    });
  });

restoreGame();

  // reset timer and mistakes
  mistakes = 0;
  document.getElementById("mistakes").textContent = "Mistakes: 0";

  clearInterval(timerInterval);
  seconds = 0;
  document.getElementById("timer").textContent = "Time: 00:00";
  startTimer();
}

function restoreGame() {
  let saved = localStorage.getItem("sudokuBoard");
  if (!saved) return;

  let values = JSON.parse(saved);
  let cells = document.querySelectorAll(".cell");

  cells.forEach((cell, index) => {
    if (!cell.classList.contains("prefilled")) {
      cell.textContent = values[index] || "";
    }
  });
}


function countSolutions(board) {
  let count = 0;

  function solve(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {

        if (board[row][col] === null) {

          for (let num = 1; num <= 9; num++) {

            if (isSafe(board, row, col, num)) {
              board[row][col] = num;

              solve(board);

              board[row][col] = null;
            }
          }

          return;
        }
      }
    }

    count++;
  }

  let copy = board.map(row => row.slice());
  solve(copy);

  return count;
}


function placeNumber(num) {
  saveGame();

  if (!selectedCell) return;

  if (isValid(selectedCell.dataset.row, selectedCell.dataset.col, num)) {
    selectedCell.textContent = num;
    checkWin();
  } else {
  mistakes++;
  document.getElementById("mistakes").textContent = "Mistakes: " + mistakes;

if (mistakes >= 3) {
  clearInterval(timerInterval);
  alert("Game Over");
}
 }

}


function isValid(row, col, num) {
  row = parseInt(row);
  col = parseInt(col);

  // Row & Column check
  for (let i = 0; i < 9; i++) {
    const rowCell = document.querySelector(`[data-row='${row}'][data-col='${i}']`);
    const colCell = document.querySelector(`[data-row='${i}'][data-col='${col}']`);
    if (rowCell.textContent == num || colCell.textContent == num) {
      return false;
    }
  }

  // 3x3 Box check
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      const boxCell = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
      if (boxCell.textContent == num) {
        return false;
      }
    }
  }

  return true;
}


function resetBoard() {
  document.querySelectorAll(".cell").forEach(cell => {
    if (!cell.classList.contains("prefilled")) {
      cell.textContent = "";
    }
  });

  mistakes = 0;
  document.getElementById("mistakes").textContent = "Mistakes: 0";

  clearInterval(timerInterval);
  seconds = 0;
  document.getElementById("timer").textContent = "Time: 00:00";
  startTimer();
}

function changeDifficulty(level) {
  currentDifficulty = level;
  loadPuzzle(level);
}

function checkWin() {
  const cells = document.querySelectorAll(".cell");
  for (let cell of cells) {
    if (cell.textContent === "") return false;
  }

  clearInterval(timerInterval);
  alert("🎉 You solved it!");
  return true;
}


function selectCell(cell) {

  // Toggle off if clicking same cell
  if (selectedCell === cell) {
    clearHighlights();
    selectedCell = null;
    return;
  }

  clearHighlights();

  selectedCell = cell;
  cell.classList.add("selected");

  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  // Important: get numeric value safely
  const value = cell.textContent.trim();

  document.querySelectorAll(".cell").forEach(c => {
    const r = parseInt(c.dataset.row);
    const co = parseInt(c.dataset.col);

    // Row and column highlight
    if (r === row || co === col) {
      c.classList.add("highlight");
    }

    // 3x3 box highlight
    if (
      Math.floor(r / 3) === Math.floor(row / 3) &&
      Math.floor(co / 3) === Math.floor(col / 3)
    ) {
      c.classList.add("highlight");
    }

    // Highlight matching numbers for ALL cells
    if (value !== "" && c.textContent.trim() === value) {
      c.classList.add("match");
    }
  });
}



function clearHighlights() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove("highlight");
    cell.classList.remove("selected");
    cell.classList.remove("match");
  });
}

function eraseNumber() {
  saveGame();

  if (!selectedCell) return;
  selectedCell.textContent = "";
}

function saveGame() {
  let boardState = [];

  document.querySelectorAll(".cell").forEach(cell => {
    boardState.push(cell.textContent);
  });

  localStorage.setItem("sudokuBoard", JSON.stringify(boardState));
}


function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    document.getElementById("timer").textContent =
      "Time: " +
      String(mins).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0");
  }, 1000);
}

const keypad = document.getElementById("keypad");

for (let i = 1; i <= 9; i++) {

  const key = document.createElement("div");
  key.textContent = i;
  key.classList.add("key");
  key.addEventListener("click", () => placeNumber(i));
  keypad.appendChild(key);
}

 const erase = document.createElement("div");
erase.textContent = "X";
erase.classList.add("key");
erase.style.background = "#ffdddd";
erase.style.gridColumn = "span 3";
erase.addEventListener("click", eraseNumber);
keypad.appendChild(erase);

console.log("Script loaded");

loadPuzzle(currentDifficulty);

document.addEventListener("keydown", function(event) {

  if (!selectedCell) return;

  // Prevent editing prefilled cells
  if (selectedCell.classList.contains("prefilled")) return;

  // Numbers 1–9
  if (event.key >= "1" && event.key <= "9") {
    placeNumber(parseInt(event.key));
  }

  // Delete / Backspace
  if (event.key === "Backspace" || event.key === "Delete") {
    eraseNumber();
  }

});

// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("Service Worker Registered"))
      .catch(err => console.log("Service Worker Error:", err));
  });
}


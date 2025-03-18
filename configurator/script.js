let WORDS = [
    'ET', 'ASS', 'FËNNEF', 'ZÉNG', 'VÉIEREL','ZWANZEG', 'HALWER',
    'FIR', 'OP', 'ENG', 'ZWOU', 'DRAI', 'VÉIER',
    'FËNNEF', 'SECHS', 'SIWEN', 'AACHT', 'NÉNG',
    'ZÉNG', 'EELEF', 'ZWIELEF', 'AUER'
];

const COLORS = {
    'ET': '#FFB6C1',
    'ASS': '#98FB98',
    'FËNNEF': '#87CEEB',
    'ZÉNG': '#DDA0DD',
    'VÉIEREL': '#F0E68C',
    'ZWANZEG': '#F1168C',
    'HALWER': '#FFB347',
    'FIR': '#77DD77',
    'OP': '#AEC6CF',
    'ENG': '#B19CD9',
    'ZWOU': '#FFB7B2',
    'DRAI': '#90EE90',
    'VÉIER': '#E6E6FA',
    'SECHS': '#FFA07A',
    'SIWEN': '#87CEFA',
    'AACHT': '#DEB887',
    'NÉNG': '#98FF98',
    'EELEF': '#FFDAB9',
    'ZWIELEF': '#D8BFD8',
    'AUER': '#F0E68C'
};
let selectedCells = [];
let isDragging = false;
let dragStartPos = null;
let currentDragWord = null;
let lastMoveTime = 0;
const MOVE_DELAY = 150; // Increased delay for more controlled movement
const gridState = Array(12).fill().map(() => Array(13).fill(null));

// Initialize grid
function initializeGrid() {
    const grid = document.getElementById('grid');
    for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 13; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell empty-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;

            cell.addEventListener('dragover', handleCellDragOver);
            cell.addEventListener('drop', handleCellDrop);
            cell.addEventListener('dragenter', handleCellDragEnter);
            cell.addEventListener('dragleave', handleCellDragLeave);

            cell.addEventListener('mousedown', startDrag);
            cell.addEventListener('mousemove', handleDrag);
            cell.addEventListener('mouseup', endDrag);

            grid.appendChild(cell);
        }
    }
    document.addEventListener('mouseup', endDrag);
}

// Update word list
function updateWordList() {
    const wordItems = document.getElementById('wordItems');
    wordItems.innerHTML = '';
    WORDS.forEach(word => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word-item';
        wordDiv.textContent = word;
        wordDiv.style.backgroundColor = COLORS[word];
        wordDiv.draggable = true;

        wordDiv.addEventListener('dragstart', (e) => {
            currentDragWord = word;
            wordDiv.classList.add('dragging');
            e.dataTransfer.setData('text/plain', word);
        });

        wordDiv.addEventListener('dragend', () => {
            wordDiv.classList.remove('dragging');
            currentDragWord = null;
        });

        wordItems.appendChild(wordDiv);
    });
}

// Drag and drop handlers
function handleCellDragOver(e) {
    e.preventDefault();
}

function handleCellDragEnter(e) {
    e.preventDefault();
    e.target.classList.add('drag-over');
}

function handleCellDragLeave(e) {
    e.target.classList.remove('drag-over');
}

function handleCellDrop(e) {
    e.preventDefault();
    const cell = e.target;
    cell.classList.remove('drag-over');

    if (!currentDragWord) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (placeWord(currentDragWord, row, col, false)) {
        WORDS = WORDS.filter(w => w !== currentDragWord);
        updateWordList();
    }
}

// Word placement and movement
function placeWord(word, row, col, vertical) {
    const letters = word.split('');

    const isSpaceAvailable = letters.every((_, index) => {
        if (vertical) {
            return row + index < 12 && !gridState[row + index][col];
        } else {
            return col + index < 13 && !gridState[row][col + index];
        }
    });

    if (!isSpaceAvailable) return false;

    letters.forEach((letter, index) => {
        if (vertical) {
            if (row + index < 12) {
                const cell = getCellAt(row + index, col);
                cell.textContent = letter;
                cell.classList.remove('empty-cell');
                cell.dataset.word = word;
                gridState[row + index][col] = { letter, word };
            }
        } else {
            if (col + index < 13) {
                const cell = getCellAt(row, col + index);
                cell.textContent = letter;
                cell.classList.remove('empty-cell');
                cell.dataset.word = word;
                gridState[row][col + index] = { letter, word };
            }
        }
    });
    return true;
}

function startDrag(e) {
    const cell = e.target;
    if (!cell.textContent) return;

    isDragging = true;
    dragStartPos = {
        row: parseInt(cell.dataset.row),
        col: parseInt(cell.dataset.col)
    };

    findConnectedWord(dragStartPos.row, dragStartPos.col);
    e.preventDefault(); // Prevent text selection
}

function handleDrag(e) {
    if (!isDragging || !dragStartPos) return;

    const currentTime = Date.now();
    if (currentTime - lastMoveTime < MOVE_DELAY) {
        return;
    }

    const cell = e.target;
    if (!cell.classList.contains('cell')) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (isNaN(row) || isNaN(col)) return;
    if (row === dragStartPos.row && col === dragStartPos.col) return;

    const rowOffset = Math.sign(row - dragStartPos.row);
    const colOffset = Math.sign(col - dragStartPos.col);

    if (rowOffset === 0 && colOffset === 0) return;

    if (moveWord(rowOffset, colOffset)) {
        lastMoveTime = currentTime;
        dragStartPos = {
            row: dragStartPos.row + rowOffset,
            col: dragStartPos.col + colOffset
        };
    }
}

let lastValidPosition = null; // Add this with your other global variables
// Add this as a global variable at the top with your other variables
// Add this as a global variable at the top with your other variables
// Add these as global variables at the top
let originalGridState = null;
// Add this as a global variable at the top
let tempHiddenCells = new Map(); // To store temporarily hidden cells
// Add this as a global variable at the top
function moveWord(rowOffset, colOffset) {
    if (!lastValidPosition) {
        // Store initial state and position only once at start of drag
        originalGridState = gridState.map(row => row.map(cell => cell ? {...cell} : null));
        lastValidPosition = selectedCells.map(cell => ({
            ...cell,
            wordData: {...gridState[cell.row][cell.col]}
        }));
        
        // Clear original word position from originalGridState
        selectedCells.forEach(cell => {
            originalGridState[cell.row][cell.col] = null;
        });
    }

    const isValid = selectedCells.every(cell => {
        const newRow = cell.row + rowOffset;
        const newCol = cell.col + colOffset;
        return newRow >= 0 && newRow < 12 && newCol >= 0 && newCol < 13;
    });

    if (!isValid) return false;

    // First, restore the entire grid to its original state
    for (let row = 0; row < gridState.length; row++) {
        for (let col = 0; col < gridState[row].length; col++) {
            const cell = getCellAt(row, col);
            const originalData = originalGridState[row][col];
            
            if (originalData) {
                cell.textContent = originalData.letter;
                cell.className = 'cell';
                cell.dataset.word = originalData.word;
                gridState[row][col] = {...originalData};
            } else {
                cell.textContent = '';
                cell.className = 'cell empty-cell';
                delete cell.dataset.word;
                gridState[row][col] = null;
            }
        }
    }

    // Update positions
    selectedCells = selectedCells.map(cell => ({
        row: cell.row + rowOffset,
        col: cell.col + colOffset
    }));

    // Show moving word on top
    selectedCells.forEach((cell, index) => {
        const newCell = getCellAt(cell.row, cell.col);
        const originalData = lastValidPosition[index].wordData;
        if (originalData) {
            newCell.textContent = originalData.letter;
            newCell.className = 'cell selected';
            newCell.dataset.word = originalData.word;
        }
    });

    return true;
}

function endDrag() {
    if (isDragging && selectedCells.length > 0 && lastValidPosition) {
        const hasCollision = selectedCells.some(cell => 
            originalGridState[cell.row][cell.col] !== null
        );

        if (hasCollision) {
            // Restore entire grid to original state
            for (let row = 0; row < gridState.length; row++) {
                for (let col = 0; col < gridState[row].length; col++) {
                    const cell = getCellAt(row, col);
                    const originalData = originalGridState[row][col];
                    
                    if (originalData) {
                        cell.textContent = originalData.letter;
                        cell.className = 'cell';
                        cell.dataset.word = originalData.word;
                        gridState[row][col] = {...originalData};
                    } else {
                        cell.textContent = '';
                        cell.className = 'cell empty-cell';
                        delete cell.dataset.word;
                        gridState[row][col] = null;
                    }
                }
            }

            // Restore moving word to original position
            selectedCells = lastValidPosition.map(cell => ({
                row: cell.row,
                col: cell.col
            }));

            // Show the word in its original position
            selectedCells.forEach((cell, index) => {
                const originalData = lastValidPosition[index].wordData;
                if (originalData) {
                    const currentCell = getCellAt(cell.row, cell.col);
                    currentCell.textContent = originalData.letter;
                    currentCell.className = 'cell';
                    currentCell.dataset.word = originalData.word;
                    gridState[cell.row][cell.col] = {...originalData};
                }
            });
        } else {
            // Update final position if no collision
            selectedCells.forEach((cell, index) => {
                const originalData = lastValidPosition[index].wordData;
                if (originalData) {
                    const currentCell = getCellAt(cell.row, cell.col);
                    currentCell.textContent = originalData.letter;
                    currentCell.className = 'cell';
                    currentCell.dataset.word = originalData.word;
                    gridState[cell.row][cell.col] = {...originalData};
                }
            });
        }
    }

    isDragging = false;
    dragStartPos = null;
    lastMoveTime = 0;
    lastValidPosition = null;
    originalGridState = null;
}

// Utility functions
function getCellAt(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function findConnectedWord(row, col) {
    selectedCells = [];
    if (!gridState[row][col]) return;

    const currentWord = gridState[row][col].word;

    for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 13; j++) {
            if (gridState[i][j] && gridState[i][j].word === currentWord) {
                selectedCells.push({ row: i, col: j });
                getCellAt(i, j).classList.add('selected');
            }
        }
    }
}

function previewMove(rowOffset, colOffset) {
    const isValid = selectedCells.every(cell => {
        const newRow = cell.row + rowOffset;
        const newCol = cell.col + colOffset;
        return newRow >= 0 && newRow < 12 &&
            newCol >= 0 && newCol < 13 &&
            (!gridState[newRow][newCol] ||
                selectedCells.some(selected =>
                    selected.row === newRow && selected.col === newCol));
    });

    if (!isValid) return;

    const wordData = selectedCells.map(cell => ({
        ...gridState[cell.row][cell.col],
        oldRow: cell.row,
        oldCol: cell.col
    }));

    selectedCells.forEach(cell => {
        const oldCell = getCellAt(cell.row, cell.col);
        oldCell.textContent = '';
        oldCell.className = 'cell empty-cell';
        delete oldCell.dataset.word;
        gridState[cell.row][cell.col] = null;
    });

    wordData.forEach(data => {
        const newRow = data.oldRow + rowOffset;
        const newCol = data.oldCol + colOffset;
        const newCell = getCellAt(newRow, newCol);

        newCell.textContent = data.letter;
        newCell.className = 'cell selected';
        newCell.dataset.word = data.word;
        gridState[newRow][newCol] = {
            letter: data.letter,
            word: data.word
        };
    });

    selectedCells = selectedCells.map(cell => ({
        row: cell.row + rowOffset,
        col: cell.col + colOffset
    }));
}

function rotateSelectedWord() {
    if (selectedCells.length < 2) return;

    const wordData = selectedCells.map(cell => ({
        ...gridState[cell.row][cell.col],
        oldRow: cell.row,
        oldCol: cell.col
    }));

    const isHorizontal = selectedCells[0].row === selectedCells[1].row;
    const startRow = Math.min(...selectedCells.map(cell => cell.row));
    const startCol = Math.min(...selectedCells.map(cell => cell.col));

    // Check if rotation would collide with existing words
    const wouldCollide = wordData.some((_, index) => {
        const newRow = isHorizontal ? startRow + index : startRow;
        const newCol = isHorizontal ? startCol : startCol + index;

        // Check if new position would overlap with a different word
        return gridState[newRow]?.[newCol] &&
            !selectedCells.some(cell => cell.row === newRow && cell.col === newCol);
    });

    if (wouldCollide) {
        return; // Prevent rotation if it would collide
    }
    selectedCells.forEach(cell => {
        const currentCell = getCellAt(cell.row, cell.col);
        currentCell.textContent = '';
        currentCell.className = 'cell empty-cell';
        delete currentCell.dataset.word;
        gridState[cell.row][cell.col] = null;
    });

    const canRotate = isHorizontal
        ? startRow + wordData.length <= 12
        : startCol + wordData.length <= 13;

    if (!canRotate) {
        wordData.forEach(data => {
            const cell = getCellAt(data.oldRow, data.oldCol);
            cell.textContent = data.letter;
            cell.className = 'cell';
            cell.dataset.word = data.word;
            gridState[data.oldRow][data.oldCol] = {
                letter: data.letter,
                word: data.word
            };
        });
        return;
    }

    selectedCells = [];
    wordData.forEach((data, index) => {
        const newRow = isHorizontal ? startRow + index : startRow;
        const newCol = isHorizontal ? startCol : startCol + index;
        const cell = getCellAt(newRow, newCol);

        cell.textContent = data.letter;
        cell.className = 'cell';
        cell.dataset.word = data.word;
        gridState[newRow][newCol] = {
            letter: data.letter,
            word: data.word
        };
        selectedCells.push({ row: newRow, col: newCol });
    });
}

function clearSelection() {
    selectedCells.forEach(cell => {
        getCellAt(cell.row, cell.col).classList.remove('selected');
    });
    selectedCells = [];
}

function addCustomWord() {
    const input = document.getElementById('customWordInput');
    const newWord = input.value.trim().toUpperCase();
    if (newWord && !WORDS.includes(newWord)) {
        WORDS.push(newWord);
        // Assign a random color to the new word
        COLORS[newWord] = '#' + Math.floor(Math.random() * 16777215).toString(16);
        // Add the CSS rule for the new word
        const style = document.createElement('style');
        style.textContent = `[data-word="${newWord}"] { background-color: ${COLORS[newWord]}; }`;
        document.head.appendChild(style);
        updateWordList();
        input.value = '';
    }
}

// Add this function to generate coordinates in the required format
function generateCoordinateCode() {
    const wordData = {};
    
    // Collect all words and their coordinates from the grid
    for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 13; col++) {
            if (gridState[row][col]) {
                const word = gridState[row][col].word;
                if (!wordData[word]) {
                    wordData[word] = [];
                }
                wordData[word].push({ row, col });
            }
        }
    }
    
    // Sort coordinates for each word to ensure they're in the right order
    for (const word in wordData) {
        // Sort horizontally or vertically based on word orientation
        const isHorizontal = wordData[word].length > 1 && 
                            wordData[word][0].row === wordData[word][1].row;
        
        if (isHorizontal) {
            wordData[word].sort((a, b) => a.col - b.col);
        } else {
            wordData[word].sort((a, b) => a.row - b.row);
        }
    }
    
    // Standard words from your original list
    const standardWords = ["ET", "ASS", "OP", "FIR", "FËNNEF", "ZÉNG", "VÉIEREL", 
                          "ZWANZEG", "HALWER", "ENG", "ZWOU", "DRAI", "VÉIER", 
                          "SECHS", "SIWEN", "AACHT", "NÉNG", "EELEF", "ZWIELEF", "AUER"];
    
    // Generate the formatted code
    result = "const int BOTTOM_LEDS[] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}; // x coordinates of bottom row\n";
    result += "const int BOTTOM_ROW = 11; // y coordinate of bottom row\n\n";
    result += "// Define words with their exact coordinates\n";
    
    // Process standard words first
    for (const word of standardWords) {
        if (wordData[word]) {
            let varName = word;
            // Handle special characters for variable names
            varName = varName.replace(/Ë/g, "E").replace(/É/g, "E")
                           .replace(/Ä/g, "A").replace(/Ü/g, "U").replace(/Ö/g, "O");
            
            // Handle duplicate words
            if (word === "FËNNEF" && Object.keys(wordData).filter(w => w === "FËNNEF").length > 1) {
                const fennefCount = Object.keys(wordData).filter(w => w === "FËNNEF").indexOf(word) + 1;
                varName = `FENNEF${fennefCount}`;
            } else if (word === "ZÉNG" && Object.keys(wordData).filter(w => w === "ZÉNG").length > 1) {
                const zengCount = Object.keys(wordData).filter(w => w === "ZÉNG").indexOf(word) + 1;
                varName = `ZENG${zengCount}`;
            }
            
            const coordStr = wordData[word].map(coord => `{${coord.col},${coord.row}}`).join(", ");
            result += `const Coordinate ${varName}[] = {${coordStr}};\n`;
        }
    }
    
    // Process special words (custom words)
    const specialWords = Object.keys(wordData).filter(word => !standardWords.includes(word));
    
    if (specialWords.length > 0) {
        result += "\n// Special words\n";
        for (const word of specialWords) {
            let varName = word;
            // Handle special characters for variable names
            varName = varName.replace(/Ë/g, "E").replace(/É/g, "E")
                           .replace(/Ä/g, "A").replace(/Ü/g, "U").replace(/Ö/g, "O");
            
            const coordStr = wordData[word].map(coord => `{${coord.col},${coord.row}}`).join(", ");
            result += `const Coordinate ${varName}[] = {${coordStr}};\n`;
        }
    }
    
    return result;
}

// Add this function to display the generated code
function showGeneratedCode() {
    const code = generateCoordinateCode();
    
    // Create a modal to display the code
    const modal = document.createElement('div');
    modal.className = 'code-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'code-modal-content';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
    };
    
    const codeHeader = document.createElement('h3');
    codeHeader.textContent = 'Generated Coordinate Code';
    
    const codeDisplay = document.createElement('pre');
    codeDisplay.textContent = code;
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy to Clipboard';
    copyBtn.onclick = function() {
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy to Clipboard';
            }, 2000);
        });
    };
    
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(codeHeader);
    modalContent.appendChild(codeDisplay);
    modalContent.appendChild(copyBtn);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
}



// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    updateWordList();
});

// Prevent text selection during drag
document.addEventListener('selectstart', (e) => {
    if (isDragging) {
        e.preventDefault();
    }
});
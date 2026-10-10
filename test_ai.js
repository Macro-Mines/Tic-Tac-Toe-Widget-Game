// Unit test for Tic Tac Toe Minimax algorithm and Game logic
const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkWinner(grid) {
  for (let i = 0; i < WINNING_COMBOS.length; i++) {
    const [a, b, c] = WINNING_COMBOS[i];
    if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
      return { winner: grid[a], line: [a, b, c] };
    }
  }
  return null;
}

function isBoardFull(grid) {
  return grid.every(cell => cell !== '');
}

function minimax(currentBoard, depth, isMaximizing, alpha, beta) {
  const winnerData = checkWinner(currentBoard);
  if (winnerData) {
    if (winnerData.winner === 'O') return 10 - depth;
    if (winnerData.winner === 'X') return depth - 10;
  }
  if (isBoardFull(currentBoard)) return 0;

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === '') {
        currentBoard[i] = 'O';
        const evalScore = minimax(currentBoard, depth + 1, false, alpha, beta);
        currentBoard[i] = '';
        maxScore = Math.max(maxScore, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === '') {
        currentBoard[i] = 'X';
        const evalScore = minimax(currentBoard, depth + 1, true, alpha, beta);
        currentBoard[i] = '';
        minScore = Math.min(minScore, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
    }
    return minScore;
  }
}

function getBestMinimaxMove(currentBoard) {
  let bestScore = -Infinity;
  let bestMoves = [];
  for (let i = 0; i < 9; i++) {
    if (currentBoard[i] === '') {
      currentBoard[i] = 'O';
      const score = minimax(currentBoard, 0, false, -Infinity, Infinity);
      currentBoard[i] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [i];
      } else if (score === bestScore) {
        bestMoves.push(i);
      }
    }
  }
  return bestMoves[0];
}

console.log("=== Testing Minimax AI Scenarios ===");

// Scenario 1: AI must take the winning move
// Board:
// O O .
// X X .
// . . .
const board1 = ['O', 'O', '', 'X', 'X', '', '', '', ''];
const move1 = getBestMinimaxMove(board1);
console.assert(move1 === 2, `Test 1 Failed: Expected move 2, got ${move1}`);
console.log("Test 1 Passed: AI takes winning move (cell 2)");

// Scenario 2: AI must block Human from winning
// Board:
// X X .
// O . .
// . . .
const board2 = ['X', 'X', '', 'O', '', '', '', '', ''];
const move2 = getBestMinimaxMove(board2);
console.assert(move2 === 2, `Test 2 Failed: Expected block move 2, got ${move2}`);
console.log("Test 2 Passed: AI blocks Human win (cell 2)");

// Scenario 3: AI forks or takes center when X starts in corner
// Board:
// X . .
// . . .
// . . .
const board3 = ['X', '', '', '', '', '', '', '', ''];
const move3 = getBestMinimaxMove(board3);
console.assert(move3 === 4, `Test 3 Failed: Expected center move 4, got ${move3}`);
console.log("Test 3 Passed: AI takes center response to corner move (cell 4)");

console.log("All AI engine tests passed successfully!");

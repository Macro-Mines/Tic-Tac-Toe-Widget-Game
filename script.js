/**
 * Tic Tac Toe AI • Windows Desktop Widget Logic
 * Features:
 * - Instant Launch Trigger (Dedicated Button & Hotkeys F12 / Alt+T / Calculator Key)
 * - Basic AI (Random moves) & Advanced AI (Unbeatable Minimax Algorithm)
 * - 3x3 Tactile Grid with Rounded Buttons & Ghost Hover Previews
 * - Status Bar with Turn indicator & AI Thinking Animation
 * - Side Score Tracker (Wins, Draws, Streak) with localStorage Persistence
 * - Web Audio API Synthesizer Sound Effects
 * - Draggable Windows 11 Title Bar
 */

(function () {
  'use strict';

  // --- Game State ---
  let board = ['', '', '', '', '', '', '', '', ''];
  let currentPlayer = 'X'; // Human starts as X
  let isGameActive = true;
  let moveCount = 0;
  let isAiMode = true;
  let aiDifficulty = 'advanced'; // 'basic' | 'advanced'
  let soundEnabled = true;
  let currentStreak = 0;

  const scores = {
    X: 0,
    O: 0,
    ties: 0
  };

  // Winning combinations indices
  const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  // --- DOM Elements ---
  const widgetWrapper = document.getElementById('widgetWrapper');
  const widgetCard = document.getElementById('widgetCard');
  const widgetTitlebar = document.getElementById('widgetTitlebar');
  const dedicatedLaunchBtn = document.getElementById('dedicatedLaunchBtn');
  const launcherBtnLabel = document.getElementById('launcherBtnLabel');
  const minimizeBtn = document.getElementById('minimizeBtn');
  const closeBtn = document.getElementById('closeBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');

  const statusBarCard = document.getElementById('statusBarCard');
  const statusBadge = document.getElementById('statusBadge');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');
  const aiThinkingDots = document.getElementById('aiThinkingDots');
  const turnDot = document.getElementById('turnDot');
  const turnCounterLabel = document.getElementById('turnCounterLabel');
  const statusFill = document.getElementById('statusFill');

  const boardGrid = document.getElementById('boardGrid');
  const cellButtons = Array.from(document.querySelectorAll('.cell-button'));
  const resetGameBtn = document.getElementById('resetGameBtn');
  const clearScoresBtn = document.getElementById('clearScoresBtn');

  const modeAiBtn = document.getElementById('modeAiBtn');
  const mode2pBtn = document.getElementById('mode2pBtn');
  const diffBasicBtn = document.getElementById('diffBasicBtn');
  const diffAdvancedBtn = document.getElementById('diffAdvancedBtn');
  const currentDiffPill = document.getElementById('currentDiffPill');
  const footerStatusText = document.getElementById('footerStatusText');

  const scoreCardX = document.getElementById('scoreCardX');
  const scoreCardO = document.getElementById('scoreCardO');
  const scoreCardTies = document.getElementById('scoreCardTies');
  const scoreValX = document.getElementById('scoreValX');
  const scoreValO = document.getElementById('scoreValO');
  const scoreValTies = document.getElementById('scoreValTies');
  const scoreLabelO = document.getElementById('scoreLabelO');
  const streakVal = document.getElementById('streakVal');

  // --- Audio Synthesis (Web Audio API) ---
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.09, volume = 0.12) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function soundMove(player) {
    if (player === 'X') {
      playTone(560, 'sine', 0.08, 0.15);
    } else {
      playTone(420, 'sine', 0.09, 0.14);
    }
  }

  function soundWin() {
    playTone(523.25, 'triangle', 0.1, 0.18); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.12, 0.18), 100); // E5
    setTimeout(() => playTone(783.99, 'triangle', 0.25, 0.22), 200); // G5
  }

  function soundTie() {
    playTone(340, 'sine', 0.12, 0.15);
    setTimeout(() => playTone(280, 'sine', 0.18, 0.15), 110);
  }

  function soundLaunch() {
    playTone(660, 'sine', 0.07, 0.1);
    setTimeout(() => playTone(880, 'sine', 0.1, 0.12), 70);
  }

  // --- Local Storage Persistence ---
  function loadPersistedState() {
    try {
      const savedScores = localStorage.getItem('ttt_scores');
      if (savedScores) {
        const parsed = JSON.parse(savedScores);
        scores.X = parsed.X || 0;
        scores.O = parsed.O || 0;
        scores.ties = parsed.ties || 0;
      }
      const savedStreak = localStorage.getItem('ttt_streak');
      if (savedStreak) {
        currentStreak = parseInt(savedStreak, 10) || 0;
      }
      const savedDiff = localStorage.getItem('ttt_diff');
      if (savedDiff && (savedDiff === 'basic' || savedDiff === 'advanced')) {
        setDifficulty(savedDiff);
      }
    } catch (e) {
      console.warn('Storage read error', e);
    }
    updateScoreboardDisplay();
  }

  function savePersistedState() {
    try {
      localStorage.setItem('ttt_scores', JSON.stringify(scores));
      localStorage.setItem('ttt_streak', currentStreak.toString());
      localStorage.setItem('ttt_diff', aiDifficulty);
    } catch (e) {
      // ignore
    }
  }

  // --- UI Update Functions ---
  function updateScoreboardDisplay() {
    scoreValX.textContent = scores.X;
    scoreValO.textContent = scores.O;
    scoreValTies.textContent = scores.ties;
    streakVal.textContent = currentStreak;
  }

  function updateTurnStatus(isAiComputing = false) {
    turnCounterLabel.textContent = `TURN ${moveCount + 1}`;

    // Update ghost previews for all unoccupied cells
    const nextMark = currentPlayer;
    cellButtons.forEach(btn => {
      if (!btn.classList.contains('taken')) {
        btn.setAttribute('data-ghost', nextMark);
      }
    });

    if (currentPlayer === 'X') {
      // Human turn
      statusBarCard.className = 'status-bar-card';
      statusBadge.textContent = 'X';
      statusTitle.textContent = isAiMode ? 'Your Turn (Human)' : "Player X's Turn";
      statusMessage.textContent = isAiMode ? 'Select a cell on the 3x3 grid' : 'Place your mark';
      aiThinkingDots.classList.remove('active');

      scoreCardX.classList.add('active-turn');
      scoreCardO.classList.remove('active-turn');
      footerStatusText.textContent = isAiMode 
        ? `Ready • ${aiDifficulty === 'advanced' ? 'Minimax AI active' : 'Basic Random AI active'}` 
        : '2-Player local match in progress';
    } else {
      // AI or Player O turn
      statusBarCard.className = 'status-bar-card state-o';
      statusBadge.textContent = 'O';
      statusTitle.textContent = isAiMode ? 'AI Turn (Opponent)' : "Player O's Turn";
      statusMessage.textContent = isAiMode ? 'Calculating next move...' : 'Place your mark';

      if (isAiMode && isAiComputing) {
        aiThinkingDots.classList.add('active');
        footerStatusText.textContent = 'AI is evaluating moves...';
      } else {
        aiThinkingDots.classList.remove('active');
      }

      scoreCardO.classList.add('active-turn');
      scoreCardX.classList.remove('active-turn');
    }
  }

  // --- Move Execution ---
  function executeMove(index, player) {
    if (board[index] !== '' || !isGameActive) return;

    board[index] = player;
    moveCount++;

    const cellBtn = cellButtons[index];
    cellBtn.classList.add('taken', player === 'X' ? 'taken-x' : 'taken-o');
    cellBtn.removeAttribute('data-ghost');

    const markSpan = cellBtn.querySelector('.cell-mark');
    markSpan.textContent = player;
    markSpan.className = `cell-mark pop-in ${player === 'X' ? 'mark-x' : 'mark-o'}`;

    soundMove(player);

    const winResult = checkWinner(board);

    if (winResult) {
      handleGameEnd(winResult.winner, winResult.line);
    } else if (isBoardFull(board)) {
      handleGameEnd('tie', null);
    } else {
      // Switch player
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      updateTurnStatus();

      // Trigger AI if it's AI's turn
      if (isAiMode && currentPlayer === 'O') {
        triggerAiTurn();
      }
    }
  }

  // --- Win / Draw Handling ---
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

  function handleGameEnd(winner, line) {
    isGameActive = false;

    if (winner === 'tie') {
      scores.ties++;
      currentStreak = 0;
      statusBarCard.className = 'status-bar-card state-draw';
      statusBadge.textContent = '=';
      statusTitle.textContent = 'Draw Game';
      statusMessage.textContent = 'Stalemate — No moves remaining!';
      turnCounterLabel.textContent = 'DRAW';
      aiThinkingDots.classList.remove('active');
      footerStatusText.textContent = 'Match drawn! Click Restart or Spacebar to replay.';
      soundTie();
    } else {
      scores[winner]++;
      if (winner === 'X') {
        currentStreak++;
      } else {
        currentStreak = 0;
      }

      // Highlight winning triple
      line.forEach(idx => {
        cellButtons[idx].classList.add('win-cell');
      });

      statusBarCard.className = 'status-bar-card state-win';
      statusBadge.textContent = '★';
      statusTitle.textContent = 'Victory!';
      
      if (isAiMode) {
        statusMessage.textContent = winner === 'X' 
          ? 'Brilliant! You defeated the AI Opponent!' 
          : 'AI Opponent secured the win!';
      } else {
        statusMessage.textContent = `Player ${winner} claims victory!`;
      }

      turnCounterLabel.textContent = 'VICTORY';
      aiThinkingDots.classList.remove('active');
      footerStatusText.textContent = `Player ${winner} won! Press Spacebar for a new round.`;
      soundWin();
    }

    updateScoreboardDisplay();
    savePersistedState();
  }

  // --- AI Opponent Engine ---
  function triggerAiTurn() {
    updateTurnStatus(true);
    
    // Quick, realistic response delay (180ms - 320ms) so the interaction feels responsive and natural
    const delay = aiDifficulty === 'basic' ? 240 : 280;

    setTimeout(() => {
      if (!isGameActive || currentPlayer !== 'O') return;

      let chosenIndex;
      if (aiDifficulty === 'basic') {
        chosenIndex = getBasicMove(board);
      } else {
        chosenIndex = getBestMinimaxMove(board);
      }

      if (chosenIndex !== -1 && chosenIndex !== undefined) {
        executeMove(chosenIndex, 'O');
      }
    }, delay);
  }

  /**
   * Basic Difficulty:
   * Chooses random valid moves from available empty cells.
   */
  function getBasicMove(currentBoard) {
    const available = [];
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === '') available.push(i);
    }
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
  }

  /**
   * Advanced Difficulty:
   * Minimax Algorithm with Alpha-Beta Pruning.
   * Guarantees optimal counterplay.
   */
  function getBestMinimaxMove(currentBoard) {
    // If board is empty or AI goes first, center or corner is optimal
    const emptyCount = currentBoard.filter(c => c === '').length;
    if (emptyCount === 9) return 4; // Center
    if (emptyCount === 8 && currentBoard[4] === '') return 4; // Take center if open

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

    // Pick from equally optimal moves for natural variety
    if (bestMoves.length > 0) {
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    return -1;
  }

  function minimax(currentBoard, depth, isMaximizing, alpha, beta) {
    const winnerData = checkWinner(currentBoard);
    if (winnerData) {
      // AI ('O') wins: positive score weighted by faster depth
      if (winnerData.winner === 'O') return 10 - depth;
      // Human ('X') wins: negative score
      if (winnerData.winner === 'X') return depth - 10;
    }

    if (isBoardFull(currentBoard)) {
      return 0; // Draw
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === '') {
          currentBoard[i] = 'O';
          const evaluation = minimax(currentBoard, depth + 1, false, alpha, beta);
          currentBoard[i] = '';
          maxScore = Math.max(maxScore, evaluation);
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break; // Alpha-beta cutoff
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === '') {
          currentBoard[i] = 'X';
          const evaluation = minimax(currentBoard, depth + 1, true, alpha, beta);
          currentBoard[i] = '';
          minScore = Math.min(minScore, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break; // Cutoff
        }
      }
      return minScore;
    }
  }

  // --- Reset & Restart ---
  function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    isGameActive = true;
    moveCount = 0;

    cellButtons.forEach(btn => {
      btn.className = 'cell-button';
      btn.setAttribute('data-ghost', 'X');
      const markSpan = btn.querySelector('.cell-mark');
      markSpan.textContent = '';
      markSpan.className = 'cell-mark';
    });

    updateTurnStatus();
  }

  function clearAllScores() {
    scores.X = 0;
    scores.O = 0;
    scores.ties = 0;
    currentStreak = 0;
    updateScoreboardDisplay();
    savePersistedState();
    resetGame();
  }

  // --- Difficulty Setting ---
  function setDifficulty(diff) {
    aiDifficulty = diff;
    if (diff === 'basic') {
      diffBasicBtn.classList.add('active');
      diffAdvancedBtn.classList.remove('active');
      currentDiffPill.textContent = 'Basic (Random)';
      footerStatusText.textContent = 'AI Mode: Basic (Random Moves)';
    } else {
      diffAdvancedBtn.classList.add('active');
      diffBasicBtn.classList.remove('active');
      currentDiffPill.textContent = 'Minimax AI';
      footerStatusText.textContent = 'AI Mode: Advanced Minimax Tree';
    }
    savePersistedState();
    if (isAiMode && isGameActive && moveCount > 0) {
      resetGame();
    }
  }

  // --- Dedicated Launcher & Instant Widget Visibility ---
  let isWidgetVisible = true;

  function toggleWidget(forceState) {
    if (typeof forceState === 'boolean') {
      isWidgetVisible = forceState;
    } else {
      isWidgetVisible = !isWidgetVisible;
    }

    if (isWidgetVisible) {
      widgetWrapper.classList.remove('hidden');
      if (launcherBtnLabel) launcherBtnLabel.textContent = 'Close Widget';
      soundLaunch();
    } else {
      widgetWrapper.classList.add('hidden');
      if (launcherBtnLabel) launcherBtnLabel.textContent = 'Launch Tic Tac Toe AI';
      playTone(400, 'sine', 0.08, 0.08);
    }
  }

  // --- Draggable Window Logic (Windows 11 Style) ---
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  function initDraggable() {
    widgetTitlebar.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons on titlebar
      if (e.target.closest('.titlebar-actions') || e.target.closest('button')) {
        return;
      }
      isDragging = true;
      const rect = widgetCard.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      document.body.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const newX = e.clientX - dragOffsetX;
      const newY = e.clientY - dragOffsetY;

      // Keep within bounds
      const maxX = window.innerWidth - widgetCard.offsetWidth;
      const maxY = window.innerHeight - widgetCard.offsetHeight;

      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      widgetCard.style.position = 'fixed';
      widgetCard.style.left = `${clampedX}px`;
      widgetCard.style.top = `${clampedY}px`;
      widgetCard.style.transform = 'none';
      widgetCard.style.margin = '0';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = 'default';
      }
    });
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // 3x3 Grid Clicks
    cellButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        initAudio();
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (isAiMode && currentPlayer === 'O') return; // Wait for AI
        executeMove(index, currentPlayer);
      });
    });

    // Reset Buttons
    resetGameBtn.addEventListener('click', () => {
      initAudio();
      resetGame();
    });

    clearScoresBtn.addEventListener('click', () => {
      initAudio();
      clearAllScores();
    });

    // Mode Switches
    modeAiBtn.addEventListener('click', () => {
      isAiMode = true;
      modeAiBtn.classList.add('active');
      mode2pBtn.classList.remove('active');
      scoreLabelO.textContent = 'AI (O)';
      resetGame();
    });

    mode2pBtn.addEventListener('click', () => {
      isAiMode = false;
      mode2pBtn.classList.add('active');
      modeAiBtn.classList.remove('active');
      scoreLabelO.textContent = 'P2 (O)';
      resetGame();
    });

    // Difficulty Buttons
    diffBasicBtn.addEventListener('click', () => setDifficulty('basic'));
    diffAdvancedBtn.addEventListener('click', () => setDifficulty('advanced'));

    // Sound FX Toggle
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundIconOn.style.display = soundEnabled ? 'inline-block' : 'none';
      soundIconOff.style.display = soundEnabled ? 'none' : 'inline-block';
      if (soundEnabled) playTone(540, 'sine', 0.08);
    });

    // Theme Toggle (Dark/Light)
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });

    // Dedicated Trigger Button (if present)
    if (dedicatedLaunchBtn) {
      dedicatedLaunchBtn.addEventListener('click', () => {
        initAudio();
        toggleWidget();
      });
    }

    // Minimize & Close Buttons (if present)
    if (minimizeBtn) minimizeBtn.addEventListener('click', () => toggleWidget(false));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleWidget(false));

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      initAudio();

      // F12 or Alt+T: Instant Launch / Toggle Widget
      if (e.key === 'F12' || (e.altKey && (e.key === 't' || e.key === 'T'))) {
        e.preventDefault();
        toggleWidget();
        return;
      }

      // Spacebar: Quick Reset
      if (e.code === 'Space' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        resetGame();
        return;
      }

      // Number keys 1-9 for keypad moves
      // Supporting standard numpad layout:
      // 7 8 9  -> 0 1 2
      // 4 5 6  -> 3 4 5
      // 1 2 3  -> 6 7 8
      // And standard top-row digits 1-9
      const numpadMap = {
        'Numpad7': 0, 'Numpad8': 1, 'Numpad9': 2,
        'Numpad4': 3, 'Numpad5': 4, 'Numpad6': 5,
        'Numpad1': 6, 'Numpad2': 7, 'Numpad3': 8,
        'Digit1': 0, 'Digit2': 1, 'Digit3': 2,
        'Digit4': 3, 'Digit5': 4, 'Digit6': 5,
        'Digit7': 6, 'Digit8': 7, 'Digit9': 8
      };

      if (numpadMap.hasOwnProperty(e.code)) {
        const cellIdx = numpadMap[e.code];
        if (isGameActive && (!isAiMode || currentPlayer === 'X')) {
          executeMove(cellIdx, currentPlayer);
        }
      }
    });

    initDraggable();
  }

  // --- Initialize App ---
  function init() {
    loadPersistedState();
    setupEventListeners();
    updateTurnStatus();
  }

  init();
})();

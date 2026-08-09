/* ============================================
   APP CONTROLLER — Screen Router & Game State
   ============================================ */

(function () {
  'use strict';

  // === PUZZLE DATA ===
  const PUZZLES = {
    puppy: {
      id: 'puppy',
      title: 'Friendly Puppy',
      image: 'images/puzzle-puppy.png',
      cols: 3,
      rows: 2,
      pieces: 6,
      unlocked: true,
    },
    castle: {
      id: 'castle',
      title: 'Sunny Castle',
      image: 'images/puzzle-castle.png',
      cols: 4,
      rows: 3,
      pieces: 12,
      unlocked: true,
    },
    whale: {
      id: 'whale',
      title: 'Swimming Whale',
      image: 'images/puzzle-whale.png',
      cols: 4,
      rows: 3,
      pieces: 12,
      unlocked: false,
    },
  };

  const PUZZLE_ORDER = ['puppy', 'castle', 'whale'];

  // === STATE ===
  let currentScreen = 'menu';
  let currentPuzzle = null;
  let puzzle = null;
  let dragSystem = null;
  let placedCount = 0;
  let totalPieces = 0;
  let timerInterval = null;
  let timerSeconds = 0;
  let hintVisible = false;
  let soundEnabled = true;

  // === DOM ELEMENTS ===
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screens = {
    menu: $('#screen-menu'),
    levels: $('#screen-levels'),
    game: $('#screen-game'),
  };

  // === STORAGE ===
  function loadProgress() {
    try {
      const data = JSON.parse(localStorage.getItem('cozy-puzzles-progress'));
      if (data && data.completed) {
        // Unlock whale if both puppy and castle are completed
        if (data.completed.puppy && data.completed.castle) {
          PUZZLES.whale.unlocked = true;
        }
        return data;
      }
    } catch (e) { /* ignore */ }
    return { completed: {}, bestTimes: {} };
  }

  function saveProgress(puzzleId, time) {
    const progress = loadProgress();
    progress.completed[puzzleId] = true;
    if (!progress.bestTimes[puzzleId] || time < progress.bestTimes[puzzleId]) {
      progress.bestTimes[puzzleId] = time;
    }
    localStorage.setItem('cozy-puzzles-progress', JSON.stringify(progress));

    // Update unlock status
    if (progress.completed.puppy && progress.completed.castle) {
      PUZZLES.whale.unlocked = true;
    }
  }


  // === SCREEN NAVIGATION ===
  function navigateTo(screenName) {
    const currentEl = screens[currentScreen];
    const nextEl = screens[screenName];

    if (currentEl) {
      currentEl.classList.add('exiting');
      currentEl.classList.remove('active');
      setTimeout(() => {
        currentEl.classList.remove('exiting');
      }, 450);
    }

    if (nextEl) {
      // Small delay to let exit animation start
      requestAnimationFrame(() => {
        nextEl.classList.add('active');
      });
    }

    currentScreen = screenName;
  }


  // === TIMER ===
  function startTimer() {
    timerSeconds = 0;
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function updateTimerDisplay() {
    const min = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const sec = String(timerSeconds % 60).padStart(2, '0');
    $('#timer-display').textContent = `${min}:${sec}`;
  }

  function formatTime(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    return `${min}:${sec}`;
  }


  // === LEVEL SELECT ===
  function updateLevelCards() {
    const progress = loadProgress();

    // Update whale card locked state
    const whaleCard = $('#card-whale');
    if (PUZZLES.whale.unlocked) {
      whaleCard.classList.remove('locked');
      whaleCard.querySelector('.puzzle-card-badge').textContent = 'Medium · 12 pcs';
      whaleCard.querySelector('.puzzle-card-badge').className = 'puzzle-card-badge badge-medium';
    } else {
      whaleCard.classList.add('locked');
    }
  }


  // === GAME SETUP ===
  function startGame(puzzleId) {
    currentPuzzle = PUZZLES[puzzleId];
    if (!currentPuzzle) return;

    navigateTo('game');
    placedCount = 0;
    totalPieces = currentPuzzle.pieces;
    hintVisible = false;
    $('#puzzle-guide').classList.remove('visible');
    $('#puzzle-placeholder').style.opacity = '1';
    $('#pieces-display').textContent = `0/${totalPieces}`;

    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => initPuzzle(img);
    img.src = currentPuzzle.image;

    // Set guide image
    $('#guide-image').src = currentPuzzle.image;
  }

  function initPuzzle(img) {
    const board = $('#puzzle-board');
    const boardSize = board.clientWidth || Math.min(board.getBoundingClientRect().width, board.getBoundingClientRect().height) || 320;

    // Setup board canvas
    const canvas = $('#board-canvas');
    canvas.width = boardSize;
    canvas.height = boardSize;
    const ctx = canvas.getContext('2d');

    // Create puzzle
    puzzle = new JigsawPuzzle(img, currentPuzzle.cols, currentPuzzle.rows, boardSize);
    const pieces = puzzle.generateAllPieces();

    // Draw grid lines on board
    puzzle.drawBoardGrid(ctx);

    // Clear tray
    const tray = $('#piece-tray');
    tray.innerHTML = '';

    // Destroy previous drag system
    if (dragSystem) dragSystem.destroy();

    // Create drag system
    dragSystem = new DragSystem({
      tray: tray,
      board: board,
      boardSize: boardSize,
      snapThreshold: boardSize / currentPuzzle.cols * 0.55,
      onSnap: handlePieceSnap,
      onDragStart: (el) => {
        // Hide placeholder on first drag
        $('#puzzle-placeholder').style.opacity = '0';
      },
      onDragEnd: () => {},
    });

    // Shuffle pieces
    const shuffled = [...pieces].sort(() => Math.random() - 0.5);

    // Create piece elements
    shuffled.forEach((pieceData) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'puzzle-piece';
      wrapper.dataset.row = pieceData.row;
      wrapper.dataset.col = pieceData.col;
      wrapper.dataset.rows = currentPuzzle.rows;
      wrapper.dataset.cols = currentPuzzle.cols;

      // Scale piece canvas for display
      const displaySize = Math.min(90, (boardSize / currentPuzzle.cols) * 1.3);
      const scale = displaySize / Math.max(pieceData.width, pieceData.height);

      const displayCanvas = document.createElement('canvas');
      displayCanvas.width = pieceData.width * scale;
      displayCanvas.height = pieceData.height * scale;
      const dCtx = displayCanvas.getContext('2d');
      dCtx.drawImage(pieceData.canvas, 0, 0, displayCanvas.width, displayCanvas.height);

      wrapper.appendChild(displayCanvas);
      wrapper._pieceData = pieceData;
      tray.appendChild(wrapper);

      dragSystem.attachPiece(wrapper);
    });

    // Start timer
    startTimer();
  }


  // === PIECE SNAP HANDLER ===
  function handlePieceSnap(pieceEl, { row, col }) {
    placedCount++;
    $('#pieces-display').textContent = `${placedCount}/${totalPieces}`;

    // Draw piece on board canvas
    const canvas = $('#board-canvas');
    const ctx = canvas.getContext('2d');
    puzzle.drawPlacedPiece(ctx, pieceEl._pieceData);

    // Sparkle effect at the center of the board position
    const boardRect = $('#puzzle-board').getBoundingClientRect();
    const pieceW = canvas.width / currentPuzzle.cols;
    const pieceH = canvas.height / currentPuzzle.rows;
    const sparkleX = boardRect.left + col * pieceW + pieceW / 2;
    const sparkleY = boardRect.top + row * pieceH + pieceH / 2;
    Effects.sparkle(sparkleX, sparkleY, 10);

    // Check win
    if (placedCount >= totalPieces) {
      setTimeout(() => handleVictory(), 600);
    }
  }


  // === VICTORY ===
  function handleVictory() {
    stopTimer();

    // Save progress
    saveProgress(currentPuzzle.id, timerSeconds);

    // Update victory modal
    $('#victory-time').textContent = formatTime(timerSeconds);
    $('#victory-pieces').textContent = totalPieces;

    // Show victory overlay
    const overlay = $('#victory-overlay');
    overlay.classList.add('active');

    // Confetti!
    setTimeout(() => Effects.confetti(4000), 300);

    // Determine if there's a next puzzle
    const currentIndex = PUZZLE_ORDER.indexOf(currentPuzzle.id);
    const nextIndex = currentIndex + 1;
    const btnNext = $('#btn-next');

    if (nextIndex < PUZZLE_ORDER.length && PUZZLES[PUZZLE_ORDER[nextIndex]].unlocked) {
      btnNext.style.display = 'flex';
      btnNext.dataset.nextPuzzle = PUZZLE_ORDER[nextIndex];
    } else if (nextIndex < PUZZLE_ORDER.length) {
      // Unlock next and show
      PUZZLES[PUZZLE_ORDER[nextIndex]].unlocked = true;
      btnNext.style.display = 'flex';
      btnNext.dataset.nextPuzzle = PUZZLE_ORDER[nextIndex];
    } else {
      btnNext.style.display = 'none';
    }
  }

  function closeVictory() {
    const overlay = $('#victory-overlay');
    overlay.classList.remove('active');
    Effects.stopConfetti();
  }


  // === EVENT LISTENERS ===
  function bindEvents() {
    // Main Menu → Level Select
    $('#btn-play').addEventListener('click', () => {
      updateLevelCards();
      navigateTo('levels');
    });

    // Level Select → Main Menu
    $('#btn-back-menu').addEventListener('click', () => {
      navigateTo('menu');
    });

    // Puzzle Cards → Game
    $$('.puzzle-card').forEach((card) => {
      card.addEventListener('click', () => {
        const puzzleId = card.dataset.puzzle;
        if (PUZZLES[puzzleId] && PUZZLES[puzzleId].unlocked) {
          startGame(puzzleId);
        }
      });
    });

    // Game → Level Select
    $('#btn-back-levels').addEventListener('click', () => {
      stopTimer();
      if (dragSystem) dragSystem.destroy();
      navigateTo('levels');
      updateLevelCards();
    });

    // Hint toggle
    $('#btn-hint').addEventListener('click', () => {
      hintVisible = !hintVisible;
      $('#puzzle-guide').classList.toggle('visible', hintVisible);
    });

    // Sound toggle
    $('#btn-sound').addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      const icon = $('#btn-sound').querySelector('.material-symbols-outlined');
      icon.textContent = soundEnabled ? 'volume_up' : 'volume_off';
    });

    // Victory — Replay
    $('#btn-replay').addEventListener('click', () => {
      closeVictory();
      startGame(currentPuzzle.id);
    });

    // Victory — Next
    $('#btn-next').addEventListener('click', () => {
      const nextId = $('#btn-next').dataset.nextPuzzle;
      closeVictory();
      if (nextId && PUZZLES[nextId]) {
        startGame(nextId);
      } else {
        navigateTo('levels');
        updateLevelCards();
      }
    });

    // Settings (placeholder)
    $('#btn-settings').addEventListener('click', () => {
      // Could open a settings modal in the future
    });
  }


  // === INIT ===
  function init() {
    // Load saved progress
    const progress = loadProgress();
    if (progress.completed.puppy && progress.completed.castle) {
      PUZZLES.whale.unlocked = true;
    }

    bindEvents();
    updateLevelCards();

    // Show menu
    screens.menu.classList.add('active');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

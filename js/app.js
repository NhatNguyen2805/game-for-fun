/* ============================================
   APP CONTROLLER — Screen Router & Game State
   ============================================ */

(function () {
  'use strict';

  // === PUZZLE DATA ===
  const PUZZLES = {
    level1: {
      id: 'level1',
      title: 'Màn 1',
      image: 'images/anh-1.png',
      cols: 4,
      rows: 3,
      pieces: 12,
      unlocked: true,
    },
    level2: {
      id: 'level2',
      title: 'Màn 2',
      image: 'images/anh-2.png',
      cols: 4,
      rows: 3,
      pieces: 12,
      unlocked: false,
    },
  };

  const PUZZLE_ORDER = ['level1', 'level2'];

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
        if (data.completed.level1) {
          PUZZLES.level2.unlocked = true;
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
    if (progress.completed.level1) {
      PUZZLES.level2.unlocked = true;
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
    loadProgress();

    const card2 = $('#card-level2');
    if (!card2) return;

    if (PUZZLES.level2.unlocked) {
      card2.classList.remove('locked');
      const badge = card2.querySelector('.puzzle-card-badge');
      if (badge) {
        badge.textContent = '12 mảnh';
        badge.className = 'puzzle-card-badge badge-easy';
      }
      const meta = card2.querySelector('.puzzle-card-meta');
      if (meta) meta.textContent = '✨ Bức tranh bí ẩn #2';
      const icon = card2.querySelector('.level-card-icon');
      if (icon) icon.textContent = 'help_center';
    } else {
      card2.classList.add('locked');
      const badge = card2.querySelector('.puzzle-card-badge');
      if (badge) {
        badge.textContent = '🔒 Khóa';
        badge.className = 'puzzle-card-badge badge-locked';
      }
      const meta = card2.querySelector('.puzzle-card-meta');
      if (meta) meta.textContent = '🔒 Hoàn thành Màn 1 để mở';
      const icon = card2.querySelector('.level-card-icon');
      if (icon) icon.textContent = 'lock';
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
    $('#puzzle-guide').style.backgroundImage = `url("${currentPuzzle.image}")`;

    startTimer();
  }

  function initPuzzle(img) {
    const board = $('#puzzle-board');
    const boardSize = board.clientWidth || Math.min(board.getBoundingClientRect().width, board.getBoundingClientRect().height) || 320;

    // Setup board canvas
    const canvas = $('#board-canvas');
    canvas.width = boardSize;
    canvas.height = boardSize;

    // Create puzzle engine
    puzzle = new JigsawPuzzle(img, currentPuzzle.cols, currentPuzzle.rows, boardSize);

    // Render board background grid
    const ctx = canvas.getContext('2d');
    puzzle.drawBoardGrid(ctx);

    // Generate pieces
    const piecesData = puzzle.generateAllPieces();

    // Populate piece tray
    const tray = $('#piece-tray');
    tray.innerHTML = '';

    // Shuffle pieces randomly
    const shuffled = [...piecesData].sort(() => Math.random() - 0.5);

    shuffled.forEach((pieceData) => {
      const pieceEl = document.createElement('div');
      pieceEl.className = 'puzzle-piece';
      pieceEl.dataset.col = pieceData.col;
      pieceEl.dataset.row = pieceData.row;
      pieceEl.dataset.cols = currentPuzzle.cols;
      pieceEl.dataset.rows = currentPuzzle.rows;

      // Fit piece nicely inside tray
      const displaySize = Math.min(90, (boardSize / currentPuzzle.cols) * 1.3);
      pieceEl.style.width = `${displaySize}px`;
      pieceEl.style.height = `${displaySize}px`;

      // Scale canvas to fit element
      const innerCanvas = pieceData.canvas;
      innerCanvas.style.width = '100%';
      innerCanvas.style.height = '100%';
      pieceEl.appendChild(innerCanvas);

      // Store data reference
      pieceEl._pieceData = pieceData;

      tray.appendChild(pieceEl);
    });

    // Hide placeholder once pieces are loaded
    $('#puzzle-placeholder').style.opacity = '0';

    // Init drag & drop
    if (dragSystem) dragSystem.destroy();
    dragSystem = new DragSystem({
      tray,
      board,
      onSnap: handlePieceSnap,
      onDragStart: (el) => {
        if (soundEnabled) Effects.playPopSound();
      },
      onDragEnd: (el) => {},
    });

    // Attach drag listener to each piece
    $$('#piece-tray .puzzle-piece').forEach((pieceEl) => {
      dragSystem.attachPiece(pieceEl);
    });
  }


  // === PIECE SNAP HANDLER ===
  function handlePieceSnap(pieceEl, { row, col }) {
    placedCount++;
    $('#pieces-display').textContent = `${placedCount}/${totalPieces}`;

    if (soundEnabled) Effects.playSnapSound();

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
      closeVictory();
      const nextPuzzleId = $('#btn-next').dataset.nextPuzzle;
      if (nextPuzzleId) {
        startGame(nextPuzzleId);
      } else {
        navigateTo('levels');
        updateLevelCards();
      }
    });
  }


  // === INIT ===
  function init() {
    loadProgress();
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

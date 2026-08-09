/* ============================================
   APP CONTROLLER — Screen Router & Game State
   ============================================ */

(function () {
  'use strict';

  // === PUZZLE DATA ===
  const PUZZLES = {
    level1: {
      id: 'level1',
      title: 'Level 1',
      image: 'images/anh-1.png',
      cols: 4,
      rows: 3,
      pieces: 12,
      unlocked: true,
    },
    level2: {
      id: 'level2',
      title: 'Level 2',
      image: 'images/anh-2.png',
      cols: 4,
      rows: 3,
      pieces: 12,
      unlocked: false,
    },
    level3: {
      id: 'level3',
      title: 'Level 3',
      image: 'images/anh-3.png',
      cols: 4,
      rows: 3,
      pieces: 12,
      unlocked: false,
    },
  };

  const PUZZLE_ORDER = ['level1', 'level2', 'level3'];

  // === STATE ===
  let currentScreen = 'menu';
  let currentPuzzle = null;
  let puzzle = null;
  let dragSystem = null;
  let placedCount = 0;
  let totalPieces = 0;
  let timerInterval = null;
  let timerSeconds = 0;
  let soundEnabled = true;
  let hintsUsedThisLevel = false;
  let hintTimeoutId = null;

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
        if (data.completed.level2) {
          PUZZLES.level3.unlocked = true;
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
    if (progress.completed.level2) {
      PUZZLES.level3.unlocked = true;
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

    // Level 2
    const card2 = $('#card-level2');
    if (card2) {
      if (PUZZLES.level2.unlocked) {
        card2.classList.remove('locked');
        const badge = card2.querySelector('.puzzle-card-badge');
        if (badge) {
          badge.textContent = '12 pieces';
          badge.className = 'puzzle-card-badge badge-easy';
        }
        const meta = card2.querySelector('.puzzle-card-meta');
        if (meta) meta.textContent = '✨ Mystery Picture #2';
        const icon = card2.querySelector('.level-card-icon');
        if (icon) icon.textContent = 'help_center';
      } else {
        card2.classList.add('locked');
        const badge = card2.querySelector('.puzzle-card-badge');
        if (badge) {
          badge.textContent = '🔒 Locked';
          badge.className = 'puzzle-card-badge badge-locked';
        }
        const meta = card2.querySelector('.puzzle-card-meta');
        if (meta) meta.textContent = '🔒 Complete Level 1 to unlock';
        const icon = card2.querySelector('.level-card-icon');
        if (icon) icon.textContent = 'lock';
      }
    }

    // Level 3
    const card3 = $('#card-level3');
    if (card3) {
      if (PUZZLES.level3.unlocked) {
        card3.classList.remove('locked');
        const badge = card3.querySelector('.puzzle-card-badge');
        if (badge) {
          badge.textContent = '12 pieces';
          badge.className = 'puzzle-card-badge badge-easy';
        }
        const meta = card3.querySelector('.puzzle-card-meta');
        if (meta) meta.textContent = '✨ Mystery Picture #3';
        const icon = card3.querySelector('.level-card-icon');
        if (icon) icon.textContent = 'help_center';
      } else {
        card3.classList.add('locked');
        const badge = card3.querySelector('.puzzle-card-badge');
        if (badge) {
          badge.textContent = '🔒 Locked';
          badge.className = 'puzzle-card-badge badge-locked';
        }
        const meta = card3.querySelector('.puzzle-card-meta');
        if (meta) meta.textContent = '🔒 Complete Level 2 to unlock';
        const icon = card3.querySelector('.level-card-icon');
        if (icon) icon.textContent = 'lock';
      }
    }
  }


  // === GAME SETUP ===
  function startGame(puzzleId) {
    currentPuzzle = PUZZLES[puzzleId];
    if (!currentPuzzle) return;

    navigateTo('game');
    placedCount = 0;
    totalPieces = currentPuzzle.pieces;

    // Reset Hint System for this level
    hintsUsedThisLevel = false;
    if (hintTimeoutId) clearTimeout(hintTimeoutId);
    const existingBox = $('#board-hint-box');
    if (existingBox) existingBox.remove();

    const btnHint = $('#btn-hint');
    if (btnHint) {
      btnHint.classList.remove('disabled');
      btnHint.removeAttribute('disabled');
    }

    $('#puzzle-placeholder').style.opacity = '1';
    $('#pieces-display').textContent = `0/${totalPieces}`;

    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => initPuzzle(img);
    img.src = currentPuzzle.image;

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


  // === SINGLE-PIECE HINT SYSTEM ===
  function triggerSinglePieceHint() {
    if (hintsUsedThisLevel) return;

    const unplaced = Array.from($$('#piece-tray .puzzle-piece')).filter((el) => !el.classList.contains('placed'));
    if (unplaced.length === 0) return;

    hintsUsedThisLevel = true;

    // Disable hint button for the rest of this level
    const btnHint = $('#btn-hint');
    if (btnHint) {
      btnHint.classList.add('disabled');
      btnHint.setAttribute('disabled', 'true');
    }

    // Pick 1 unplaced piece
    const targetPiece = unplaced[Math.floor(Math.random() * unplaced.length)];
    const col = parseInt(targetPiece.dataset.col);
    const row = parseInt(targetPiece.dataset.row);

    // Highlight piece in tray and scroll to it
    targetPiece.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    targetPiece.classList.add('hint-highlight');

    // Highlight slot on board
    const board = $('#puzzle-board');
    const boardRect = board.getBoundingClientRect();
    const pieceW = boardRect.width / currentPuzzle.cols;
    const pieceH = boardRect.height / currentPuzzle.rows;

    const existingBox = $('#board-hint-box');
    if (existingBox) existingBox.remove();

    const hintBox = document.createElement('div');
    hintBox.id = 'board-hint-box';
    hintBox.className = 'board-hint-box';
    hintBox.style.left = `${col * pieceW}px`;
    hintBox.style.top = `${row * pieceH}px`;
    hintBox.style.width = `${pieceW}px`;
    hintBox.style.height = `${pieceH}px`;
    board.appendChild(hintBox);

    if (hintTimeoutId) clearTimeout(hintTimeoutId);
    hintTimeoutId = setTimeout(() => {
      targetPiece.classList.remove('hint-highlight');
      if (hintBox.parentNode) hintBox.remove();
    }, 3000);
  }


  // === PIECE SNAP HANDLER ===
  function handlePieceSnap(pieceEl, { row, col }) {
    placedCount++;
    $('#pieces-display').textContent = `${placedCount}/${totalPieces}`;

    if (soundEnabled) Effects.playSnapSound();

    // Clean up hint highlight if snapped
    const existingBox = $('#board-hint-box');
    if (existingBox) existingBox.remove();
    $$('.puzzle-piece.hint-highlight').forEach((el) => el.classList.remove('hint-highlight'));

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

    // Hint button: 1-time per level single piece hint
    $('#btn-hint').addEventListener('click', () => {
      triggerSinglePieceHint();
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

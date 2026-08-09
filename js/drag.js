/* ============================================
   DRAG & DROP — Pointer Events based system
   Supports touch + mouse unified
   ============================================ */

class DragSystem {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.tray - The piece tray container
   * @param {HTMLElement} options.board - The puzzle board element
   * @param {Function} options.onSnap - Callback when piece snaps correctly (pieceEl, pieceData)
   * @param {Function} options.onDragStart - Callback on drag start
   * @param {Function} options.onDragEnd - Callback on drag end (even if no snap)
   * @param {number} options.snapThreshold - Distance threshold to snap (px)
   * @param {number} options.boardSize - Board size in pixels
   */
  constructor(options) {
    this.tray = options.tray;
    this.board = options.board;
    this.onSnap = options.onSnap || (() => {});
    this.onDragStart = options.onDragStart || (() => {});
    this.onDragEnd = options.onDragEnd || (() => {});
    this.snapThreshold = options.snapThreshold || 30;
    this.boardSize = options.boardSize || 360;

    this._dragging = null;
    this._offsetX = 0;
    this._offsetY = 0;
    this._startX = 0;
    this._startY = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    // Listen on document for move/up to handle edge cases
    document.addEventListener('pointermove', this._onPointerMove, { passive: false });
    document.addEventListener('pointerup', this._onPointerUp);
    document.addEventListener('pointercancel', this._onPointerUp);
  }

  /**
   * Attach drag behavior to a piece element
   * @param {HTMLElement} pieceEl - The piece wrapper element
   */
  attachPiece(pieceEl) {
    pieceEl.addEventListener('pointerdown', this._onPointerDown, { passive: false });
    pieceEl.style.touchAction = 'none';
  }

  _onPointerDown(e) {
    const pieceEl = e.currentTarget;
    if (pieceEl.classList.contains('placed')) return;

    e.preventDefault();
    pieceEl.setPointerCapture(e.pointerId);

    const rect = pieceEl.getBoundingClientRect();
    this._offsetX = e.clientX - rect.left - rect.width / 2;
    this._offsetY = e.clientY - rect.top - rect.height / 2;
    this._startX = e.clientX;
    this._startY = e.clientY;

    // Store original position info
    pieceEl._originalParent = pieceEl.parentElement;
    pieceEl._originalIndex = Array.from(pieceEl.parentElement.children).indexOf(pieceEl);

    // Make dragging
    pieceEl.classList.add('dragging');
    const centerX = e.clientX - this._offsetX;
    const centerY = e.clientY - this._offsetY;
    pieceEl.style.left = (centerX - pieceEl.offsetWidth / 2) + 'px';
    pieceEl.style.top = (centerY - pieceEl.offsetHeight / 2) + 'px';

    this._dragging = pieceEl;
    this.onDragStart(pieceEl);
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    e.preventDefault();

    const pieceEl = this._dragging;
    const centerX = e.clientX - this._offsetX;
    const centerY = e.clientY - this._offsetY;
    pieceEl.style.left = (centerX - pieceEl.offsetWidth / 2) + 'px';
    pieceEl.style.top = (centerY - pieceEl.offsetHeight / 2) + 'px';
  }

  _onPointerUp(e) {
    if (!this._dragging) return;

    const pieceEl = this._dragging;
    this._dragging = null;
    pieceEl.classList.remove('dragging');

    // Check if dropped over the board
    const boardRect = this.board.getBoundingClientRect();
    const pieceRect = pieceEl.getBoundingClientRect();
    const pieceCenterX = pieceRect.left + pieceRect.width / 2;
    const pieceCenterY = pieceRect.top + pieceRect.height / 2;

    // Get piece data
    const row = parseInt(pieceEl.dataset.row);
    const col = parseInt(pieceEl.dataset.col);
    const pieceW = this.boardSize / parseInt(pieceEl.dataset.cols);
    const pieceH = this.boardSize / parseInt(pieceEl.dataset.rows);

    // Target position on screen
    const targetX = boardRect.left + col * pieceW + pieceW / 2;
    const targetY = boardRect.top + row * pieceH + pieceH / 2;

    const dist = Math.sqrt((pieceCenterX - targetX) ** 2 + (pieceCenterY - targetY) ** 2);

    if (dist < this.snapThreshold) {
      // SNAP! Piece is correctly placed
      pieceEl.classList.add('placed');
      pieceEl.style.position = '';
      pieceEl.style.left = '';
      pieceEl.style.top = '';
      this.onSnap(pieceEl, { row, col });
    } else {
      // Return to tray
      pieceEl.style.position = '';
      pieceEl.style.left = '';
      pieceEl.style.top = '';
      pieceEl.classList.remove('dragging');
    }

    this.onDragEnd(pieceEl);
  }

  /**
   * Clean up all listeners
   */
  destroy() {
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
    document.removeEventListener('pointercancel', this._onPointerUp);
  }
}

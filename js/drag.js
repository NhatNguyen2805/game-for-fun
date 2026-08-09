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
   */
  constructor(options) {
    this.tray = options.tray;
    this.board = options.board;
    this.onSnap = options.onSnap || (() => {});
    this.onDragStart = options.onDragStart || (() => {});
    this.onDragEnd = options.onDragEnd || (() => {});

    this._dragging = null;
    this._touchOffsetX = 0;
    this._touchOffsetY = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    document.addEventListener('pointermove', this._onPointerMove, { passive: false });
    document.addEventListener('pointerup', this._onPointerUp);
    document.addEventListener('pointercancel', this._onPointerUp);
  }

  /**
   * Attach drag behavior to a piece element
   */
  attachPiece(pieceEl) {
    pieceEl.addEventListener('pointerdown', this._onPointerDown, { passive: false });
    pieceEl.style.touchAction = 'none';
  }

  _onPointerDown(e) {
    const pieceEl = e.currentTarget;
    if (pieceEl.classList.contains('placed')) return;

    e.preventDefault();

    // Try pointer capture
    try {
      pieceEl.setPointerCapture(e.pointerId);
    } catch (err) { /* fallback */ }

    const rect = pieceEl.getBoundingClientRect();
    this._touchOffsetX = e.clientX - (rect.left + rect.width / 2);
    this._touchOffsetY = e.clientY - (rect.top + rect.height / 2);

    pieceEl.classList.add('dragging');
    this._updatePiecePosition(pieceEl, e.clientX, e.clientY);

    this._dragging = pieceEl;
    this.onDragStart(pieceEl);
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    e.preventDefault();

    this._updatePiecePosition(this._dragging, e.clientX, e.clientY);
  }

  _updatePiecePosition(pieceEl, clientX, clientY) {
    const width = pieceEl.offsetWidth || 100;
    const height = pieceEl.offsetHeight || 100;
    pieceEl.style.left = (clientX - this._touchOffsetX - width / 2) + 'px';
    pieceEl.style.top = (clientY - this._touchOffsetY - height / 2) + 'px';
  }

  _onPointerUp(e) {
    if (!this._dragging) return;

    const pieceEl = this._dragging;
    this._dragging = null;

    // MEASURE DRAGGED POSITION BEFORE REMOVING .dragging CLASS!
    const pieceRect = pieceEl.getBoundingClientRect();
    const pieceCenterX = pieceRect.left + pieceRect.width / 2;
    const pieceCenterY = pieceRect.top + pieceRect.height / 2;

    // NOW remove dragging class
    pieceEl.classList.remove('dragging');

    // Get current board position and size
    const boardRect = this.board.getBoundingClientRect();
    const cols = parseInt(pieceEl.dataset.cols) || 3;
    const rows = parseInt(pieceEl.dataset.rows) || 2;
    const col = parseInt(pieceEl.dataset.col) || 0;
    const row = parseInt(pieceEl.dataset.row) || 0;

    const pieceW = boardRect.width / cols;
    const pieceH = boardRect.height / rows;

    // Target position center on screen
    const targetX = boardRect.left + col * pieceW + pieceW / 2;
    const targetY = boardRect.top + row * pieceH + pieceH / 2;

    // Calculate distance
    const dist = Math.sqrt((pieceCenterX - targetX) ** 2 + (pieceCenterY - targetY) ** 2);

    // Generous snap threshold: within 80% of piece size or if dropped over the target slot
    const snapThreshold = Math.max(pieceW, pieceH) * 0.85;

    if (dist < snapThreshold) {
      // SNAP! Correctly placed
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
    }

    this.onDragEnd(pieceEl);
  }

  destroy() {
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
    document.removeEventListener('pointercancel', this._onPointerUp);
  }
}

/* ============================================
   DRAG & DROP — Pointer Events based system
   Supports touch + mouse unified
   Smart horizontal tray scrolling + vertical piece dragging
   ============================================ */

class DragSystem {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.tray - The piece tray container
   * @param {HTMLElement} options.board - The puzzle board element
   * @param {Function} options.onSnap - Callback when piece snaps correctly
   * @param {Function} options.onDragStart - Callback on drag start
   * @param {Function} options.onDragEnd - Callback on drag end
   */
  constructor(options) {
    this.tray = options.tray;
    this.board = options.board;
    this.onSnap = options.onSnap || (() => {});
    this.onWrongDrop = options.onWrongDrop || (() => {});
    this.onDragStart = options.onDragStart || (() => {});
    this.onDragEnd = options.onDragEnd || (() => {});

    this._activePiece = null;
    this._isDraggingPiece = false;
    this._startX = 0;
    this._startY = 0;
    this._touchOffsetX = 0;
    this._touchOffsetY = 0;

    // Tray scroll state
    this._isTrayScrolling = false;
    this._trayStartX = 0;
    this._trayScrollLeft = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onTrayPointerDown = this._onTrayPointerDown.bind(this);

    this.tray.addEventListener('pointerdown', this._onTrayPointerDown);
    document.addEventListener('pointermove', this._onPointerMove, { passive: false });
    document.addEventListener('pointerup', this._onPointerUp);
    document.addEventListener('pointercancel', this._onPointerUp);
  }

  /**
   * Attach drag behavior to a piece element
   */
  attachPiece(pieceEl) {
    pieceEl.addEventListener('pointerdown', this._onPointerDown);
  }

  _onTrayPointerDown(e) {
    if (e.target.closest('.puzzle-piece')) return;
    this._isTrayScrolling = true;
    this._trayStartX = e.clientX;
    this._trayScrollLeft = this.tray.scrollLeft;
  }

  _onPointerDown(e) {
    const pieceEl = e.currentTarget;
    if (pieceEl.classList.contains('placed')) return;

    this._activePiece = pieceEl;
    this._isDraggingPiece = false;
    this._startX = e.clientX;
    this._startY = e.clientY;

    const rect = pieceEl.getBoundingClientRect();
    this._touchOffsetX = e.clientX - (rect.left + rect.width / 2);
    this._touchOffsetY = e.clientY - (rect.top + rect.height / 2);

    this._trayStartX = e.clientX;
    this._trayScrollLeft = this.tray.scrollLeft;
  }

  _onPointerMove(e) {
    // 1. Handle tray scroll on background
    if (this._isTrayScrolling) {
      const walk = e.clientX - this._trayStartX;
      this.tray.scrollLeft = this._trayScrollLeft - walk;
      return;
    }

    if (!this._activePiece) return;

    const dx = e.clientX - this._startX;
    const dy = e.clientY - this._startY;
    const dist = Math.hypot(dx, dy);

    // 2. Decide if user wants to drag piece or scroll tray
    if (!this._isDraggingPiece) {
      if (dist > 6) {
        // If moving UPWARDS or vertical motion > horizontal, initiate piece lift
        if (dy < -4 || Math.abs(dy) > Math.abs(dx)) {
          this._isDraggingPiece = true;
          this._activePiece.classList.add('dragging');
          try {
            this._activePiece.setPointerCapture(e.pointerId);
          } catch (err) {}
          this.onDragStart(this._activePiece);
        } else {
          // Horizontal swipe on piece -> scroll the tray!
          this.tray.scrollLeft = this._trayScrollLeft - dx;
        }
      }
      return;
    }

    // 3. Move active piece in 2D space
    e.preventDefault();
    this._updatePiecePosition(this._activePiece, e.clientX, e.clientY);
  }

  _updatePiecePosition(pieceEl, clientX, clientY) {
    const width = pieceEl.offsetWidth || 100;
    const height = pieceEl.offsetHeight || 100;
    pieceEl.style.left = (clientX - this._touchOffsetX - width / 2) + 'px';
    pieceEl.style.top = (clientY - this._touchOffsetY - height / 2) + 'px';
  }

  _onPointerUp(e) {
    if (this._isTrayScrolling) {
      this._isTrayScrolling = false;
    }

    if (!this._activePiece) return;

    const pieceEl = this._activePiece;
    const wasDragging = this._isDraggingPiece;

    this._activePiece = null;
    this._isDraggingPiece = false;

    if (!wasDragging) return;

    // MEASURE DRAGGED POSITION BEFORE REMOVING .dragging CLASS!
    const pieceRect = pieceEl.getBoundingClientRect();
    const pieceCenterX = pieceRect.left + pieceRect.width / 2;
    const pieceCenterY = pieceRect.top + pieceRect.height / 2;

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

    // Snap threshold: within 55% of cell size
    const snapThreshold = Math.min(pieceW, pieceH) * 0.55;

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

      // Check if dropped near or over board
      const isOverBoard = (
        pieceCenterX >= boardRect.left - 40 &&
        pieceCenterX <= boardRect.right + 40 &&
        pieceCenterY >= boardRect.top - 40 &&
        pieceCenterY <= boardRect.bottom + 40
      );

      if (isOverBoard) {
        this.onWrongDrop(pieceEl, { x: pieceCenterX, y: pieceCenterY });
      }
    }

    this.onDragEnd(pieceEl);
  }

  destroy() {
    this.tray.removeEventListener('pointerdown', this._onTrayPointerDown);
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
    document.removeEventListener('pointercancel', this._onPointerUp);
  }
}

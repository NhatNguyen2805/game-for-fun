/* ============================================
   PUZZLE ENGINE — Jigsaw Piece Generation
   Uses Canvas API with Bézier Curve edges
   ============================================ */

class JigsawPuzzle {
  /**
   * @param {HTMLImageElement} image - Source image
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @param {number} boardSize - Board size in pixels
   */
  constructor(image, cols, rows, boardSize) {
    this.image = image;
    this.cols = cols;
    this.rows = rows;
    this.boardSize = boardSize;
    this.pieceW = boardSize / cols;
    this.pieceH = boardSize / rows;
    this.tabSize = Math.min(this.pieceW, this.pieceH) * 0.2;
    this.edgeMap = this._generateEdgeMap();
    this.pieces = [];
  }

  /**
   * Generate random edge map.
   * +1 = tab (protruding), -1 = blank (indented), 0 = flat (border edge)
   */
  _generateEdgeMap() {
    const { cols, rows } = this;

    // Horizontal edges (between rows)
    const hEdges = [];
    for (let r = 0; r < rows - 1; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(Math.random() > 0.5 ? 1 : -1);
      }
      hEdges.push(row);
    }

    // Vertical edges (between columns)
    const vEdges = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols - 1; c++) {
        row.push(Math.random() > 0.5 ? 1 : -1);
      }
      vEdges.push(row);
    }

    return { hEdges, vEdges };
  }

  /**
   * Get edges for a specific piece
   */
  _getPieceEdges(row, col) {
    const { hEdges, vEdges } = this.edgeMap;
    return {
      top: row === 0 ? 0 : hEdges[row - 1][col],
      bottom: row === this.rows - 1 ? 0 : -hEdges[row][col],
      left: col === 0 ? 0 : vEdges[row][col - 1],
      right: col === this.cols - 1 ? 0 : -vEdges[row][col],
    };
  }

  /**
   * Draw a jigsaw edge using cubic Bézier curves
   * @param {Path2D} path
   * @param {number} x0 - Start X
   * @param {number} y0 - Start Y
   * @param {number} x1 - End X
   * @param {number} y1 - End Y
   * @param {number} edge - -1, 0, or +1
   * @param {boolean} isHorizontal - true if edge runs left-right
   */
  _drawEdge(path, x0, y0, x1, y1, edge, isHorizontal) {
    if (edge === 0) {
      path.lineTo(x1, y1);
      return;
    }

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    const len = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
    const tab = this.tabSize * edge;

    if (isHorizontal) {
      // Horizontal edge: tab goes up/down
      const neck = len * 0.1;
      const headW = len * 0.13;
      const headH = Math.abs(tab) * 1.1;

      // First straight segment
      path.lineTo(midX - neck * 2, y0);
      // Neck
      path.bezierCurveTo(
        midX - neck, y0,
        midX - headW, y0 - tab * 0.4,
        midX - headW, y0 - tab * 0.7
      );
      // Head top
      path.bezierCurveTo(
        midX - headW * 1.2, y0 - headH,
        midX + headW * 1.2, y0 - headH,
        midX + headW, y0 - tab * 0.7
      );
      // Neck back
      path.bezierCurveTo(
        midX + headW, y0 - tab * 0.4,
        midX + neck, y0,
        midX + neck * 2, y0
      );
      // Rest
      path.lineTo(x1, y1);
    } else {
      // Vertical edge: tab goes left/right
      const neck = len * 0.1;
      const headW = Math.abs(tab) * 1.1;
      const headH = len * 0.13;

      path.lineTo(x0, midY - neck * 2);
      path.bezierCurveTo(
        x0, midY - neck,
        x0 - tab * 0.4, midY - headH,
        x0 - tab * 0.7, midY - headH
      );
      path.bezierCurveTo(
        x0 - headW, midY - headH * 1.2,
        x0 - headW, midY + headH * 1.2,
        x0 - tab * 0.7, midY + headH
      );
      path.bezierCurveTo(
        x0 - tab * 0.4, midY + headH,
        x0, midY + neck,
        x0, midY + neck * 2
      );
      path.lineTo(x1, y1);
    }
  }

  /**
   * Create a Path2D for a piece at (row, col)
   */
  _createPiecePath(row, col) {
    const edges = this._getPieceEdges(row, col);
    const x = col * this.pieceW;
    const y = row * this.pieceH;
    const w = this.pieceW;
    const h = this.pieceH;

    const path = new Path2D();
    path.moveTo(x, y);

    // Top edge (left → right)
    this._drawEdge(path, x, y, x + w, y, edges.top, true);
    // Right edge (top → bottom)
    this._drawEdge(path, x + w, y, x + w, y + h, edges.right, false);
    // Bottom edge (right → left) — reverse direction, negate edge
    this._drawEdge(path, x + w, y + h, x, y + h, -edges.bottom, true);
    // Left edge (bottom → top) — reverse direction, negate edge
    this._drawEdge(path, x, y + h, x, y, -edges.left, false);

    path.closePath();
    return path;
  }

  /**
   * Render a single piece to a separate canvas
   * Returns { canvas, row, col, originX, originY, edges }
   */
  renderPiece(row, col) {
    const edges = this._getPieceEdges(row, col);
    const margin = this.tabSize + 4;

    // Canvas size includes margin for tabs
    const canvasW = this.pieceW + margin * 2;
    const canvasH = this.pieceH + margin * 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    // Offset drawing so tabs don't get clipped
    ctx.save();
    ctx.translate(margin - col * this.pieceW, margin - row * this.pieceH);

    // Create clip path
    const clipPath = this._createPiecePath(row, col);
    ctx.clip(clipPath);

    // Draw the image portion (cover-fit)
    const imgW = this.image.naturalWidth;
    const imgH = this.image.naturalHeight;
    const scale = Math.max(this.boardSize / imgW, this.boardSize / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (this.boardSize - drawW) / 2;
    const offsetY = (this.boardSize - drawH) / 2;
    ctx.drawImage(this.image, offsetX, offsetY, drawW, drawH);

    ctx.restore();

    // Draw border outline
    ctx.save();
    ctx.translate(margin - col * this.pieceW, margin - row * this.pieceH);
    ctx.strokeStyle = 'rgba(74, 69, 64, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke(clipPath);
    ctx.restore();

    return {
      canvas,
      row,
      col,
      originX: col * this.pieceW - margin,
      originY: row * this.pieceH - margin,
      width: canvasW,
      height: canvasH,
      edges
    };
  }

  /**
   * Generate all pieces
   */
  generateAllPieces() {
    this.pieces = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.pieces.push(this.renderPiece(r, c));
      }
    }
    return this.pieces;
  }

  /**
   * Draw the board grid (ghost guide) on the main canvas
   */
  drawBoardGrid(ctx) {
    ctx.clearRect(0, 0, this.boardSize, this.boardSize);

    ctx.strokeStyle = 'rgba(215, 194, 190, 0.5)';
    ctx.lineWidth = 1;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const path = this._createPiecePath(r, c);
        ctx.stroke(path);
      }
    }
  }

  /**
   * Draw placed pieces on the board canvas
   */
  drawPlacedPiece(ctx, pieceData) {
    const { canvas, originX, originY } = pieceData;
    ctx.drawImage(canvas, originX, originY);
  }
}

/* ============================================
   PUZZLE ENGINE — Jigsaw Piece Generation
   Uses Canvas API with Bézier Curve edges
   Single-pass grid renderer for crisp, clean lines
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
    this.tabSize = Math.min(this.pieceW, this.pieceH) * 0.18;
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
   * Draw a jigsaw edge using vector-transformed Bézier curves.
   * Guarantees smooth, non-overlapping curves regardless of direction.
   * @param {Path2D} path
   * @param {number} x0 - Start X
   * @param {number} y0 - Start Y
   * @param {number} x1 - End X
   * @param {number} y1 - End Y
   * @param {number} edge - -1, 0, or +1
   */
  _drawEdge(path, x0, y0, x1, y1, edge) {
    if (edge === 0) {
      path.lineTo(x1, y1);
      return;
    }

    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Unit tangent vector
    const ux = dx / len;
    const uy = dy / len;

    // Unit normal vector (pointing 90 deg clockwise)
    const nx = -uy;
    const ny = ux;

    // Transform local (t, n) to world (X, Y)
    const pt = (t, n) => [
      x0 + t * ux + n * nx,
      y0 + t * uy + n * ny
    ];

    const h = this.tabSize * edge;
    const neck = len * 0.07;
    const headW = len * 0.11;
    const mid = len * 0.5;

    // 1. Line to base of neck
    const [p0x, p0y] = pt(mid - neck * 1.8, 0);
    path.lineTo(p0x, p0y);

    // 2. Neck up to left head
    const [c1x1, c1y1] = pt(mid - neck, 0);
    const [c1x2, c1y2] = pt(mid - headW, h * 0.4);
    const [p1x, p1y] = pt(mid - headW, h * 0.85);
    path.bezierCurveTo(c1x1, c1y1, c1x2, c1y2, p1x, p1y);

    // 3. Head top arc
    const [c2x1, c2y1] = pt(mid - headW * 1.2, h * 1.2);
    const [c2x2, c2y2] = pt(mid + headW * 1.2, h * 1.2);
    const [p2x, p2y] = pt(mid + headW, h * 0.85);
    path.bezierCurveTo(c2x1, c2y1, c2x2, c2y2, p2x, p2y);

    // 4. Right head down to neck base
    const [c3x1, c3y1] = pt(mid + headW, h * 0.4);
    const [c3x2, c3y2] = pt(mid + neck, 0);
    const [p3x, p3y] = pt(mid + neck * 1.8, 0);
    path.bezierCurveTo(c3x1, c3y1, c3x2, c3y2, p3x, p3y);

    // 5. Line to end
    path.lineTo(x1, y1);
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

    // Top edge (left -> right)
    this._drawEdge(path, x, y, x + w, y, edges.top);

    // Right edge (top -> bottom)
    this._drawEdge(path, x + w, y, x + w, y + h, edges.right);

    // Bottom edge (right -> left) -- invert edge sign for reverse direction
    this._drawEdge(path, x + w, y + h, x, y + h, -edges.bottom);

    // Left edge (bottom -> top) -- invert edge sign for reverse direction
    this._drawEdge(path, x, y + h, x, y, -edges.left);

    path.closePath();
    return path;
  }

  /**
   * Render a single piece to a separate canvas
   * Returns { canvas, row, col, originX, originY, edges }
   */
  renderPiece(row, col) {
    const edges = this._getPieceEdges(row, col);
    const margin = this.tabSize + 6;

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
    ctx.strokeStyle = 'rgba(136, 79, 68, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
   * Draw the board grid (ghost guide) on the main canvas cleanly
   * Draws each internal line exactly ONCE to avoid double-stroking
   */
  drawBoardGrid(ctx) {
    ctx.clearRect(0, 0, this.boardSize, this.boardSize);

    ctx.save();
    ctx.strokeStyle = 'rgba(136, 79, 68, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const path = new Path2D();

    // 1. Draw internal horizontal edges
    for (let r = 0; r < this.rows - 1; r++) {
      const y = (r + 1) * this.pieceH;
      for (let c = 0; c < this.cols; c++) {
        const x0 = c * this.pieceW;
        const x1 = (c + 1) * this.pieceW;
        const edge = this.edgeMap.hEdges[r][c];
        path.moveTo(x0, y);
        this._drawEdge(path, x0, y, x1, y, edge);
      }
    }

    // 2. Draw internal vertical edges
    for (let c = 0; c < this.cols - 1; c++) {
      const x = (c + 1) * this.pieceW;
      for (let r = 0; r < this.rows; r++) {
        const y0 = r * this.pieceH;
        const y1 = (r + 1) * this.pieceH;
        const edge = this.edgeMap.vEdges[r][c];
        path.moveTo(x, y0);
        this._drawEdge(path, x, y0, x, y1, edge);
      }
    }

    ctx.stroke(path);

    // 3. Draw outer rounded border once
    const borderPath = new Path2D();
    const radius = 16;
    const size = this.boardSize;
    borderPath.moveTo(radius, 0);
    borderPath.lineTo(size - radius, 0);
    borderPath.arcTo(size, 0, size, radius, radius);
    borderPath.lineTo(size, size - radius);
    borderPath.arcTo(size, size, size - radius, size, radius);
    borderPath.lineTo(radius, size);
    borderPath.arcTo(0, size, 0, size - radius, radius);
    borderPath.lineTo(0, radius);
    borderPath.arcTo(0, 0, radius, 0, radius);
    borderPath.closePath();

    ctx.strokeStyle = 'rgba(136, 79, 68, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke(borderPath);

    ctx.restore();
  }

  /**
   * Draw placed pieces on the board canvas
   */
  drawPlacedPiece(ctx, pieceData) {
    const { canvas, originX, originY } = pieceData;
    ctx.drawImage(canvas, originX, originY);
  }
}

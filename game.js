// ============================================================
//  TIC TAC TOE — X vs O
//  Features: AI (minimax) with 3 difficulty levels, 2-player
//  mode, animated marks, win-line, score tracking.
// ============================================================

(() => {
  'use strict';

  // ---- Win Patterns ----
  const WIN_PATTERNS = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6],          // diags
  ];

  // Line coordinates for SVG win-line (percentage based)
  // Each pattern maps to [x1, y1, x2, y2] within the board grid
  const LINE_COORDS = {
    '0,1,2': [16.6, 16.6, 83.3, 16.6],
    '3,4,5': [16.6, 50,   83.3, 50],
    '6,7,8': [16.6, 83.3, 83.3, 83.3],
    '0,3,6': [16.6, 16.6, 16.6, 83.3],
    '1,4,7': [50,   16.6, 50,   83.3],
    '2,5,8': [83.3, 16.6, 83.3, 83.3],
    '0,4,8': [16.6, 16.6, 83.3, 83.3],
    '2,4,6': [83.3, 16.6, 16.6, 83.3],
  };

  // ---- State ----
  let board       = Array(9).fill(null);  // null, 'X', 'O'
  let currentMark = 'X';
  let mode        = 'ai';    // 'ai' | 'pvp'
  let difficulty  = 'medium'; // 'easy' | 'medium' | 'hard'
  let scores      = { X: 0, O: 0, draw: 0 };
  let gameActive  = true;
  let aiThinking  = false;

  // ---- DOM ----
  const cells     = document.querySelectorAll('.cell');
  const winLineSvg = document.getElementById('win-line-svg');
  const winLine   = document.getElementById('win-line');
  const turnPill  = document.getElementById('turn-pill');
  const turnIcon  = document.getElementById('turn-icon');
  const turnText  = document.getElementById('turn-text');
  const xScore    = document.getElementById('x-score');
  const oScore    = document.getElementById('o-score');
  const drawScore = document.getElementById('draw-score');
  const xLabel    = document.getElementById('x-label');
  const oLabel    = document.getElementById('o-label');
  const scoreX    = document.getElementById('score-x');
  const scoreO    = document.getElementById('score-o');
  const scoreDraw = document.getElementById('score-draw');
  const restartBtn = document.getElementById('restart-btn');
  const resultOverlay = document.getElementById('result-overlay');
  const resultEmoji   = document.getElementById('result-emoji');
  const resultTitle   = document.getElementById('result-title');
  const resultSubtitle = document.getElementById('result-subtitle');
  const resultPlayBtn  = document.getElementById('result-play-btn');
  const diffSelector  = document.getElementById('difficulty-selector');
  const bgCanvas = document.getElementById('bg-canvas');
  const bgCtx    = bgCanvas.getContext('2d');

  // ---- Cell Click ----
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      if (!gameActive || aiThinking) return;
      const idx = parseInt(cell.dataset.index);
      if (board[idx] !== null) return;

      placeMark(idx, currentMark);

      const winner = checkWin();
      if (winner) {
        endRound(winner);
        return;
      }
      if (board.every(c => c !== null)) {
        endRound('draw');
        return;
      }

      switchTurn();

      if (mode === 'ai' && currentMark === 'O') {
        aiMove();
      }
    });
  });

  function placeMark(idx, mark) {
    board[idx] = mark;
    const cell = cells[idx];
    cell.classList.add('taken');

    const markEl = document.createElement('div');
    markEl.className = 'mark';

    if (mark === 'X') {
      const inner = document.createElement('div');
      inner.className = 'mark-x';
      markEl.appendChild(inner);
    } else {
      const inner = document.createElement('div');
      inner.className = 'mark-o';
      markEl.appendChild(inner);
    }

    cell.appendChild(markEl);
  }

  function switchTurn() {
    currentMark = currentMark === 'X' ? 'O' : 'X';
    updateTurnUI();
  }

  function updateTurnUI() {
    turnIcon.textContent = currentMark;
    turnIcon.className = currentMark === 'X' ? 'turn-x' : 'turn-o';
    turnPill.className = 'turn-pill ' + (currentMark === 'X' ? 'x-turn' : 'o-turn');

    if (mode === 'ai') {
      turnText.textContent = currentMark === 'X' ? 'Your turn' : 'AI thinking…';
    } else {
      turnText.textContent = `Player ${currentMark}'s turn`;
    }

    // Highlight active score card
    scoreX.classList.toggle('highlight', currentMark === 'X' && gameActive);
    scoreO.classList.toggle('highlight', currentMark === 'O' && gameActive);
    scoreDraw.classList.remove('highlight');
  }

  // ---- Win Check ----
  function checkWin() {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], pattern };
      }
    }
    return null;
  }

  // ---- End Round ----
  function endRound(result) {
    gameActive = false;
    cells.forEach(c => c.classList.add('game-over'));

    if (result === 'draw') {
      scores.draw++;
      drawScore.textContent = scores.draw;
      scoreDraw.classList.add('highlight');
      scoreX.classList.remove('highlight');
      scoreO.classList.remove('highlight');

      turnText.textContent = "It's a draw!";
      turnIcon.textContent = '=';
      turnIcon.className = '';
      turnPill.className = 'turn-pill';

      setTimeout(() => showResult('draw'), 600);
    } else {
      const { winner, pattern } = result;
      scores[winner]++;
      if (winner === 'X') {
        xScore.textContent = scores.X;
        scoreX.classList.add('highlight');
        scoreO.classList.remove('highlight');
      } else {
        oScore.textContent = scores.O;
        scoreO.classList.add('highlight');
        scoreX.classList.remove('highlight');
      }

      // Highlight winning cells
      pattern.forEach(idx => {
        cells[idx].classList.add('win-cell', winner === 'X' ? 'x-win' : 'o-win');
      });

      // Draw win line
      drawWinLine(pattern, winner);

      const winLabel = mode === 'ai'
        ? (winner === 'X' ? 'You win!' : 'AI wins!')
        : `Player ${winner} wins!`;
      turnText.textContent = winLabel;

      setTimeout(() => showResult(winner), 900);
    }
  }

  function drawWinLine(pattern, winner) {
    const key = pattern.join(',');
    const coords = LINE_COORDS[key];
    if (!coords) return;

    winLine.setAttribute('x1', coords[0]);
    winLine.setAttribute('y1', coords[1]);
    winLine.setAttribute('x2', coords[2]);
    winLine.setAttribute('y2', coords[3]);
    winLine.className.baseVal = (winner === 'X' ? 'x-line' : 'o-line') + ' animate';
  }

  // ---- Result Modal ----
  function showResult(result) {
    if (result === 'draw') {
      resultEmoji.textContent = '🤝';
      resultTitle.textContent = "It's a Draw!";
      resultTitle.className = 'draw-result';
      resultSubtitle.textContent = 'A battle of equals.';
    } else {
      const isX = result === 'X';
      if (mode === 'ai') {
        resultEmoji.textContent = isX ? '🎉' : '🤖';
        resultTitle.textContent = isX ? 'You Win!' : 'AI Wins!';
        resultSubtitle.textContent = isX
          ? 'Brilliant strategy!'
          : 'The machine prevails… Try again!';
      } else {
        resultEmoji.textContent = '🏆';
        resultTitle.textContent = `Player ${result} Wins!`;
        resultSubtitle.textContent = 'Well played!';
      }
      resultTitle.className = isX ? 'x-wins' : 'o-wins';
    }
    resultOverlay.classList.remove('hidden');
  }

  // ---- AI (Minimax) ----
  function aiMove() {
    aiThinking = true;
    updateTurnUI();

    const delay = 300 + Math.random() * 400;
    setTimeout(() => {
      let move;
      if (difficulty === 'easy') {
        move = aiEasyMove();
      } else if (difficulty === 'medium') {
        // 60% optimal, 40% random
        move = Math.random() < 0.6 ? aiBestMove() : aiRandomMove();
      } else {
        move = aiBestMove();
      }

      placeMark(move, 'O');
      aiThinking = false;

      const winner = checkWin();
      if (winner) {
        endRound(winner);
        return;
      }
      if (board.every(c => c !== null)) {
        endRound('draw');
        return;
      }

      switchTurn();
    }, delay);
  }

  function aiRandomMove() {
    const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  function aiEasyMove() {
    // Mostly random, but block wins 50% of the time
    if (Math.random() < 0.5) {
      // Check if opponent is about to win and block
      const block = findWinningMove('X');
      if (block !== null) return block;
    }
    return aiRandomMove();
  }

  function findWinningMove(mark) {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      const vals = [board[a], board[b], board[c]];
      const markCount = vals.filter(v => v === mark).length;
      const nullCount = vals.filter(v => v === null).length;
      if (markCount === 2 && nullCount === 1) {
        const emptyIdx = [a, b, c].find(i => board[i] === null);
        return emptyIdx;
      }
    }
    return null;
  }

  function aiBestMove() {
    // Try to win first
    const winMove = findWinningMove('O');
    if (winMove !== null) return winMove;

    // Then block
    const blockMove = findWinningMove('X');
    if (blockMove !== null) return blockMove;

    // Otherwise minimax
    let bestScore = -Infinity;
    let bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== null) continue;
      board[i] = 'O';
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
    return bestMove;
  }

  function minimax(b, depth, isMaximizing, alpha, beta) {
    const result = checkWinStatic(b);
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (b.every(c => c !== null)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) continue;
        b[i] = 'O';
        const score = minimax(b, depth + 1, false, alpha, beta);
        b[i] = null;
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) continue;
        b[i] = 'X';
        const score = minimax(b, depth + 1, true, alpha, beta);
        b[i] = null;
        best = Math.min(best, score);
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function checkWinStatic(b) {
    for (const [a, c, d] of WIN_PATTERNS) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return null;
  }

  // ---- Reset ----
  function resetBoard() {
    board = Array(9).fill(null);
    currentMark = 'X';
    gameActive = true;
    aiThinking = false;

    cells.forEach(cell => {
      cell.innerHTML = '';
      cell.className = 'cell';
    });

    winLine.className.baseVal = '';
    winLine.setAttribute('x1', 0);
    winLine.setAttribute('y1', 0);
    winLine.setAttribute('x2', 0);
    winLine.setAttribute('y2', 0);

    resultOverlay.classList.add('hidden');
    updateTurnUI();
  }

  restartBtn.addEventListener('click', resetBoard);
  resultPlayBtn.addEventListener('click', resetBoard);

  // ---- Mode Switch ----
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newMode = btn.dataset.mode;
      if (newMode === mode) return;

      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = newMode;

      // Update labels
      if (mode === 'ai') {
        xLabel.textContent = 'You';
        oLabel.textContent = 'AI';
        diffSelector.classList.remove('hidden-diff');
      } else {
        xLabel.textContent = 'Player X';
        oLabel.textContent = 'Player O';
        diffSelector.classList.add('hidden-diff');
      }

      // Reset scores and board
      scores = { X: 0, O: 0, draw: 0 };
      xScore.textContent = '0';
      oScore.textContent = '0';
      drawScore.textContent = '0';
      resetBoard();
    });
  });

  // ---- Difficulty Switch ----
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      difficulty = btn.dataset.diff;
    });
  });

  // ---- Background Animation ----
  function initBackground() {
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      bgCanvas.width  = window.innerWidth * dpr;
      bgCanvas.height = window.innerHeight * dpr;
      bgCanvas.style.width  = window.innerWidth + 'px';
      bgCanvas.style.height = window.innerHeight + 'px';
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Subtle floating orbs
    const orbs = [];
    for (let i = 0; i < 5; i++) {
      orbs.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 80 + Math.random() * 160,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        color: i % 2 === 0
          ? 'rgba(129,140,248,0.03)'
          : 'rgba(251,146,60,0.025)',
      });
    }

    // Small particles
    const particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 1 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: 0.06 + Math.random() * 0.12,
        color: Math.random() > 0.5 ? '129,140,248' : '251,146,60',
      });
    }

    function loop() {
      bgCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Orbs
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r) o.x = window.innerWidth + o.r;
        if (o.x > window.innerWidth + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = window.innerHeight + o.r;
        if (o.y > window.innerHeight + o.r) o.y = -o.r;

        const grad = bgCtx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, o.color);
        grad.addColorStop(1, 'transparent');
        bgCtx.fillStyle = grad;
        bgCtx.beginPath();
        bgCtx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        bgCtx.fill();
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;

        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(${p.color},${p.alpha})`;
        bgCtx.fill();
      }

      requestAnimationFrame(loop);
    }
    loop();
  }

  // ---- Init ----
  initBackground();
  updateTurnUI();
})();

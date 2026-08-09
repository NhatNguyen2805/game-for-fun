/* ============================================
   EFFECTS — Sparkles, Confetti, Animations
   ============================================ */

const Effects = (() => {

  // --- SPARKLE BURST ---
  function sparkle(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'sparkle';
      const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.5 - 0.25);
      const dist = 30 + Math.random() * 40;
      const endDist = dist + 20 + Math.random() * 30;
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;
      const ex = Math.cos(angle) * endDist;
      const ey = Math.sin(angle) * endDist - 20;

      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.setProperty('--sx', sx + 'px');
      el.style.setProperty('--sy', sy + 'px');
      el.style.setProperty('--ex', ex + 'px');
      el.style.setProperty('--ey', ey + 'px');

      const size = 4 + Math.random() * 6;
      el.style.width = size + 'px';
      el.style.height = size + 'px';

      // Random color from palette
      const colors = ['#FCE89C', '#FFB5A7', '#A5D1B5', '#B8E2F2', '#ffffff'];
      el.style.background = colors[Math.floor(Math.random() * colors.length)];

      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }


  // --- CONFETTI ---
  let confettiRunning = false;

  function confetti(durationMs = 3000) {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#FFB5A7', '#FCE89C', '#A5D1B5', '#B8E2F2', '#F3DF94', '#FFDAD3', '#C0EDD0'];
    const particles = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * canvas.height * 0.5,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    confettiRunning = true;
    const startTime = performance.now();

    function draw(now) {
      if (!confettiRunning) return;
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyAlive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.vy += 0.05; // gravity
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (elapsed > durationMs - 1000) {
          p.opacity = Math.max(0, p.opacity - 0.015);
        }

        if (p.opacity > 0 && p.y < canvas.height + 20) {
          anyAlive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (anyAlive && elapsed < durationMs + 1000) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiRunning = false;
      }
    }

    requestAnimationFrame(draw);
  }

  function stopConfetti() {
    confettiRunning = false;
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }


  // --- STAR POP ANIMATION (CSS driven, just triggers) ---
  function animateStars() {
    // Stars animate via CSS transitions when .active is added to victory-overlay
    // This function is a placeholder for any extra JS-driven star effects
  }

  return { sparkle, confetti, stopConfetti, animateStars };
})();

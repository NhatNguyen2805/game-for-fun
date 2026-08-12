/* ============================================
   OCEAN FISHING & SPELLING GAME — Core Engine
   Phase 1: Ocean World & Swimming Fish Sprites
   ============================================ */

(function () {
  'use strict';

  // === FISH SPECIES DATA ===
  const FISH_SPECIES = [
    {
      id: 'dolphin',
      name: 'Dolphin',
      vietnamese: 'Cá heo',
      word: 'DOLPHIN',
      color: '#38BDF8',
      secondaryColor: '#0284C7',
      emoji: '🐬',
      size: { width: 95, height: 65 },
      speed: 1.8,
      fact: 'Dolphins are super smart ocean friends who love jumping in waves! 🐬',
      svg: `<svg viewBox="0 0 100 65" class="fish-svg">
              <path d="M10,35 Q30,10 65,15 Q90,20 95,35 Q90,50 60,55 Q35,55 10,35 Z" fill="#38BDF8"/>
              <path d="M60,55 Q45,62 30,55 Q45,50 60,55 Z" fill="#0284C7"/>
              <path d="M45,18 Q55,5 65,15 Z" fill="#0284C7"/>
              <polygon points="5,35 15,22 15,48" fill="#0284C7" class="fish-tail"/>
              <circle cx="78" cy="28" r="4" fill="#FFFFFF"/>
              <circle cx="79" cy="28" r="2" fill="#0F172A"/>
              <path d="M82,34 Q86,37 82,40" stroke="#0F172A" stroke-width="2" fill="none"/>
            </svg>`
    },
    {
      id: 'turtle',
      name: 'Sea Turtle',
      vietnamese: 'Rùa biển',
      word: 'TURTLE',
      color: '#34D399',
      secondaryColor: '#059669',
      emoji: '🐢',
      size: { width: 85, height: 60 },
      speed: 1.0,
      fact: 'Sea turtles can swim thousands of miles across the deep blue ocean! 🐢',
      svg: `<svg viewBox="0 0 90 60" class="fish-svg">
              <ellipse cx="45" cy="30" rx="30" ry="22" fill="#34D399"/>
              <ellipse cx="45" cy="30" rx="25" ry="18" fill="#059669" opacity="0.6"/>
              <circle cx="72" cy="30" r="12" fill="#34D399"/>
              <circle cx="75" cy="27" r="3" fill="#FFFFFF"/>
              <circle cx="76" cy="27" r="1.5" fill="#0F172A"/>
              <path d="M30,12 Q20,2 10,12" stroke="#059669" stroke-width="6" stroke-linecap="round" fill="none"/>
              <path d="M30,48 Q20,58 10,48" stroke="#059669" stroke-width="6" stroke-linecap="round" fill="none"/>
            </svg>`
    },
    {
      id: 'clownfish',
      name: 'Clownfish',
      vietnamese: 'Cá hề',
      word: 'FISH',
      color: '#FB923C',
      secondaryColor: '#FFFFFF',
      emoji: '🐠',
      size: { width: 75, height: 50 },
      speed: 1.4,
      fact: 'Clownfish love hiding inside soft anemones under the sea! 🐠',
      svg: `<svg viewBox="0 0 80 50" class="fish-svg">
              <path d="M15,25 Q35,5 60,12 Q75,25 60,38 Q35,45 15,25 Z" fill="#FB923C"/>
              <path d="M32,10 Q35,25 32,40" stroke="#FFFFFF" stroke-width="7" fill="none"/>
              <path d="M32,10 Q35,25 32,40" stroke="#000000" stroke-width="1" fill="none"/>
              <path d="M50,14 Q53,25 50,36" stroke="#FFFFFF" stroke-width="6" fill="none"/>
              <polygon points="5,25 18,12 18,38" fill="#FB923C" class="fish-tail"/>
              <polygon points="5,25 18,12 18,38" stroke="#FFFFFF" stroke-width="2" fill="none"/>
              <circle cx="65" cy="20" r="3.5" fill="#FFFFFF"/>
              <circle cx="66" cy="20" r="1.8" fill="#000000"/>
            </svg>`
    },
    {
      id: 'octopus',
      name: 'Octopus',
      vietnamese: 'Bạch tuộc',
      word: 'OCTOPUS',
      color: '#C084FC',
      secondaryColor: '#7E22CE',
      emoji: '🐙',
      size: { width: 80, height: 75 },
      speed: 1.2,
      fact: 'An octopus has 8 wiggling arms and 3 hearts! 🐙',
      svg: `<svg viewBox="0 0 80 80" class="fish-svg">
              <circle cx="40" cy="30" r="24" fill="#C084FC"/>
              <circle cx="32" cy="25" r="4" fill="#FFFFFF"/>
              <circle cx="32" cy="25" r="2" fill="#0F172A"/>
              <circle cx="48" cy="25" r="4" fill="#FFFFFF"/>
              <circle cx="48" cy="25" r="2" fill="#0F172A"/>
              <path d="M35,34 Q40,38 45,34" stroke="#7E22CE" stroke-width="2.5" fill="none"/>
              <!-- Tentacles -->
              <path d="M20,48 Q15,65 22,75" stroke="#C084FC" stroke-width="5" stroke-linecap="round" fill="none" class="tentacle-1"/>
              <path d="M30,50 Q28,68 33,78" stroke="#C084FC" stroke-width="5" stroke-linecap="round" fill="none" class="tentacle-2"/>
              <path d="M40,52 Q40,70 42,78" stroke="#C084FC" stroke-width="5" stroke-linecap="round" fill="none" class="tentacle-3"/>
              <path d="M50,50 Q52,68 47,78" stroke="#C084FC" stroke-width="5" stroke-linecap="round" fill="none" class="tentacle-4"/>
              <path d="M60,48 Q65,65 58,75" stroke="#C084FC" stroke-width="5" stroke-linecap="round" fill="none" class="tentacle-5"/>
            </svg>`
    },
    {
      id: 'shark',
      name: 'Baby Shark',
      vietnamese: 'Cá mập',
      word: 'SHARK',
      color: '#94A3B8',
      secondaryColor: '#475569',
      emoji: '🦈',
      size: { width: 105, height: 60 },
      speed: 2.2,
      fact: 'Sharks are super fast swimmers and ocean guardians! 🦈',
      svg: `<svg viewBox="0 0 110 60" class="fish-svg">
              <path d="M15,30 Q40,10 75,15 Q105,25 105,30 Q105,35 75,45 Q40,50 15,30 Z" fill="#94A3B8"/>
              <path d="M40,30 Q75,30 105,35 Q75,45 40,30 Z" fill="#F1F5F9"/>
              <polygon points="50,15 62,0 70,12" fill="#475569"/>
              <polygon points="5,30 18,12 18,48" fill="#475569" class="fish-tail"/>
              <circle cx="88" cy="24" r="3.5" fill="#FFFFFF"/>
              <circle cx="89" cy="24" r="1.8" fill="#000000"/>
              <line x1="70" y1="26" x2="68" y2="34" stroke="#475569" stroke-width="2"/>
              <line x1="65" y1="27" x2="63" y2="33" stroke="#475569" stroke-width="2"/>
            </svg>`
    }
  ];

  // === ENGINE STATE ===
  let activeFish = [];
  let isRunning = false;
  let animFrameId = null;
  let containerEl = null;
  let caughtCount = 0;
  const TOTAL_TARGET = 10;
  let isCasting = false;

  // === FISH SPRITE CLASS ===
  class FishSprite {
    constructor(species, containerWidth, containerHeight, index) {
      this.species = species;
      this.width = species.size.width;
      this.height = species.size.height;
      
      // Boundaries
      this.minY = 70; // Below header
      this.maxY = containerHeight - this.height - 80; // Above bottom dock
      
      // Position
      this.x = Math.random() * (containerWidth - this.width);
      this.y = this.minY + Math.random() * (this.maxY - this.minY);
      
      // Movement physics
      this.direction = Math.random() > 0.5 ? 1 : -1; // 1 = right, -1 = left
      this.speed = (species.speed + Math.random() * 0.4) * 0.9;
      this.frequency = 0.03 + Math.random() * 0.02;
      this.amplitude = 8 + Math.random() * 12;
      this.time = Math.random() * 100;
      
      // DOM Element creation
      this.el = document.createElement('div');
      this.el.className = `ocean-fish-sprite species-${species.id}`;
      this.el.dataset.fishId = species.id;
      this.el.style.width = `${this.width}px`;
      this.el.style.height = `${this.height}px`;
      this.el.innerHTML = species.svg;
      
      // Tap interaction
      this.el.addEventListener('pointerdown', (e) => this.onTap(e));
      
      this.updatePosition(containerWidth);
    }

    update(containerWidth) {
      this.time += 1;
      this.x += this.speed * this.direction;
      
      // Vertical sine wobble
      const wobble = Math.sin(this.time * this.frequency) * this.amplitude;
      const currentY = Math.max(this.minY, Math.min(this.maxY, this.y + wobble));
      
      // Boundary check & direction reverse
      if (this.x >= containerWidth - this.width - 10 && this.direction === 1) {
        this.direction = -1;
      } else if (this.x <= 10 && this.direction === -1) {
        this.direction = 1;
      }

      // Render transform
      const scaleX = this.direction === 1 ? -1 : 1; // SVG faces left by default
      this.el.style.transform = `translate3d(${this.x}px, ${currentY}px, 0) scaleX(${scaleX})`;

      // Periodic Bubble Spawn
      if (Math.random() < 0.008) {
        this.spawnBubble(this.x + (this.direction === 1 ? this.width : 0), currentY + 15);
      }
    }

    updatePosition(containerWidth) {
      const scaleX = this.direction === 1 ? -1 : 1;
      this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scaleX(${scaleX})`;
    }

    spawnBubble(bubbleX, bubbleY) {
      if (!containerEl) return;
      const bubble = document.createElement('div');
      bubble.className = 'ocean-bubble';
      bubble.style.left = `${bubbleX}px`;
      bubble.style.top = `${bubbleY}px`;
      const size = 6 + Math.random() * 10;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      containerEl.appendChild(bubble);

      setTimeout(() => {
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
      }, 2500);
    }

    onTap(e) {
      e.stopPropagation();
      // Visual feedback: Giggle bounce + extra bubbles
      this.el.classList.add('fish-giggle');
      setTimeout(() => this.el.classList.remove('fish-giggle'), 600);

      // Create burst of 4 bubbles
      for (let i = 0; i < 4; i++) {
        this.spawnBubble(this.x + 20 + (Math.random() * 20 - 10), this.y + (Math.random() * 20 - 10));
      }
      
      if (window.Effects && window.Effects.playPopSound) {
        window.Effects.playPopSound();
      }
    }

    destroy() {
      if (this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
    }
  }

  // === MAIN ENGINE API ===
  const FishingEngine = {
    init() {
      containerEl = document.getElementById('fishing-fish-layer');
      if (!containerEl) return;

      this.bindControls();
      this.start();
    },

    start() {
      this.bindControls();
      if (isRunning) return;
      containerEl = document.getElementById('fishing-fish-layer');
      if (!containerEl) return;

      // Clear existing
      this.stop();
      containerEl.innerHTML = '';
      activeFish = [];

      const rect = containerEl.getBoundingClientRect();
      const width = rect.width || 380;
      const height = rect.height || 500;

      // Spawn 6 initial fish from species list
      for (let i = 0; i < 6; i++) {
        const species = FISH_SPECIES[i % FISH_SPECIES.length];
        const fish = new FishSprite(species, width, height, i);
        activeFish.push(fish);
        containerEl.appendChild(fish.el);
      }

      isRunning = true;
      this.loop();
    },

    loop() {
      if (!isRunning) return;

      const rect = containerEl.getBoundingClientRect();
      const width = rect.width || 380;

      for (let i = 0; i < activeFish.length; i++) {
        activeFish[i].update(width);
      }

      animFrameId = requestAnimationFrame(() => this.loop());
    },

    stop() {
      isRunning = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      activeFish.forEach(f => f.destroy());
      activeFish = [];
    },

    castLine() {
      if (isCasting || activeFish.length === 0) return;
      isCasting = true;

      const btnCast = document.getElementById('btn-cast-line');
      if (btnCast) btnCast.disabled = true;

      // Select random fish as target
      const targetFish = activeFish[Math.floor(Math.random() * activeFish.length)];
      
      // Animate Fishing Hook
      this.animateHookToFish(targetFish, () => {
        // Trigger Fish Catch Event
        this.onFishHooked(targetFish);
        if (btnCast) btnCast.disabled = false;
        isCasting = false;
      });
    },

    animateHookToFish(fishSprite, onComplete) {
      const container = document.querySelector('.fishing-canvas-container');
      if (!container) {
        if (onComplete) onComplete();
        return;
      }

      // Create Hook Line Element
      const lineEl = document.createElement('div');
      lineEl.className = 'fishing-hook-line';
      const hookEl = document.createElement('div');
      hookEl.className = 'fishing-hook';
      hookEl.innerHTML = '🪝';
      
      container.appendChild(lineEl);
      container.appendChild(hookEl);

      const startX = container.clientWidth - 40; // Near boat/rod
      const startY = 30;
      const targetX = fishSprite.x + fishSprite.width / 2;
      const targetY = fishSprite.y + fishSprite.height / 2;

      // Animate line stretching
      const startTime = performance.now();
      const duration = 1000; // 1s drop animation

      function drawLine(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing out back for squishy drop
        const currentX = startX + (targetX - startX) * progress;
        const currentY = startY + (targetY - startY) * progress;

        lineEl.style.left = `${startX}px`;
        lineEl.style.top = `${startY}px`;
        
        // Distance and Angle calculation
        const dx = currentX - startX;
        const dy = currentY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        lineEl.style.width = `${length}px`;
        lineEl.style.transform = `rotate(${angle}deg)`;
        lineEl.style.transformOrigin = '0 0';

        hookEl.style.left = `${currentX - 12}px`;
        hookEl.style.top = `${currentY - 12}px`;

        if (progress < 1) {
          requestAnimationFrame(drawLine);
        } else {
          // Splash effect at hook target
          fishSprite.spawnBubble(targetX, targetY);
          if (window.Effects && window.Effects.playSuccessSound) {
            window.Effects.playSuccessSound();
          }

          setTimeout(() => {
            if (lineEl.parentNode) lineEl.parentNode.removeChild(lineEl);
            if (hookEl.parentNode) hookEl.parentNode.removeChild(hookEl);
            if (onComplete) onComplete();
          }, 300);
        }
      }

      requestAnimationFrame(drawLine);
    },

    onFishHooked(fishSprite) {
      caughtCount = Math.min(caughtCount + 1, TOTAL_TARGET);
      const countDisplay = document.getElementById('fishing-caught-count');
      if (countDisplay) {
        countDisplay.textContent = `${caughtCount}/${TOTAL_TARGET}`;
      }

      // Trigger Toast notification
      if (window.Effects && window.Effects.showToast) {
        window.Effects.showToast(`🎣 Got a ${fishSprite.species.name}! Amazing Dawson!`);
      }
    },

    bindControls() {
      const btnCast = document.getElementById('btn-cast-line');
      if (btnCast) {
        btnCast.onclick = () => this.castLine();
      }
    }
  };

  // Expose to Global Scope
  window.FishingEngine = FishingEngine;

})();

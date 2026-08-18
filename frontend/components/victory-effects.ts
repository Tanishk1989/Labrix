/**
 * Victory Effects: Web-Audio synthesized haptic chime + lightweight canvas particle confetti.
 * Zero external audio files, zero heavy libraries.
 */

export function playVictoryChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [
      { freq: 523.25, time: 0, duration: 0.35, gain: 0.15 }, // C5
      { freq: 659.25, time: 0.08, duration: 0.4, gain: 0.18 }, // E5
      { freq: 783.99, time: 0.16, duration: 0.5, gain: 0.2 }, // G5
      { freq: 1046.5, time: 0.24, duration: 0.7, gain: 0.25 }, // C6 (High sparkle)
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime + time);
      gainNode.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + time + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    });
  } catch {
    // Gracefully ignore audio policies if blocked by browser
  }
}

export function fireVictoryConfetti() {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [
    "#00F0FF", // Neon Cyan
    "#6366F1", // Indigo
    "#EC4899", // Fuchsia
    "#10B981", // Emerald
    "#F59E0B", // Gold
    "#FFFFFF", // Pure White
  ];

  interface Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    vx: number;
    vy: number;
    rotation: number;
    vRotation: number;
    opacity: number;
  }

  const particles: Particle[] = [];
  const particleCount = 70;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.45 + (Math.random() - 0.5) * 100,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 4,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }

  let animationFrame: number;
  const startTime = performance.now();

  function render(time: number) {
    if (!ctx) return;
    const elapsed = (time - startTime) / 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let active = 0;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.rotation += p.vRotation;
      p.opacity = Math.max(0, 1 - elapsed / 2.5);

      if (p.opacity > 0) {
        active++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    if (active > 0 && elapsed < 3.0) {
      animationFrame = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrame);
      canvas.remove();
    }
  }

  animationFrame = requestAnimationFrame(render);
}

export function triggerVictoryMoment() {
  playVictoryChime();
  fireVictoryConfetti();
}

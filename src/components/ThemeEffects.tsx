import { useEffect, useRef } from "react";
import type { Theme } from "../settings";

type Kind = "sakura" | "autumn" | "halloween";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  sway: number;
  swayPhase: number;
  angle: number;
  spin: number;
  flip: number;
  flipSpeed: number;
  hue: number;
  alpha: number;
  variant: number;
}

const SAKURA_COLORS = ["#ffc4d6", "#ffb0c8", "#ffd9e4", "#ff9fbd"];
const AUTUMN_COLORS = ["#e8832a", "#c4501b", "#d9a21b", "#a63a17", "#b9772e", "#8f2d12"];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function spawn(kind: Kind, width: number, height: number, initial: boolean): Particle {
  const base: Particle = {
    x: rand(0, width),
    y: initial ? rand(-height * 0.1, height) : rand(-60, -10),
    size: 1,
    speed: 1,
    drift: 0,
    sway: rand(10, 40),
    swayPhase: rand(0, Math.PI * 2),
    angle: rand(0, Math.PI * 2),
    spin: rand(-0.02, 0.02),
    flip: rand(0, Math.PI * 2),
    flipSpeed: rand(0.01, 0.04),
    hue: 0,
    alpha: rand(0.55, 0.95),
    variant: Math.floor(Math.random() * 6),
  };
  if (kind === "sakura") {
    base.size = rand(7, 14);
    base.speed = rand(0.5, 1.2);
    base.drift = rand(0.1, 0.5);
  } else if (kind === "autumn") {
    base.size = rand(10, 20);
    base.speed = rand(0.7, 1.6);
    base.drift = rand(-0.3, 0.5);
    base.spin = rand(-0.03, 0.03);
  } else {
    // halloween: embers rise, bats cross the screen
    const bat = Math.random() < 0.18;
    base.variant = bat ? 100 : 0;
    if (bat) {
      base.size = rand(10, 18);
      base.speed = rand(-0.25, 0.25);
      base.drift = rand(0.9, 1.7) * (Math.random() < 0.5 ? 1 : -1);
      base.x = base.drift > 0 ? -30 : width + 30;
      base.y = rand(height * 0.05, height * 0.6);
      base.sway = rand(14, 36);
      base.alpha = 0.8;
    } else {
      base.size = rand(1.2, 3.2);
      base.speed = -rand(0.3, 0.9);
      base.drift = rand(-0.2, 0.2);
      base.y = initial ? rand(0, height) : height + rand(10, 60);
      base.hue = Math.random() < 0.6 ? 28 : 275;
      base.alpha = rand(0.3, 0.8);
    }
  }
  return base;
}

function drawPetal(ctx: CanvasRenderingContext2D, p: Particle) {
  const s = p.size;
  const squash = 0.35 + Math.abs(Math.cos(p.flip)) * 0.65;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(1, squash);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = SAKURA_COLORS[p.variant % SAKURA_COLORS.length];
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.6);
  ctx.bezierCurveTo(s * 0.8, -s * 0.9, s * 0.9, s * 0.3, 0, s * 0.7);
  ctx.bezierCurveTo(-s * 0.9, s * 0.3, -s * 0.8, -s * 0.9, 0, -s * 0.6);
  ctx.fill();
  // notch at the tip, like a real cherry petal
  ctx.globalAlpha = p.alpha * 0.9;
  ctx.fillStyle = "#fff1f5";
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.62);
  ctx.lineTo(0, -s * 0.38);
  ctx.lineTo(s * 0.12, -s * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLeaf(ctx: CanvasRenderingContext2D, p: Particle) {
  const s = p.size;
  const squash = 0.45 + Math.abs(Math.cos(p.flip)) * 0.55;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(squash, 1);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = AUTUMN_COLORS[p.variant % AUTUMN_COLORS.length];
  ctx.beginPath();
  if (p.variant % 2 === 0) {
    // maple-ish: five pointed lobes
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? s * 0.62 : s * 0.28;
      const a = (Math.PI * i) / spikes - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  } else {
    // oak/birch-ish: simple pointed oval
    ctx.moveTo(0, -s * 0.6);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.05, 0, s * 0.6);
    ctx.quadraticCurveTo(-s * 0.55, -s * 0.05, 0, -s * 0.6);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = p.alpha * 0.55;
  ctx.strokeStyle = "rgba(60, 20, 5, 0.8)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.lineTo(0, s * 0.75);
  ctx.stroke();
  ctx.restore();
}

function drawBat(ctx: CanvasRenderingContext2D, p: Particle) {
  const s = p.size;
  const flap = Math.sin(p.flip * 6) * 0.55;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.drift > 0 ? 1 : -1, 1);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = "#07030d";
  ctx.strokeStyle = "rgba(255, 122, 0, 0.35)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.15);
  // right wing
  ctx.quadraticCurveTo(s * 0.5, -s * (0.7 + flap), s * 1.3, -s * (0.25 + flap));
  ctx.quadraticCurveTo(s * 1.0, s * 0.05, s * 0.75, s * 0.15);
  ctx.quadraticCurveTo(s * 0.5, s * 0.02, s * 0.3, s * 0.3);
  ctx.quadraticCurveTo(s * 0.12, s * 0.12, 0, s * 0.35);
  // left wing (mirror)
  ctx.quadraticCurveTo(-s * 0.12, s * 0.12, -s * 0.3, s * 0.3);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.02, -s * 0.75, s * 0.15);
  ctx.quadraticCurveTo(-s * 1.0, s * 0.05, -s * 1.3, -s * (0.25 + flap));
  ctx.quadraticCurveTo(-s * 0.5, -s * (0.7 + flap), 0, -s * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // ears
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.15);
  ctx.lineTo(-s * 0.08, -s * 0.38);
  ctx.lineTo(0, -s * 0.2);
  ctx.lineTo(s * 0.08, -s * 0.38);
  ctx.lineTo(s * 0.12, -s * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEmber(ctx: CanvasRenderingContext2D, p: Particle) {
  const color = p.hue === 28 ? "255, 140, 30" : "176, 106, 255";
  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
  glow.addColorStop(0, `rgba(${color}, ${p.alpha})`);
  glow.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
  ctx.fill();
}

interface ThemeEffectsProps {
  theme: Theme;
}

export default function ThemeEffects({ theme }: ThemeEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kind: Kind | null = theme === "sakura" || theme === "autumn" || theme === "halloween" ? theme : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!kind || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(70, Math.max(18, (width * height) / 22000)));
      const count = kind === "halloween" ? Math.round(target * 0.8) : target;
      while (particles.length < count) particles.push(spawn(kind, width, height, true));
      particles.length = Math.min(particles.length, count);
    };

    const step = (time: number) => {
      frame = requestAnimationFrame(step);
      // normalise to ~60fps so slow devices don't crawl
      const dt = Math.min(2.5, last ? (time - last) / 16.67 : 1);
      last = time;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.swayPhase += 0.012 * dt;
        p.flip += p.flipSpeed * dt;
        p.angle += p.spin * dt;
        const isBat = p.variant === 100;
        if (isBat) {
          p.x += p.drift * dt;
          p.y += (Math.sin(p.swayPhase * 2) * 0.6 + p.speed) * dt;
        } else {
          p.y += p.speed * dt;
          p.x += (p.drift + Math.sin(p.swayPhase) * (p.sway / 80)) * dt;
        }

        if (kind === "sakura") drawPetal(ctx, p);
        else if (kind === "autumn") drawLeaf(ctx, p);
        else if (isBat) drawBat(ctx, p);
        else drawEmber(ctx, p);

        const margin = 50;
        const gone = isBat
          ? p.x < -margin * 2 || p.x > width + margin * 2
          : p.speed >= 0
            ? p.y > height + margin
            : p.y < -margin;
        if (gone || (!isBat && (p.x < -margin || p.x > width + margin))) {
          particles[i] = spawn(kind, width, height, false);
        }
      }
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };

    const start = () => {
      stop();
      if (reduce.matches || document.hidden) return;
      frame = requestAnimationFrame(step);
    };

    const drawStill = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (kind === "sakura") drawPetal(ctx, p);
        else if (kind === "autumn") drawLeaf(ctx, p);
        else if (p.variant !== 100) drawEmber(ctx, p);
      }
    };

    const onMotionChange = () => {
      if (reduce.matches) {
        stop();
        drawStill();
      } else {
        start();
      }
    };

    particles = [];
    resize();
    if (reduce.matches) drawStill();
    else start();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", start);
    reduce.addEventListener("change", onMotionChange);
    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", start);
      reduce.removeEventListener("change", onMotionChange);
    };
  }, [kind]);

  if (!kind) return null;
  return <canvas ref={canvasRef} className="theme-effects" aria-hidden="true" />;
}

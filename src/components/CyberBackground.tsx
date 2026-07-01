import { useEffect, useRef } from "react";

/** Animated background: floating hex blockchain nodes + grid. */
export function CyberBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const nodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1.5 + Math.random() * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 160 * dpr) {
            const a = 1 - d / (160 * dpr);
            ctx.strokeStyle = `hsla(187, 100%, 55%, ${a * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      // nodes
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > c.width) n.vx *= -1;
        if (n.y < 0 || n.y > c.height) n.vy *= -1;
        ctx.fillStyle = "hsla(187,100%,65%,0.9)";
        ctx.shadowColor = "hsla(187,100%,55%,0.8)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
    </div>
  );
}

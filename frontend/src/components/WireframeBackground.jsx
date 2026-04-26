import { useEffect, useRef } from 'react';

const WireframeBackground = () => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* ── Geometry (same as login page) ── */
    const generatePoints = () => {
      const pts = [];
      // Skull dome
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        for (let j = 0; j < 8; j++) {
          const p = (j / 8) * Math.PI * 0.6;
          const r = 120 + Math.sin(p * 2) * 15;
          pts.push({
            x: Math.cos(a) * Math.sin(p) * r,
            y: -Math.cos(p) * r + 20,
            z: Math.sin(a) * Math.sin(p) * r,
          });
        }
      }
      // Jaw
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = 70 + Math.cos(a * 2) * 15;
        pts.push({ x: Math.cos(a) * r, y: 80 + Math.sin(a * 3) * 10, z: Math.sin(a) * r * 0.8 });
      }
      // Eye sockets
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          pts.push({ x: side * 38 + Math.cos(a) * 18, y: -10 + Math.sin(a) * 12, z: 95 + Math.cos(a) * 5 });
        }
      }
      // Nose
      for (let i = 0; i < 6; i++) {
        pts.push({ x: (Math.random() - 0.5) * 8, y: -5 + i * 12, z: 100 + Math.sin(i * 0.8) * 15 });
      }
      return pts;
    };

    const points = generatePoints();
    const edges  = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dz = points[i].z - points[j].z;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 65) edges.push([i, j]);
      }
    }

    const project = (p, t, cx, cy, scale) => {
      const cosY = Math.cos(t * 0.18);
      const sinY = Math.sin(t * 0.18);
      const rx   = p.x * cosY + p.z * sinY;
      const rz   = -p.x * sinY + p.z * cosY;
      const cosX = Math.cos(0.12);
      const sinX = Math.sin(0.12);
      const ry   = p.y * cosX - rz * sinX;
      const rz2  = p.y * sinX + rz * cosX;
      const fov   = 400;
      const depth = fov / (fov + rz2 + 200);
      return { x: cx + rx * depth * scale, y: cy + ry * depth * scale, depth };
    };

    /* ── Single centered large skull ── */
    const skulls = [
      { cx: 0.5, cy: 0.5, scale: 2.2, speed: 0.8, phase: 0 },
    ];

    let time = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      skulls.forEach(sk => {
        const t   = time * sk.speed + sk.phase;
        const cx  = W * sk.cx;
        const cy  = H * sk.cy;

        // Subtle scan line
        const scanY = cy + Math.sin(t * 1.5) * (H * 0.12);
        const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
        scanGrad.addColorStop(0, 'transparent');
        scanGrad.addColorStop(0.5, 'rgba(59,130,246,0.025)');
        scanGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(cx - 180 * sk.scale, scanY - 30, 360 * sk.scale, 60);

        // Edges
        edges.forEach(([i, j]) => {
          const a = project(points[i], t, cx, cy, sk.scale);
          const b = project(points[j], t, cx, cy, sk.scale);
          const avg   = (a.depth + b.depth) / 2;
          const midY  = (a.y + b.y) / 2;
          const boost = Math.abs(midY - scanY) < 40 ? (1 - Math.abs(midY - scanY) / 40) * 0.15 : 0;
          const alpha = Math.max(0, Math.min(0.12, avg * 0.15)) + boost;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(90,160,240,${alpha})`;
          ctx.lineWidth   = 0.5 + boost * 1.5;
          ctx.stroke();
        });

        // Points
        points.forEach(p => {
          const pr      = project(p, t, cx, cy, sk.scale);
          const dScan   = Math.abs(pr.y - scanY);
          const hilight = dScan < 25;
          const sz      = hilight ? 1.6 : 0.7;
          const alpha   = hilight ? 0.25 : Math.max(0.04, pr.depth * 0.12);
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, sz, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(130,190,255,${alpha})`;
          ctx.fill();
        });
      });

      time += 0.006;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width:  '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
      }}
    />
  );
};

export default WireframeBackground;

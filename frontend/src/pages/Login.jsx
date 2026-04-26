import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [bootLines, setBootLines] = useState([]);
  const [progressPct, setProgressPct] = useState(0);
  const [activeRole, setActiveRole] = useState('ADMIN');
  const [scanProgress, setScanProgress] = useState(0);
  const [statusText, setStatusText] = useState('CROSS-REFERENCING DATABASE...');
  const [matchPercent, setMatchPercent] = useState(97.3);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Cycle status text
  useEffect(() => {
    const texts = [
      'CROSS-REFERENCING DATABASE...',
      'SCANNING BIOMETRIC SIGNATURES...',
      'VERIFYING CLEARANCE LEVEL...',
      'LOADING SECURE MODULES...',
      'ENCRYPTING CHANNEL AES-256...',
      'SYNCING WITH CENTRAL NODE...',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setStatusText(texts[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animate match percentage
  useEffect(() => {
    const interval = setInterval(() => {
      setMatchPercent(prev => {
        const delta = (Math.random() - 0.5) * 1.2;
        return Math.min(99.9, Math.max(94.0, prev + delta));
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Wireframe head canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 500;
    const H = canvas.height = 500;
    let time = 0;

    // 3D points for a geometric wireframe head shape
    const generateHeadPoints = () => {
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
      // Jaw/chin
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = 70 + Math.cos(a * 2) * 15;
        pts.push({
          x: Math.cos(a) * r,
          y: 80 + Math.sin(a * 3) * 10,
          z: Math.sin(a) * r * 0.8,
        });
      }
      // Eye sockets
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          pts.push({
            x: side * 38 + Math.cos(a) * 18,
            y: -10 + Math.sin(a) * 12,
            z: 95 + Math.cos(a) * 5,
          });
        }
      }
      // Nose bridge
      for (let i = 0; i < 6; i++) {
        pts.push({
          x: (Math.random() - 0.5) * 8,
          y: -5 + i * 12,
          z: 100 + Math.sin(i * 0.8) * 15,
        });
      }
      return pts;
    };

    const points = generateHeadPoints();

    // Generate edges (connect nearby points)
    const edges = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dz = points[i].z - points[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 65) {
          edges.push([i, j]);
        }
      }
    }

    const project = (p, t) => {
      // Rotate Y axis slowly
      const cosY = Math.cos(t * 0.3);
      const sinY = Math.sin(t * 0.3);
      const rx = p.x * cosY + p.z * sinY;
      const rz = -p.x * sinY + p.z * cosY;
      // Slight X tilt
      const cosX = Math.cos(0.15);
      const sinX = Math.sin(0.15);
      const ry = p.y * cosX - rz * sinX;
      const rz2 = p.y * sinX + rz * cosX;

      const fov = 400;
      const depth = fov / (fov + rz2 + 200);
      return {
        x: W / 2 + rx * depth,
        y: H / 2 + ry * depth,
        depth,
        z: rz2,
      };
    };

    const draw = () => {
      time += 0.008;
      ctx.clearRect(0, 0, W, H);

      // Scan line effect
      const scanY = (Math.sin(time * 2) * 0.5 + 0.5) * H;
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.06)');
      scanGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 40, W, 80);

      // Draw edges
      edges.forEach(([i, j]) => {
        const a = project(points[i], time);
        const b = project(points[j], time);
        const avgDepth = (a.depth + b.depth) / 2;
        const alpha = Math.max(0.05, Math.min(0.45, avgDepth * 0.5));

        // Highlight edges near scan line
        const midY = (a.y + b.y) / 2;
        const distToScan = Math.abs(midY - scanY);
        const boost = distToScan < 50 ? (1 - distToScan / 50) * 0.5 : 0;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(100, 180, 255, ${alpha + boost})`;
        ctx.lineWidth = 0.6 + boost * 2;
        ctx.stroke();
      });

      // Draw points
      points.forEach(p => {
        const pr = project(p, time);
        const distToScan = Math.abs(pr.y - scanY);
        const highlight = distToScan < 30;
        const size = highlight ? 2.5 : 1.2;
        const alpha = highlight ? 0.9 : Math.max(0.15, pr.depth * 0.5);

        ctx.beginPath();
        ctx.arc(pr.x, pr.y, size, 0, Math.PI * 2);
        ctx.fillStyle = highlight
          ? `rgba(120, 200, 255, ${alpha})`
          : `rgba(160, 200, 240, ${alpha})`;
        ctx.fill();

        if (highlight && Math.random() > 0.7) {
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, 5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, 0.3)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      // Scan line
      ctx.beginPath();
      ctx.moveTo(80, scanY);
      ctx.lineTo(W - 80, scanY);
      ctx.strokeStyle = `rgba(59, 130, 246, 0.25)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/login', { email, password });
      if (res.data.success) {
        login(res.data.user);

        // ── ACCESS GRANTED animation sequence ──
        setAccessGranted(true);
        const lines = [
          '> CREDENTIALS VALIDATED...',
          '> IDENTITY CONFIRMED: ' + (res.data.user?.name || res.data.user?.full_name || 'OFFICER'),
          '> ROLE ASSIGNED: ' + (res.data.user?.role || 'USER').toUpperCase(),
          '> LOADING SECURE MODULES...',
          '> INITIALIZING DASHBOARD...',
          '> ACCESS GRANTED — WELCOME',
        ];
        let shown = [];
        lines.forEach((line, i) => {
          setTimeout(() => {
            shown = [...shown, line];
            setBootLines([...shown]);
          }, i * 320);
        });

        // Animate progress bar 0 → 100 over 2200ms
        let pct = 0;
        const pBar = setInterval(() => {
          pct = Math.min(100, pct + 2.2);
          setProgressPct(Math.round(pct));
          if (pct >= 100) clearInterval(pBar);
        }, 44);

        // Navigate after 2600ms
        setTimeout(() => navigate('/dashboard'), 2600);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'AUTHENTICATION FAILED — INVALID CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setActiveRole(role);
    if (role === 'ADMIN') {
      setEmail('123');
    } else if (role === 'OFFICER') {
      setEmail('officer@crms.com');
    } else if (role === 'COURT CLERK') {
      setEmail('clerk@1.gov');
    } else {
      setEmail('');
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div className="terminal-login">
      {/* Scan lines overlay */}
      <div className="scanlines" />

      {/* ── ACCESS GRANTED Overlay ── */}
      {accessGranted && (
        <div className="ag-overlay">
          <div className="ag-scanlines" />
          <div className="ag-content">
            <div className="ag-badge-ring">
              <svg viewBox="0 0 80 80" className="ag-shield-svg">
                <circle cx="40" cy="40" r="36" stroke="#22d3ee" strokeWidth="1" fill="none" strokeDasharray="4 3" />
                <circle cx="40" cy="40" r="28" stroke="#3b82f6" strokeWidth="0.5" fill="none" />
                <path d="M40 12 L24 22 L24 42 C24 52 32 60 40 63 C48 60 56 52 56 42 L56 22 Z"
                  stroke="#22d3ee" strokeWidth="1.5" fill="rgba(34,211,238,0.06)" />
                <path d="M33 40 l5 5 9-9" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
              <div className="ag-ring-pulse" />
            </div>

            <div className="ag-headline">ACCESS GRANTED</div>
            <div className="ag-subline">IDENTITY VERIFIED · CLEARANCE CONFIRMED</div>

            <div className="ag-boot-log">
              {bootLines.map((line, i) => (
                <div key={i} className="ag-boot-line" style={{ animationDelay: `${i * 0.05}s` }}>
                  {line}
                </div>
              ))}
            </div>

            <div className="ag-progress-wrap">
              <div className="ag-progress-label">
                <span>LOADING SYSTEM</span>
                <span className="ag-pct">{progressPct}%</span>
              </div>
              <div className="ag-progress-track">
                <div className="ag-progress-fill" style={{ width: `${progressPct}%` }} />
                <div className="ag-progress-glow" style={{ left: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD Bar */}
      <div className="hud-top">
        <div className="hud-top-left">
          <span className="hud-label">SYS. CRM-5X4F</span>
          <span className="hud-label flash">BIOMETRIC SCAN ACTIVE</span>
          <span className="hud-label dim">CAM: 01 / LIVE</span>
        </div>
        <div className="hud-top-right">
          <span className="hud-label">RES: 3840×2160</span>
          <span className="hud-label">FPS: 60 — STABLE</span>
          <span className="hud-label dim">ENC: AES-256</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="terminal-body">
        {/* Left: Biometric Scan Visualization */}
        <div className="scan-area">
          {/* Corner brackets */}
          <div className="scan-bracket tl" />
          <div className="scan-bracket tr" />
          <div className="scan-bracket bl" />
          <div className="scan-bracket br" />

          <canvas ref={canvasRef} className="scan-canvas" />

          {/* Scan info under canvas */}
          <div className="scan-info">
            <span className="scan-tag">3D FACIAL GEOMETRY</span>
            <span className="scan-tag dim">MESH: 248 VERTICES</span>
          </div>
        </div>

        {/* Right: Auth Panel */}
        <div className="auth-panel">
          <div className="auth-panel-inner">
            {/* Header */}
            <div className="auth-header">
              <div className="auth-badge">
                <svg viewBox="0 0 24 24" fill="none" className="badge-icon">
                  <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="auth-title">CRM SYSTEM</h2>
                <span className="auth-sub">LAW ENFORCEMENT PORTAL · SECURE</span>
              </div>
            </div>

            <div className="auth-divider" />

            <h1 className="secure-access">SECURE ACCESS</h1>
            <p className="auth-notice">AUTHORIZED PERSONNEL ONLY · ALL ACTIVITY LOGGED</p>

            {/* Role Tabs */}
            <div className="role-tabs">
              {['ADMIN', 'OFFICER', 'COURT CLERK'].map(r => (
                <button
                  key={r}
                  className={`role-tab ${activeRole === r ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(r)}
                  type="button"
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="terminal-error">
                <span>⚠ {error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="terminal-field">
                <label>ID</label>
                <input
                  type="text"
                  placeholder="Enter your ID"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="terminal-field">
                <label>ACCESS CODE</label>
                <input
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <span className="auth-btn-loading">
                    <span className="terminal-spinner" /> AUTHENTICATING...
                  </span>
                ) : 'AUTHENTICATE'}
              </button>
            </form>

            {/* Footer */}
            <div className="auth-footer">
              <span>CRM SYSTEM v2.4 · HIGHEST CLASSIFICATION</span>
              <span>SECURE CHANNEL ACTIVE · UNAUTHORIZED ACCESS IS A</span>
              <span>CRIMINAL OFFENSE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD Bar */}
      <div className="hud-bottom">
        <div className="hud-bottom-left">
          <div className="match-box">
            <span className="match-label">MATCH: <span className="match-value">{matchPercent.toFixed(1)}%</span></span>
            <span className="match-conf">CONFIDENCE: VERIFIED ✓</span>
          </div>
        </div>
        <div className="hud-bottom-center">
          <span className="status-ticker">▶ {statusText}</span>
        </div>
        <div className="hud-bottom-right">
          <span className="hud-label">LAT: 19.07°N · LON: 72.88°E</span>
          <span className="hud-label">ZONE: MUMBAI-PD</span>
          <span className="hud-label">ALERT: <span className="alert-none">NONE</span></span>
        </div>
      </div>
    </div>
  );
};

export default Login;

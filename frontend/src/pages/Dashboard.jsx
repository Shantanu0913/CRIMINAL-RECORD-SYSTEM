import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineFolder,
  HiOutlineCollection, HiOutlineTrendingUp, HiOutlineShieldCheck,
  HiOutlineBadgeCheck, HiOutlineOfficeBuilding, HiOutlineChip,
  HiOutlineLightningBolt, HiOutlineServer, HiOutlineArrowRight
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/dashboard/stats');
        if (res.data.success) setStats(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" />
      <p>Loading dashboard…</p>
    </div>
  );

  const metrics = [
    { key: 'totalCriminals', label: 'Criminals',   icon: <HiOutlineUserGroup />,    accent: '#f43f5e', glow: 'rgba(244,63,94,0.2)',  path: '/criminals' },
    { key: 'totalFIRs',      label: 'Active FIRs', icon: <HiOutlineDocumentText />, accent: '#3b82f6', glow: 'rgba(59,130,246,0.2)', path: '/firs'      },
    { key: 'totalCases',     label: 'Case Files',  icon: <HiOutlineFolder />,       accent: '#f59e0b', glow: 'rgba(245,158,11,0.2)', path: '/cases'     },
    { key: 'totalEvidence',  label: 'Evidence',    icon: <HiOutlineCollection />,   accent: '#10b981', glow: 'rgba(16,185,129,0.2)', path: '/evidence'  },
  ];

  const caseStatusColors = {
    'Pending':       { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
    'Investigation': { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)'  },
    'Closed':        { color: '#34d399', bg: 'rgba(52,211,153,0.08)'  },
    'Dismissed':     { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
  };

  const catPalette = ['#f43f5e','#3b82f6','#f59e0b','#a855f7','#10b981','#06b6d4','#f97316','#ec4899'];
  const categories = stats?.criminalCategories || [];
  const maxCat     = Math.max(...categories.map(c => Number(c.count)), 1);

  const roleInfo = [
    { role: 'Admin',          icon: <HiOutlineShieldCheck />,  color: '#a855f7' },
    { role: 'Police Officer', icon: <HiOutlineBadgeCheck />,   color: '#22d3ee' },
    { role: 'Court Clerk',    icon: <HiOutlineOfficeBuilding />, color: '#f59e0b' },
  ];

  return (
    <div className="dashboard-page page">
      {/* ── Header ── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-greeting-tag">
            <HiOutlineLightningBolt />
            SYSTEM ACTIVE
          </div>
          <h1>Command Center</h1>
          <p className="dash-subtitle">
            Welcome back, <span className="dash-name">{user?.name || user?.full_name || 'Officer'}</span>
          </p>
        </div>
        <div className="dash-header-right">
          <div className="dash-clock">
            <span className="dash-clock-time">
              {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
            <span className="dash-clock-date">
              {now.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="dash-role-pill">
            <HiOutlineShieldCheck /> {user?.role || 'Admin'}
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="dash-metrics">
        {metrics.map((m, i) => (
          <div
            key={m.key}
            className={`dash-metric-card${m.path ? ' clickable' : ''}`}
            style={{ '--ma': m.accent, '--mg': m.glow, animationDelay: `${i * 80}ms` }}
            onClick={() => m.path && navigate(m.path)}
            title={m.path ? `Go to ${m.label}` : undefined}
          >
            <div className="dmc-top">
              <div className="dmc-icon">{m.icon}</div>
              <div className="dmc-trend">
                {m.path ? <HiOutlineArrowRight className="dmc-arrow" /> : <HiOutlineTrendingUp />}
              </div>
            </div>
            <div className="dmc-value">{stats?.[m.key] ?? 0}</div>
            <div className="dmc-label">{m.label}</div>
            <div className="dmc-bar" />
          </div>
        ))}
      </div>

      {/* ── Body Grid ── */}
      <div className="dash-body-grid">

        {/* Case Status Breakdown */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title">Case Status</span>
            <span
              className="dash-panel-badge dash-panel-link"
              onClick={() => navigate('/cases')}
              title="View all cases"
            >
              View Cases <HiOutlineArrowRight />
            </span>
          </div>
          <div className="dash-panel-body">
            {stats?.caseStatuses?.length > 0 ? stats.caseStatuses.map((s, i) => {
              const cm = caseStatusColors[s.status] || { color: '#64748b', bg: 'rgba(100,116,139,0.08)' };
              return (
                <div key={i} className="dash-status-row">
                  <div className="dsr-left">
                    <span className="dsr-dot" style={{ background: cm.color }} />
                    <span className="dsr-name">{s.status}</span>
                  </div>
                  <div className="dsr-right">
                    <div className="dsr-bar-track">
                      <div className="dsr-bar-fill" style={{ width: `${(s.count / (stats?.totalCases || 1)) * 100}%`, background: cm.color }} />
                    </div>
                    <span className="dsr-count">{s.count}</span>
                  </div>
                </div>
              );
            }) : <p className="empty-text">No case data</p>}
          </div>
        </div>

        {/* Criminal Categories — horizontal bar chart */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title">Criminal Categories</span>
            <span className="dash-panel-badge">{categories.length} Types</span>
          </div>
          <div className="dash-panel-body">
            {categories.length > 0 ? categories.slice(0, 8).map((c, i) => (
              <div key={i} className="dash-cat-row">
                <span className="dash-cat-name">{c.status}</span>
                <div className="dash-cat-bar-track">
                  <div
                    className="dash-cat-bar-fill"
                    style={{ width: `${(Number(c.count) / maxCat) * 100}%`, background: catPalette[i % catPalette.length] }}
                  />
                </div>
                <span className="dash-cat-count" style={{ color: catPalette[i % catPalette.length] }}>{c.count}</span>
              </div>
            )) : <p className="empty-text">No category data</p>}
          </div>
        </div>

        {/* System Info — styled like a terminal */}
        <div className="dash-panel terminal-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title"><HiOutlineChip /> System Info</span>
            <span className="term-status-dot">● ONLINE</span>
          </div>
          <div className="dash-panel-body term-body">
            {[
              { k: 'Database',    v: 'Criminal_Record_System_2' },
              { k: 'Operator',    v: user?.name || user?.full_name || '—' },
              { k: 'Login ID',    v: user?.email || '—' },
              { k: 'Access Level',v: user?.role || '—' },
              { k: 'Server',      v: 'http://localhost:5000' },
              { k: 'Version',     v: '2.0.1' },
            ].map(({ k, v }) => (
              <div key={k} className="term-row">
                <span className="term-key">{k}</span>
                <span className="term-sep">·</span>
                <span className="term-val">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title"><HiOutlineServer /> Quick Summary</span>
          </div>
          <div className="dash-panel-body">
            <div className="dash-summary-hexgrid">
              {metrics.map(m => (
                <div
                  key={m.key}
                  className={`dash-hex-item${m.path ? ' clickable' : ''}`}
                  style={{ '--ma': m.accent }}
                  onClick={() => m.path && navigate(m.path)}
                  title={m.path ? `Go to ${m.label}` : undefined}
                >
                  <div className="dash-hex-icon">{m.icon}</div>
                  <div className="dash-hex-val">{stats?.[m.key] ?? 0}</div>
                  <div className="dash-hex-lbl">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="dash-roles-strip">
              <div className="dash-role-chip clickable" style={{ '--rc': '#60a5fa' }} onClick={() => navigate('/criminals')}>
                <span><HiOutlineUserGroup /></span><span>Criminals</span>
              </div>
              <div className="dash-role-chip clickable" style={{ '--rc': '#3b82f6' }} onClick={() => navigate('/firs')}>
                <span><HiOutlineDocumentText /></span><span>FIR Records</span>
              </div>
              <div className="dash-role-chip clickable" style={{ '--rc': '#f59e0b' }} onClick={() => navigate('/cases')}>
                <span><HiOutlineFolder /></span><span>Case Files</span>
              </div>
              <div className="dash-role-chip clickable" style={{ '--rc': '#10b981' }} onClick={() => navigate('/evidence')}>
                <span><HiOutlineCollection /></span><span>Evidence</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

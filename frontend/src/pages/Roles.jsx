import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import {
  HiOutlineUserAdd, HiOutlineSearch, HiOutlinePencil, HiOutlineTrash,
  HiOutlineShieldCheck, HiOutlineBadgeCheck, HiOutlineOfficeBuilding,
  HiOutlineX, HiOutlineCheck, HiOutlineEye, HiOutlineEyeOff
} from 'react-icons/hi';

const ROLES = ['Admin', 'Police Officer', 'Court Clerk'];

const roleMeta = {
  'Admin':          { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', icon: <HiOutlineShieldCheck /> },
  'Police Officer': { color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.25)', icon: <HiOutlineBadgeCheck /> },
  'Court Clerk':    { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', icon: <HiOutlineOfficeBuilding /> },
  'User':           { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.2)', icon: <HiOutlineShieldCheck /> },
};

const emptyForm = { name: '', email: '', phone: '', password: '', role: 'Police Officer', badge_no: '', rank_1: '', station_id: '', court_id: '', office: '' };

export default function Roles() {
  const [users, setUsers]           = useState([]);
  const [stations, setStations]     = useState([]);
  const [courts, setCourts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');
  const [showForm, setShowForm]     = useState(false);
  const [editUser, setEditUser]     = useState(null);   // null = add, obj = edit
  const [form, setForm]             = useState(emptyForm);
  const [showPass, setShowPass]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, sRes, cRes] = await Promise.all([
        API.get('/users'),
        API.get('/users/stations'),
        API.get('/users/courts'),
      ]);
      if (uRes.data.success) setUsers(uRes.data.data);
      if (sRes.data.success) setStations(sRes.data.data);
      if (cRes.data.success) setCourts(cRes.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditUser(null);
    setForm(emptyForm);
    setError('');
    setShowPass(false);
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      name: u.name || '', email: u.email || '', phone: u.phone || '',
      password: '', role: u.role || 'Police Officer',
      badge_no: u.badge_no || '', rank_1: u.rank_1 || '',
      station_id: u.station_id || '', court_id: u.court_id || '',
      office: u.office || ''
    });
    setError('');
    setShowPass(false);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditUser(null); };

  const handleSave = async () => {
    setError('');
    if (!form.name || !form.email || (!editUser && !form.password)) {
      setError('Name, email and password are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editUser) {
        await API.put(`/users/${editUser.user_id}`, payload);
      } else {
        await API.post('/users', payload);
      }
      closeForm();
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'An error occurred');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/users/${id}`);
      setDeleteConfirm(null);
      fetchAll();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = users.filter(u => {
    const matchRole   = filter === 'All' || u.role === filter;
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = ROLES.reduce((acc, r) => { acc[r] = users.filter(u => u.role === r).length; return acc; }, {});

  return (
    <div className="roles-page page">
      {/* ---- Header ---- */}
      <div className="page-header">
        <div>
          <h1>Role Management</h1>
          <p className="page-subtitle">Assign and manage system roles for all personnel</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="btn-add-user">
          <HiOutlineUserAdd /> Add New Person
        </button>
      </div>

      {/* ---- Role Summary Cards ---- */}
      <div className="roles-summary-grid">
        {ROLES.map(r => {
          const m = roleMeta[r];
          return (
            <div
              key={r}
              className={`role-summary-card ${filter === r ? 'active' : ''}`}
              style={{ '--rc': m.color, '--rbg': m.bg, '--rborder': m.border }}
              onClick={() => setFilter(filter === r ? 'All' : r)}
            >
              <span className="role-summary-icon">{m.icon}</span>
              <div className="role-summary-info">
                <span className="role-summary-count">{counts[r] ?? 0}</span>
                <span className="role-summary-name">{r}</span>
              </div>
            </div>
          );
        })}
        <div
          className={`role-summary-card all-card ${filter === 'All' ? 'active' : ''}`}
          onClick={() => setFilter('All')}
        >
          <span className="role-summary-icon"><HiOutlineShieldCheck /></span>
          <div className="role-summary-info">
            <span className="role-summary-count">{users.length}</span>
            <span className="role-summary-name">All Users</span>
          </div>
        </div>
      </div>

      {/* ---- Toolbar ---- */}
      <div className="toolbar">
        <div className="search-box">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="roles-search"
          />
        </div>
        <span className="record-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ---- Table ---- */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /><p>Loading users…</p></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email / ID</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="empty-row">No users found</td></tr>
              ) : filtered.map((u) => {
                const m = roleMeta[u.role] || roleMeta['User'];
                const detail = u.role === 'Police Officer'
                  ? `${u.rank_1 || '—'} · ${u.station_name || 'No station'}`
                  : u.role === 'Court Clerk'
                  ? `${u.court_name || 'No court'}`
                  : u.role === 'Admin'
                  ? `${u.office || 'Head Office'}`
                  : '—';
                return (
                  <tr key={u.user_id}>
                    <td className="id-cell">{u.user_id}</td>
                    <td>
                      <div className="name-cell">
                        <div className="name-avatar" style={{ background: `linear-gradient(135deg, ${m.color}88, ${m.color}44)` }}>
                          {u.name?.charAt(0) || '?'}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="mono-cell">{u.email}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                    <td>
                      <span className="role-badge-pill" style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
                        <span className="role-pill-icon">{m.icon}</span>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{detail}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="icon-btn edit" title="Edit" onClick={() => openEdit(u)}>
                          <HiOutlinePencil />
                        </button>
                        <button className="icon-btn delete" title="Delete" onClick={() => setDeleteConfirm(u)}>
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Add / Edit Modal ---- */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal roles-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editUser ? 'Edit User' : 'Add New Person'}</h2>
              <button className="modal-close" onClick={closeForm}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {error && <div className="form-error">{error}</div>}

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Singh" />
                </div>
                <div className="form-group">
                  <label>Email / Login ID *</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="e.g. rahul@police.gov" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. 9876543210" />
                </div>
                <div className="form-group">
                  <label>{editUser ? 'Password (leave blank to keep)' : 'Password *'}</label>
                  <div className="input-password-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={editUser ? '••••••' : 'Set password'}
                    />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(p => !p)}>
                      {showPass ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Role *</label>
                <div className="role-selector">
                  {ROLES.map(r => {
                    const m = roleMeta[r];
                    return (
                      <button
                        key={r}
                        type="button"
                        className={`role-option ${form.role === r ? 'selected' : ''}`}
                        style={{ '--rc': m.color, '--rbg': m.bg }}
                        onClick={() => setForm(f => ({ ...f, role: r }))}
                      >
                        <span className="role-opt-icon">{m.icon}</span>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role-specific fields */}
              {form.role === 'Police Officer' && (
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Badge No</label>
                    <input value={form.badge_no} onChange={e => setForm(f => ({ ...f, badge_no: e.target.value }))} placeholder="e.g. DSP101" />
                  </div>
                  <div className="form-group">
                    <label>Rank</label>
                    <select value={form.rank_1} onChange={e => setForm(f => ({ ...f, rank_1: e.target.value }))}>
                      <option value="">Select rank…</option>
                      {['DSP', 'Inspector', 'Sub Inspector', 'ASI', 'Head Constable', 'Constable'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Police Station *</label>
                    <select value={form.station_id} onChange={e => setForm(f => ({ ...f, station_id: e.target.value }))}>
                      <option value="">Select station…</option>
                      {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {form.role === 'Court Clerk' && (
                <div className="form-group">
                  <label>Court *</label>
                  <select value={form.court_id} onChange={e => setForm(f => ({ ...f, court_id: e.target.value }))}>
                    <option value="">Select court…</option>
                    {courts.map(c => <option key={c.court_id} value={c.court_id}>{c.court_name}</option>)}
                  </select>
                </div>
              )}

              {form.role === 'Admin' && (
                <div className="form-group">
                  <label>Office</label>
                  <input value={form.office} onChange={e => setForm(f => ({ ...f, office: e.target.value }))} placeholder="e.g. Head Office" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeForm} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-save-user">
                {saving ? <><span className="spinner-small" /> Saving…</> : <><HiOutlineCheck /> {editUser ? 'Update User' : 'Create User'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Delete Confirm ---- */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete User</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong>?<br />
                <span style={{ color: 'var(--accent-rose)', fontSize: '13px' }}>This will also remove all their role assignments.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.user_id)}>
                <HiOutlineTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
  HiOutlineEye, HiOutlineX, HiOutlineCheck, HiOutlineCollection,
  HiOutlineDocumentText, HiOutlinePhotograph, HiOutlineFilm,
  HiOutlineChip, HiOutlineCube, HiOutlineCalendar, HiOutlineFolder
} from 'react-icons/hi';

const EVIDENCE_TYPES = ['Document', 'Video', 'Photo', 'Digital', 'Physical', 'Audio', 'Biological', 'Other'];

const typeMeta = {
  'Document':   { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   icon: <HiOutlineDocumentText /> },
  'Video':      { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  icon: <HiOutlineFilm /> },
  'Photo':      { color: '#f472b6', bg: 'rgba(244,114,182,0.1)',  icon: <HiOutlinePhotograph /> },
  'Digital':    { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',   icon: <HiOutlineChip /> },
  'Physical':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   icon: <HiOutlineCube /> },
  'Audio':      { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   icon: <HiOutlineCollection /> },
  'Biological': { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',    icon: <HiOutlineCollection /> },
  'Other':      { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  icon: <HiOutlineCollection /> },
};

const emptyForm = { case_id: '', description: '', type: 'Document', date_collected: '' };

export default function Evidence() {
  const [evidence, setEvidence]     = useState([]);
  const [cases, setCases]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [viewItem, setViewItem]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const eRes = await API.get('/evidence');
      if (eRes.data.success) setEvidence(eRes.data.data);
    } catch (e) { console.error('evidence fetch error', e); }

    try {
      const cRes = await API.get('/evidence/cases');
      if (cRes.data.success) setCases(cRes.data.data);
    } catch (e) {
      // Fallback: fetch cases directly if /evidence/cases isn't available yet
      try {
        const cRes = await API.get('/cases');
        if (cRes.data.success) setCases(cRes.data.data.map(c => ({ case_id: c.case_id, case_type: c.case_type, status: c.status })));
      } catch (e2) { console.error('cases fetch error', e2); }
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      case_id: item.case_id || '',
      description: item.description || '',
      type: item.type || 'Document',
      date_collected: item.date_collected ? item.date_collected.slice(0, 10) : '',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const handleSave = async () => {
    setError('');
    if (!form.type || !form.description.trim()) {
      setError('Type and description are required.');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await API.put(`/evidence/${editItem.evidence_id}`, form);
      } else {
        await API.post('/evidence', form);
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
      await API.delete(`/evidence/${id}`);
      setDeleteConfirm(null);
      fetchAll();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  // Stats per type
  const typeCounts = EVIDENCE_TYPES.reduce((acc, t) => {
    acc[t] = evidence.filter(e => e.type === t).length;
    return acc;
  }, {});

  const filtered = evidence.filter(e => {
    const matchType  = filterType === 'All' || e.type === filterType;
    const matchSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.type?.toLowerCase().includes(search.toLowerCase()) || String(e.case_id).includes(search);
    return matchType && matchSearch;
  });

  return (
    <div className="evidence-page page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Evidence Records</h1>
          <p className="page-subtitle">Manage all collected evidence items across cases</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="btn-add-evidence">
          <HiOutlinePlus /> Add Evidence
        </button>
      </div>

      {/* ── Type Summary Strip ── */}
      <div className="ev-type-strip">
        <div
          className={`ev-type-chip ${filterType === 'All' ? 'active' : ''}`}
          style={{ '--ec': '#60a5fa' }}
          onClick={() => setFilterType('All')}
        >
          <HiOutlineCollection /> All
          <span className="ev-type-count">{evidence.length}</span>
        </div>
        {EVIDENCE_TYPES.filter(t => typeCounts[t] > 0).map(t => {
          const m = typeMeta[t];
          return (
            <div
              key={t}
              className={`ev-type-chip ${filterType === t ? 'active' : ''}`}
              style={{ '--ec': m.color }}
              onClick={() => setFilterType(filterType === t ? 'All' : t)}
            >
              {m.icon} {t}
              <span className="ev-type-count">{typeCounts[t]}</span>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="search-box">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search description, type, case ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="evidence-search"
          />
        </div>
        <span className="record-count">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /><p>Loading evidence…</p></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Description</th>
                <th>Case ID</th>
                <th>Case Type</th>
                <th>Date Collected</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="empty-row">No evidence records found</td></tr>
              ) : filtered.map(item => {
                const m = typeMeta[item.type] || typeMeta['Other'];
                return (
                  <tr key={item.evidence_id}>
                    <td className="id-cell">{item.evidence_id}</td>
                    <td>
                      <span className="ev-badge" style={{ color: m.color, background: m.bg }}>
                        <span className="ev-badge-icon">{m.icon}</span>
                        {item.type}
                      </span>
                    </td>
                    <td className="ev-desc-cell">{item.description}</td>
                    <td>
                      {item.case_id
                        ? <span className="mono-cell">#{item.case_id}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {item.case_type
                        ? <span className="badge badge-info">{item.case_type}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <HiOutlineCalendar style={{ color: 'var(--text-muted)' }} />
                        {item.date_collected ? new Date(item.date_collected).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="icon-btn view" title="View" onClick={() => setViewItem(item)}>
                          <HiOutlineEye />
                        </button>
                        <button className="icon-btn edit" title="Edit" onClick={() => openEdit(item)}>
                          <HiOutlinePencil />
                        </button>
                        <button className="icon-btn delete" title="Delete" onClick={() => setDeleteConfirm(item)}>
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

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Evidence' : 'Add New Evidence'}</h2>
              <button className="modal-close" onClick={closeForm}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {error && <div className="form-error">{error}</div>}

              {/* Type Selector */}
              <div className="form-group">
                <label>Evidence Type *</label>
                <div className="ev-type-selector">
                  {EVIDENCE_TYPES.map(t => {
                    const m = typeMeta[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`ev-type-option ${form.type === t ? 'selected' : ''}`}
                        style={{ '--ec': m.color, '--ebg': m.bg }}
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                      >
                        <span className="ev-type-opt-icon">{m.icon}</span>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the evidence item…"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Linked Case</label>
                  <select value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}>
                    <option value="">No case linked</option>
                    {cases.map(c => (
                      <option key={c.case_id} value={c.case_id}>
                        Case #{c.case_id} — {c.case_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Collected</label>
                  <input
                    type="date"
                    value={form.date_collected}
                    onChange={e => setForm(f => ({ ...f, date_collected: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeForm} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-save-evidence">
                {saving
                  ? <><span className="spinner-small" /> Saving…</>
                  : <><HiOutlineCheck /> {editItem ? 'Update Evidence' : 'Add Evidence'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Evidence Details</h2>
              <button className="modal-close" onClick={() => setViewItem(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {(() => {
                const m = typeMeta[viewItem.type] || typeMeta['Other'];
                return (
                  <div className="ev-detail-view">
                    <div className="ev-detail-type-banner" style={{ background: m.bg, borderColor: m.color }}>
                      <span style={{ fontSize: '32px', color: m.color }}>{m.icon}</span>
                      <div>
                        <div className="ev-detail-type-label" style={{ color: m.color }}>{viewItem.type}</div>
                        <div className="ev-detail-id">Evidence #{viewItem.evidence_id}</div>
                      </div>
                    </div>
                    <div className="ev-detail-grid">
                      <div className="detail-item full">
                        <span className="detail-label">Description</span>
                        <span className="detail-value">{viewItem.description}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Linked Case</span>
                        <span className="detail-value mono">{viewItem.case_id ? `#${viewItem.case_id}` : '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Case Type</span>
                        <span className="detail-value">{viewItem.case_type || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Case Status</span>
                        <span className="detail-value">{viewItem.case_status || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Date Collected</span>
                        <span className="detail-value">
                          {viewItem.date_collected
                            ? new Date(viewItem.date_collected).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewItem(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewItem(null); openEdit(viewItem); }}>
                <HiOutlinePencil /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Evidence</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete evidence item{' '}
                <strong style={{ color: 'var(--text-primary)' }}>#{deleteConfirm.evidence_id}</strong>?<br />
                <span style={{ color: 'var(--accent-rose)', fontSize: '13px' }}>This action cannot be undone.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.evidence_id)}>
                <HiOutlineTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

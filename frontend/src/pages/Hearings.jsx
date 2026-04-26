import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
  HiOutlineEye, HiOutlineX, HiOutlineCheck, HiOutlineCalendar,
  HiOutlineClock, HiOutlineScale, HiOutlineBookOpen, HiOutlineArrowRight
} from 'react-icons/hi';

const STATUSES = ['Scheduled', 'Completed', 'Adjourned', 'Cancelled'];

const statusMeta = {
  'Scheduled':  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  },
  'Completed':  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
  'Adjourned':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  'Cancelled':  { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.25)'   },
};

const emptyForm = { case_id: '', hearing_date: '', hearing_time: '', judge_remarks: '', next_date: '', status: 'Scheduled' };

export default function Hearings() {
  const [hearings, setHearings] = useState([]);
  const [cases, setCases]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const hRes = await API.get('/hearings');
      if (hRes.data.success) setHearings(hRes.data.data);
    } catch (e) { console.error(e); }
    try {
      const cRes = await API.get('/cases');
      if (cRes.data.success) setCases(cRes.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = (prefillCaseId = '') => {
    setEditItem(null);
    setForm({ ...emptyForm, case_id: prefillCaseId });
    setError('');
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      case_id: item.case_id || '',
      hearing_date: item.hearing_date ? item.hearing_date.slice(0, 10) : '',
      hearing_time: item.hearing_time ? item.hearing_time.slice(0, 5) : '',
      judge_remarks: item.judge_remarks || '',
      next_date: item.next_date ? item.next_date.slice(0, 10) : '',
      status: item.status || 'Scheduled',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const handleSave = async () => {
    setError('');
    if (!form.case_id || !form.hearing_date) {
      setError('Case and hearing date are required.');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await API.put(`/hearings/${editItem.hearing_id}`, form);
      } else {
        await API.post('/hearings', form);
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
      await API.delete(`/hearings/${id}`);
      setDeleteConfirm(null);
      fetchAll();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = hearings.filter(h => h.status === s).length;
    return acc;
  }, {});

  const filtered = hearings.filter(h => {
    const matchStatus = filterStatus === 'All' || h.status === filterStatus;
    const matchSearch = !search ||
      h.case_type?.toLowerCase().includes(search.toLowerCase()) ||
      h.court_name?.toLowerCase().includes(search.toLowerCase()) ||
      h.judge_name?.toLowerCase().includes(search.toLowerCase()) ||
      String(h.case_id).includes(search);
    return matchStatus && matchSearch;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatTime = (t) => t ? t.slice(0, 5) : '—';

  return (
    <div className="hearings-page page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Court Hearings</h1>
          <p className="page-subtitle">Schedule and track all case hearings across courts</p>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd()} id="btn-add-hearing">
          <HiOutlinePlus /> Schedule Hearing
        </button>
      </div>

      {/* ── Status Summary ── */}
      <div className="hearing-status-grid">
        <div
          className={`hearing-stat-card ${filterStatus === 'All' ? 'active' : ''}`}
          style={{ '--hc': '#60a5fa' }}
          onClick={() => setFilterStatus('All')}
        >
          <HiOutlineScale className="hsc-icon" />
          <div className="hsc-val">{hearings.length}</div>
          <div className="hsc-lbl">Total Hearings</div>
        </div>
        {STATUSES.map(s => {
          const m = statusMeta[s];
          return (
            <div
              key={s}
              className={`hearing-stat-card ${filterStatus === s ? 'active' : ''}`}
              style={{ '--hc': m.color }}
              onClick={() => setFilterStatus(filterStatus === s ? 'All' : s)}
            >
              <div className="hsc-val">{statusCounts[s] ?? 0}</div>
              <div className="hsc-lbl">{s}</div>
              <span className="hsc-dot" style={{ background: m.color }} />
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
            placeholder="Search by case type, court, judge…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="hearing-search"
          />
        </div>
        <span className="record-count">{filtered.length} hearing{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /><p>Loading hearings…</p></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Case</th>
                <th>Court</th>
                <th>Judge</th>
                <th>Hearing Date</th>
                <th>Time</th>
                <th>Next Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="9" className="empty-row">No hearings found</td></tr>
              ) : filtered.map(h => {
                const m = statusMeta[h.status] || statusMeta['Scheduled'];
                return (
                  <tr key={h.hearing_id}>
                    <td className="id-cell">{h.hearing_id}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="mono-cell">#{h.case_id}</span>
                        {h.case_type && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.case_type}</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{h.court_name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{h.judge_name || '—'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                        <HiOutlineCalendar style={{ color: 'var(--text-muted)' }} />
                        {formatDate(h.hearing_date)}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        <HiOutlineClock />
                        {formatTime(h.hearing_time)}
                      </span>
                    </td>
                    <td style={{ color: h.next_date ? 'var(--accent-amber)' : 'var(--text-muted)', fontSize: '13px' }}>
                      {h.next_date ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <HiOutlineArrowRight /> {formatDate(h.next_date)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="hearing-status-badge" style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
                        {h.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="icon-btn view" title="View" onClick={() => setViewItem(h)}><HiOutlineEye /></button>
                        <button className="icon-btn edit" title="Edit" onClick={() => openEdit(h)}><HiOutlinePencil /></button>
                        <button className="icon-btn delete" title="Delete" onClick={() => setDeleteConfirm(h)}><HiOutlineTrash /></button>
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
              <h2>{editItem ? 'Edit Hearing' : 'Schedule Hearing'}</h2>
              <button className="modal-close" onClick={closeForm}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label>Case *</label>
                <select value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}>
                  <option value="">— Select case —</option>
                  {cases.map(c => (
                    <option key={c.case_id} value={c.case_id}>
                      Case #{c.case_id} — {c.case_type} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Hearing Date *</label>
                  <input type="date" value={form.hearing_date} onChange={e => setForm(f => ({ ...f, hearing_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Hearing Time</label>
                  <input type="time" value={form.hearing_time} onChange={e => setForm(f => ({ ...f, hearing_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Next Hearing Date</label>
                  <input type="date" value={form.next_date} onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Judge's Remarks / Notes</label>
                <textarea
                  rows={3}
                  value={form.judge_remarks}
                  onChange={e => setForm(f => ({ ...f, judge_remarks: e.target.value }))}
                  placeholder="Observations, orders, or remarks from the judge…"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeForm} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-save-hearing">
                {saving ? <><span className="spinner-small" /> Saving…</> : <><HiOutlineCheck /> {editItem ? 'Update' : 'Schedule'}</>}
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
              <h2>Hearing Details</h2>
              <button className="modal-close" onClick={() => setViewItem(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {(() => {
                const m = statusMeta[viewItem.status] || statusMeta['Scheduled'];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Banner */}
                    <div className="hearing-detail-banner" style={{ background: m.bg, borderColor: m.color }}>
                      <HiOutlineScale style={{ fontSize: '28px', color: m.color }} />
                      <div>
                        <div style={{ color: m.color, fontSize: '14px', fontWeight: 700 }}>Hearing #{viewItem.hearing_id}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{viewItem.court_name || '—'}</div>
                      </div>
                      <div className="hearing-status-badge" style={{ marginLeft: 'auto', color: m.color, background: 'transparent', border: `1px solid ${m.border}` }}>
                        {viewItem.status}
                      </div>
                    </div>

                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Case</span>
                        <span className="detail-value mono">#{viewItem.case_id} — {viewItem.case_type || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Judge</span>
                        <span className="detail-value">{viewItem.judge_name || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Hearing Date</span>
                        <span className="detail-value">{formatDate(viewItem.hearing_date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Hearing Time</span>
                        <span className="detail-value">{formatTime(viewItem.hearing_time)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Next Date</span>
                        <span className="detail-value" style={{ color: viewItem.next_date ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                          {formatDate(viewItem.next_date)}
                        </span>
                      </div>
                      <div className="detail-item full" style={{ gridColumn: '1 / -1' }}>
                        <span className="detail-label">Judge's Remarks</span>
                        <span className="detail-value" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {viewItem.judge_remarks || 'No remarks recorded'}
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
              <h2>Delete Hearing</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Delete hearing <strong style={{ color: 'var(--text-primary)' }}>#{deleteConfirm.hearing_id}</strong> scheduled on{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{formatDate(deleteConfirm.hearing_date)}</strong>?
                <br /><span style={{ color: 'var(--accent-rose)', fontSize: '13px' }}>This action cannot be undone.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.hearing_id)}>
                <HiOutlineTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

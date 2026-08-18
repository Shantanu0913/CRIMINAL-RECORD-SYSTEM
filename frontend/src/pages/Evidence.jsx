import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axios';
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
  HiOutlineEye, HiOutlineX, HiOutlineCheck, HiOutlineCollection,
  HiOutlineDocumentText, HiOutlinePhotograph, HiOutlineFilm,
  HiOutlineChip, HiOutlineCube, HiOutlineCalendar, HiOutlineFolder,
  HiOutlineUpload, HiOutlinePlay, HiOutlineCamera
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

const emptyForm = { case_id: '', description: '', type: 'Photo', file_url: '', file_name: '', media_type: 'Photo', date_collected: '' };

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
  const fileInputRef = useRef(null);

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
    const today = new Date().toISOString().split('T')[0];
    setForm({ ...emptyForm, date_collected: today });
    setError('');
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      case_id: item.case_id || '',
      description: item.description || '',
      type: item.type || 'Photo',
      file_url: item.file_url || '',
      file_name: item.file_name || '',
      media_type: item.media_type || item.type || 'Photo',
      date_collected: item.date_collected ? item.date_collected.slice(0, 10) : '',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let detectedType = 'Document';
    if (file.type.startsWith('image/')) detectedType = 'Photo';
    else if (file.type.startsWith('video/')) detectedType = 'Video';
    else if (file.type.startsWith('audio/')) detectedType = 'Audio';

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({
        ...prev,
        file_url: event.target.result,
        file_name: file.name,
        media_type: detectedType,
        type: prev.type === 'Document' && detectedType !== 'Document' ? detectedType : prev.type
      }));
    };
    reader.readAsDataURL(file);
  };

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
      setError(e.response?.data?.message || 'An error occurred saving evidence');
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

  const typeCounts = EVIDENCE_TYPES.reduce((acc, t) => {
    acc[t] = evidence.filter(e => e.type === t).length;
    return acc;
  }, {});

  const filtered = evidence.filter(e => {
    const matchType  = filterType === 'All' || e.type === filterType;
    const matchSearch = !search || 
      e.description?.toLowerCase().includes(search.toLowerCase()) || 
      e.type?.toLowerCase().includes(search.toLowerCase()) || 
      e.file_name?.toLowerCase().includes(search.toLowerCase()) || 
      String(e.case_id).includes(search);
    return matchType && matchSearch;
  });

  return (
    <div className="evidence-page page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Evidence Vault & Media Records</h1>
          <p className="page-subtitle">Manage crime scene evidence, surveillance footage, interrogation recordings, and forensic documents</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="btn-add-evidence">
          <HiOutlinePlus /> Add New Evidence
        </button>
      </div>

      {/* ── Type Summary Strip ── */}
      <div className="ev-type-strip">
        <div
          className={`ev-type-chip ${filterType === 'All' ? 'active' : ''}`}
          style={{ '--ec': '#60a5fa' }}
          onClick={() => setFilterType('All')}
        >
          <HiOutlineCollection /> All Evidence
          <span className="ev-type-count">{evidence.length}</span>
        </div>
        {EVIDENCE_TYPES.map(t => {
          const m = typeMeta[t] || typeMeta['Other'];
          return (
            <div
              key={t}
              className={`ev-type-chip ${filterType === t ? 'active' : ''}`}
              style={{ '--ec': m.color }}
              onClick={() => setFilterType(filterType === t ? 'All' : t)}
            >
              {m.icon} {t}
              <span className="ev-type-count">{typeCounts[t] || 0}</span>
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
            placeholder="Search description, file name, case ID, evidence type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="evidence-search"
          />
        </div>
        <span className="record-count">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /><p>Loading evidence repository…</p></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Media Preview</th>
                <th>Classification</th>
                <th>Description</th>
                <th>Linked Case</th>
                <th>Date Collected</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="empty-row">No evidence records found</td></tr>
              ) : filtered.map(item => {
                const m = typeMeta[item.type] || typeMeta['Other'];
                const isVideo = item.media_type === 'Video' || item.type === 'Video';
                const isPhoto = item.media_type === 'Photo' || item.type === 'Photo' || (item.file_url && item.file_url.startsWith('data:image'));
                return (
                  <tr 
                    key={item.evidence_id} 
                    className="clickable-row"
                    onClick={() => setViewItem(item)}
                    title="Click to view evidence details & media player"
                  >
                    <td className="id-cell">#{item.evidence_id}</td>
                    <td>
                      {item.file_url ? (
                        isPhoto ? (
                          <img src={item.file_url} alt="Evidence" className="ev-table-thumb" />
                        ) : isVideo ? (
                          <div className="ev-table-video-chip">
                            <HiOutlinePlay /> Video Clip
                          </div>
                        ) : (
                          <div className="ev-table-doc-chip">
                            <HiOutlineDocumentText /> {item.file_name || 'File'}
                          </div>
                        )
                      ) : (
                        <span className="ev-table-no-media">No Media</span>
                      )}
                    </td>
                    <td>
                      <span className="ev-badge" style={{ color: m.color, background: m.bg }}>
                        <span className="ev-badge-icon">{m.icon}</span>
                        {item.type}
                      </span>
                    </td>
                    <td className="ev-desc-cell">{item.description}</td>
                    <td>
                      {item.case_id ? (
                        <div>
                          <span className="mono-cell">Case #{item.case_id}</span>
                          {item.case_type && <span className="ev-case-tag">{item.case_type}</span>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <HiOutlineCalendar style={{ color: 'var(--text-muted)' }} />
                        {item.date_collected ? new Date(item.date_collected).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          className="icon-btn view" 
                          title="View Evidence & Media" 
                          onClick={(e) => { e.stopPropagation(); setViewItem(item); }}
                        >
                          <HiOutlineEye />
                        </button>
                        <button 
                          className="icon-btn edit" 
                          title="Edit Evidence" 
                          onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                        >
                          <HiOutlinePencil />
                        </button>
                        <button 
                          className="icon-btn delete" 
                          title="Delete Evidence" 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item); }}
                        >
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
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Evidence Record & Media' : 'Add New Evidence & Upload Media'}</h2>
              <button className="modal-close" onClick={closeForm}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {error && <div className="form-error">{error}</div>}

              {/* Type Selector */}
              <div className="form-group">
                <label>Evidence Category *</label>
                <div className="ev-type-selector">
                  {EVIDENCE_TYPES.map(t => {
                    const m = typeMeta[t] || typeMeta['Other'];
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

              {/* Media File Upload & Preview Section */}
              <div className="form-group">
                <label>Attach Evidence Media (Photos, Video Recordings, Audio, Documents)</label>
                <div className="ev-media-uploader">
                  {form.file_url ? (
                    <div className="ev-preview-box">
                      {form.media_type === 'Video' || (form.file_url && form.file_url.startsWith('data:video')) ? (
                        <video src={form.file_url} controls className="ev-form-video-player" />
                      ) : form.media_type === 'Audio' || (form.file_url && form.file_url.startsWith('data:audio')) ? (
                        <audio src={form.file_url} controls className="ev-form-audio-player" />
                      ) : (
                        <img src={form.file_url} alt="Evidence Preview" className="ev-form-img-preview" />
                      )}
                      <div className="ev-preview-info">
                        <span className="ev-preview-filename">{form.file_name || 'Attached Media File'}</span>
                        <button 
                          type="button" 
                          className="ev-preview-remove" 
                          onClick={() => setForm(f => ({ ...f, file_url: '', file_name: '', media_type: '' }))}
                        >
                          <HiOutlineX /> Remove Media
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ev-dropzone" onClick={() => fileInputRef.current?.click()}>
                      <HiOutlineUpload className="ev-upload-icon" />
                      <span className="ev-upload-main">Click to select or drag photo/video evidence</span>
                      <span className="ev-upload-sub">Supports MP4, WebM, MOV, JPG, PNG, PDF, Audio recordings</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx" 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Evidence Description & Chain of Custody Notes *</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe where item was found, condition, officer markings, serial numbers..."
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Linked Court / Case File</label>
                  <select value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}>
                    <option value="">— No Case Linked —</option>
                    {cases.map(c => (
                      <option key={c.case_id} value={c.case_id}>
                        Case #{c.case_id} — {c.case_type} ({c.status})
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
                  : <><HiOutlineCheck /> {editItem ? 'Update Evidence' : 'Save Evidence Item'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal with High-Tech Media Player ── */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Evidence Dossier & Media Player</h2>
              <button className="modal-close" onClick={() => setViewItem(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              {(() => {
                const m = typeMeta[viewItem.type] || typeMeta['Other'];
                const isVideo = viewItem.media_type === 'Video' || viewItem.type === 'Video';
                const isPhoto = viewItem.media_type === 'Photo' || viewItem.type === 'Photo' || (viewItem.file_url && viewItem.file_url.startsWith('data:image'));
                const isAudio = viewItem.media_type === 'Audio' || viewItem.type === 'Audio' || (viewItem.file_url && viewItem.file_url.startsWith('data:audio'));
                return (
                  <div className="ev-detail-view">
                    <div className="ev-detail-type-banner" style={{ background: m.bg, borderColor: m.color }}>
                      <span style={{ fontSize: '32px', color: m.color }}>{m.icon}</span>
                      <div>
                        <div className="ev-detail-type-label" style={{ color: m.color }}>{viewItem.type} EVIDENCE</div>
                        <div className="ev-detail-id">Item #{viewItem.evidence_id} · Case #{viewItem.case_id || 'Unassigned'}</div>
                      </div>
                    </div>

                    {/* Media Playback / Viewing Screen */}
                    {viewItem.file_url ? (
                      <div className="ev-media-stage">
                        {isVideo ? (
                          <div className="ev-video-stage-wrapper">
                            <video src={viewItem.file_url} controls autoPlay muted className="ev-stage-video" />
                            <span className="ev-stage-tag">RECORDING PLAYBACK</span>
                          </div>
                        ) : isPhoto ? (
                          <div className="ev-photo-stage-wrapper">
                            <img src={viewItem.file_url} alt={viewItem.description} className="ev-stage-img" />
                            <span className="ev-stage-tag">CRIME SCENE CAPTURE</span>
                          </div>
                        ) : isAudio ? (
                          <div className="ev-audio-stage-wrapper">
                            <HiOutlineCollection style={{ fontSize: '40px', color: 'var(--accent-cyan)' }} />
                            <audio src={viewItem.file_url} controls className="ev-stage-audio" />
                          </div>
                        ) : (
                          <div className="ev-doc-stage-wrapper">
                            <HiOutlineDocumentText style={{ fontSize: '48px', color: 'var(--accent-blue)' }} />
                            <span className="ev-doc-name">{viewItem.file_name || 'Document Attached'}</span>
                            <a href={viewItem.file_url} download={viewItem.file_name || 'evidence-file'} className="btn btn-primary" style={{marginTop: '10px'}}>
                              Download Document
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ev-no-media-box">
                        <HiOutlinePhotograph style={{ fontSize: '36px', opacity: 0.4 }} />
                        <span>No photo or video file attached to this evidence record</span>
                      </div>
                    )}

                    <div className="ev-detail-grid" style={{ marginTop: '16px' }}>
                      <div className="detail-item full">
                        <span className="detail-label">DESCRIPTION & CHAIN OF CUSTODY</span>
                        <span className="detail-value">{viewItem.description}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">LINKED CASE</span>
                        <span className="detail-value mono">{viewItem.case_id ? `#${viewItem.case_id}` : '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">CASE TYPE</span>
                        <span className="detail-value">{viewItem.case_type || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">CASE STATUS</span>
                        <span className="detail-value">{viewItem.case_status || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">DATE COLLECTED</span>
                        <span className="detail-value">
                          {viewItem.date_collected
                            ? new Date(viewItem.date_collected).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
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
              <button className="btn btn-primary" onClick={() => { const item = viewItem; setViewItem(null); openEdit(item); }}>
                <HiOutlinePencil /> Edit Record
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
              <h2>Delete Evidence Record</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete evidence item{' '}
                <strong style={{ color: 'var(--text-primary)' }}>#{deleteConfirm.evidence_id}</strong>?<br />
                <span style={{ color: 'var(--accent-rose)', fontSize: '13px' }}>This will permanently remove the record and attached media.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.evidence_id)}>
                <HiOutlineTrash /> Delete Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

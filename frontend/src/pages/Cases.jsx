import { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from '../components/Modal';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineEye } from 'react-icons/hi';

const Cases = () => {
  const [cases, setCases] = useState([]);
  const [firs, setFirs] = useState([]);
  const [courts, setCourts] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [evidenceModal, setEvidenceModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    fir_id: '', court_id: '', case_type: '', start_date: '', end_date: '', status: 'Pending'
  });
  const [evidenceForm, setEvidenceForm] = useState({
    case_id: '', description: '', type: '', date_collected: ''
  });

  useEffect(() => {
    fetchCases();
    fetchFIRs();
    fetchCourts();
    fetchEvidence();
  }, []);

  const fetchCases = async () => {
    try { const res = await API.get('/cases'); if (res.data.success) setCases(res.data.data); } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  const fetchFIRs = async () => {
    try { const res = await API.get('/firs'); if (res.data.success) setFirs(res.data.data); } catch (err) { console.error(err); }
  };
  const fetchCourts = async () => {
    try { const res = await API.get('/courts'); if (res.data.success) setCourts(res.data.data); } catch (err) { console.error(err); }
  };
  const fetchEvidence = async () => {
    try { const res = await API.get('/evidence'); if (res.data.success) setEvidence(res.data.data); } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await API.put(`/cases/${selected.case_id}`, formData);
      } else {
        await API.post('/cases', formData);
      }
      setModalOpen(false);
      resetForm();
      fetchCases();
    } catch (err) { alert(err.response?.data?.message || 'Error saving case'); }
  };

  const handleEvidenceSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/evidence', evidenceForm);
      setEvidenceModal(false);
      setEvidenceForm({ case_id: '', description: '', type: '', date_collected: '' });
      fetchEvidence();
    } catch (err) { alert(err.response?.data?.message || 'Error adding evidence'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this case?')) return;
    try { await API.delete(`/cases/${id}`); fetchCases(); } catch (err) { alert('Error deleting case'); }
  };

  const openEdit = (c) => {
    setSelected(c);
    setFormData({
      fir_id: c.fir_id || '',
      court_id: c.court_id || '',
      case_type: c.case_type || '',
      start_date: c.start_date ? c.start_date.split('T')[0] : '',
      end_date: c.end_date ? c.end_date.split('T')[0] : '',
      status: c.status || 'Pending'
    });
    setModalOpen(true);
  };

  const openAdd = () => { setSelected(null); resetForm(); setModalOpen(true); };

  const resetForm = () => {
    setFormData({ fir_id: '', court_id: '', case_type: '', start_date: '', end_date: '', status: 'Pending' });
    setSelected(null);
  };

  const [caseFIRDetails, setCaseFIRDetails] = useState(null);

  const openViewCase = async (c) => {
    setSelected(c);
    setViewModal(true);
    setCaseFIRDetails(null);
    if (c.fir_id) {
      try {
        const res = await API.get(`/firs/${c.fir_id}`);
        if (res.data.success) setCaseFIRDetails(res.data.data);
      } catch (err) {
        console.error('Error fetching linked FIR details:', err);
      }
    }
  };

  const getStatusClass = (status) => {
    const map = { 'Pending': 'warning', 'Investigation': 'info', 'Closed': 'success', 'Dismissed': 'muted' };
    return map[status] || 'default';
  };

  const filtered = cases.filter(c =>
    `${c.case_id} ${c.case_type || ''} ${c.court_name || ''} ${c.status || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const getEvidenceForCase = (caseId) => evidence.filter(e => e.case_id === caseId);

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading cases...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Case Tracking & Legal Dossiers</h1>
          <p className="page-subtitle">Track and manage court cases, hearings, and forensic evidence chains</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => { setEvidenceForm({ case_id: '', description: '', type: '', date_collected: '' }); setEvidenceModal(true); }}>
            <HiOutlinePlus /> Add Evidence
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <HiOutlinePlus /> New Case
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <HiOutlineSearch className="search-icon" />
          <input type="text" placeholder="Search cases by ID, type, court, status..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="record-count">{filtered.length} cases</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Type</th>
              <th>Linked FIR</th>
              <th>Court & Judge</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Evidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="empty-row">No case files found</td></tr>
            ) : (
              filtered.map(c => (
                <tr 
                  key={c.case_id} 
                  className="clickable-row"
                  onClick={() => openViewCase(c)}
                  title="Click to view comprehensive case dossier"
                >
                  <td className="mono-cell">#{c.case_id}</td>
                  <td><span style={{fontWeight: 600}}>{c.case_type || '—'}</span></td>
                  <td className="mono-cell">
                    {c.fir_id ? <span className="badge badge-info">FIR #{c.fir_id}</span> : <span style={{color: '#64748b'}}>—</span>}
                  </td>
                  <td>
                    <div>
                      <span>{c.court_name || '—'}</span>
                      {c.judge_name && <div style={{fontSize: '11px', color: '#64748b'}}>{c.judge_name}</div>}
                    </div>
                  </td>
                  <td>{c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}</td>
                  <td><span className={`badge badge-${getStatusClass(c.status)}`}>{c.status}</span></td>
                  <td>
                    <span className="evidence-count">
                      {getEvidenceForCase(c.case_id).length} item{getEvidenceForCase(c.case_id).length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="icon-btn view" 
                      title="View Dossier" 
                      onClick={(e) => { e.stopPropagation(); openViewCase(c); }}
                    >
                      <HiOutlineEye />
                    </button>
                    <button 
                      className="icon-btn edit" 
                      title="Edit Case" 
                      onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                    >
                      <HiOutlinePencil />
                    </button>
                    <button 
                      className="icon-btn add" 
                      title="Add Evidence" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEvidenceForm({ case_id: c.case_id, description: '', type: '', date_collected: '' }); 
                        setEvidenceModal(true); 
                      }}
                    >
                      <HiOutlinePlus />
                    </button>
                    <button 
                      className="icon-btn delete" 
                      title="Delete Case" 
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.case_id); }}
                    >
                      <HiOutlineTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Case Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Case File' : 'New Case File'} size="large">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Case Type *</label>
              <input type="text" value={formData.case_type} onChange={e => setFormData({...formData, case_type: e.target.value})} required placeholder="e.g. Fraud, Armed Robbery, Assault" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Pending">Pending</option>
                <option value="Investigation">Investigation</option>
                <option value="Closed">Closed</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Linked FIR</label>
              <select value={formData.fir_id} onChange={e => setFormData({...formData, fir_id: e.target.value})}>
                <option value="">— Select FIR —</option>
                {firs.map(f => (
                  <option key={f.fir_id} value={f.fir_id}>#{f.fir_id} — {f.description?.substring(0, 40)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Court</label>
              <select value={formData.court_id} onChange={e => setFormData({...formData, court_id: e.target.value})}>
                <option value="">— Select Court —</option>
                {courts.map(c => (
                  <option key={c.court_id} value={c.court_id}>{c.court_name} — {c.judge_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{selected ? 'Update' : 'Create'} Case</button>
          </div>
        </form>
      </Modal>

      {/* View Case Dossier Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Legal Case File & Judicial Dossier" size="large">
        {selected && (
          <div className="case-dossier-view">
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">CASE NUMBER</span><span className="detail-value mono">#{selected.case_id}</span></div>
              <div className="detail-item"><span className="detail-label">PROSECUTION STATUS</span><span className={`badge badge-${getStatusClass(selected.status)}`}>{selected.status}</span></div>
              <div className="detail-item"><span className="detail-label">OFFENCE CATEGORY</span><span className="detail-value">{selected.case_type || '—'}</span></div>
              <div className="detail-item"><span className="detail-label">ORIGINATING FIR</span><span className="detail-value mono">{selected.fir_id ? `#${selected.fir_id}` : 'Direct Filing'}</span></div>
              <div className="detail-item"><span className="detail-label">ASSIGNED COURT</span><span className="detail-value">{selected.court_name || '—'}</span></div>
              <div className="detail-item"><span className="detail-label">PRESIDING JUDGE</span><span className="detail-value">{selected.judge_name || '—'}</span></div>
              <div className="detail-item"><span className="detail-label">PROCEEDINGS START</span><span className="detail-value">{selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '—'}</span></div>
              <div className="detail-item"><span className="detail-label">DISPOSITION / END</span><span className="detail-value">{selected.end_date ? new Date(selected.end_date).toLocaleDateString() : 'Active Proceedings'}</span></div>
            </div>

            {/* Linked FIR Incident Details */}
            {caseFIRDetails && (
              <div className="dossier-sub-section" style={{marginTop: '16px'}}>
                <h4 className="dossier-sec-title">Originating FIR Details & Accused Group</h4>
                <div className="dossier-fir-card">
                  <div className="fir-card-top">
                    <span className="badge badge-info">FIR #{caseFIRDetails.fir_id}</span>
                    <span className="fir-meta-station">{caseFIRDetails.station_name} · Officer {caseFIRDetails.rank_1} ({caseFIRDetails.badge_no})</span>
                  </div>
                  <p className="fir-desc-full">{caseFIRDetails.description}</p>
                  {caseFIRDetails.criminals && caseFIRDetails.criminals.length > 0 && (
                    <div className="fir-accused-chips">
                      <span className="accused-label">Named Accused:</span>
                      {caseFIRDetails.criminals.map(c => (
                        <span key={c.criminal_id} className="accused-name-tag">
                          {c.photo_url && <img src={c.photo_url} alt={c.name} className="mini-tag-avatar" />}
                          {c.name} (#{c.criminal_id})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Linked Evidence Section */}
            <div className="evidence-section" style={{marginTop: '16px'}}>
              <h4 className="dossier-sec-title">Chain of Custody & Evidence Repository ({getEvidenceForCase(selected.case_id).length})</h4>
              {getEvidenceForCase(selected.case_id).length === 0 ? (
                <p className="empty-text">No evidence items registered under this case file yet.</p>
              ) : (
                <div className="dossier-evidence-grid">
                  {getEvidenceForCase(selected.case_id).map(ev => (
                    <div key={ev.evidence_id} className="dossier-ev-card">
                      {ev.file_url ? (
                        ev.media_type === 'Video' || ev.type === 'Video' ? (
                          <div className="ev-card-video-box">
                            <video src={ev.file_url} className="ev-card-video" />
                            <span className="ev-tag">🎬 Video</span>
                          </div>
                        ) : (
                          <img src={ev.file_url} alt="Evidence" className="ev-card-img" />
                        )
                      ) : (
                        <div className="ev-card-placeholder">
                          <span className="ev-type-pill">{ev.type}</span>
                        </div>
                      )}
                      <div className="ev-card-details">
                        <span className="ev-card-desc">{ev.description}</span>
                        <span className="ev-card-date">{ev.date_collected ? new Date(ev.date_collected).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  setViewModal(false);
                  openEdit(selected);
                }}
              >
                <HiOutlinePencil /> Edit Case Record
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Evidence Modal */}
      <Modal isOpen={evidenceModal} onClose={() => setEvidenceModal(false)} title="Add Evidence">
        <form onSubmit={handleEvidenceSubmit} className="modal-form">
          <div className="form-group">
            <label>Linked Case *</label>
            <select value={evidenceForm.case_id} onChange={e => setEvidenceForm({...evidenceForm, case_id: e.target.value})} required>
              <option value="">— Select Case —</option>
              {cases.map(c => (
                <option key={c.case_id} value={c.case_id}>#{c.case_id} — {c.case_type}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Evidence Type *</label>
              <select value={evidenceForm.type} onChange={e => setEvidenceForm({...evidenceForm, type: e.target.value})} required>
                <option value="">Select type</option>
                <option value="Physical">Physical</option>
                <option value="Digital">Digital</option>
                <option value="Document">Document</option>
                <option value="Video">Video</option>
                <option value="Testimonial">Testimonial</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Collected</label>
              <input type="date" value={evidenceForm.date_collected} onChange={e => setEvidenceForm({...evidenceForm, date_collected: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea value={evidenceForm.description} onChange={e => setEvidenceForm({...evidenceForm, description: e.target.value})} rows="3" required></textarea>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEvidenceModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Evidence</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cases;

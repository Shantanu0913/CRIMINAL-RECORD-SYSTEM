import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import Modal from '../components/Modal';
import BiometricEnrollModal from '../components/BiometricEnrollModal';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineSearch, 
  HiOutlineEye,
  HiOutlineUserGroup,
  HiOutlineUserAdd,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineCamera,
  HiOutlineFingerPrint,
  HiOutlinePhotograph,
  HiOutlineFilm,
  HiOutlineUpload,
  HiOutlinePlay,
  HiOutlineDocumentText,
  HiOutlineLocationMarker,
  HiOutlineShieldExclamation
} from 'react-icons/hi';

const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const FIRs = () => {
  const [firs, setFirs] = useState([]);
  const [criminals, setCriminals] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  
  // Accused search within modal
  const [suspectSearch, setSuspectSearch] = useState('');
  const [quickAddModal, setQuickAddModal] = useState(false);
  const [quickFormData, setQuickFormData] = useState({ name: '', gender: 'Male', address: '', remarks: '' });

  // Biometric Enrolment Trigger for clicked Accused card
  const [enrolCriminal, setEnrolCriminal] = useState(null);
  const [enrolModalOpen, setEnrolModalOpen] = useState(false);

  // Evidence Add Sub-Modal for FIR
  const [addEvidenceModal, setAddEvidenceModal] = useState(false);
  const [evidenceFormData, setEvidenceFormData] = useState({
    description: '',
    type: 'Photo',
    file_url: '',
    file_name: '',
    media_type: 'Photo'
  });
  const [evidenceUploading, setEvidenceUploading] = useState(false);

  const groupPhotoInputRef = useRef(null);
  const firEvidenceInputRef = useRef(null);

  const [formData, setFormData] = useState({
    date: '', 
    time: '', 
    description: '', 
    officer_id: '', 
    station_id: '', 
    group_photo_url: '',
    incident_location: '',
    fir_status: 'Under Investigation',
    severity_level: 'High',
    criminal_ids: [],
    evidence_items: []
  });

  useEffect(() => {
    fetchFIRs();
    fetchCriminals();
    fetchOfficers();
    fetchStations();
  }, []);

  const fetchFIRs = async () => {
    try {
      const res = await API.get('/firs');
      if (res.data.success) setFirs(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCriminals = async () => {
    try { const res = await API.get('/criminals'); if (res.data.success) setCriminals(res.data.data); } catch (err) { console.error(err); }
  };
  const fetchOfficers = async () => {
    try { const res = await API.get('/officers'); if (res.data.success) setOfficers(res.data.data); } catch (err) { console.error(err); }
  };
  const fetchStations = async () => {
    try { const res = await API.get('/stations'); if (res.data.success) setStations(res.data.data); } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await API.put(`/firs/${selected.fir_id}`, formData);
      } else {
        await API.post('/firs', formData);
      }
      setModalOpen(false);
      resetForm();
      fetchFIRs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving FIR');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FIR?')) return;
    try {
      await API.delete(`/firs/${id}`);
      fetchFIRs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting FIR');
    }
  };

  const openEdit = async (fir) => {
    setSelected(fir);
    let linkedIds = [];
    let detailedFIR = fir;
    try {
      const res = await API.get(`/firs/${fir.fir_id}`);
      if (res.data.success) {
        detailedFIR = res.data.data;
        if (detailedFIR.criminals) {
          linkedIds = detailedFIR.criminals.map(c => c.criminal_id);
        }
      }
    } catch {
      if (fir.linked_criminal_ids) {
        linkedIds = fir.linked_criminal_ids.split(',').map(Number);
      }
    }

    setFormData({
      date: detailedFIR.date ? detailedFIR.date.split('T')[0] : '',
      time: detailedFIR.time || '',
      description: detailedFIR.description || '',
      officer_id: detailedFIR.officer_id || '',
      station_id: detailedFIR.station_id || '',
      group_photo_url: detailedFIR.group_photo_url || '',
      incident_location: detailedFIR.incident_location || '',
      fir_status: detailedFIR.fir_status || 'Under Investigation',
      severity_level: detailedFIR.severity_level || 'High',
      criminal_ids: linkedIds,
      evidence_items: []
    });
    setSuspectSearch('');
    setModalOpen(true);
  };

  const openView = async (fir) => {
    setSelected(fir);
    setSelectedDetails(fir);
    setViewModal(true);
    try {
      const res = await API.get(`/firs/${fir.fir_id}`);
      if (res.data.success) {
        setSelectedDetails(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAdd = () => {
    setSelected(null);
    resetForm();
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
    setFormData({
      date: today,
      time: nowTime,
      description: '',
      officer_id: '',
      station_id: '',
      group_photo_url: '',
      incident_location: '',
      fir_status: 'Under Investigation',
      severity_level: 'High',
      criminal_ids: [],
      evidence_items: []
    });
    setSuspectSearch('');
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ 
      date: '', time: '', description: '', officer_id: '', station_id: '', 
      group_photo_url: '', incident_location: '', fir_status: 'Under Investigation', severity_level: 'High',
      criminal_ids: [], evidence_items: [] 
    });
    setSelected(null);
  };

  // Group Photo Upload Handler
  const handleGroupPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 900, 0.82);
      setFormData(prev => ({ ...prev, group_photo_url: compressed }));
    } catch (err) {
      console.error('Error processing group photo:', err);
    }
  };

  // Quick Attach Group Photo Directly from View Modal
  const handleQuickGroupPhotoInView = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDetails) return;
    try {
      const compressed = await compressImage(file, 900, 0.82);
      await API.put(`/firs/${selectedDetails.fir_id}`, { group_photo_url: compressed });
      const updated = { ...selectedDetails, group_photo_url: compressed };
      setSelectedDetails(updated);
      fetchFIRs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error attaching group photo');
    }
  };

  // Evidence Attachment Handlers
  const handleAttachEvidenceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDetails) return;
    setEvidenceUploading(true);
    try {
      const res = await API.post(`/firs/${selectedDetails.fir_id}/evidence`, evidenceFormData);
      if (res.data.success) {
        setAddEvidenceModal(false);
        setEvidenceFormData({ description: '', type: 'Photo', file_url: '', file_name: '', media_type: 'Photo' });
        // Refresh FIR details
        const refreshed = await API.get(`/firs/${selectedDetails.fir_id}`);
        if (refreshed.data.success) setSelectedDetails(refreshed.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error attaching evidence');
    } finally {
      setEvidenceUploading(false);
    }
  };

  const handleEvidenceFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let detectedType = 'Document';
    if (file.type.startsWith('image/')) detectedType = 'Photo';
    else if (file.type.startsWith('video/')) detectedType = 'Video';
    else if (file.type.startsWith('audio/')) detectedType = 'Audio';

    let fileData = '';
    if (file.type.startsWith('image/')) {
      fileData = await compressImage(file, 850, 0.82);
    } else {
      fileData = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    }

    setEvidenceFormData(prev => ({
      ...prev,
      file_url: fileData,
      file_name: file.name,
      media_type: detectedType,
      type: prev.type === 'Document' && detectedType !== 'Document' ? detectedType : prev.type
    }));
  };

  // Accused Card Biometric Updated callback
  const handleAccusedBiometricUpdated = async () => {
    await fetchCriminals();
    if (selectedDetails) {
      const res = await API.get(`/firs/${selectedDetails.fir_id}`);
      if (res.data.success) setSelectedDetails(res.data.data);
    }
  };

  // Group Accused Handlers
  const toggleSuspect = (criminalId) => {
    setFormData(prev => {
      const exists = prev.criminal_ids.includes(criminalId);
      return {
        ...prev,
        criminal_ids: exists 
          ? prev.criminal_ids.filter(id => id !== criminalId)
          : [...prev.criminal_ids, criminalId]
      };
    });
  };

  const removeSuspect = (criminalId) => {
    setFormData(prev => ({
      ...prev,
      criminal_ids: prev.criminal_ids.filter(id => id !== criminalId)
    }));
  };

  const handleQuickAddCriminal = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/criminals', quickFormData);
      if (res.data.success) {
        const newCriminal = res.data.data;
        await fetchCriminals();
        setFormData(prev => ({
          ...prev,
          criminal_ids: [...prev.criminal_ids, newCriminal.criminal_id]
        }));
        setQuickAddModal(false);
        setQuickFormData({ name: '', gender: 'Male', address: '', remarks: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering accused');
    }
  };

  const filtered = firs.filter(f =>
    `${f.fir_id} ${f.description || ''} ${f.station_name || ''} ${f.criminal_names || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCriminalsForModal = criminals.filter(c =>
    `${c.name} ${c.criminal_id} ${c.address || ''}`.toLowerCase().includes(suspectSearch.toLowerCase())
  );

  const selectedCriminalObjects = criminals.filter(c => formData.criminal_ids.includes(c.criminal_id));

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading FIR records...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>FIR Records</h1>
          <p className="page-subtitle">First Information Reports & Group Accused Filing</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <HiOutlinePlus /> File New FIR
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <HiOutlineSearch className="search-icon" />
          <input type="text" placeholder="Search FIRs by ID, description, officer, or accused..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="record-count">{filtered.length} records</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>FIR ID</th>
              <th>Date & Time</th>
              <th>Incident Description</th>
              <th>Investigating Officer</th>
              <th>Police Station</th>
              <th>Accused Group</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="empty-row">No FIR records found</td></tr>
            ) : (
              filtered.map(f => {
                const criminalList = f.criminal_names ? f.criminal_names.split(', ') : [];
                return (
                  <tr 
                    key={f.fir_id}
                    className="clickable-row"
                    onClick={() => openView(f)}
                    title="Click to view full FIR report & accused dossier"
                  >
                    <td className="mono-cell">#{f.fir_id}</td>
                    <td>
                      <div>
                        <span style={{fontWeight: 600}}>{f.date ? new Date(f.date).toLocaleDateString() : '—'}</span>
                        <div style={{fontSize: '11px', color: '#64748b'}}>{f.time || ''}</div>
                      </div>
                    </td>
                    <td style={{maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={f.description}>
                      {f.description || '—'}
                    </td>
                    <td>{f.badge_no ? `${f.rank_1} (${f.badge_no})` : '—'}</td>
                    <td><span className="badge badge-info">{f.station_name || '—'}</span></td>
                    <td>
                      {criminalList.length > 0 ? (
                        <div className="fir-group-chip">
                          <HiOutlineUserGroup className="group-chip-icon" />
                          <span className="group-count-tag">{criminalList.length} Accused</span>
                          <span className="group-names-preview" title={f.criminal_names}>
                            ({criminalList.slice(0, 2).join(', ')}{criminalList.length > 2 ? ` +${criminalList.length - 2}` : ''})
                          </span>
                        </div>
                      ) : (
                        <span style={{color: '#64748b', fontSize: '12px'}}>Unidentified / None</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="icon-btn view" 
                        title="View Dossier" 
                        onClick={(e) => { e.stopPropagation(); openView(f); }}
                      >
                        <HiOutlineEye />
                      </button>
                      <button 
                        className="icon-btn edit" 
                        title="Edit FIR" 
                        onClick={(e) => { e.stopPropagation(); openEdit(f); }}
                      >
                        <HiOutlinePencil />
                      </button>
                      <button 
                        className="icon-btn delete" 
                        title="Delete FIR" 
                        onClick={(e) => { e.stopPropagation(); handleDelete(f.fir_id); }}
                      >
                        <HiOutlineTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit FIR & Accused Group' : 'File New FIR on Group of Accused'} size="large">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Incident Date *</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Incident Time</label>
              <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Investigating Officer</label>
              <select value={formData.officer_id} onChange={e => setFormData({...formData, officer_id: e.target.value})}>
                <option value="">— Select Officer —</option>
                {officers.map(o => (
                  <option key={o.officer_id} value={o.officer_id}>{o.officer_name} ({o.badge_no}) — {o.rank_1}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Police Station</label>
              <select value={formData.station_id} onChange={e => setFormData({...formData, station_id: e.target.value})}>
                <option value="">— Select Station —</option>
                {stations.map(s => (
                  <option key={s.station_id} value={s.station_id}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Incident Location / Landmark</label>
              <input 
                type="text" 
                placeholder="e.g. Central Market, Block 4 Warehouse, Solapur Road..."
                value={formData.incident_location} 
                onChange={e => setFormData({...formData, incident_location: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Severity Level</label>
              <select value={formData.severity_level} onChange={e => setFormData({...formData, severity_level: e.target.value})}>
                <option value="Critical">🔴 Critical (Armed / Violent Gang)</option>
                <option value="High">🟠 High (Major Robbery / Conspiracy)</option>
                <option value="Medium">🟡 Medium (Theft / Assault)</option>
                <option value="Low">🟢 Low (Minor Offence)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>FIR Complaint & Incident Details *</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" placeholder="Describe the incident, offences committed, witness statements..." required></textarea>
          </div>

          {/* ── ACCUSED GROUP PHOTO UPLOADER ── */}
          <div className="form-group">
            <label>Accused Group Photo / Crime Scene Capture (Optional)</label>
            <div className="fir-group-photo-uploader">
              {formData.group_photo_url ? (
                <div className="group-photo-preview-wrap">
                  <img src={formData.group_photo_url} alt="Accused Group" className="group-photo-preview-img" />
                  <div className="group-photo-tag-overlay">
                    <HiOutlinePhotograph /> ACCUSED GROUP PHOTO ATTACHED
                  </div>
                  <button 
                    type="button" 
                    className="group-photo-remove-btn"
                    onClick={() => setFormData(prev => ({ ...prev, group_photo_url: '' }))}
                  >
                    <HiOutlineX /> Remove Photo
                  </button>
                </div>
              ) : (
                <div className="group-photo-dropzone" onClick={() => groupPhotoInputRef.current?.click()}>
                  <HiOutlinePhotograph className="group-upload-icon" />
                  <span className="group-upload-title">Click to upload Accused Group Photo / Crime Scene Snapshot</span>
                  <span className="group-upload-hint">Attach a group lineup, CCTV capture, or hideout arrest photograph</span>
                </div>
              )}
              <input 
                type="file" 
                ref={groupPhotoInputRef}
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={handleGroupPhotoUpload}
              />
            </div>
          </div>

          {/* ── GROUP OF ACCUSED SELECTION WORKBENCH ── */}
          <div className="accused-group-workbench">
            <div className="workbench-header">
              <div className="workbench-title-box">
                <HiOutlineUserGroup className="wb-icon" />
                <div>
                  <h4 className="wb-title">Group of Accused / Named Suspects</h4>
                  <span className="wb-sub">Select multiple individuals involved in this incident</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline quick-add-btn" 
                onClick={() => setQuickAddModal(true)}
              >
                <HiOutlineUserAdd /> + Register New Accused
              </button>
            </div>

            {/* Selected Accused Pills Bar */}
            <div className="selected-accused-bar">
              <div className="selected-bar-header">
                <span className="selected-count-label">
                  ATTACHED ACCUSED ({selectedCriminalObjects.length}):
                </span>
                {selectedCriminalObjects.length > 0 && (
                  <button 
                    type="button" 
                    className="clear-all-accused"
                    onClick={() => setFormData(prev => ({ ...prev, criminal_ids: [] }))}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedCriminalObjects.length === 0 ? (
                <div className="no-accused-prompt">
                  <span>No accused attached to this FIR yet. Click individuals below to add to group.</span>
                </div>
              ) : (
                <div className="selected-pills-list">
                  {selectedCriminalObjects.map(c => (
                    <div key={c.criminal_id} className="accused-pill">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="pill-avatar-img" />
                      ) : (
                        <div className="pill-avatar">{c.name.charAt(0)}</div>
                      )}
                      <div className="pill-info">
                        <span className="pill-name">{c.name}</span>
                        <span className="pill-id">#{c.criminal_id}</span>
                      </div>
                      <button 
                        type="button" 
                        className="pill-remove" 
                        onClick={() => removeSuspect(c.criminal_id)}
                        title="Remove from group"
                      >
                        <HiOutlineX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accused Directory Grid */}
            <div className="accused-directory">
              <div className="directory-search">
                <HiOutlineSearch className="dir-search-icon" />
                <input 
                  type="text" 
                  placeholder="Filter suspects by name or address..."
                  value={suspectSearch}
                  onChange={e => setSuspectSearch(e.target.value)}
                />
              </div>

              <div className="directory-cards-grid">
                {filteredCriminalsForModal.slice(0, 18).map(c => {
                  const isSelected = formData.criminal_ids.includes(c.criminal_id);
                  return (
                    <div 
                      key={c.criminal_id} 
                      className={`suspect-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSuspect(c.criminal_id)}
                    >
                      <div className="suspect-checkbox">
                        {isSelected ? <HiOutlineCheck className="check-icon" /> : null}
                      </div>

                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="suspect-card-img" />
                      ) : (
                        <div className="suspect-card-avatar">{c.name.charAt(0)}</div>
                      )}

                      <div className="suspect-card-info">
                        <span className="suspect-card-name">{c.name}</span>
                        <span className="suspect-card-meta">#{c.criminal_id} · {c.gender}</span>
                        <span className="suspect-card-addr">{c.address || '—'}</span>
                      </div>

                      <div className="suspect-card-chips">
                        {c.face_enrolled ? <span className="bio-dot face" title="Face Enrolled">📸</span> : null}
                        {c.fingerprint_enrolled ? <span className="bio-dot fp" title="Fingerprint Enrolled">👆</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="form-actions" style={{marginTop: '20px'}}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {selected ? 'Update FIR' : `File FIR with ${formData.criminal_ids.length} Accused`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Register Accused Sub-Modal */}
      <Modal isOpen={quickAddModal} onClose={() => setQuickAddModal(false)} title="Quick Register Accused Person" size="medium">
        <form onSubmit={handleQuickAddCriminal} className="modal-form">
          <div className="form-group">
            <label>Accused Full Name *</label>
            <input type="text" value={quickFormData.name} onChange={e => setQuickFormData({...quickFormData, name: e.target.value})} required autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select value={quickFormData.gender} onChange={e => setQuickFormData({...quickFormData, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Known Address</label>
              <input type="text" value={quickFormData.address} onChange={e => setQuickFormData({...quickFormData, address: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Remarks / Role in Incident</label>
            <textarea value={quickFormData.remarks} onChange={e => setQuickFormData({...quickFormData, remarks: e.target.value})} rows="2" placeholder="Accused suspect, accomplice, etc."></textarea>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setQuickAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add to System & Attach to FIR</button>
          </div>
        </form>
      </Modal>

      {/* ── VIEW MODAL: FIR REPORT, GROUP PHOTO, ACCUSED & EVIDENCE VAULT ── */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="FIR Report & Accused Group Dossier" size="large">
        {selectedDetails && (
          <div className="fir-dossier-view">
            {/* Group Photograph Banner */}
            {selectedDetails.group_photo_url ? (
              <div className="fir-group-photo-banner">
                <img src={selectedDetails.group_photo_url} alt="Accused Group" className="fir-group-banner-img" />
                <div className="fir-banner-overlay">
                  <div className="fir-banner-left">
                    <span className="banner-badge">ACCUSED GROUP & CRIME SCENE CAPTURE</span>
                    <span className="banner-subtitle">Syndicate / Lineup Photographic Record</span>
                  </div>
                  <button 
                    type="button" 
                    className="banner-change-btn" 
                    onClick={() => groupPhotoInputRef.current?.click()}
                  >
                    Change Group Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="fir-group-photo-prompt">
                <div className="prompt-left">
                  <HiOutlinePhotograph className="prompt-icon" />
                  <div>
                    <span className="prompt-title">No Group Photo Attached</span>
                    <span className="prompt-sub">Upload an accused gang lineup or crime scene photo</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => groupPhotoInputRef.current?.click()}
                >
                  <HiOutlineUpload /> + Attach Group Photo
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={groupPhotoInputRef}
              accept="image/*" 
              style={{ display: 'none' }}
              onChange={handleQuickGroupPhotoInView}
            />

            {/* Metadata Grid */}
            <div className="detail-grid" style={{ marginTop: '16px' }}>
              <div className="detail-item"><span className="detail-label">FIR NUMBER</span><span className="detail-value mono">#{selectedDetails.fir_id}</span></div>
              <div className="detail-item"><span className="detail-label">INCIDENT DATE</span><span className="detail-value">{selectedDetails.date ? new Date(selectedDetails.date).toLocaleDateString() : '—'}</span></div>
              <div className="detail-item"><span className="detail-label">INCIDENT TIME</span><span className="detail-value">{selectedDetails.time || '—'}</span></div>
              <div className="detail-item"><span className="detail-label">INVESTIGATING OFFICER</span><span className="detail-value">{selectedDetails.badge_no ? `${selectedDetails.rank_1} (${selectedDetails.badge_no})` : '—'}</span></div>
              <div className="detail-item"><span className="detail-label">POLICE STATION</span><span className="detail-value">{selectedDetails.station_name || '—'}</span></div>
              <div className="detail-item">
                <span className="detail-label">STATUS & PRIORITY</span>
                <div style={{display: 'flex', gap: '6px', marginTop: '2px'}}>
                  <span className="badge badge-warning">{selectedDetails.fir_status || 'Under Investigation'}</span>
                  {selectedDetails.severity_level && (
                    <span className={`badge ${selectedDetails.severity_level === 'Critical' ? 'badge-danger' : selectedDetails.severity_level === 'High' ? 'badge-warning' : 'badge-info'}`}>
                      {selectedDetails.severity_level}
                    </span>
                  )}
                </div>
              </div>
              {selectedDetails.incident_location && (
                <div className="detail-item full">
                  <span className="detail-label">INCIDENT LOCATION / SCENE</span>
                  <span className="detail-value"><HiOutlineLocationMarker style={{color: 'var(--accent-cyan)'}} /> {selectedDetails.incident_location}</span>
                </div>
              )}
              <div className="detail-item full"><span className="detail-label">COMPLAINT / INCIDENT REPORT</span><span className="detail-value">{selectedDetails.description}</span></div>
            </div>

            {/* Accused Group Section — Interactive Clickable Cards */}
            <div className="dossier-accused-section">
              <div className="dossier-sec-header">
                <h4 className="dossier-sec-title">
                  <HiOutlineUserGroup /> Group of Accused Individuals ({selectedDetails.criminals?.length || (selectedDetails.criminal_names ? selectedDetails.criminal_names.split(', ').length : 0)})
                </h4>
                <span className="dossier-sec-hint">Click any card to enrol face/fingerprints or view criminal profile</span>
              </div>

              {selectedDetails.criminals && selectedDetails.criminals.length > 0 ? (
                <div className="dossier-criminals-grid">
                  {selectedDetails.criminals.map(c => (
                    <div 
                      key={c.criminal_id} 
                      className="dossier-criminal-card interactive"
                      onClick={() => {
                        setEnrolCriminal(c);
                        setEnrolModalOpen(true);
                      }}
                      title="Click to enrol biometrics, mugshot, or view dossier"
                    >
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="dossier-c-photo" />
                      ) : (
                        <div className="dossier-c-avatar">{c.name.charAt(0)}</div>
                      )}
                      <div className="dossier-c-details">
                        <span className="dossier-c-name">{c.name}</span>
                        <span className="dossier-c-id">#{c.criminal_id} · {c.gender}</span>
                        <span className="dossier-c-addr">{c.address || 'Address Unknown'}</span>
                        <div className="dossier-c-biostatus">
                          <span className={`bio-mini-chip ${c.face_enrolled ? 'chip-active' : 'chip-dim'}`}>
                            <HiOutlineCamera /> {c.face_enrolled ? 'Face' : 'No Face'}
                          </span>
                          <span className={`bio-mini-chip ${c.fingerprint_enrolled ? 'chip-active' : 'chip-dim'}`}>
                            <HiOutlineFingerPrint /> {c.fingerprint_enrolled ? 'Print' : 'No Print'}
                          </span>
                        </div>
                      </div>
                      <div className="card-enrol-badge">
                        <span>Enrol / View ➔</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDetails.criminal_names ? (
                <div className="dossier-plain-names">
                  <span>{selectedDetails.criminal_names}</span>
                </div>
              ) : (
                <p style={{color: '#64748b', fontSize: '13px'}}>No specific accused named in this report.</p>
              )}
            </div>

            {/* Attached Evidence & Crime Scene Vault */}
            <div className="dossier-evidence-section">
              <div className="dossier-sec-header">
                <h4 className="dossier-sec-title">
                  <HiOutlineShieldExclamation /> Attached Evidence & Crime Scene Media ({selectedDetails.evidence?.length || 0})
                </h4>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => setAddEvidenceModal(true)}
                >
                  <HiOutlinePlus /> + Attach Evidence
                </button>
              </div>

              {selectedDetails.evidence && selectedDetails.evidence.length > 0 ? (
                <div className="fir-evidence-grid">
                  {selectedDetails.evidence.map(ev => (
                    <div key={ev.evidence_id} className="fir-ev-card">
                      <div className="fir-ev-media-box">
                        {ev.file_url ? (
                          ev.media_type === 'Video' || ev.type === 'Video' ? (
                            <video src={ev.file_url} controls className="fir-ev-video" />
                          ) : ev.media_type === 'Audio' || ev.type === 'Audio' ? (
                            <div className="fir-ev-audio-box">
                              <audio src={ev.file_url} controls className="fir-ev-audio" />
                            </div>
                          ) : (
                            <img src={ev.file_url} alt="Evidence" className="fir-ev-img" />
                          )
                        ) : (
                          <div className="fir-ev-no-file">
                            <HiOutlineDocumentText style={{ fontSize: '28px', color: 'var(--accent-cyan)' }} />
                            <span>{ev.type} Evidence</span>
                          </div>
                        )}
                        <span className="fir-ev-type-badge">{ev.type}</span>
                      </div>
                      <div className="fir-ev-info">
                        <span className="fir-ev-desc" title={ev.description}>{ev.description}</span>
                        <span className="fir-ev-date">{ev.date_collected ? new Date(ev.date_collected).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-fir-evidence">
                  <span>No forensic evidence or surveillance media attached to this FIR yet.</span>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    style={{marginTop: '8px'}}
                    onClick={() => setAddEvidenceModal(true)}
                  >
                    <HiOutlineUpload /> Upload First Evidence Item
                  </button>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  setViewModal(false);
                  openEdit(selectedDetails);
                }}
              >
                <HiOutlinePencil /> Edit FIR & Accused Group
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Attach Evidence Sub-Modal */}
      <Modal isOpen={addEvidenceModal} onClose={() => setAddEvidenceModal(false)} title="Attach Evidence to FIR" size="medium">
        <form onSubmit={handleAttachEvidenceSubmit} className="modal-form">
          <div className="form-group">
            <label>Evidence Category *</label>
            <select 
              value={evidenceFormData.type} 
              onChange={e => setEvidenceFormData({...evidenceFormData, type: e.target.value, media_type: e.target.value})}
            >
              <option value="Photo">📷 Crime Scene Photo</option>
              <option value="Video">🎬 CCTV Footage / Video Clip</option>
              <option value="Physical">🔪 Recovered Weapon / Physical Property</option>
              <option value="Document">📄 Forensic Report / Document</option>
              <option value="Audio">🎙️ Audio Statement / Intercept</option>
              <option value="Other">📦 Other Evidence</option>
            </select>
          </div>

          <div className="form-group">
            <label>Attach Evidence Media File (Photo, Video, Audio, Document)</label>
            <div className="fir-ev-uploader">
              {evidenceFormData.file_url ? (
                <div className="fir-ev-preview">
                  {evidenceFormData.media_type === 'Video' ? (
                    <video src={evidenceFormData.file_url} controls className="fir-ev-form-video" />
                  ) : (
                    <img src={evidenceFormData.file_url} alt="Evidence" className="fir-ev-form-img" />
                  )}
                  <button 
                    type="button" 
                    className="fir-ev-clear"
                    onClick={() => setEvidenceFormData(prev => ({ ...prev, file_url: '', file_name: '', media_type: 'Photo' }))}
                  >
                    <HiOutlineX /> Remove Media
                  </button>
                </div>
              ) : (
                <div className="ev-dropzone" onClick={() => firEvidenceInputRef.current?.click()}>
                  <HiOutlineUpload className="ev-upload-icon" />
                  <span className="ev-upload-main">Click to select photo, video, audio, or document file</span>
                </div>
              )}
              <input 
                type="file" 
                ref={firEvidenceInputRef}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={handleEvidenceFileUpload}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Evidence Description & Seizure Details *</label>
            <textarea 
              rows="3"
              placeholder="e.g. Weapon recovered from suspect, CCTV footage from store camera 2, gold jewelry seized..."
              value={evidenceFormData.description}
              onChange={e => setEvidenceFormData({...evidenceFormData, description: e.target.value})}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAddEvidenceModal(false)} disabled={evidenceUploading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={evidenceUploading}>
              {evidenceUploading ? 'Uploading...' : 'Attach Evidence to FIR'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Biometric Enrolment Workstation Modal for Clicked Accused */}
      {enrolCriminal && (
        <BiometricEnrollModal
          isOpen={enrolModalOpen}
          onClose={() => setEnrolModalOpen(false)}
          criminal={enrolCriminal}
          onUpdated={handleAccusedBiometricUpdated}
        />
      )}
    </div>
  );
};

export default FIRs;

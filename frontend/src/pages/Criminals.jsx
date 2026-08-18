import { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from '../components/Modal';
import BiometricEnrollModal from '../components/BiometricEnrollModal';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineSearch, 
  HiOutlineEye,
  HiOutlineFingerPrint,
  HiOutlineCamera,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck
} from 'react-icons/hi';

const Criminals = () => {
  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    name: '', gender: 'Male', address: '', remarks: ''
  });

  useEffect(() => { fetchCriminals(); }, []);

  const fetchCriminals = async () => {
    try {
      const res = await API.get('/criminals');
      if (res.data.success) setCriminals(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await API.put(`/criminals/${selected.criminal_id}`, formData);
      } else {
        await API.post('/criminals', formData);
      }
      setModalOpen(false);
      resetForm();
      fetchCriminals();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving criminal record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await API.delete(`/criminals/${id}`);
      fetchCriminals();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting record');
    }
  };

  const openEdit = (criminal) => {
    setSelected(criminal);
    setFormData({
      name: criminal.name || '',
      gender: criminal.gender || 'Male',
      address: criminal.address || '',
      remarks: criminal.remarks || ''
    });
    setModalOpen(true);
  };

  const openBiometrics = (criminal) => {
    setSelected(criminal);
    setBiometricModalOpen(true);
  };

  const openAdd = () => {
    setSelected(null);
    resetForm();
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', gender: 'Male', address: '', remarks: '' });
    setSelected(null);
  };

  const handleBiometricUpdated = (updatedCriminal) => {
    setCriminals(prev => prev.map(c => c.criminal_id === updatedCriminal.criminal_id ? updatedCriminal : c));
    if (selected && selected.criminal_id === updatedCriminal.criminal_id) {
      setSelected(updatedCriminal);
    }
  };

  const [criminalMedia, setCriminalMedia] = useState([]);
  const [criminalFIRs, setCriminalFIRs] = useState([]);

  const openViewDossier = async (c) => {
    setSelected(c);
    setViewModal(true);
    // Fetch attached media recordings & linked FIRs
    try {
      const [mediaRes, firRes] = await Promise.all([
        API.get(`/criminals/${c.criminal_id}/media`).catch(() => ({ data: { data: [] } })),
        API.get(`/firs`).catch(() => ({ data: { data: [] } }))
      ]);
      if (mediaRes.data?.success) setCriminalMedia(mediaRes.data.data);
      if (firRes.data?.success) {
        const linked = firRes.data.data.filter(f => 
          (f.linked_criminal_ids && f.linked_criminal_ids.split(',').map(Number).includes(c.criminal_id)) ||
          (f.criminal_names && f.criminal_names.toLowerCase().includes(c.name.toLowerCase()))
        );
        setCriminalFIRs(linked);
      }
    } catch (err) {
      console.error('Error fetching dossier auxiliary info:', err);
    }
  };

  const filtered = criminals.filter(c =>
    `${c.name} ${c.address || ''} ${c.remarks || ''} ${c.biometric_status || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading criminals...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Criminal Records</h1>
          <p className="page-subtitle">Manage criminal profiles, mugshots, forensic biometrics, and surveillance vaults</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <HiOutlinePlus /> Add Criminal
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, address, remarks, biometric status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="record-count">{filtered.length} records</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>Gender</th>
              <th>Address</th>
              <th>Biometrics</th>
              <th>Classification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="empty-row">No criminal records found</td></tr>
            ) : (
              filtered.map(c => (
                <tr 
                  key={c.criminal_id} 
                  className="clickable-row"
                  onClick={() => openViewDossier(c)}
                  title="Click to view full criminal dossier"
                >
                  <td className="id-cell">#{c.criminal_id}</td>
                  <td className="name-cell">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.name} className="name-avatar-img" />
                    ) : (
                      <div className="name-avatar">{c.name?.charAt(0)}</div>
                    )}
                    <div>
                      <span className="subject-name-main">{c.name}</span>
                      {c.face_enrolled && <span className="face-verified-mini" title="Face Enrolled">✓ Face</span>}
                    </div>
                  </td>
                  <td>{c.gender}</td>
                  <td>{c.address || '—'}</td>
                  <td>
                    <div className="table-bio-badges">
                      <span className={`bio-mini-chip ${c.face_enrolled ? 'chip-active' : 'chip-dim'}`} title={c.face_enrolled ? 'Face Enrolled' : 'Face Missing'}>
                        <HiOutlineCamera /> {c.face_enrolled ? 'Face' : '—'}
                      </span>
                      <span className={`bio-mini-chip ${c.fingerprint_enrolled ? 'chip-active' : 'chip-dim'}`} title={c.fingerprint_enrolled ? `Fingerprint Enrolled (${c.fingerprint_type || 'Thumb'})` : 'Fingerprint Missing'}>
                        <HiOutlineFingerPrint /> {c.fingerprint_enrolled ? 'Print' : '—'}
                      </span>
                    </div>
                  </td>
                  <td><span className="badge badge-warning">{c.remarks || '—'}</span></td>
                  <td className="actions-cell">
                    <button 
                      className="icon-btn biometric" 
                      title="Enrol Face & Fingerprint" 
                      onClick={(e) => { e.stopPropagation(); openBiometrics(c); }}
                    >
                      <HiOutlineFingerPrint />
                    </button>
                    <button 
                      className="icon-btn view" 
                      title="View Dossier" 
                      onClick={(e) => { e.stopPropagation(); openViewDossier(c); }}
                    >
                      <HiOutlineEye />
                    </button>
                    <button 
                      className="icon-btn edit" 
                      title="Edit" 
                      onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                    >
                      <HiOutlinePencil />
                    </button>
                    <button 
                      className="icon-btn delete" 
                      title="Delete" 
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.criminal_id); }}
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

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Criminal' : 'Add Criminal'} size="medium">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Remarks / Offence Category</label>
            <textarea value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} rows="2"></textarea>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{selected ? 'Update' : 'Add'} Criminal</button>
          </div>
        </form>
      </Modal>

      {/* View Modal with Comprehensive Dossier, Biometrics & Recordings */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Criminal Master Dossier & Forensic Profile" size="large">
        {selected && (
          <div className="criminal-dossier">
            {/* Top Identity Row */}
            <div className="dossier-top-grid">
              {/* Photo & Biometric Card */}
              <div className="dossier-photo-card">
                {selected.photo_url ? (
                  <div className="dossier-img-wrap">
                    <img src={selected.photo_url} alt={selected.name} className="dossier-mugshot" />
                    <span className="dossier-mugshot-tag">FACIAL BIOMETRICS ENROLLED</span>
                  </div>
                ) : (
                  <div className="dossier-no-photo">
                    <HiOutlineCamera className="dossier-cam-icon" />
                    <span>NO MUGSHOT ENROLLED</span>
                  </div>
                )}
              </div>

              {/* Fingerprint Card */}
              <div className="dossier-fp-card">
                {selected.fingerprint_data ? (
                  <div className="dossier-fp-wrap">
                    <img src={selected.fingerprint_data} alt="Fingerprint" className="dossier-fp-img" />
                    <div className="dossier-fp-meta">
                      <span className="dossier-fp-type">{selected.fingerprint_type || 'Right Thumb'}</span>
                      <span className="dossier-fp-qual">Minutiae Quality: {selected.fingerprint_quality || 95}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="dossier-no-fp">
                    <HiOutlineFingerPrint className="dossier-fp-icon" />
                    <span>NO FINGERPRINT ENROLLED</span>
                  </div>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div className="detail-grid" style={{ marginTop: '16px' }}>
              <div className="detail-item"><span className="detail-label">CRIMINAL ID</span><span className="detail-value mono">#{selected.criminal_id}</span></div>
              <div className="detail-item"><span className="detail-label">FULL NAME</span><span className="detail-value">{selected.name}</span></div>
              <div className="detail-item"><span className="detail-label">GENDER</span><span className="detail-value">{selected.gender}</span></div>
              <div className="detail-item"><span className="detail-label">BIOMETRIC STATUS</span>
                <span className={`badge ${selected.face_enrolled && selected.fingerprint_enrolled ? 'badge-success' : selected.face_enrolled || selected.fingerprint_enrolled ? 'badge-warning' : 'badge-danger'}`}>
                  {selected.face_enrolled && selected.fingerprint_enrolled ? 'Fully Enrolled' : selected.face_enrolled || selected.fingerprint_enrolled ? 'Partial Biometrics' : 'Biometrics Pending'}
                </span>
              </div>
              <div className="detail-item full"><span className="detail-label">KNOWN ADDRESS</span><span className="detail-value">{selected.address || '—'}</span></div>
              <div className="detail-item full"><span className="detail-label">OFFENCE / REMARKS</span><span className="detail-value">{selected.remarks || '—'}</span></div>
            </div>

            {/* Linked FIRs Section */}
            {criminalFIRs.length > 0 && (
              <div className="dossier-sub-section" style={{marginTop: '16px'}}>
                <h4 className="dossier-sec-title">Linked First Information Reports ({criminalFIRs.length})</h4>
                <div className="dossier-firs-list">
                  {criminalFIRs.map(f => (
                    <div key={f.fir_id} className="dossier-fir-item">
                      <span className="fir-id-tag">FIR #{f.fir_id}</span>
                      <span className="fir-desc-preview">{f.description}</span>
                      <span className="fir-date-tag">{f.date ? new Date(f.date).toLocaleDateString() : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Surveillance & Media Section */}
            {criminalMedia.length > 0 && (
              <div className="dossier-sub-section" style={{marginTop: '16px'}}>
                <h4 className="dossier-sec-title">Attached Surveillance Footage & Recordings ({criminalMedia.length})</h4>
                <div className="accused-media-grid" style={{maxHeight: '220px'}}>
                  {criminalMedia.map(m => (
                    <div key={m.media_id} className="accused-media-card">
                      <div className="media-stage-box" style={{height: '110px'}}>
                        {m.media_type === 'Video' || (m.file_url && m.file_url.startsWith('data:video')) ? (
                          <video src={m.file_url} controls className="accused-card-video" />
                        ) : (
                          <img src={m.file_url} alt={m.title} className="accused-card-img" />
                        )}
                      </div>
                      <div className="media-card-footer">
                        <span className="media-card-name">{m.title || m.file_name || 'Media'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  setViewModal(false);
                  openBiometrics(selected);
                }}
              >
                <HiOutlineFingerPrint /> Launch Biometric Enrolment & Media Vault
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Biometric Enrolment Workstation Modal */}
      {selected && (
        <BiometricEnrollModal
          isOpen={biometricModalOpen}
          onClose={() => setBiometricModalOpen(false)}
          criminal={selected}
          onUpdated={handleBiometricUpdated}
        />
      )}
    </div>
  );
};

export default Criminals;

import { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from '../components/Modal';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineEye } from 'react-icons/hi';

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
  const [formData, setFormData] = useState({
    date: '', time: '', description: '', officer_id: '', station_id: '', criminal_ids: []
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

  const openEdit = (fir) => {
    setSelected(fir);
    setFormData({
      date: fir.date ? fir.date.split('T')[0] : '',
      time: fir.time || '',
      description: fir.description || '',
      officer_id: fir.officer_id || '',
      station_id: fir.station_id || '',
      criminal_ids: []
    });
    setModalOpen(true);
  };

  const openAdd = () => {
    setSelected(null);
    resetForm();
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ date: '', time: '', description: '', officer_id: '', station_id: '', criminal_ids: [] });
    setSelected(null);
  };

  const filtered = firs.filter(f =>
    `${f.fir_id} ${f.description || ''} ${f.station_name || ''} ${f.criminal_names || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading FIR records...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>FIR Records</h1>
          <p className="page-subtitle">First Information Reports management</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <HiOutlinePlus /> File New FIR
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <HiOutlineSearch className="search-icon" />
          <input type="text" placeholder="Search FIRs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="record-count">{filtered.length} records</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>FIR ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Description</th>
              <th>Officer</th>
              <th>Station</th>
              <th>Linked Criminals</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="empty-row">No FIR records found</td></tr>
            ) : (
              filtered.map(f => (
                <tr key={f.fir_id}>
                  <td className="mono-cell">#{f.fir_id}</td>
                  <td>{f.date ? new Date(f.date).toLocaleDateString() : '—'}</td>
                  <td>{f.time || '—'}</td>
                  <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{f.description || '—'}</td>
                  <td>{f.badge_no ? `${f.rank_1} (${f.badge_no})` : '—'}</td>
                  <td>{f.station_name || '—'}</td>
                  <td>{f.criminal_names || '—'}</td>
                  <td className="actions-cell">
                    <button className="icon-btn view" title="View" onClick={() => { setSelected(f); setViewModal(true); }}><HiOutlineEye /></button>
                    <button className="icon-btn edit" title="Edit" onClick={() => openEdit(f)}><HiOutlinePencil /></button>
                    <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(f.fir_id)}><HiOutlineTrash /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit FIR' : 'File New FIR'} size="large">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Officer</label>
              <select value={formData.officer_id} onChange={e => setFormData({...formData, officer_id: e.target.value})}>
                <option value="">— Select Officer —</option>
                {officers.map(o => (
                  <option key={o.officer_id} value={o.officer_id}>{o.officer_name} ({o.badge_no})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Station</label>
              <select value={formData.station_id} onChange={e => setFormData({...formData, station_id: e.target.value})}>
                <option value="">— Select Station —</option>
                {stations.map(s => (
                  <option key={s.station_id} value={s.station_id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" required></textarea>
          </div>
          <div className="form-group">
            <label>Link Criminals</label>
            <select multiple value={formData.criminal_ids.map(String)} onChange={e => setFormData({...formData, criminal_ids: Array.from(e.target.selectedOptions, o => Number(o.value))})} style={{minHeight: '80px'}}>
              {criminals.map(c => (
                <option key={c.criminal_id} value={c.criminal_id}>{c.name} — {c.address}</option>
              ))}
            </select>
            <span style={{fontSize: '11px', color: '#64748b'}}>Hold Ctrl to select multiple</span>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{selected ? 'Update' : 'File'} FIR</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="FIR Details">
        {selected && (
          <div className="detail-grid">
            <div className="detail-item"><span className="detail-label">FIR ID</span><span className="detail-value mono">#{selected.fir_id}</span></div>
            <div className="detail-item"><span className="detail-label">Date</span><span className="detail-value">{selected.date ? new Date(selected.date).toLocaleDateString() : '—'}</span></div>
            <div className="detail-item"><span className="detail-label">Time</span><span className="detail-value">{selected.time || '—'}</span></div>
            <div className="detail-item"><span className="detail-label">Officer</span><span className="detail-value">{selected.badge_no ? `${selected.rank_1} (${selected.badge_no})` : '—'}</span></div>
            <div className="detail-item"><span className="detail-label">Station</span><span className="detail-value">{selected.station_name || '—'}</span></div>
            <div className="detail-item"><span className="detail-label">Criminals</span><span className="detail-value">{selected.criminal_names || '—'}</span></div>
            <div className="detail-item full"><span className="detail-label">Description</span><span className="detail-value">{selected.description}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FIRs;

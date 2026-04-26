import { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from '../components/Modal';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineEye } from 'react-icons/hi';

const Criminals = () => {
  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
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

  const openAdd = () => {
    setSelected(null);
    resetForm();
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', gender: 'Male', address: '', remarks: '' });
    setSelected(null);
  };

  const filtered = criminals.filter(c =>
    `${c.name} ${c.address || ''} ${c.remarks || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading criminals...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Criminal Records</h1>
          <p className="page-subtitle">Manage criminal profiles and information</p>
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
            placeholder="Search by name, address, or remarks..."
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
              <th>Name</th>
              <th>Gender</th>
              <th>Address</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="empty-row">No criminal records found</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.criminal_id}>
                  <td className="id-cell">#{c.criminal_id}</td>
                  <td className="name-cell">
                    <div className="name-avatar">{c.name?.charAt(0)}</div>
                    <span>{c.name}</span>
                  </td>
                  <td>{c.gender}</td>
                  <td>{c.address || '—'}</td>
                  <td><span className="badge badge-warning">{c.remarks || '—'}</span></td>
                  <td className="actions-cell">
                    <button className="icon-btn view" title="View" onClick={() => { setSelected(c); setViewModal(true); }}><HiOutlineEye /></button>
                    <button className="icon-btn edit" title="Edit" onClick={() => openEdit(c)}><HiOutlinePencil /></button>
                    <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(c.criminal_id)}><HiOutlineTrash /></button>
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
            <label>Remarks</label>
            <textarea value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} rows="2"></textarea>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{selected ? 'Update' : 'Add'} Criminal</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Criminal Details">
        {selected && (
          <div className="detail-grid">
            <div className="detail-item"><span className="detail-label">ID</span><span className="detail-value mono">#{selected.criminal_id}</span></div>
            <div className="detail-item"><span className="detail-label">Name</span><span className="detail-value">{selected.name}</span></div>
            <div className="detail-item"><span className="detail-label">Gender</span><span className="detail-value">{selected.gender}</span></div>
            <div className="detail-item"><span className="detail-label">Address</span><span className="detail-value">{selected.address || '—'}</span></div>
            <div className="detail-item full"><span className="detail-label">Remarks</span><span className="detail-value">{selected.remarks || '—'}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Criminals;

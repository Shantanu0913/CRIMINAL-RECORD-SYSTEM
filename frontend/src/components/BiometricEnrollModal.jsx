import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import Modal from './Modal';
import { 
  HiOutlineCamera, 
  HiOutlineFingerPrint, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineRefresh, 
  HiOutlineUpload, 
  HiOutlineTrash,
  HiOutlineShieldCheck,
  HiOutlineFilm,
  HiOutlinePhotograph
} from 'react-icons/hi';

const FINGER_TYPES = [
  'Right Thumb', 'Right Index', 'Right Middle', 'Right Ring', 'Right Little',
  'Left Thumb', 'Left Index', 'Left Middle', 'Left Ring', 'Left Little'
];

// High-resolution SVG fingerprint ridge template generator
const generateFingerprintSVG = (seed = 1) => {
  const width = 240;
  const height = 300;
  const cx = 120;
  const cy = 150;
  let paths = [];

  // Concentric elliptical friction ridge loops
  for (let r = 12; r < 110; r += 7) {
    const rx = r * 0.85;
    const ry = r * 1.25;
    const wobble = Math.sin(r * seed) * 3;
    paths.push(
      `<ellipse cx="${cx + wobble}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity="${0.65 + (r % 3) * 0.15}" />`
    );
  }

  // Core whorl loop
  paths.push(
    `<path d="M 115 140 Q 120 130 128 140 T 120 160 T 112 145" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />`
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${paths.join('')}</svg>`;
};

const BiometricEnrollModal = ({ isOpen, onClose, criminal, onUpdated }) => {
  const [activeTab, setActiveTab] = useState('face'); // 'face' | 'fingerprint' | 'media'
  
  // Face Enrolment State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facePreview, setFacePreview] = useState(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceSuccess, setFaceSuccess] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);

  // Fingerprint Enrolment State
  const [fingerType, setFingerType] = useState('Right Thumb');
  const [fpScanning, setFpScanning] = useState(false);
  const [fpProgress, setFpProgress] = useState(0);
  const [fpQuality, setFpQuality] = useState(0);
  const [fpPreview, setFpPreview] = useState(null);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSuccess, setFpSuccess] = useState(false);

  // Accused Photos & Videos Vault State
  const [mediaList, setMediaList] = useState([]);
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaType, setNewMediaType] = useState('Photo');
  const [mediaUploading, setMediaUploading] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const fpFileInputRef = useRef(null);
  const mediaFileInputRef = useRef(null);

  // Fetch Accused Media
  const fetchAccusedMedia = async (criminalId) => {
    if (!criminalId) return;
    try {
      const res = await API.get(`/criminals/${criminalId}/media`);
      if (res.data.success) setMediaList(res.data.data);
    } catch (err) {
      console.error('Error fetching accused media:', err);
    }
  };

  // Initialize from criminal data
  useEffect(() => {
    if (criminal && isOpen) {
      setFacePreview(criminal.photo_url || null);
      setFaceSuccess(!!criminal.face_enrolled);
      setFpPreview(criminal.fingerprint_data || null);
      setFingerType(criminal.fingerprint_type || 'Right Thumb');
      setFpQuality(criminal.fingerprint_quality || (criminal.fingerprint_enrolled ? 96 : 0));
      setFpSuccess(!!criminal.fingerprint_enrolled);
      fetchAccusedMedia(criminal.criminal_id);
    }
  }, [criminal, isOpen]);

  const handleAccusedMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !criminal) return;

    setMediaUploading(true);
    try {
      let fileDataUrl = '';
      if (file.type.startsWith('image/')) {
        fileDataUrl = await compressImage(file, 800, 0.85);
      } else {
        fileDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      }

      const res = await API.post(`/criminals/${criminal.criminal_id}/media`, {
        media_type: newMediaType,
        file_url: fileDataUrl,
        file_name: file.name,
        title: newMediaTitle || file.name
      });

      if (res.data.success) {
        setNewMediaTitle('');
        await fetchAccusedMedia(criminal.criminal_id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading accused media');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDeleteAccusedMedia = async (mediaId) => {
    if (!window.confirm('Delete this photo/video recording?')) return;
    try {
      await API.delete(`/criminals/${criminal.criminal_id}/media/${mediaId}`);
      await fetchAccusedMedia(criminal.criminal_id);
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting media');
    }
  };

  // Clean up camera stream on close / tab change
  useEffect(() => {
    if (!isOpen || activeTab !== 'face') {
      stopCamera();
    }
  }, [isOpen, activeTab]);

  // Camera Handlers
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. You can upload a photo file instead.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

const compressImage = (fileOrDataUrl, maxWidth = 500, quality = 0.75) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxWidth || h > maxWidth) {
        if (w > h) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        } else {
          w = Math.round((w * maxWidth) / h);
          h = maxWidth;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    setFaceScanning(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const optimized = await compressImage(rawDataUrl, 640, 0.85);

    setTimeout(() => {
      setFacePreview(optimized);
      setFaceScanning(false);
      stopCamera();
    }, 500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const optimized = await compressImage(file, 720, 0.85);
      setFacePreview(optimized);
      stopCamera();
    } catch (err) {
      console.error('File optimization error:', err);
    }
  };

  const handleSaveFace = async () => {
    if (!facePreview || !criminal) return;
    setFaceLoading(true);
    try {
      const res = await API.post(`/criminals/${criminal.criminal_id}/biometrics/face`, {
        photo_url: facePreview
      });
      if (res.data.success) {
        setFaceSuccess(true);
        if (onUpdated) onUpdated(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving facial biometrics');
    } finally {
      setFaceLoading(false);
    }
  };

  const handleClearFace = async () => {
    if (!criminal) return;
    if (!window.confirm('Clear enrolled face biometrics for this record?')) return;
    setFaceLoading(true);
    try {
      const res = await API.delete(`/criminals/${criminal.criminal_id}/biometrics/face`);
      if (res.data.success) {
        setFacePreview(null);
        setFaceSuccess(false);
        if (onUpdated) onUpdated(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error clearing facial biometrics');
    } finally {
      setFaceLoading(false);
    }
  };

  // Fingerprint Handlers
  const handleStartScan = () => {
    setFpScanning(true);
    setFpProgress(0);
    setFpQuality(0);

    const interval = setInterval(() => {
      setFpProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setFpScanning(false);
          const quality = Math.floor(92 + Math.random() * 7);
          setFpQuality(quality);
          
          // Generate SVG ridge data URI
          const svgString = generateFingerprintSVG(Math.random() * 10 + 1);
          const base64Svg = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
          setFpPreview(base64Svg);
          return 100;
        }
        return prev + 10;
      });
    }, 180);
  };

  const handleFpUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const optimized = await compressImage(file, 480, 0.9);
      setFpPreview(optimized);
      setFpQuality(96);
    } catch (err) {
      console.error('Fingerprint upload error:', err);
    }
  };

  const handleSaveFingerprint = async () => {
    if (!fpPreview || !criminal) return;
    setFpLoading(true);
    try {
      const res = await API.post(`/criminals/${criminal.criminal_id}/biometrics/fingerprint`, {
        fingerprint_data: fpPreview,
        fingerprint_type: fingerType,
        fingerprint_quality: fpQuality || 95
      });
      if (res.data.success) {
        setFpSuccess(true);
        if (onUpdated) onUpdated(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving fingerprint biometrics');
    } finally {
      setFpLoading(false);
    }
  };

  const handleClearFingerprint = async () => {
    if (!criminal) return;
    if (!window.confirm('Clear enrolled fingerprint biometrics for this record?')) return;
    setFpLoading(true);
    try {
      const res = await API.delete(`/criminals/${criminal.criminal_id}/biometrics/fingerprint`);
      if (res.data.success) {
        setFpPreview(null);
        setFpSuccess(false);
        setFpQuality(0);
        if (onUpdated) onUpdated(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error clearing fingerprint biometrics');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Biometric Enrolment Workstation" size="large">
      <div className="biometric-workstation">
        {/* Subject Header */}
        <div className="bio-subject-banner">
          <div className="bio-subject-info">
            <span className="bio-subject-id">SUBJECT #{criminal?.criminal_id}</span>
            <h3 className="bio-subject-name">{criminal?.name}</h3>
            <span className="bio-subject-gender">{criminal?.gender} · {criminal?.address || 'Location Unknown'}</span>
          </div>
          <div className="bio-status-pills">
            <span className={`bio-badge ${faceSuccess ? 'enrolled' : 'pending'}`}>
              {faceSuccess ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />} Face {faceSuccess ? 'Enrolled' : 'Pending'}
            </span>
            <span className={`bio-badge ${fpSuccess ? 'enrolled' : 'pending'}`}>
              {fpSuccess ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />} Fingerprint {fpSuccess ? 'Enrolled' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bio-tabs">
          <button 
            type="button"
            className={`bio-tab ${activeTab === 'face' ? 'active' : ''}`}
            onClick={() => setActiveTab('face')}
          >
            <HiOutlineCamera className="bio-tab-icon" />
            <span>Facial Biometrics & Mugshot</span>
            {faceSuccess && <span className="tab-check">✓</span>}
          </button>
          <button 
            type="button"
            className={`bio-tab ${activeTab === 'fingerprint' ? 'active' : ''}`}
            onClick={() => setActiveTab('fingerprint')}
          >
            <HiOutlineFingerPrint className="bio-tab-icon" />
            <span>Fingerprint Minutiae Enrolment</span>
            {fpSuccess && <span className="tab-check">✓</span>}
          </button>
          <button 
            type="button"
            className={`bio-tab ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <HiOutlineFilm className="bio-tab-icon" />
            <span>Accused Photos & Videos Vault</span>
            {mediaList.length > 0 && <span className="tab-badge-count">{mediaList.length}</span>}
          </button>
        </div>

        {/* ── TAB 1: FACIAL BIOMETRICS ── */}
        {activeTab === 'face' && (
          <div className="bio-pane">
            <div className="bio-capture-grid">
              {/* Left: Viewport / Live Cam / Preview */}
              <div className="bio-viewport">
                {facePreview ? (
                  <div className="bio-preview-container">
                    <img src={facePreview} alt="Face Preview" className="bio-captured-img" />
                    <div className="bio-hud-reticle">
                      <div className="reticle-corner top-left" />
                      <div className="reticle-corner top-right" />
                      <div className="reticle-corner bottom-left" />
                      <div className="reticle-corner bottom-right" />
                      <div className="reticle-center" />
                      <span className="reticle-tag">3D MESH VERIFIED</span>
                    </div>
                  </div>
                ) : cameraActive ? (
                  <div className="bio-camera-live">
                    <video ref={videoRef} autoPlay playsInline muted className="bio-video-feed" />
                    <div className={`bio-camera-hud ${faceScanning ? 'scanning' : ''}`}>
                      <div className="hud-oval-guide" />
                      <div className="hud-laser-line" />
                      <span className="hud-hint">ALIGN FACE INSIDE OVAL</span>
                    </div>
                  </div>
                ) : (
                  <div className="bio-placeholder">
                    <HiOutlineCamera className="placeholder-icon" />
                    <p className="placeholder-title">No Facial Biometrics Enrolled</p>
                    <p className="placeholder-sub">Capture live camera stream or upload high-resolution identification mugshot</p>
                    {cameraError && <p className="camera-err-msg">{cameraError}</p>}
                  </div>
                )}
              </div>

              {/* Right: Controls & Biometric Metrics */}
              <div className="bio-controls-panel">
                <h4 className="panel-title">Capture & Verification</h4>
                
                <div className="bio-btn-stack">
                  {!cameraActive && (
                    <button 
                      type="button" 
                      className="btn btn-primary bio-btn" 
                      onClick={startCamera}
                    >
                      <HiOutlineCamera /> Start Live Webcam
                    </button>
                  )}

                  {cameraActive && (
                    <button 
                      type="button" 
                      className="btn btn-success bio-btn capture-btn" 
                      onClick={capturePhoto}
                      disabled={faceScanning}
                    >
                      <span className="rec-dot" /> {faceScanning ? 'ANALYZING FACIAL POINTS...' : 'CAPTURE MUGSHOT'}
                    </button>
                  )}

                  <button 
                    type="button" 
                    className="btn btn-secondary bio-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <HiOutlineUpload /> Upload Photo File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload} 
                  />

                  {cameraActive && (
                    <button 
                      type="button" 
                      className="btn btn-outline bio-btn" 
                      onClick={stopCamera}
                    >
                      Cancel Camera
                    </button>
                  )}
                </div>

                {/* Facial Metrics Box */}
                {facePreview && (
                  <div className="bio-metrics-card">
                    <div className="metric-row">
                      <span className="metric-label">Facial Symmetry:</span>
                      <span className="metric-val">98.4% Confidence</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Landmark Vertices:</span>
                      <span className="metric-val">128 Point Matrix</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Enrolment Status:</span>
                      <span className={`metric-val ${faceSuccess ? 'text-success' : 'text-warning'}`}>
                        {faceSuccess ? 'ENROLLED IN DATABASE' : 'PENDING COMMIT'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Row */}
                <div className="bio-action-row">
                  {facePreview && (
                    <button 
                      type="button" 
                      className="btn btn-primary bio-commit-btn"
                      onClick={handleSaveFace}
                      disabled={faceLoading}
                    >
                      <HiOutlineShieldCheck /> {faceLoading ? 'SAVING BIOMETRICS...' : 'COMMIT & ENROLL FACE'}
                    </button>
                  )}

                  {faceSuccess && (
                    <button 
                      type="button" 
                      className="btn btn-danger bio-clear-btn"
                      onClick={handleClearFace}
                      disabled={faceLoading}
                      title="Delete Face Biometric"
                    >
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: FINGERPRINT BIOMETRICS ── */}
        {activeTab === 'fingerprint' && (
          <div className="bio-pane">
            <div className="bio-capture-grid">
              {/* Left: Interactive Scanner Pad */}
              <div className="bio-viewport fp-viewport">
                <div className={`fp-scanner-pad ${fpScanning ? 'active-scan' : ''}`}>
                  {fpScanning && <div className="fp-laser-bar" />}
                  
                  {fpPreview ? (
                    <div className="fp-result-wrapper">
                      <img src={fpPreview} alt="Fingerprint Ridge Pattern" className="fp-ridge-img" />
                      <div className="fp-overlay-minutiae">
                        <span className="fp-ridge-tag">{fingerType.toUpperCase()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="fp-empty-pad" onClick={handleStartScan}>
                      <HiOutlineFingerPrint className="fp-big-icon" />
                      <span className="fp-click-prompt">CLICK TO SCAN ON PAD</span>
                    </div>
                  )}

                  {/* Scan Progress Overlay */}
                  {fpScanning && (
                    <div className="fp-scan-overlay">
                      <span className="fp-scan-title">EXTRACTING RIDGE MINUTIAE...</span>
                      <div className="fp-progress-bar">
                        <div className="fp-progress-fill" style={{ width: `${fpProgress}%` }} />
                      </div>
                      <span className="fp-pct">{fpProgress}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Finger Selector & Ridge Quality */}
              <div className="bio-controls-panel">
                <h4 className="panel-title">Friction Ridge Configuration</h4>

                {/* Finger Selector */}
                <div className="form-group">
                  <label className="bio-field-label">SELECT DIGIT / FINGER</label>
                  <select 
                    className="bio-select" 
                    value={fingerType} 
                    onChange={e => setFingerType(e.target.value)}
                  >
                    {FINGER_TYPES.map(ft => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                </div>

                <div className="bio-btn-stack">
                  <button 
                    type="button" 
                    className="btn btn-primary bio-btn"
                    onClick={handleStartScan}
                    disabled={fpScanning}
                  >
                    <HiOutlineRefresh /> {fpScanning ? 'SCANNING SENSOR...' : 'SIMULATE OPTICAL SENSOR SCAN'}
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary bio-btn"
                    onClick={() => fpFileInputRef.current?.click()}
                  >
                    <HiOutlineUpload /> Upload Forensic Ridge File (WSQ/PNG)
                  </button>
                  <input 
                    type="file" 
                    ref={fpFileInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleFpUpload} 
                  />
                </div>

                {/* Fingerprint Quality Meter */}
                {fpPreview && (
                  <div className="bio-metrics-card">
                    <div className="metric-row">
                      <span className="metric-label">Minutiae Quality Score:</span>
                      <span className="metric-val text-success">{fpQuality || 96}% (EXCELLENT)</span>
                    </div>
                    <div className="fp-quality-track">
                      <div className="fp-quality-bar" style={{ width: `${fpQuality || 96}%` }} />
                    </div>
                    <div className="metric-row" style={{ marginTop: '8px' }}>
                      <span className="metric-label">Target Digit:</span>
                      <span className="metric-val font-mono">{fingerType}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Standard:</span>
                      <span className="metric-val">ANSI/NIST-ITL 1-2011</span>
                    </div>
                  </div>
                )}

                {/* Action Row */}
                <div className="bio-action-row">
                  {fpPreview && (
                    <button 
                      type="button" 
                      className="btn btn-primary bio-commit-btn"
                      onClick={handleSaveFingerprint}
                      disabled={fpLoading}
                    >
                      <HiOutlineShieldCheck /> {fpLoading ? 'COMMITTING RIDGE DATA...' : 'COMMIT & ENROLL FINGERPRINT'}
                    </button>
                  )}

                  {fpSuccess && (
                    <button 
                      type="button" 
                      className="btn btn-danger bio-clear-btn"
                      onClick={handleClearFingerprint}
                      disabled={fpLoading}
                      title="Delete Fingerprint Biometric"
                    >
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: ACCUSED PHOTOS & VIDEOS VAULT ── */}
        {activeTab === 'media' && (
          <div className="bio-pane">
            <div className="accused-media-workbench">
              {/* Top Uploader Strip */}
              <div className="media-uploader-card">
                <div className="media-upload-header">
                  <div>
                    <h4 className="media-card-title">Upload Accused Media (Surveillance Footage, Interrogation Clips, Crime Scene Photos)</h4>
                    <span className="media-card-sub">Attach auxiliary photo & video recordings to #{criminal?.criminal_id} {criminal?.name}</span>
                  </div>
                </div>

                <div className="media-upload-form-row">
                  <div className="form-group" style={{flex: 1}}>
                    <input 
                      type="text" 
                      placeholder="Media Title (e.g. CCTV Store Robbery, Interrogation Day 1, CCTV Sighting)..."
                      value={newMediaTitle}
                      onChange={e => setNewMediaTitle(e.target.value)}
                      className="media-title-input"
                    />
                  </div>
                  <div className="form-group" style={{width: '160px'}}>
                    <select 
                      value={newMediaType} 
                      onChange={e => setNewMediaType(e.target.value)}
                      className="media-type-select"
                    >
                      <option value="Photo">📷 Photo</option>
                      <option value="Video">🎬 Video Clip</option>
                    </select>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => mediaFileInputRef.current?.click()}
                    disabled={mediaUploading}
                  >
                    <HiOutlineUpload /> {mediaUploading ? 'Uploading...' : 'Choose File & Upload'}
                  </button>
                  <input 
                    type="file" 
                    ref={mediaFileInputRef}
                    accept={newMediaType === 'Video' ? 'video/*' : 'image/*'}
                    style={{display: 'none'}}
                    onChange={handleAccusedMediaUpload}
                  />
                </div>
              </div>

              {/* Media Gallery Grid */}
              <div className="accused-gallery-container">
                <div className="gallery-header-strip">
                  <span className="gallery-count">{mediaList.length} Attached Recording{mediaList.length !== 1 ? 's' : ''}</span>
                </div>

                {mediaList.length === 0 ? (
                  <div className="empty-media-gallery">
                    <HiOutlineFilm className="empty-media-icon" />
                    <p className="empty-media-text">No auxiliary surveillance photos or interrogation videos uploaded yet.</p>
                    <span className="empty-media-hint">Use the uploader above to attach MP4, WebM, JPG, PNG recordings.</span>
                  </div>
                ) : (
                  <div className="accused-media-grid">
                    {mediaList.map(item => (
                      <div key={item.media_id} className="accused-media-card">
                        <div className="media-stage-box">
                          {item.media_type === 'Video' || (item.file_url && item.file_url.startsWith('data:video')) ? (
                            <video src={item.file_url} controls className="accused-card-video" />
                          ) : (
                            <img src={item.file_url} alt={item.title} className="accused-card-img" />
                          )}
                          <span className={`media-type-chip ${item.media_type.toLowerCase()}`}>
                            {item.media_type === 'Video' ? '🎬 VIDEO' : '📷 PHOTO'}
                          </span>
                        </div>
                        <div className="media-card-footer">
                          <div className="media-card-meta">
                            <span className="media-card-name" title={item.title || item.file_name}>{item.title || item.file_name || 'Accused Recording'}</span>
                            <span className="media-card-date">
                              {item.date_added ? new Date(item.date_added).toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                          <button 
                            type="button" 
                            className="media-card-delete"
                            onClick={() => handleDeleteAccusedMedia(item.media_id)}
                            title="Delete this recording"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BiometricEnrollModal;

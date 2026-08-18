const pool = require('../config/db');

const CriminalModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM Criminal ORDER BY criminal_id DESC');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM Criminal WHERE criminal_id = ?', [id]);
    return rows[0];
  },

  async create(data) {
    const { name, gender, address, remarks } = data;
    const [result] = await pool.query(
      'INSERT INTO Criminal (name, gender, address, remarks) VALUES (?, ?, ?, ?)',
      [name, gender, address, remarks]
    );
    return { criminal_id: result.insertId, ...data };
  },

  async update(id, data) {
    const { name, gender, address, remarks, photo_url, fingerprint_data, fingerprint_type, fingerprint_quality } = data;
    await pool.query(
      `UPDATE Criminal SET 
        name = COALESCE(?, name), 
        gender = COALESCE(?, gender), 
        address = COALESCE(?, address), 
        remarks = COALESCE(?, remarks),
        photo_url = COALESCE(?, photo_url),
        fingerprint_data = COALESCE(?, fingerprint_data),
        fingerprint_type = COALESCE(?, fingerprint_type),
        fingerprint_quality = COALESCE(?, fingerprint_quality)
       WHERE criminal_id = ?`,
      [name, gender, address, remarks, photo_url, fingerprint_data, fingerprint_type, fingerprint_quality, id]
    );
    return this.getById(id);
  },

  async enrollFace(id, { photo_url }) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const fpEnrolled = !!existing.fingerprint_enrolled;
    const newStatus = fpEnrolled ? 'Enrolled' : 'Partial';

    await pool.query(
      `UPDATE Criminal SET 
        photo_url = ?, 
        face_enrolled = TRUE, 
        face_enrolled_at = NOW(),
        biometric_status = ?
       WHERE criminal_id = ?`,
      [photo_url, newStatus, id]
    );
    return this.getById(id);
  },

  async enrollFingerprint(id, { fingerprint_data, fingerprint_type = 'Right Thumb', fingerprint_quality = 95 }) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const faceEnrolled = !!existing.face_enrolled;
    const newStatus = faceEnrolled ? 'Enrolled' : 'Partial';

    await pool.query(
      `UPDATE Criminal SET 
        fingerprint_data = ?, 
        fingerprint_type = ?,
        fingerprint_quality = ?,
        fingerprint_enrolled = TRUE, 
        fingerprint_enrolled_at = NOW(),
        biometric_status = ?
       WHERE criminal_id = ?`,
      [fingerprint_data, fingerprint_type, fingerprint_quality, newStatus, id]
    );
    return this.getById(id);
  },

  async deleteBiometric(id, type) {
    const existing = await this.getById(id);
    if (!existing) return null;

    if (type === 'face') {
      const fpEnrolled = !!existing.fingerprint_enrolled;
      const newStatus = fpEnrolled ? 'Partial' : 'Pending';
      await pool.query(
        `UPDATE Criminal SET 
          photo_url = NULL, 
          face_enrolled = FALSE, 
          face_enrolled_at = NULL,
          biometric_status = ?
         WHERE criminal_id = ?`,
        [newStatus, id]
      );
    } else if (type === 'fingerprint') {
      const faceEnrolled = !!existing.face_enrolled;
      const newStatus = faceEnrolled ? 'Partial' : 'Pending';
      await pool.query(
        `UPDATE Criminal SET 
          fingerprint_data = NULL, 
          fingerprint_type = 'Right Thumb',
          fingerprint_quality = 0,
          fingerprint_enrolled = FALSE, 
          fingerprint_enrolled_at = NULL,
          biometric_status = ?
         WHERE criminal_id = ?`,
        [newStatus, id]
      );
    }

    return this.getById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM Criminal WHERE criminal_id = ?', [id]);
    return { criminal_id: id };
  },

  async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM Criminal');
    return rows[0].count;
  },

  async getCountByStatus() {
    // Group by remarks as a proxy for categorization
    const [rows] = await pool.query(
      'SELECT remarks as status, COUNT(*) as count FROM Criminal GROUP BY remarks ORDER BY count DESC LIMIT 8'
    );
    return rows;
  }
};

module.exports = CriminalModel;

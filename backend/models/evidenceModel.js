const pool = require('../config/db');

const EvidenceModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT e.*,
             cf.case_type, cf.status AS case_status,
             cf.case_id AS linked_case_id
      FROM Evidence e
      LEFT JOIN Case_File cf ON e.case_id = cf.case_id
      ORDER BY e.evidence_id DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT e.*,
             cf.case_type, cf.status AS case_status
      FROM Evidence e
      LEFT JOIN Case_File cf ON e.case_id = cf.case_id
      WHERE e.evidence_id = ?
    `, [id]);
    return rows[0];
  },

  async create(data) {
    const { case_id, description, type, date_collected } = data;
    const [result] = await pool.query(
      'INSERT INTO Evidence (case_id, description, type, date_collected) VALUES (?, ?, ?, ?)',
      [case_id || null, description, type, date_collected || null]
    );
    return { evidence_id: result.insertId, ...data };
  },

  async update(id, data) {
    const { case_id, description, type, date_collected } = data;
    await pool.query(
      'UPDATE Evidence SET case_id = ?, description = ?, type = ?, date_collected = ? WHERE evidence_id = ?',
      [case_id || null, description, type, date_collected || null, id]
    );
  },

  async delete(id) {
    await pool.query('DELETE FROM Evidence WHERE evidence_id = ?', [id]);
  },

  async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM Evidence');
    return rows[0].count;
  },

  async getByCaseId(caseId) {
    const [rows] = await pool.query('SELECT * FROM Evidence WHERE case_id = ?', [caseId]);
    return rows;
  },

  async getAllCases() {
    const [rows] = await pool.query('SELECT case_id, case_type, status FROM Case_File ORDER BY case_id');
    return rows;
  }
};

module.exports = EvidenceModel;

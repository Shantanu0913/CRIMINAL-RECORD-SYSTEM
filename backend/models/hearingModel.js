const pool = require('../config/db');

const HearingModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT h.*, cf.case_type, cf.status AS case_status,
             ct.court_name, ct.judge_name
      FROM Hearing h
      LEFT JOIN Case_File cf ON h.case_id = cf.case_id
      LEFT JOIN Court ct ON cf.court_id = ct.court_id
      ORDER BY h.hearing_date DESC, h.hearing_time DESC
    `);
    return rows;
  },

  async getByCaseId(caseId) {
    const [rows] = await pool.query(`
      SELECT h.*, ct.court_name, ct.judge_name
      FROM Hearing h
      LEFT JOIN Case_File cf ON h.case_id = cf.case_id
      LEFT JOIN Court ct ON cf.court_id = ct.court_id
      WHERE h.case_id = ?
      ORDER BY h.hearing_date DESC
    `, [caseId]);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT h.*, cf.case_type, cf.status AS case_status,
             ct.court_name, ct.judge_name
      FROM Hearing h
      LEFT JOIN Case_File cf ON h.case_id = cf.case_id
      LEFT JOIN Court ct ON cf.court_id = ct.court_id
      WHERE h.hearing_id = ?
    `, [id]);
    return rows[0];
  },

  async create(data) {
    const { case_id, hearing_date, hearing_time, judge_remarks, next_date, status } = data;
    const [result] = await pool.query(
      'INSERT INTO Hearing (case_id, hearing_date, hearing_time, judge_remarks, next_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [case_id, hearing_date, hearing_time || null, judge_remarks || null, next_date || null, status || 'Scheduled']
    );
    return { hearing_id: result.insertId, ...data };
  },

  async update(id, data) {
    const { case_id, hearing_date, hearing_time, judge_remarks, next_date, status } = data;
    await pool.query(
      'UPDATE Hearing SET case_id=?, hearing_date=?, hearing_time=?, judge_remarks=?, next_date=?, status=? WHERE hearing_id=?',
      [case_id, hearing_date, hearing_time || null, judge_remarks || null, next_date || null, status || 'Scheduled', id]
    );
  },

  async delete(id) {
    await pool.query('DELETE FROM Hearing WHERE hearing_id = ?', [id]);
  }
};

module.exports = HearingModel;

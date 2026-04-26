const pool = require('../config/db');

const CaseFileModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT cf.*,
             f.description as fir_description,
             ct.court_name, ct.judge_name, ct.location as court_location
      FROM Case_File cf
      LEFT JOIN FIR f ON cf.fir_id = f.fir_id
      LEFT JOIN Court ct ON cf.court_id = ct.court_id
      ORDER BY cf.case_id DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT cf.*,
             f.description as fir_description,
             ct.court_name, ct.judge_name, ct.location as court_location
      FROM Case_File cf
      LEFT JOIN FIR f ON cf.fir_id = f.fir_id
      LEFT JOIN Court ct ON cf.court_id = ct.court_id
      WHERE cf.case_id = ?
    `, [id]);
    return rows[0];
  },

  async create(data) {
    const { fir_id, court_id, case_type, start_date, end_date, status } = data;
    const [result] = await pool.query(
      'INSERT INTO Case_File (fir_id, court_id, case_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [fir_id || null, court_id || null, case_type, start_date || null, end_date || null, status || 'Pending']
    );
    return { case_id: result.insertId, ...data };
  },

  async update(id, data) {
    const { fir_id, court_id, case_type, start_date, end_date, status } = data;
    await pool.query(
      'UPDATE Case_File SET fir_id=?, court_id=?, case_type=?, start_date=?, end_date=?, status=? WHERE case_id=?',
      [fir_id || null, court_id || null, case_type, start_date || null, end_date || null, status, id]
    );
    return { case_id: id, ...data };
  },

  async delete(id) {
    await pool.query('DELETE FROM Case_File WHERE case_id = ?', [id]);
    return { case_id: id };
  },

  async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM Case_File');
    return rows[0].count;
  },

  async getCountByStatus() {
    const [rows] = await pool.query('SELECT status, COUNT(*) as count FROM Case_File GROUP BY status');
    return rows;
  }
};

module.exports = CaseFileModel;

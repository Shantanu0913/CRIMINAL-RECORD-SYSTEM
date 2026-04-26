const pool = require('../config/db');

const FIRModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT f.*,
             p.badge_no, p.rank_1,
             ps.name as station_name,
             GROUP_CONCAT(c.name SEPARATOR ', ') as criminal_names
      FROM FIR f
      LEFT JOIN Police_Officer p ON f.officer_id = p.officer_id
      LEFT JOIN Police_Station ps ON f.station_id = ps.station_id
      LEFT JOIN FIR_Criminal fc ON f.fir_id = fc.fir_id
      LEFT JOIN Criminal c ON fc.criminal_id = c.criminal_id
      GROUP BY f.fir_id
      ORDER BY f.fir_id DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT f.*,
             p.badge_no, p.rank_1,
             ps.name as station_name
      FROM FIR f
      LEFT JOIN Police_Officer p ON f.officer_id = p.officer_id
      LEFT JOIN Police_Station ps ON f.station_id = ps.station_id
      WHERE f.fir_id = ?
    `, [id]);
    if (!rows[0]) return null;
    // Get linked criminals
    const [criminals] = await pool.query(`
      SELECT c.* FROM Criminal c
      JOIN FIR_Criminal fc ON c.criminal_id = fc.criminal_id
      WHERE fc.fir_id = ?
    `, [id]);
    rows[0].criminals = criminals;
    return rows[0];
  },

  async create(data) {
    const { date, time, description, officer_id, station_id, criminal_ids } = data;
    const [result] = await pool.query(
      'INSERT INTO FIR (date, time, description, officer_id, station_id) VALUES (?, ?, ?, ?, ?)',
      [date, time || null, description, officer_id || null, station_id || null]
    );
    // Link criminals
    if (criminal_ids && criminal_ids.length > 0) {
      const values = criminal_ids.map(cid => [result.insertId, cid]);
      await pool.query('INSERT INTO FIR_Criminal (fir_id, criminal_id) VALUES ?', [values]);
    }
    return { fir_id: result.insertId, ...data };
  },

  async update(id, data) {
    const { date, time, description, officer_id, station_id, criminal_ids } = data;
    await pool.query(
      'UPDATE FIR SET date=?, time=?, description=?, officer_id=?, station_id=? WHERE fir_id=?',
      [date, time || null, description, officer_id || null, station_id || null, id]
    );
    // Re-link criminals
    if (criminal_ids !== undefined) {
      await pool.query('DELETE FROM FIR_Criminal WHERE fir_id = ?', [id]);
      if (criminal_ids && criminal_ids.length > 0) {
        const values = criminal_ids.map(cid => [id, cid]);
        await pool.query('INSERT INTO FIR_Criminal (fir_id, criminal_id) VALUES ?', [values]);
      }
    }
    return { fir_id: id, ...data };
  },

  async delete(id) {
    await pool.query('DELETE FROM FIR_Criminal WHERE fir_id = ?', [id]);
    await pool.query('DELETE FROM FIR WHERE fir_id = ?', [id]);
    return { fir_id: id };
  },

  async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM FIR');
    return rows[0].count;
  },

  async getCountByStatus() {
    // Group FIRs by station
    const [rows] = await pool.query(`
      SELECT ps.name as status, COUNT(*) as count
      FROM FIR f
      LEFT JOIN Police_Station ps ON f.station_id = ps.station_id
      GROUP BY ps.name
    `);
    return rows;
  }
};

module.exports = FIRModel;

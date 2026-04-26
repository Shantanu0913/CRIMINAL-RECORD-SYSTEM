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
    const { name, gender, address, remarks } = data;
    await pool.query(
      'UPDATE Criminal SET name=?, gender=?, address=?, remarks=? WHERE criminal_id=?',
      [name, gender, address, remarks, id]
    );
    return { criminal_id: id, ...data };
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

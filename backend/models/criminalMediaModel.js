const pool = require('../config/db');

const CriminalMediaModel = {
  async getByCriminalId(criminalId) {
    const [rows] = await pool.query(
      'SELECT * FROM Criminal_Media WHERE criminal_id = ? ORDER BY media_id DESC',
      [criminalId]
    );
    return rows;
  },

  async getById(mediaId) {
    const [rows] = await pool.query(
      'SELECT * FROM Criminal_Media WHERE media_id = ?',
      [mediaId]
    );
    return rows[0];
  },

  async create(data) {
    const { criminal_id, media_type = 'Photo', file_url, file_name, title } = data;
    const [result] = await pool.query(
      'INSERT INTO Criminal_Media (criminal_id, media_type, file_url, file_name, title, date_added) VALUES (?, ?, ?, ?, ?, NOW())',
      [criminal_id, media_type, file_url, file_name || null, title || 'Accused Media']
    );
    return { media_id: result.insertId, ...data };
  },

  async delete(mediaId) {
    await pool.query('DELETE FROM Criminal_Media WHERE media_id = ?', [mediaId]);
    return { media_id: mediaId };
  }
};

module.exports = CriminalMediaModel;

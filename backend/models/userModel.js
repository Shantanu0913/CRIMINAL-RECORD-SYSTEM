const pool = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT user_id, name, email, phone FROM Users WHERE user_id = ?', [id]);
    return rows[0];
  },

  async getRole(userId) {
    // Check if user is admin
    const [admin] = await pool.query('SELECT * FROM Admin WHERE user_id = ?', [userId]);
    if (admin.length > 0) return 'Admin';
    // Check if user is police officer
    const [officer] = await pool.query('SELECT * FROM Police_Officer WHERE user_id = ?', [userId]);
    if (officer.length > 0) return 'Police Officer';
    // Check if user is court clerk
    const [clerk] = await pool.query('SELECT * FROM Court_Clerk WHERE user_id = ?', [userId]);
    if (clerk.length > 0) return 'Court Clerk';
    return 'User';
  },

  async getAll() {
    const [rows] = await pool.query('SELECT user_id, name, email, phone FROM Users');
    return rows;
  }
};

module.exports = UserModel;

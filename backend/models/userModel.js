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

  async getRole(userId, requestedRole = null) {
    if (requestedRole) {
      const normalized = requestedRole.toLowerCase().trim();
      if (normalized === 'admin') {
        const [admin] = await pool.query('SELECT * FROM Admin WHERE user_id = ?', [userId]);
        return admin.length > 0 ? 'Admin' : null;
      } else if (normalized === 'police officer' || normalized === 'officer' || normalized === 'police') {
        const [officer] = await pool.query('SELECT * FROM Police_Officer WHERE user_id = ?', [userId]);
        return officer.length > 0 ? 'Police Officer' : null;
      } else if (normalized === 'court clerk' || normalized === 'court_clerk' || normalized === 'clerk') {
        const [clerk] = await pool.query('SELECT * FROM Court_Clerk WHERE user_id = ?', [userId]);
        return clerk.length > 0 ? 'Court Clerk' : null;
      }
    }

    // Default hierarchy if no specific role was requested
    const [admin] = await pool.query('SELECT * FROM Admin WHERE user_id = ?', [userId]);
    if (admin.length > 0) return 'Admin';
    const [officer] = await pool.query('SELECT * FROM Police_Officer WHERE user_id = ?', [userId]);
    if (officer.length > 0) return 'Police Officer';
    const [clerk] = await pool.query('SELECT * FROM Court_Clerk WHERE user_id = ?', [userId]);
    if (clerk.length > 0) return 'Court Clerk';
    return 'User';
  },

  async getAllUserRoles(userId) {
    const roles = [];
    const [admin] = await pool.query('SELECT * FROM Admin WHERE user_id = ?', [userId]);
    if (admin.length > 0) roles.push('Admin');
    const [officer] = await pool.query('SELECT * FROM Police_Officer WHERE user_id = ?', [userId]);
    if (officer.length > 0) roles.push('Police Officer');
    const [clerk] = await pool.query('SELECT * FROM Court_Clerk WHERE user_id = ?', [userId]);
    if (clerk.length > 0) roles.push('Court Clerk');
    return roles;
  },

  async getAll() {
    const [rows] = await pool.query('SELECT user_id, name, email, phone FROM Users');
    return rows;
  }
};

module.exports = UserModel;

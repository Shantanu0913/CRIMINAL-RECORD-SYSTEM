const pool = require('../config/db');

const userController = {
  // GET /api/users — list all users with their roles
  async getAllUsers(req, res) {
    try {
      const [rows] = await pool.query(`
        SELECT
          u.user_id, u.name, u.email, u.phone, u.password,
          CASE
            WHEN a.admin_id IS NOT NULL THEN 'Admin'
            WHEN po.officer_id IS NOT NULL THEN 'Police Officer'
            WHEN cc.clerk_id IS NOT NULL THEN 'Court Clerk'
            ELSE 'User'
          END AS role,
          po.badge_no, po.rank_1, po.station_id,
          ps.name AS station_name,
          cc.court_id,
          c.court_name,
          a.office
        FROM Users u
        LEFT JOIN Admin a ON u.user_id = a.user_id
        LEFT JOIN Police_Officer po ON u.user_id = po.user_id
        LEFT JOIN Police_Station ps ON po.station_id = ps.station_id
        LEFT JOIN Court_Clerk cc ON u.user_id = cc.user_id
        LEFT JOIN Court c ON cc.court_id = c.court_id
        ORDER BY u.user_id ASC
      `);
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error('getAllUsers error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // GET /api/users/stations — list stations for dropdowns
  async getStations(req, res) {
    try {
      const [rows] = await pool.query('SELECT station_id, name FROM Police_Station ORDER BY station_id');
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // GET /api/users/courts — list courts for dropdowns
  async getCourts(req, res) {
    try {
      const [rows] = await pool.query('SELECT court_id, court_name FROM Court ORDER BY court_id');
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // POST /api/users — create a new user with a role
  async createUser(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { name, email, phone, password, role, badge_no, rank_1, station_id, court_id, office } = req.body;

      if (!name || !email || !password || !role) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Name, email, password and role are required' });
      }

      // Insert into Users
      const [userResult] = await conn.query(
        'INSERT INTO Users (name, email, phone, password) VALUES (?, ?, ?, ?)',
        [name, email, phone || null, password]
      );
      const userId = userResult.insertId;

      // Insert into role table
      if (role === 'Admin') {
        await conn.query(
          'INSERT INTO Admin (user_id, office, contact) VALUES (?, ?, ?)',
          [userId, office || 'Head Office', phone || null]
        );
      } else if (role === 'Police Officer') {
        if (!station_id) { await conn.rollback(); return res.status(400).json({ success: false, message: 'Station is required for Police Officer' }); }
        await conn.query(
          'INSERT INTO Police_Officer (user_id, badge_no, rank_1, station_id) VALUES (?, ?, ?, ?)',
          [userId, badge_no || `OFF${userId}`, rank_1 || 'Constable', station_id]
        );
      } else if (role === 'Court Clerk') {
        if (!court_id) { await conn.rollback(); return res.status(400).json({ success: false, message: 'Court is required for Court Clerk' }); }
        await conn.query(
          'INSERT INTO Court_Clerk (user_id, court_id) VALUES (?, ?)',
          [userId, court_id]
        );
      }

      await conn.commit();
      res.status(201).json({ success: true, message: 'User created successfully', userId });
    } catch (err) {
      await conn.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
      console.error('createUser error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      conn.release();
    }
  },

  // PUT /api/users/:id — update user info & role
  async updateUser(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const userId = req.params.id;
      const { name, email, phone, password, role, badge_no, rank_1, station_id, court_id, office } = req.body;

      // Update Users table
      const updateFields = [];
      const updateVals = [];
      if (name)     { updateFields.push('name = ?');     updateVals.push(name); }
      if (email)    { updateFields.push('email = ?');    updateVals.push(email); }
      if (phone)    { updateFields.push('phone = ?');    updateVals.push(phone); }
      if (password) { updateFields.push('password = ?'); updateVals.push(password); }

      if (updateFields.length) {
        updateVals.push(userId);
        await conn.query(`UPDATE Users SET ${updateFields.join(', ')} WHERE user_id = ?`, updateVals);
      }

      // Remove old role assignments
      await conn.query('DELETE FROM Admin WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM Police_Officer WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM Court_Clerk WHERE user_id = ?', [userId]);

      // Insert new role
      if (role === 'Admin') {
        await conn.query('INSERT INTO Admin (user_id, office, contact) VALUES (?, ?, ?)', [userId, office || 'Head Office', phone || null]);
      } else if (role === 'Police Officer') {
        if (!station_id) { await conn.rollback(); return res.status(400).json({ success: false, message: 'Station is required for Police Officer' }); }
        await conn.query('INSERT INTO Police_Officer (user_id, badge_no, rank_1, station_id) VALUES (?, ?, ?, ?)', [userId, badge_no || `OFF${userId}`, rank_1 || 'Constable', station_id]);
      } else if (role === 'Court Clerk') {
        if (!court_id) { await conn.rollback(); return res.status(400).json({ success: false, message: 'Court is required for Court Clerk' }); }
        await conn.query('INSERT INTO Court_Clerk (user_id, court_id) VALUES (?, ?)', [userId, court_id]);
      }

      await conn.commit();
      res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
      await conn.rollback();
      console.error('updateUser error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      conn.release();
    }
  },

  // DELETE /api/users/:id — delete a user and their role entries
  async deleteUser(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const userId = req.params.id;

      await conn.query('DELETE FROM Admin WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM Police_Officer WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM Court_Clerk WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM Users WHERE user_id = ?', [userId]);

      await conn.commit();
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
      await conn.rollback();
      console.error('deleteUser error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      conn.release();
    }
  }
};

module.exports = userController;

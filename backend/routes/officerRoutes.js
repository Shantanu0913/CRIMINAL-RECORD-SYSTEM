const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/officers - List all officers
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT po.*, u.name as officer_name, u.phone, ps.name as station_name
      FROM Police_Officer po
      LEFT JOIN Users u ON po.user_id = u.user_id
      LEFT JOIN Police_Station ps ON po.station_id = ps.station_id
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching officers' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/stations
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Police_Station');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stations' });
  }
});

module.exports = router;

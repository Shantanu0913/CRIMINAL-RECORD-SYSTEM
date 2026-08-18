const FIRModel = require('../models/firModel');

const firController = {
  async getAll(req, res) {
    try {
      const firs = await FIRModel.getAll();
      res.json({ success: true, data: firs });
    } catch (error) {
      console.error('Error fetching FIRs:', error);
      res.status(500).json({ success: false, message: 'Error fetching FIRs' });
    }
  },

  async getById(req, res) {
    try {
      const fir = await FIRModel.getById(req.params.id);
      if (!fir) {
        return res.status(404).json({ success: false, message: 'FIR not found' });
      }
      res.json({ success: true, data: fir });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching FIR' });
    }
  },

  async create(req, res) {
    try {
      const { date, description } = req.body;
      if (!date || !description) {
        return res.status(400).json({ success: false, message: 'Date and description are required' });
      }
      const fir = await FIRModel.create(req.body);
      res.status(201).json({ success: true, message: 'FIR created successfully', data: fir });
    } catch (error) {
      console.error('Error creating FIR:', error);
      res.status(500).json({ success: false, message: 'Error creating FIR' });
    }
  },

  async update(req, res) {
    try {
      const existing = await FIRModel.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'FIR not found' });
      }
      const fir = await FIRModel.update(req.params.id, req.body);
      res.json({ success: true, message: 'FIR updated successfully', data: fir });
    } catch (error) {
      console.error('Error updating FIR:', error);
      res.status(500).json({ success: false, message: 'Error updating FIR' });
    }
  },

  async delete(req, res) {
    try {
      const existing = await FIRModel.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'FIR not found' });
      }
      await FIRModel.delete(req.params.id);
      res.json({ success: true, message: 'FIR deleted successfully' });
    } catch (error) {
      console.error('Error deleting FIR:', error);
      res.status(500).json({ success: false, message: 'Error deleting FIR' });
    }
  },

  async addEvidence(req, res) {
    try {
      const pool = require('../config/db');
      const { description, type = 'Photo', file_url, file_name, media_type } = req.body;
      const firId = req.params.id;

      const [result] = await pool.query(
        'INSERT INTO Evidence (fir_id, description, type, file_url, file_name, media_type, date_collected) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [firId, description || 'FIR Evidence', type, file_url || null, file_name || null, media_type || type || 'Photo']
      );

      res.status(201).json({
        success: true,
        message: 'Evidence attached to FIR successfully',
        data: { evidence_id: result.insertId, fir_id: firId, description, type, file_url, file_name, media_type }
      });
    } catch (error) {
      console.error('Error attaching evidence to FIR:', error);
      res.status(500).json({ success: false, message: 'Error attaching evidence to FIR' });
    }
  }
};

module.exports = firController;

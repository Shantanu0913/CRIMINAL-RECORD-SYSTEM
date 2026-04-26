const CriminalModel = require('../models/criminalModel');

const criminalController = {
  async getAll(req, res) {
    try {
      const criminals = await CriminalModel.getAll();
      res.json({ success: true, data: criminals });
    } catch (error) {
      console.error('Error fetching criminals:', error);
      res.status(500).json({ success: false, message: 'Error fetching criminals' });
    }
  },

  async getById(req, res) {
    try {
      const criminal = await CriminalModel.getById(req.params.id);
      if (!criminal) {
        return res.status(404).json({ success: false, message: 'Criminal not found' });
      }
      res.json({ success: true, data: criminal });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching criminal' });
    }
  },

  async create(req, res) {
    try {
      const { name, gender } = req.body;
      if (!name || !gender) {
        return res.status(400).json({ success: false, message: 'Name and gender are required' });
      }
      const criminal = await CriminalModel.create(req.body);
      res.status(201).json({ success: true, message: 'Criminal record created', data: criminal });
    } catch (error) {
      console.error('Error creating criminal:', error);
      res.status(500).json({ success: false, message: 'Error creating criminal record' });
    }
  },

  async update(req, res) {
    try {
      const existing = await CriminalModel.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Criminal not found' });
      }
      const criminal = await CriminalModel.update(req.params.id, req.body);
      res.json({ success: true, message: 'Criminal record updated', data: criminal });
    } catch (error) {
      console.error('Error updating criminal:', error);
      res.status(500).json({ success: false, message: 'Error updating criminal record' });
    }
  },

  async delete(req, res) {
    try {
      const existing = await CriminalModel.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Criminal not found' });
      }
      await CriminalModel.delete(req.params.id);
      res.json({ success: true, message: 'Criminal record deleted' });
    } catch (error) {
      console.error('Error deleting criminal:', error);
      res.status(500).json({ success: false, message: 'Error deleting criminal record' });
    }
  }
};

module.exports = criminalController;

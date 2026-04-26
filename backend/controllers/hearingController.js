const HearingModel = require('../models/hearingModel');

const hearingController = {
  async getAll(req, res) {
    try {
      const data = await HearingModel.getAll();
      res.json({ success: true, data });
    } catch (e) {
      console.error('getAll hearings error:', e);
      res.status(500).json({ success: false, message: 'Error fetching hearings' });
    }
  },

  async getByCaseId(req, res) {
    try {
      const data = await HearingModel.getByCaseId(req.params.caseId);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Error fetching hearings' });
    }
  },

  async getById(req, res) {
    try {
      const item = await HearingModel.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Hearing not found' });
      res.json({ success: true, data: item });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Error fetching hearing' });
    }
  },

  async create(req, res) {
    try {
      const { case_id, hearing_date } = req.body;
      if (!case_id || !hearing_date) {
        return res.status(400).json({ success: false, message: 'Case and hearing date are required' });
      }
      const item = await HearingModel.create(req.body);
      res.status(201).json({ success: true, message: 'Hearing scheduled successfully', data: item });
    } catch (e) {
      console.error('create hearing error:', e);
      res.status(500).json({ success: false, message: 'Error scheduling hearing' });
    }
  },

  async update(req, res) {
    try {
      const { case_id, hearing_date } = req.body;
      if (!case_id || !hearing_date) {
        return res.status(400).json({ success: false, message: 'Case and hearing date are required' });
      }
      await HearingModel.update(req.params.id, req.body);
      res.json({ success: true, message: 'Hearing updated successfully' });
    } catch (e) {
      console.error('update hearing error:', e);
      res.status(500).json({ success: false, message: 'Error updating hearing' });
    }
  },

  async remove(req, res) {
    try {
      await HearingModel.delete(req.params.id);
      res.json({ success: true, message: 'Hearing deleted successfully' });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Error deleting hearing' });
    }
  }
};

module.exports = hearingController;

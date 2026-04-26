const CaseFileModel = require('../models/caseFileModel');

const caseFileController = {
  async getAll(req, res) {
    try {
      const cases = await CaseFileModel.getAll();
      res.json({ success: true, data: cases });
    } catch (error) {
      console.error('Error fetching cases:', error);
      res.status(500).json({ success: false, message: 'Error fetching cases' });
    }
  },

  async getById(req, res) {
    try {
      const caseFile = await CaseFileModel.getById(req.params.id);
      if (!caseFile) {
        return res.status(404).json({ success: false, message: 'Case not found' });
      }
      res.json({ success: true, data: caseFile });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching case' });
    }
  },

  async create(req, res) {
    try {
      const { case_type } = req.body;
      if (!case_type) {
        return res.status(400).json({ success: false, message: 'Case type is required' });
      }
      const caseFile = await CaseFileModel.create(req.body);
      res.status(201).json({ success: true, message: 'Case created successfully', data: caseFile });
    } catch (error) {
      console.error('Error creating case:', error);
      res.status(500).json({ success: false, message: 'Error creating case' });
    }
  },

  async update(req, res) {
    try {
      const existing = await CaseFileModel.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Case not found' });
      }
      const caseFile = await CaseFileModel.update(req.params.id, req.body);
      res.json({ success: true, message: 'Case updated successfully', data: caseFile });
    } catch (error) {
      console.error('Error updating case:', error);
      res.status(500).json({ success: false, message: 'Error updating case' });
    }
  },

  async delete(req, res) {
    try {
      const existing = await CaseFileModel.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Case not found' });
      }
      await CaseFileModel.delete(req.params.id);
      res.json({ success: true, message: 'Case deleted successfully' });
    } catch (error) {
      console.error('Error deleting case:', error);
      res.status(500).json({ success: false, message: 'Error deleting case' });
    }
  }
};

module.exports = caseFileController;

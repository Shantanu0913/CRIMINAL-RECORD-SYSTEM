const EvidenceModel = require('../models/evidenceModel');

const evidenceController = {
  // GET /api/evidence
  async getAll(req, res) {
    try {
      const evidence = await EvidenceModel.getAll();
      res.json({ success: true, data: evidence });
    } catch (error) {
      console.error('Error fetching evidence:', error);
      res.status(500).json({ success: false, message: 'Error fetching evidence' });
    }
  },

  // GET /api/evidence/cases — list cases for dropdown
  async getCases(req, res) {
    try {
      const cases = await EvidenceModel.getAllCases();
      res.json({ success: true, data: cases });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching cases' });
    }
  },

  // GET /api/evidence/:id
  async getById(req, res) {
    try {
      const evidence = await EvidenceModel.getById(req.params.id);
      if (!evidence) {
        return res.status(404).json({ success: false, message: 'Evidence not found' });
      }
      res.json({ success: true, data: evidence });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching evidence' });
    }
  },

  // POST /api/evidence
  async create(req, res) {
    try {
      const { description, type } = req.body;
      if (!type || !description) {
        return res.status(400).json({ success: false, message: 'Type and description are required' });
      }
      const evidence = await EvidenceModel.create(req.body);
      res.status(201).json({ success: true, message: 'Evidence added successfully', data: evidence });
    } catch (error) {
      console.error('Error creating evidence:', error);
      res.status(500).json({ success: false, message: 'Error adding evidence' });
    }
  },

  // PUT /api/evidence/:id
  async update(req, res) {
    try {
      const { description, type } = req.body;
      if (!type || !description) {
        return res.status(400).json({ success: false, message: 'Type and description are required' });
      }
      await EvidenceModel.update(req.params.id, req.body);
      res.json({ success: true, message: 'Evidence updated successfully' });
    } catch (error) {
      console.error('Error updating evidence:', error);
      res.status(500).json({ success: false, message: 'Error updating evidence' });
    }
  },

  // DELETE /api/evidence/:id
  async remove(req, res) {
    try {
      await EvidenceModel.delete(req.params.id);
      res.json({ success: true, message: 'Evidence deleted successfully' });
    } catch (error) {
      console.error('Error deleting evidence:', error);
      res.status(500).json({ success: false, message: 'Error deleting evidence' });
    }
  }
};

module.exports = evidenceController;

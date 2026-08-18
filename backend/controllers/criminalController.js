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
  },

  // POST /api/criminals/:id/biometrics/face
  async enrollFace(req, res) {
    try {
      const { photo_url } = req.body;
      if (!photo_url) {
        return res.status(400).json({ success: false, message: 'Face image data (photo_url) is required' });
      }
      const updated = await CriminalModel.enrollFace(req.params.id, { photo_url });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Criminal not found' });
      }
      res.json({
        success: true,
        message: 'Facial biometrics enrolled successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error enrolling face:', error);
      res.status(500).json({ success: false, message: 'Error enrolling face biometrics' });
    }
  },

  // POST /api/criminals/:id/biometrics/fingerprint
  async enrollFingerprint(req, res) {
    try {
      const { fingerprint_data, fingerprint_type, fingerprint_quality } = req.body;
      if (!fingerprint_data) {
        return res.status(400).json({ success: false, message: 'Fingerprint ridge data is required' });
      }
      const updated = await CriminalModel.enrollFingerprint(req.params.id, {
        fingerprint_data,
        fingerprint_type: fingerprint_type || 'Right Thumb',
        fingerprint_quality: fingerprint_quality || 95
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Criminal not found' });
      }
      res.json({
        success: true,
        message: 'Fingerprint biometrics enrolled successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error enrolling fingerprint:', error);
      res.status(500).json({ success: false, message: 'Error enrolling fingerprint biometrics' });
    }
  },

  // DELETE /api/criminals/:id/biometrics/:type
  async deleteBiometric(req, res) {
    try {
      const { type } = req.params;
      if (type !== 'face' && type !== 'fingerprint') {
        return res.status(400).json({ success: false, message: 'Invalid biometric type. Must be face or fingerprint' });
      }
      const updated = await CriminalModel.deleteBiometric(req.params.id, type);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Criminal not found' });
      }
      res.json({
        success: true,
        message: `${type === 'face' ? 'Facial' : 'Fingerprint'} biometrics cleared`,
        data: updated
      });
    } catch (error) {
      console.error('Error clearing biometric:', error);
      res.status(500).json({ success: false, message: 'Error clearing biometric record' });
    }
  },

  // GET /api/criminals/:id/media
  async getMedia(req, res) {
    try {
      const CriminalMediaModel = require('../models/criminalMediaModel');
      const media = await CriminalMediaModel.getByCriminalId(req.params.id);
      res.json({ success: true, data: media });
    } catch (error) {
      console.error('Error fetching accused media:', error);
      res.status(500).json({ success: false, message: 'Error fetching media files' });
    }
  },

  // POST /api/criminals/:id/media
  async addMedia(req, res) {
    try {
      const { media_type, file_url, file_name, title } = req.body;
      if (!file_url) {
        return res.status(400).json({ success: false, message: 'Media file data (file_url) is required' });
      }
      const CriminalMediaModel = require('../models/criminalMediaModel');
      const created = await CriminalMediaModel.create({
        criminal_id: req.params.id,
        media_type: media_type || 'Photo',
        file_url,
        file_name,
        title: title || 'Accused Media'
      });
      res.status(201).json({ success: true, message: 'Accused media uploaded successfully', data: created });
    } catch (error) {
      console.error('Error uploading accused media:', error);
      res.status(500).json({ success: false, message: 'Error saving accused media file' });
    }
  },

  // DELETE /api/criminals/:id/media/:mediaId
  async deleteMedia(req, res) {
    try {
      const CriminalMediaModel = require('../models/criminalMediaModel');
      await CriminalMediaModel.delete(req.params.mediaId);
      res.json({ success: true, message: 'Accused media file deleted' });
    } catch (error) {
      console.error('Error deleting accused media:', error);
      res.status(500).json({ success: false, message: 'Error deleting accused media' });
    }
  }
};

module.exports = criminalController;

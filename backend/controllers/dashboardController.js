const CriminalModel = require('../models/criminalModel');
const FIRModel = require('../models/firModel');
const CaseFileModel = require('../models/caseFileModel');
const EvidenceModel = require('../models/evidenceModel');

const dashboardController = {
  async getStats(req, res) {
    try {
      const [
        criminalCount,
        firCount,
        caseCount,
        evidenceCount,
        caseStatuses,
        criminalCategories
      ] = await Promise.all([
        CriminalModel.getCount(),
        FIRModel.getCount(),
        CaseFileModel.getCount(),
        EvidenceModel.getCount(),
        CaseFileModel.getCountByStatus(),
        CriminalModel.getCountByStatus()
      ]);

      res.json({
        success: true,
        data: {
          totalCriminals: criminalCount,
          totalFIRs: firCount,
          totalCases: caseCount,
          totalEvidence: evidenceCount,
          caseStatuses,
          criminalCategories
        }
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
    }
  }
};

module.exports = dashboardController;

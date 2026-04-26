const express = require('express');
const router = express.Router();
const hearingController = require('../controllers/hearingController');

router.get('/', hearingController.getAll);
router.get('/case/:caseId', hearingController.getByCaseId);
router.get('/:id', hearingController.getById);
router.post('/', hearingController.create);
router.put('/:id', hearingController.update);
router.delete('/:id', hearingController.remove);

module.exports = router;

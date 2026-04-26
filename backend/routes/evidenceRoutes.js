const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');

router.get('/cases', evidenceController.getCases);
router.get('/', evidenceController.getAll);
router.get('/:id', evidenceController.getById);
router.post('/', evidenceController.create);
router.put('/:id', evidenceController.update);
router.delete('/:id', evidenceController.remove);

module.exports = router;

const express = require('express');
const router = express.Router();
const caseFileController = require('../controllers/caseFileController');

router.get('/', caseFileController.getAll);
router.get('/:id', caseFileController.getById);
router.post('/', caseFileController.create);
router.put('/:id', caseFileController.update);
router.delete('/:id', caseFileController.delete);

module.exports = router;

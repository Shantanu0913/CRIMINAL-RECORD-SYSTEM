const express = require('express');
const router = express.Router();
const firController = require('../controllers/firController');

router.get('/', firController.getAll);
router.get('/:id', firController.getById);
router.post('/', firController.create);
router.post('/:id/evidence', firController.addEvidence);
router.put('/:id', firController.update);
router.delete('/:id', firController.delete);

module.exports = router;

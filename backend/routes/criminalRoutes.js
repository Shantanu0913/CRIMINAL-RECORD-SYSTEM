const express = require('express');
const router = express.Router();
const criminalController = require('../controllers/criminalController');

router.get('/', criminalController.getAll);
router.get('/:id', criminalController.getById);
router.post('/', criminalController.create);
router.put('/:id', criminalController.update);
router.delete('/:id', criminalController.delete);

module.exports = router;

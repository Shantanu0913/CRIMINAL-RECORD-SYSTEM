const express = require('express');
const router = express.Router();
const criminalController = require('../controllers/criminalController');

router.get('/', criminalController.getAll);
router.get('/:id', criminalController.getById);
router.post('/', criminalController.create);
router.put('/:id', criminalController.update);
router.delete('/:id', criminalController.delete);

// Biometric Enrolment Routes
router.post('/:id/biometrics/face', criminalController.enrollFace);
router.post('/:id/biometrics/fingerprint', criminalController.enrollFingerprint);
router.delete('/:id/biometrics/:type', criminalController.deleteBiometric);

// Accused Media (Photos & Videos) Routes
router.get('/:id/media', criminalController.getMedia);
router.post('/:id/media', criminalController.addMedia);
router.delete('/:id/media/:mediaId', criminalController.deleteMedia);

module.exports = router;

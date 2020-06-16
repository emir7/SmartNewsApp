const express = require('express');
const router = express.Router();

const phase1Ctrl = require('../controllers/phase1');
const validator = require('../validator/validator');

router.post('/metrics', validator.validate, phase1Ctrl.writeMetrics);

module.exports = router;
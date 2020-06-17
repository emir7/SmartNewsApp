const express = require('express');
const router = express.Router();

const validator = require('../validator/validator');
const phase2Ctr = require('../controllers/phase2');

router.post('/data', validator.validate, phase2Ctr.writeData);

module.exports = router;
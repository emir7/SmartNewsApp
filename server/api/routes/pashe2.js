const express = require('express');
const router = express.Router();

const validator = require('../validator/validator');
const phase2Ctr = require('../controllers/phase2');

router.post('/data', validator.validate, phase2Ctr.writeData);
router.get('/data', validator.validate, phase2Ctr.getAllData);
router.delete('/data', validator.validateRemove, phase2Ctr.removeUser);

module.exports = router;
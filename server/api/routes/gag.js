const express = require('express')
const router = express.Router()
const gagController = require('../controllers/gagController');

router.get('/', gagController.getAwesomeGags);
module.exports = router;
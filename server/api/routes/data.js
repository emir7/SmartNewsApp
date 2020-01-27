const express = require('express')
const router = express.Router()
const dataController = require('../controllers/dataController');

router.post('/', dataController.saveData);
module.exports = router;
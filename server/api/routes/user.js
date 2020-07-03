const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController');

const validator = require('../validator/validator');

router.post('/', validator.validate, userController.createUser);
router.get('/', validator.validate, userController.getAllUsers);

module.exports = router;
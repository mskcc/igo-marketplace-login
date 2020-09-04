var express = require('express');
const AuthController = require('../controllers/AuthController');

var router = express.Router();

router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);

module.exports = router;

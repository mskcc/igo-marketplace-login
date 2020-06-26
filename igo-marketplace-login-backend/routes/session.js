var express = require('express');
const SessionController = require('../controllers/SessionController');
var router = express.Router();

router.get('/user', SessionController.retrieveUserData);

module.exports = router;

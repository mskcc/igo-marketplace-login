var express = require('express');
const SessionController = require('../controllers/SessionController');
var router = express.Router();

router.get('/groups', SessionController.retrieveUserGroups);

module.exports = router;

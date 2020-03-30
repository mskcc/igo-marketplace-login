var express = require("express");
var router = express.Router();
var path = require('path');

/**
 * GET home page - The login page uses any routed path as an input for redirection, so "*"
 * 	e.g. /login/project-tracker  -> app will use project-tracker for re-routing
 */
router.get("*", function(req, res) {
	res.sendFile(path.join(__dirname + '/../public/index.html'));
});

module.exports = router;

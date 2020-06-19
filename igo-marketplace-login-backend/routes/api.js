var express = require('express');
var authRouter = require('./auth');
var sessionRouter = require('./session');

var app = express();

app.use('/auth/', authRouter);
app.use('/session/', sessionRouter);

module.exports = app;

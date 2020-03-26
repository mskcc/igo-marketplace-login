const instance = require("jwt-in-cookie");
instance.configure({secret: process.env.JWT_SECRET});
module.exports = instance;


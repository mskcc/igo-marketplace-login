const jwtInCookie = require('jwt-in-cookie');
const apiResponse = require('../helpers/apiResponse');
const { logger } = require("../helpers/winston");

exports.authenticateRequest = function(req, res, next) {
  if(process.env.ENV === 'QA') {
    next();
    return;
  }
  try {
    jwtInCookie.validateJwtToken(req);
  } catch(err){
    logger.log("error", err.message);
    return apiResponse.unauthorizedResponse(res,  'Not authorized - please log in');
  }
  next();
};
exports.getCookie = function(req){
  return jwtInCookie.retrieveTokenFromCookie(req);
};

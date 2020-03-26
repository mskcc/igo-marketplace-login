const jwt = require("jsonwebtoken");
const cookieValidator = require("./jwt-in-cookie");
/**
 *
 * Follows the express guidelines (Ref - https://expressjs.com/en/guide/writing-middleware.html)
 *
 * @param req
 * @param res
 * @param next
 */
exports.verifyCookie = function(req, res, next) {
    cookieValidator.retrieveTokenFromCookie(req);
    next();

    /*
    // TODO - session constant
    const session = req.cookies['session'];

    if (session === undefined || session === null) {
        throw new Error("JWT Token not defined");
    }

    // TODO - this needs to grab from the shared MONGODB file
    jwt.verify(session, process.env.JWT_SECRET, function (err, decoded) {
        if(err) {
            throw new Error("Invalid JWT Token");
        }
    });
    next();
     */
};

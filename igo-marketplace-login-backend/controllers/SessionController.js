const {authenticateRequest, getCookie} = require("../middlewares/jwt-cookie");
const {retrieveUserData} = require("../data_access/UserModelDataAccess");
const apiResponse = require("../helpers/apiResponse");
const { logger } = require("../helpers/winston");

/**
 * Retrieves the user groups saved for the user in the DB
 * 
 * @returns {Object}
 */
exports.retrieveUserData = [
	authenticateRequest,
	async function (req, res) {
		const cookie = getCookie(req);
		let userData = null;
		try {
			userData = await retrieveUserData(cookie);
		} catch(err) {
			logger.log("error", `Database Query Failed: ${err.message}`);
			return apiResponse.ErrorResponse(res, "Failed to retrieve User Data");
		}
		if(userData == null){
			logger.log("info", "No user w/ credentials found");
			return apiResponse.ErrorResponse(res, "No user w/ credentials found");
		}

		const resp = Object.assign(userData.toJSON());
		delete resp._id;
		delete resp.__v;
		delete resp.loginFirstDate;
		delete resp.loginLastDate;
		delete resp.createdAt;
		delete resp.updatedAt;

		logger.log("info", "Successfully retrieved User Data");
		return apiResponse.successResponseWithData(res,"Successfully retrieved User Data", resp);
	}
];

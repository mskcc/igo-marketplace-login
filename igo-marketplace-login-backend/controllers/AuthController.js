const UserModel = require("../models/UserModel");
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const ldap = require('ldapjs');
const cookieValidator = require("jwt-in-cookie");
const { logger } = require("../helpers/winston");
const client = ldap.createClient({
	url: 'ldaps://mskcc.root.mskcc.org/', // Error: connect ECONNREFUSED 23.202.231.169:636
	// url: 'ldaps://ldapha.mskcc.root.mskcc.org/'	// Error: getaddrinfo ENOTFOUND ldapha.mskcc.root.mskcc.org
	tlsOptions: {
		rejectUnauthorized: false
	}
});
const {
	getRoles,
	getGroups,
	getSurname,
	getGivenName,
	getTitle } = require('../helpers/ldapUtil');

/**
 * User registration.
 *
 * @param {string}      firstName
 * @param {string}      lastName
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.register = [
	// Validate fields.
	body("firstName").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("lastName").isLength({ min: 1 }).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
			return UserModel.findOne({email : value}).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	// Sanitize fields.
	sanitizeBody("firstName").escape(),
	sanitizeBody("lastName").escape(),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				//hash input password
				bcrypt.hash(req.body.password,10,function(err, hash) {
					// generate OTP for confirmation
					let otp = utility.randomNumber(4);
					// Create User object with escaped and trimmed data
					var user = new UserModel(
						{
							firstName: req.body.firstName,
							lastName: req.body.lastName,
							email: req.body.email,
							password: hash,
							confirmOTP: otp
						}
					);
					// Html email body
					let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
					// Send confirmation email
					mailer.send(
						constants.confirmEmails.from,
						req.body.email,
						"Confirm Account",
						html
					).then(function(){
						// Save user.
						user.save(function (err) {
							if (err) { return apiResponse.ErrorResponse(res, err.message); }
							let userData = {
								_id: user._id,
								firstName: user.firstName,
								lastName: user.lastName,
								email: user.email
							};
							return apiResponse.successResponseWithData(res,"Registration Success.", userData);
						});
					}).catch(err => {
						console.log(err);
						return apiResponse.ErrorResponse(res,err);
					}) ;
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err.message);
		}
	}];


const sendLDAPSearch = async function(client, user) {
	const opts = {
		filter: `(sAMAccountName=${user})`,
		scope: 'sub',
		attributes: ['dn', 'sn', 'cn', 'memberOf', 'title', 'givenName', 'sAMAccountName', 'displayName', 'title']
	};
	const promise = new Promise(function(resolve, reject) {
		client.search("DC=MSKCC,DC=ROOT,DC=MSKCC,DC=ORG", opts, (err, res) => {
			res.on('searchEntry', function(entry) {
				const result = entry.object;
				resolve(result);
			});
			res.on('searchReference', function(referral) {
				console.log('referral: ' + referral.uris.join());
			});
			res.on('error', function(err) {
				reject(`LDAP Error: ${err.message}`);
			});
			res.on('end', function(result) {
				console.log('status: ' + result.status);console.log('status: ' + result.status);
				if(result.status !== 0){
					reject(`LDAP Status Fail: ${result.status}`)
				}
			});
		});
	});
	return promise;
};

const sendLdapCredentials = async function(client, user, pwd) {
	const promise = new Promise(function(resolve, reject) {
		client.bind(`${user}@mskcc.org`, pwd, function(err) {
			if(err){
				const errorMsg = `Failed bind to LDAP client (User: ${user}) - ${err.message}`;
				reject(new Error(errorMsg));
			}
		});
		sendLDAPSearch(client, user).then(
			(resp) => {
				resolve(resp);
			}
		).catch((err) => {
			const errorMsg = `Failed to Retrieve LDAP response (User: ${user}) - ${err.message}`;
			reject(new Error(errorMsg));
		})
	});
	return promise;
};

/**
 * Returns usermodel for a username if it exists
 *
 * @param username
 * @returns {Promise<null|*>}
 */
const getExistingUser = async function(username) {
	const results = await UserModel.find({username});

	if(results.length === 0){
		return null;
	} else if(results.length > 1){
		// Only one result should be returned for a username
		throw new Error(`Unable to resolve single user: ${username}`);
	}

	return results[0];
};

const loadUser = async function(username, ldapResponse){
	let user = await getExistingUser(username);

	const groups = getGroups(ldapResponse);
	const roles = getRoles(groups);
	const surname = getSurname(ldapResponse);
	const givenName = getGivenName(ldapResponse);
	const title = getTitle(ldapResponse);
	const loginDate = new Date();

	if(user){
		logger.log("info", `Updating user: ${username}`);
		user.set({
			title,
			groups: groups.join(','),
			isLabMember: roles.has(constants.LDAP.LAB_MEMBER),
			isAdmin: roles.has(constants.LDAP.ADMIN),
			isPM: roles.has(constants.LDAP.PM),
			isUser: roles.has(constants.LDAP.USER),
			loginLastDate: loginDate
		});
	} else {
		logger.log("info", `Adding new user: ${username}`);
		// New user - create new entry and add
		user = new UserModel({
			firstName: givenName,
			lastName: surname,
			username: username,
			title: title,
			groups: groups.join(','),
			isLabMember: roles.has(constants.LDAP.LAB_MEMBER),
			isAdmin: roles.has(constants.LDAP.ADMIN),
			isPM: roles.has(constants.LDAP.PM),
			isUser: roles.has(constants.LDAP.USER),
			loginFirstDate: loginDate,
			loginLastDate: loginDate
		});
		user.save(function (err) {
			if (err) {
				throw new Error(err.message);
			}
		});
	}

	return user;
};

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
	body("userName")
		.isLength({ min: 1 }).trim().withMessage("UserId must be specified.")
		.isAlphanumeric().withMessage("UserId must be alphanumeric"),
	body("password")
		.isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	sanitizeBody("userName").escape(),
	sanitizeBody("password").escape(),
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Failed login", errors.array());
			}else {
				const user = req.body.userName;
				const pwd = req.body.password;

				logger.log("info", `Authenticating user: ${user}`);
				const ldapResponse = await sendLdapCredentials(client, user, pwd);
				const userData  = await loadUser(user, ldapResponse);

				// Successful login - prepare valid JWT token for future authentication
				const jwtPayload = userData.toJSON();
				cookieValidator.setJwtToken(res, jwtPayload);

				// userData.token = token;
				apiResponse.successResponse(res, 'Successful login');
			}
		} catch (err) {
			const errorMsg = `Authentication Failure: ${err.message}`;
			logger.log("error", errorMsg);
			return apiResponse.ErrorResponse(res, "Failed login");
		}
	}];

/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
exports.verifyConfirm = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("otp").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				UserModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if(!user.isConfirmed){
							//Check account confirmation.
							if(user.confirmOTP == req.body.otp){
								//Update user as confirmed
								UserModel.findOneAndUpdate(query, {
									isConfirmed: 1,
									confirmOTP: null 
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err.message);
								});
								return apiResponse.successResponse(res,"Account confirmed success.");
							}else{
								return apiResponse.unauthorizedResponse(res, "Otp does not match");
							}
						}else{
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					}else{
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err.message);
		}
	}];

/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	sanitizeBody("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				UserModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if(!user.isConfirmed){
							// Generate otp
							let otp = utility.randomNumber(4);
							// Html email body
							let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from, 
								req.body.email,
								"Confirm Account",
								html
							).then(function(){
								user.isConfirmed = 0;
								user.confirmOTP = otp;
								// Save user.
								user.save(function (err) {
									if (err) { return apiResponse.ErrorResponse(res, err.message); }
									return apiResponse.successResponse(res,"Confirm otp sent.");
								});
							});
						}else{
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					}else{
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err.message);
		}
	}];

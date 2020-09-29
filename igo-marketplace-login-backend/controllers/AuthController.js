const { body,validationResult, sanitizeBody } = require("express-validator");
const ldap = require('ldapjs');
const cookieValidator = require("jwt-in-cookie");

const UserModel = require("../models/UserModel");
const apiResponse = require("../helpers/apiResponse");
const { constants } = require("../helpers/constants");9
const { logger } = require("../helpers/winston");
const {
	getRoles,
	getGroups,
	getSurname,
	getGivenName,
	getTitle,
	retrieveHierarchy,
	hasValidHierarchy} = require('../helpers/ldapUtil');

const client = ldap.createClient({
	url: 'ldaps://mskcc.root.mskcc.org/', // Error: connect ECONNREFUSED 23.202.231.169:636
	// url: 'ldaps://ldapha.mskcc.root.mskcc.org/'	// Error: getaddrinfo ENOTFOUND ldapha.mskcc.root.mskcc.org
	tlsOptions: {
		rejectUnauthorized: false
	}
});

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

const loadUser = async function(username, password, ldapResponse){
	let user = await getExistingUser(username);

	const groups = getGroups(ldapResponse);
	const roles = getRoles(groups);
	const surname = getSurname(ldapResponse);
	const givenName = getGivenName(ldapResponse);
	const title = getTitle(ldapResponse);
	const loginDate = new Date();

	if(user){
		logger.log("info", `Updating user: ${username}`);
		const updatedUser = {
			title,
			groups: groups.join(','),
			isLabMember: roles.has(constants.LDAP.LAB_MEMBER),
			isAdmin: roles.has(constants.LDAP.ADMIN),
			isPM: roles.has(constants.LDAP.PM),
			isUser: roles.has(constants.LDAP.USER),
			loginLastDate: loginDate
		};

		// Check if the User instance is missing the hierarchy and update it if necessary
		if(!hasValidHierarchy(username, user)){
			logger.info(`Adding hierarchy to user: ${username}`);
			const hierarchy = await retrieveHierarchy(client, username, password);
			updatedUser['hierarchy'] = hierarchy;
			UserModel.update(
				{ username: username },
				updatedUser,
				{ multi: true },
				function(err, numberAffected){
					logger.error(err);
				}
			);
		} else {
			user.set(updatedUser);
		}
	} else {
		logger.info(`Retrieving hierarchy for user: ${username}`);
		const hierarchy = await retrieveHierarchy(client, username, password);

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
			loginLastDate: loginDate,
			hierarchy: hierarchy
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
		.isLength({ min: 1 }).trim().withMessage("userName must be specified.")
		.isAlphanumeric().withMessage("userName must be alphanumeric"),
	body("password")
		.isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	sanitizeBody("userName").escape(),
	// Do NOT sanitize the password, e.g. "hi<>world" => "hi&lt;&gt;world"
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Invalid userName/password", errors.array());
			}else {
				const user = req.body.userName;
				const pwd = req.body.password;

				logger.log("info", `Authenticating user: ${user}`);
				const ldapResponse = await sendLdapCredentials(client, user, pwd);

				const userData  = await loadUser(user, pwd, ldapResponse);

				// Redact fields, groups especially can be very large and result in nginx header issues.
				const jwtPayload = userData.toJSON();
				delete jwtPayload.groups;
				delete jwtPayload.loginFirstDate;
				delete jwtPayload.createdAt;
				delete jwtPayload.updatedAt;

				// Successful login - prepare valid JWT token for future authentication
				cookieValidator.setJwtToken(res, jwtPayload);

				// Log cookie size to verify nginx buffer_size will not be exceeded
				const jwtPayloadString = JSON.stringify(jwtPayload);
				logger.log("info", `JWT Token Set: ${Buffer.byteLength(jwtPayloadString, 'utf8')} bytes. Sending successful login response for User: ${user}`);

				apiResponse.successResponse(res, 'Successful login');
			}
		} catch (err) {
			const errorMsg = `Authentication Failure: ${err.message}`;
			logger.log("error", errorMsg);
			return apiResponse.unauthorizedResponse(res, "Failed login");
		}
	}];

/**
 * User logout - clears token value so that future validation calls will fail
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.logout = [
	async (req, res) => {
		try {
			const cookie = cookieValidator.retrieveTokenFromCookie(req);
			const username = cookie["username"] || "unknown_user";
			logger.log("info", `Logging out user: ${username}`);
			cookieValidator.clearToken(res);
			apiResponse.successResponse(res, 'Successful logout');
		} catch (err) {
			logger.error("error", err.message);
			return apiResponse.ErrorResponse(res, "Failed logout");
		}
	}];

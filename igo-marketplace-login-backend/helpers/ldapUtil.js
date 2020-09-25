const { constants } = require('./constants');

const LAB_MEMBER_GROUP = constants.LDAP.LAB_MEMBER_GROUP;
const ADMIN_GROUP = constants.LDAP.ADMIN_GROUP;
const PM_GROUP = constants.LDAP.PM_GROUP;

const LAB_MEMBER = constants.LDAP.LAB_MEMBER;
const ADMIN = constants.LDAP.ADMIN;
const PM = constants.LDAP.PM;
const USER = constants.LDAP.USER;

const MEMBER_OF = constants.LDAP.MEMBER_OF;

const { logger } = require("./winston");

// Fields in the ldap response that will be used to filter projects on
const HIERARCHY_FILTERS = ["sn", "givenName"];
const HIERARCHY_DEPTH = 3;							// Upward levels from the user to create the filtering hierarchy

const getRolesForGroup = (group) => {
  // Lab Member - MemberOf: "zzPDL_CMO_IGO"
  // Admin - MemberOf: "zzPDL_SKI_IGO_DATA"
  // PM - MemberOf: zzPDL_SKI_CMOPM
  // Splunk - MemberOf: zzPDL_CMO_Splunk
  // User - All others
  const roles = [];
  const ROLES = [
    [PM_GROUP, PM],
    [ADMIN_GROUP, ADMIN],
    [LAB_MEMBER_GROUP, LAB_MEMBER]
  ];
  for(const role of ROLES){
    if(group.toLowerCase().includes(role[0].toLowerCase())){
      roles.push(role[1]);
    }
  }

  return roles;
};

/**
 * Retrieves the manager's CN of the input user
 * @param client
 * @param user
 * @returns {Promise<unknown>}
 */
const retrieveManagerUserName = async function(client, user) {
  const opts = {
    filter: `(sAMAccountName=${user})`,
    scope: "sub",
    attributes: ["manager"]
  };
  const promise = new Promise(function(resolve, reject) {
    client.search("DC=MSKCC,DC=ROOT,DC=MSKCC,DC=ORG", opts, (err, res) => {
      res.on("searchEntry", function(entry) {
        const result = entry.object;

        // Parse out value of the CN entry in the manager field value
        const managerValue = result["manager"] || "CN=";
        const attributes = managerValue.split(",");
        let kv;

        for(const attr of attributes){
          kv = attr.split("=");
          if("CN" === kv[0]){
            resolve(kv[1]);
            return;
          }
        }
        logger.log("error", `Could not find manager of ${user}`);
        resolve("");
      });
      res.on("searchReference", function(referral) {
        // logger.log("info", "referral: " + referral.uris.join());
      });
      res.on("error", function(err) {
        reject(`LDAP Error: ${err.message}`);
      });
      res.on("end", function(result) {
        // logger.log("info", "status: " + result.status);
        if(result.status !== 0){
          reject(`LDAP Status Fail: ${result.status}`)
        }
      });
    });
  });
  return promise;
};

/**
 * Logs any issues with user entry prior to being added to the hierarchy
 *
 * @param userName
 * @param entry
 * @returns {Promise<void>}
 */
const isValidHierarchyEntry = function(userName, entry){
  for(const filter of HIERARCHY_FILTERS){
    if(!entry.hasOwnProperty(filter)){
      logger.error(`Invalid Hierarchy Entry: ${userName}, ${filter}`);
      return false;
    }
  }
  return true;
};

/**
 * Populates the LDAP user data from the input user name
 *
 * @param client
 * @param userName
 * @returns {Promise<unknown>}
 */
const populateUserDataFromUserName = async function(client, userName) {
  logger.log("info", `Populating data for userName: ${userName}`);
  const opts = {
    filter: `(sAMAccountName=${userName})`,
    scope: "sub",
    attributes: ["dn", "sn", "cn", "title", "givenName", "sAMAccountName", "displayName", "title"]
  };
  const promise = new Promise(function(resolve, reject) {
    client.search("DC=MSKCC,DC=ROOT,DC=MSKCC,DC=ORG", opts, (err, res) => {
      res.on("searchEntry", function(entry) {
        const result = entry.object;
        resolve(result);
      });
      res.on("searchReference", function(referral) {
        // logger.log("info", "referral: " + referral.uris.join());
      });
      res.on("error", function(err) {
        reject(`LDAP Error: ${err.message}`);
      });
      res.on("end", function(result) {
        if(result.status !== 0){
          logger.log("error", "status: " + result.status);
          reject(`LDAP Status Fail: ${result.status}`);
        }
      });
    });
  });
  return promise;
};

exports.hasValidHierarchy = function(username, user) {
  const hierarchy = user["hierarchy"];
  if(hierarchy && hierarchy.length > 0){
    for(const entry of hierarchy){
      if(!isValidHierarchyEntry(username, entry)){
        logger.info(`User: ${username} has an invalid hierarchy`);
        return false;
      }
    }
    return true;
  }
  logger.info(`User: ${username} has an invalid hierarchy`);
  return false;
}

/**
 * Retrieves hierarchy of users from the user data contained in the request token
 *
 * @param req
 * @returns [] - list of hierarchy objects containing data of managers
 */
exports.retrieveHierarchy = function(client, userName, password) {
  const dn=`CN=${userName},OU=Sloan Kettering Institute,OU=SKI,DC=MSKCC,DC=ROOT,DC=MSKCC,DC=ORG`;
  client.bind(dn, password, function(err) {
    if(err){
      const errorMsg = `Failed bind to LDAP client (User: ${userName}) - ${err.message}`;
      logger.error(errorMsg);
    }
  });

  const promise = new Promise(async function(resolve, reject) {
    if(userName) {
      const user = await populateUserDataFromUserName(client, userName);
      const hierarchy = [];
      if(isValidHierarchyEntry(userName, user)){
        hierarchy.push(user);
      }

      let managerUserName = userName;
      let manager;
      logger.info(`Populating hierarachy for user: ${userName}`);
      for(let itr = 0; itr < HIERARCHY_DEPTH; itr+=1){
        managerUserName = await retrieveManagerUserName(client, managerUserName);
        // TODO - this can be asynchronous
        manager = await populateUserDataFromUserName(client, managerUserName);
        if(isValidHierarchyEntry(managerUserName, manager)){
          hierarchy.push(manager);
        }
      }

      logger.info(`User Hierachy: ${userName} => ${hierarchy.map(m => m["cn"]).join(", ")}`);
      resolve(hierarchy);
    } else {
      logger.error( "Failed to filter userData");
    }
  });

  return promise;
};

exports.getRoles = (groups) => {
  const roles = new Set([]);
  let groupRoles;
  for(const group of groups){
    groupRoles = getRolesForGroup(group);
    groupRoles.forEach(role => roles.add(role));
  }

  // Any user not in a defined role-group is a user
  if(roles.size === 0){
    roles.add(USER);
  }

  return roles;
};

exports.getSurname = (ldapResult) => {
  return ldapResult[constants.LDAP.SURNAME] || '';
};

exports.getGivenName = (ldapResult) => {
  return ldapResult[constants.LDAP.GIVEN_NAME] || '';
};

exports.getTitle = (ldapResult) => {
  return ldapResult[constants.LDAP.TITLE] || '';
};

exports.getUserName = (ldapResult) => {
  return ldapResult[constants.LDAP.CN] || '';
};
/**
 * Returns all groups in the ldap result we care about - all "zzPDL" & "GRP" strings in the memberOf ldap result
 * @param ldapResult
 */
exports.getGroups = (ldapResult) => {
  const memberOf = ldapResult[MEMBER_OF] || [];
  // TODO - regex to ignore the "," at the end
  const regex = '(CN=(zzPDL|GRP)_.*?),';
  const groups = [];

  let found, result, formatted;
  for(const membership of memberOf){
    found = membership.match(regex);
    if(found && found.length > 0){
      result = found[0];
      if(result){
        formatted = result.split(',')[0];
        groups.push(formatted);
      }
    }
  }
  return groups;
};

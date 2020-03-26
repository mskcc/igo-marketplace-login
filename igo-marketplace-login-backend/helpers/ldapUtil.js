const { constants } = require("./constants");

const LAB_MEMBER_GROUP = constants.LDAP.LAB_MEMBER_GROUP;
const ADMIN_GROUP = constants.LDAP.ADMIN_GROUP;
const PM_GROUP = constants.LDAP.PM_GROUP;

const LAB_MEMBER = constants.LDAP.LAB_MEMBER;
const ADMIN = constants.LDAP.ADMIN;
const PM = constants.LDAP.PM;
const USER = constants.LDAP.USER;

const MEMBER_OF = constants.LDAP.MEMBER_OF;

const getRolesForGroup = (group) => {
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

exports.getRoles = (groups) => {
    const roles = new Set([]);
    let groupRoles;
    for(const group of groups){
        groupRoles = getRolesForGroup(group);
        groupRoles.forEach(role => roles.add(role))
    }

    // Any user not in a defined role-group is a user
    if(roles.size === 0){
        roles.push(USER);
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
    const regex = "(CN=(zzPDL|GRP)_.*?),";
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

/**
 * Returns the role that the user belongs to based on their LDAP result
 *
 * @param ldapResult
 */
exports.getRole = (ldapResult) => {
    // Lab Member - MemberOf: "zzPDL_CMO_IGO"
    // Admin - MemberOf: "zzPDL_SKI_IGO_DATA"
    // PM - MemberOf: zzPDL_SKI_CMOPM
    // Splunk - MemberOf: zzPDL_CMO_Splunk
    // User - All others

    const memberOf = ldapResult[MEMBER_OF] || [];

    const roles = new Set([]);

    return ldapResult;
};

const UserModel = require('../models/UserModel');
const { logger } = require('../helpers/winston');

/**
 * Retrieves userData by querying with the available fields in the input searchObj
 * @param searchObj
 * @returns {Query|void}
 */
exports.retrieveUserData = function(searchObj) {
  // Populate UserModel fields present in the search Object
  const fields = ['firstName', 'lastName', 'username', 'title'];
  const query = {};
  let val;
  for(let field of fields){
    val = searchObj[field];
    if(val){
      query[field] = val;
    }
  }
  logger.log('info', `Querying for userName: '${query.username}', first: '${query.firstName}', last: '${query.lastName}', title: '${query.title}'`);
  return UserModel.findOne(query);
};

var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  username: {type: String, required: true},
  title: {type: String, required: true},
  groups: {type: String, required: true},
  loginFirstDate: {type: Date, required: true},
  loginLastDate: {type: Date, required: true},
  /* ROLE MEMBERSHIP - Determined by the zzPDL groups the user belongs to (see constants.js( */
  isLabMember: {type: Boolean, required: true},   // constants.js: LAB_MEMBER_GROUP
  isAdmin: {type: Boolean, required: true},       // constants.js: ADMIN_GROUP
  isPM: {type: Boolean, required: true},          // constants.js: PM_GROUP
  isUser: {type: Boolean, required: true},        // If user isn't a PM, Admin, or Lab Member, they are a user
}, {timestamps: true});

// Virtual for user's full name
UserSchema
  .virtual('fullName')
  .get(function () {
    return this.firstName + ' ' + this.lastName;
  });

module.exports = mongoose.model('User', UserSchema);

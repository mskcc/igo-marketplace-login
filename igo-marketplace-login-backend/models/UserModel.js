var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	username: {type: String, required: true},
	title: {type: String, required: true},
	groups: {type: String, required: true},
	isLabMember: {type: Boolean, required: true},
	isAdmin: {type: Boolean, required: true},
	isPM: {type: Boolean, required: true},
	isUser: {type: Boolean, required: true},
	loginFirstDate: {type: Date, required: true},
	loginLastDate: {type: Date, required: true},
}, {timestamps: true});

// Virtual for user's full name
UserSchema
	.virtual("fullName")
	.get(function () {
		return this.firstName + " " + this.lastName;
	});

module.exports = mongoose.model("User", UserSchema);

/**
 * JOI Validation Schemas
 */
module.exports = {
	authSchema: require('./schemas/UserValidation/auth'),
	userInfoSchema: require('./schemas/UserValidation/auth/user'),
	adminSchema: require('./schemas/AdminValidation/Auth'),
	flowSchema: require("./schemas/AdminValidation/Flow")
	// driverSchema: require('./schemas/driver')
};

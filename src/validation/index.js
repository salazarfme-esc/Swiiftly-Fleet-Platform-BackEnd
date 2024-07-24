/**
 * JOI Validation Schemas
 */
module.exports = {
	authSchema: require('./schemas/UserValidation/auth'),
	userInfoSchema: require('./schemas/UserValidation/auth/user'),
	adminSchema: require('./schemas/AdminValidation/Auth'),
	// driverSchema: require('./schemas/driver')
};

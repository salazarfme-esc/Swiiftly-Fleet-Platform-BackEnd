/**
 * JOI Validation Schemas
 */
module.exports = {
	authSchema: require('./schemas/UserValidation/auth'),
	userInfoSchema: require('./schemas/UserValidation/user'),
	adminSchema: require('./schemas/AdminValidation/Auth'),
	flowSchema: require("./schemas/AdminValidation/Flow"),
	vehicleSchema : require("./schemas/UserValidation/vehicle"),
	userManagementSchema: require("./schemas/AdminValidation/UserManagement")
	// driverSchema: require('./schemas/driver')
};

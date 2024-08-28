/**
 * JOI Validation Schemas
 */
module.exports = {
	authSchema: require('./schemas/UserValidation/auth'),
	userInfoSchema: require('./schemas/UserValidation/user'),
	adminSchema: require('./schemas/AdminValidation/Auth'),
	flowSchema: require("./schemas/AdminValidation/Flow"),
	vehicleSchema: require("./schemas/UserValidation/vehicle"),
	userManagementSchema: require("./schemas/AdminValidation/UserManagement"),
	jobSchema: require("./schemas/UserValidation/job"),
	adminJobSchema: require("./schemas/AdminValidation/Job"),
	makeAndModel: require("./schemas/AdminValidation/MakeAndModel")
	// driverSchema: require('./schemas/driver')
};

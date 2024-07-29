'use strict';

/***********************************************
 * SERVICE FOR HANDLING MONGODB QUERIES
 ***********************************************/
module.exports = {
	User: require('./user.service'),
	Verification: require('./verification.service'),
	Admin: require('./admin.service'),
	Flow: require("./flow.service"),
	FlowQuestion: require("./flowQuestion.service"),
	FlowCategory: require("./flowCategory.service"),
	Vehicle: require("./vehicles.service"),
	MainJob: require("./mainJob.service"),
	SubJob: require("./subJob.service")
};

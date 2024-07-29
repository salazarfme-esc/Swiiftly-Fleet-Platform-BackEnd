/***************************
 * ROUTE CONTROLLER METHODS
 ***************************/
/**
 * All User Controller
 */
const userAuthController = require('./userController/auth');
const userInfoController = require('./userController/users');
const userVehicleController = require("./userController/vehicle");
const userJobController = require("./userController/job");

/**
 * All Admin Controller
 */
const adminAuthController = require('./adminController/auth');
const adminFlowController = require("./adminController/flow");
const adminUserManagementController = require("./adminController/userManagement");

module.exports = {
    /**
     * All Admin Controllers
     */
    adminAuth: adminAuthController,
    adminFlow: adminFlowController,
    adminUserManagement: adminUserManagementController,
    /**
     * All User Controllers
     */
    userAuth: userAuthController,
    userInfo: userInfoController,
    userVehicle: userVehicleController,
    userJob: userJobController,
};
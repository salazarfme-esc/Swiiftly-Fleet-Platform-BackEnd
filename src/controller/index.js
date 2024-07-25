/***************************
 * ROUTE CONTROLLER METHODS
 ***************************/
/**
 * All User Controller
 */
const userAuthController = require('./userController/auth');
const userInfoController = require('./userController/users');

/**
 * All Admin Controller
 */
const adminAuthController = require('./adminController/auth');
const adminFlowController = require("./adminController/flow");

module.exports = {
    /**
     * All Admin Controllers
     */
    adminAuth: adminAuthController,
    adminFlow: adminFlowController,
    /**
     * All User Controllers
     */
    userAuth: userAuthController,
    userInfo: userInfoController,
};
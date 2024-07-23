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

module.exports = {
    /**
     * All Admin Contollers
     */
    adminAuth: adminAuthController,
    /**
     * All User Controllers
     */
    userAuth: userAuthController,
    userInfo: userInfoController,
};
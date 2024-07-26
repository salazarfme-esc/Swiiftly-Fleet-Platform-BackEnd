const Router = require("express").Router();
/**
 * Controllers
 */
const adminAuthController = require("../../controller").adminAuth;
const adminFlowController = require("../../controller").adminFlow;
const adminUserManagementController = require("../../controller").adminUserManagement;

/**
 * Middlewares
 */
const adminAuthenticated = require("../../services/middleware/adminAuthenticate");
const adminValidationSchema = require("../../validation").adminSchema;
const florValidationSchema = require("../../validation").flowSchema;
const userManagementSchema = require("../../validation").userManagementSchema;
const validationMiddleware = require("../../utils/validationMiddleware");

module.exports = () => {
    /**
     * Login Route
     */
    Router.post(
        "/login",
        validationMiddleware(adminValidationSchema.login, "body"),
        adminAuthController.login
    );
    /**********************
     * AUTHORIZED ROUTES
     **********************/
    /**
     * Middleware for Handling Request Authorization
     */
    Router.use("/", adminAuthenticated);
    Router.get("/get-all-admin", adminAuthController.getAllAdmin);
    Router.get("/get-admin/:id", adminAuthController.getSingleAdmin);
    Router.put("/update-admin", validationMiddleware(adminValidationSchema.update_admin, "body"), adminAuthController.updateAdmin);
    Router.post("/add-admin", validationMiddleware(adminValidationSchema.add_admin, "body"), adminAuthController.addAdmin);


    /**
    * Middleware for Handling Flow Requests
    */
    Router.post("/flow-category", validationMiddleware(florValidationSchema.flowCategory, "body"), adminFlowController.addFlowCategory);
    Router.get("/flow-category", adminFlowController.getFlowCategory);
    Router.put("/flow-category/:id", validationMiddleware(florValidationSchema.flowCategory, "body"), adminFlowController.updateFlowCategory);
    Router.post("/flow-question", validationMiddleware(florValidationSchema.flowQuestion, "body"), adminFlowController.addFlowQuestion);
    Router.get("/flow-question", adminFlowController.getFlowQuestion);
    Router.put("/flow-question/:id", validationMiddleware(florValidationSchema.flowQuestion, "body"), adminFlowController.updateFlowQuestion);
    Router.post("/flow", validationMiddleware(florValidationSchema.flow, "body"), adminFlowController.addFlow);
    Router.get("/flow", adminFlowController.getFlow);
    Router.put("/flow/:id", validationMiddleware(florValidationSchema.flow, "body"), adminFlowController.updateFlow);

    /**
   * Middleware for Handling User Management Requests
   */
    Router.post("/user", validationMiddleware(userManagementSchema.addUser, "body"), adminUserManagementController.addUser);
    Router.get("/user", adminUserManagementController.GetUser);
    Router.delete("/user/:id", adminUserManagementController.DeleteUser);



    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/

    return Router;
};
const Router = require("express").Router();
/**
 * Controllers
 */
const adminAuthController = require("../../controller").adminAuth;

/**
 * Middlewares
 */
const adminAuthenticated = require("../../services/middleware/adminAuthenticate");
const adminValidationSchema = require("../../validation").adminSchema;
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
     * Middlerware for Handling Request Authorization
     */
    Router.use("/", adminAuthenticated);
    Router.get("/get-all-admin", adminAuthController.getAlladmin);
    Router.get("/get-admin/:id", adminAuthController.getSingleAdmin);
    Router.put("/update-admin", validationMiddleware(adminValidationSchema.update_admin, "body"), adminAuthController.updateAdmin);
    Router.post("/add-admin", validationMiddleware(adminValidationSchema.add_admin, "body"), adminAuthController.addAdmin);



    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/

    return Router;
};
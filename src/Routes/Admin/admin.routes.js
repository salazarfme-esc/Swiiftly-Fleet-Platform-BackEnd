const Router = require("express").Router();
/**
 * Controllers
 */
const adminAuthController = require("../../controller").adminAuth;
const adminFlowController = require("../../controller").adminFlow;
const adminUserManagementController = require("../../controller").adminUserManagement;
const adminJobController = require("../../controller").adminJob;
const adminMakeAndModel = require("../../controller").makeAndModel;
const adminInvoicesController = require("../../controller").adminInvoices;
const adminFeedbackController = require("../../controller").adminFeedback;

/**
 * Middlewares
 */
const adminAuthenticated = require("../../services/middleware/adminAuthenticate");
const adminValidationSchema = require("../../validation").adminSchema;
const florValidationSchema = require("../../validation").flowSchema;
const userManagementSchema = require("../../validation").userManagementSchema;
const adminJobValidationSchema = require("../../validation").adminJobSchema;
const adminMakeAndModelValidationSchema = require("../../validation").makeAndModel;
const adminInvoicesValidationSchema = require("../../validation").adminInvoicesSchema;
const validationMiddleware = require("../../utils/validationMiddleware");
const multerService = require('../../services/multer');

module.exports = () => {
    /**
     * Login Route
     */
    Router.post(
        "/login",
        validationMiddleware(adminValidationSchema.login, "body"),
        adminAuthController.login
    );
    Router.post(
        "/forgot-password",
        validationMiddleware(adminValidationSchema.forgotPassword, "body"),
        adminAuthController.forgotPasswordByEmail
    );
    Router.post(
        "/verify-otp",
        validationMiddleware(adminValidationSchema.verifyOtp, "body"),
        adminAuthController.verifyOtp
    );
    Router.put(
        "/reset-password",
        validationMiddleware(adminValidationSchema.resetPassword, "body"),
        adminAuthController.resetPassword
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
    Router.put("/update-admin", [multerService.uploadFile('file').single('avatar'), validationMiddleware(adminValidationSchema.update_admin, "body")], adminAuthController.updateAdmin);
    Router.post("/add-admin", validationMiddleware(adminValidationSchema.add_admin, "body"), adminAuthController.addAdmin);
    Router.put("/update-sub-admin/:id", validationMiddleware(adminValidationSchema.update_Sub_Admin, "body"), adminAuthController.updateSubAdmin);
    Router.put("/change-password", validationMiddleware(adminValidationSchema.changePassword, "body"), adminAuthController.changeAdminPassword);
    Router.put("/change-status-sub-admin/:id", validationMiddleware(adminValidationSchema.changeStatusSubAdmin, "query"), adminAuthController.changeStatusSubAdmin);
    Router.delete("/delete-sub-admin/:id", validationMiddleware(adminValidationSchema.deleteSubAdmin, "query"), adminAuthController.deleteSubAdmin);
    Router.get("/dashboard", adminAuthController.getDashboardData);


    // Routes for Make
    Router.post("/add-make", [multerService.uploadFile('file').single('image'), validationMiddleware(adminMakeAndModelValidationSchema.addOrUpdateMake, "body")], adminMakeAndModel.addMake);
    Router.get("/get-all-makes", adminMakeAndModel.getMakes);
    Router.put("/update-make/:id", [multerService.uploadFile('file').single('image'), validationMiddleware(adminMakeAndModelValidationSchema.addOrUpdateMake, "body")], adminMakeAndModel.updateMake);
    Router.delete("/delete-make/:id", adminMakeAndModel.deleteMake);

    // Routes for Model
    Router.post("/add-model", [multerService.uploadFile('file').single('image'), validationMiddleware(adminMakeAndModelValidationSchema.addOrUpdateModel, "body")], adminMakeAndModel.addModel);
    Router.get("/get-all-models", adminMakeAndModel.getModels);
    Router.put("/update-model/:id", [multerService.uploadFile('file').single('image'), validationMiddleware(adminMakeAndModelValidationSchema.addOrUpdateModel, "body")], adminMakeAndModel.updateModel);
    Router.delete("/delete-model/:id", adminMakeAndModel.deleteModel);

    /**
    * Middleware for Handling Flow Requests
    */
    Router.post("/flow-category", validationMiddleware(florValidationSchema.flowCategory, "body"), adminFlowController.addFlowCategory);
    Router.get("/flow-category", adminFlowController.getFlowCategory);
    Router.put("/flow-category/:id", validationMiddleware(florValidationSchema.flowCategory, "body"), adminFlowController.updateFlowCategory);
    Router.get("/flow-category-detail/:id", adminFlowController.getFlowCategoryById);
    Router.delete("/flow-category/:id", adminFlowController.deleteFlowCategory);
    Router.post("/flow-question", validationMiddleware(florValidationSchema.flowQuestion, "body"), adminFlowController.addFlowQuestion);
    Router.get("/flow-question", adminFlowController.getFlowQuestion);
    Router.put("/flow-question/:id", validationMiddleware(florValidationSchema.flowQuestion, "body"), adminFlowController.updateFlowQuestion);
    Router.get("/flow-question-detail/:id", adminFlowController.getFlowQuestionById);
    Router.delete("/flow-question/:id", adminFlowController.deleteFlowQuestion);
    Router.post("/flow", validationMiddleware(florValidationSchema.flow, "body"), adminFlowController.addFlow);
    Router.get("/flow", adminFlowController.getFlow);
    Router.put("/flow/:id", validationMiddleware(florValidationSchema.flow, "body"), adminFlowController.updateFlow);
    Router.get("/flow-detail/:categoryId", adminFlowController.getFlowByCategoryId);
    Router.put("/update-status-flow/:id", validationMiddleware(florValidationSchema.flowPublish, "body"), adminFlowController.publishFLow);

    Router.put("/flow-sequence", validationMiddleware(florValidationSchema.updateFlowSequence, "body"), adminFlowController.UpdateFlowSequence);
    Router.delete("/flow-sequence", validationMiddleware(florValidationSchema.deleteFlowItem, "body"), adminFlowController.DeleteFlowBySequence);

    /**
   * Middleware for Handling User Management Requests
   */
    Router.post("/user", [multerService.uploadFile('file').fields([{ name: 'blank_check_or_bank_letter', max: 1 }, { name: 'w9_document', max: 1 }]), validationMiddleware(userManagementSchema.addUser, "body")], adminUserManagementController.addUser);
    Router.get("/user", adminUserManagementController.GetUser);
    Router.get("/user-vehicle/:userId", adminUserManagementController.GetUserVehiclesData);
    Router.delete("/user/:id", adminUserManagementController.DeleteUser);
    Router.get("/user-detail/:userId", adminUserManagementController.GetUserDetail);
    Router.put("/vendor-update-status/:userId", validationMiddleware(userManagementSchema.UpdateVendorStatus, "body"), adminUserManagementController.UpdateVendorStatus);
    Router.put("/vendor-update-info/:userId", multerService.uploadFile('file').fields([{ name: 'blank_check_or_bank_letter', max: 1 }, { name: 'w9_document', max: 1 }]), validationMiddleware(userManagementSchema.UpdateVendorInfo, "body"), adminUserManagementController.UpdateVendorInfo);

    /**
   * Middleware for Handling Job Requests
   */
    Router.get("/request", adminJobController.getRequests);
    Router.get("/todo-request", adminJobController.getAcceptedJobs);
    Router.put("/accept-or-reject/:root_ticket_id", validationMiddleware(adminJobValidationSchema.acceptOrRejectRequest, "body"), adminJobController.AcceptRejectRequest);
    Router.put("/child-sequence-update/:root_ticket_id", validationMiddleware(adminJobValidationSchema.updateSubJobSequence, "body"), adminJobController.UpdateSubJobSequence);
    Router.put("/assign-vendor", validationMiddleware(adminJobValidationSchema.assignVendorToSubTicket, "body"), adminJobController.AssignVendorToSubTicket);
    Router.get("/vendor-child-tickets", adminJobController.getVendorChildTickets);
    Router.get("/company-fleet-jobs", adminJobController.GetCompanyFleetJobs);
    Router.get("/company-fleet-job/:job_id", adminJobController.GetCompanyFleetJobByID);
    Router.get("/company-fleet-child-ticket/:root_ticket_id", adminJobController.GetCompanyFleetChildTicket);

    // Invoices Routes
    Router.get("/vendor-invoices", adminInvoicesController.getVendorInvoices);
    Router.put("/update-invoice/:invoiceId", validationMiddleware(adminInvoicesValidationSchema.updateInvoice, "body"), adminInvoicesController.updateInvoice);
    Router.get("/invoice/:invoiceId", adminInvoicesController.getInvoiceById);
    Router.get("/fleet-invoices", adminInvoicesController.getFleetInvoices);
    Router.get("/fleet-invoices/:invoiceId", adminInvoicesController.getFleetInvoiceById);
    Router.put("/update-fleet-invoice/:invoiceId", validationMiddleware(adminInvoicesValidationSchema.updateFleetInvoice, "body"), adminInvoicesController.updateFleetInvoice);

    // Feedback Routes
    Router.get("/feedback", adminFeedbackController.getAllFeedbacks);
    Router.get("/feedback/:feedbackId", adminFeedbackController.getDetailedFeedback);



    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/

    return Router;
};
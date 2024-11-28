const Router = require('express').Router();
/**
 * All Controllers
 */
const userAuthController = require('../../controller').userAuth;
const userInfoController = require('../../controller').userInfo;
const userVehicleController = require("../../controller").userVehicle;
const userJobController = require("../../controller").userJob;
const userInvoicesController = require("../../controller").userInvoices;
const userFeedbackController = require("../../controller").userFeedback;
/**
 * All Middlewares
 */
const userAuthenticated = require('../../services/middleware/userAuthenticate');
const verificationAuthenticated = require('../../services/middleware/verification');
const userValidationSchema = require('../../validation').authSchema;
const userInfoValidationSchema = require('../../validation').userInfoSchema;
const vehicleValidationSchema = require("../../validation").vehicleSchema;
const jobValidationSchema = require("../../validation").jobSchema;
const userInvoicesValidationSchema = require("../../validation").userInvoicesSchema;
const feedbackValidationSchema = require("../../validation").feedbackSchema;
const validationMiddleware = require('../../utils/validationMiddleware');
const multerService = require('../../services/multer');
module.exports = () => {

    /***************************
     * UPLOAD FILE ROUTES 
     ***************************/

    Router.post('upload', multerService.uploadFile('file').single('file'), (req, res) => {
        return res.send(req.file.location);
    });



    /***************************
     * START UNAUTHORIZED ROUTES
     ***************************/
    /*
    **Login and Signup Route
    */
    Router.post(
        '/login',
        validationMiddleware(userValidationSchema.login, 'body'),
        userAuthController.login
    );

    Router.post(
        '/signup',
        validationMiddleware(userValidationSchema.signup, 'body'),
        userAuthController.signup
    );
    /**
     * Email verification Route
     */
    Router.post(
        '/verify-otp', [
        validationMiddleware(userValidationSchema.verifyOtp, 'body'),
    ],
        userAuthController.verifyOtp
    );
    /**
    * Resend Otp Route
    */
    Router.post(
        '/resend-otp', [
        validationMiddleware(userValidationSchema.resendOtp, 'body'),
    ],
        userAuthController.resendOtp
    );
    /**
    * Forgot Password Route
    */
    Router.post(
        '/forgot-password', [
        validationMiddleware(userValidationSchema.forgotPassword, 'body'),
    ],
        userAuthController.forgotPassword
    );


    /**
        * Make And Model Route
     */
    Router.get("/get-models/:id", userVehicleController.getModels);
    Router.get("/get-makes", userVehicleController.getMakes);

    /****************************
     * END OF UNAUTHORIZED ROUTES
     ****************************/

    /**********************
     * AUTHORIZED ROUTES
     **********************/
    /**
     * Middlerware for Handling Request Authorization
     */
    Router.use('/', userAuthenticated);

    /**
     * Routes for handling user profile
     */
    Router.put(
        '/reset-password',
        validationMiddleware(userValidationSchema.resetPassword, 'body'),
        userAuthController.ResetPassword
    );
    Router.get('/profile', userInfoController.profile);
    Router.put('/update-profile', [multerService.uploadFile('file').single('avatar'), validationMiddleware(userInfoValidationSchema.updateProfile, 'body')], userInfoController.updateProfile);
    Router.put('/update-vendor-profile', [multerService.uploadFile('file').fields([{ name: 'avatar', max: 1 }, { name: 'blank_check_or_bank_letter', max: 1 }, { name: 'w9_document', max: 1 }]), validationMiddleware(userInfoValidationSchema.updateVendorProfileValidation, 'body')], userInfoController.updateVendorProfile);
    Router.put('/update-vendor-profile-status', userInfoController.updateVendorProfileStatus);

    /**
     * Routes for handle change password
     */
    Router.put('/change-password', validationMiddleware(userInfoValidationSchema.changePassword, 'body'), userInfoController.changePassword);


    /**
     * Routes for handle vehicle
     */
    Router.post('/vehicle', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }, { name: 'document', max: 5 }]), validationMiddleware(vehicleValidationSchema.addVehicle, 'body')], userVehicleController.AddVehicle);
    Router.post('/bulk-vehicle', multerService.uploadFile('file').single('vehicle'), userVehicleController.BulkUploadVehicles);
    Router.post('/vehicle/search', validationMiddleware(vehicleValidationSchema.searchVehicle, 'body'), userVehicleController.GetVehicle);
    Router.put('/vehicle/:id', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }, { name: 'document', max: 5 }]), validationMiddleware(vehicleValidationSchema.updateVehicle, 'body')], userVehicleController.UpdateVehicle);
    Router.post('/delete-vehicle', validationMiddleware(vehicleValidationSchema.deleteVehicles, 'body'), userVehicleController.BulkDeleteVehicles);
    Router.post('/brand-vehicle', validationMiddleware(vehicleValidationSchema.getBrandStatisticsValidation, 'body'), userVehicleController.GetBrandStatistics);
    Router.post('/brand-vehicle-list', validationMiddleware(vehicleValidationSchema.getCarsByBrandStatusValidation, 'body'), userVehicleController.GetCarsByBrandStatus);
    Router.get('/get-vehicle/:vehicleId', userVehicleController.GetVehicleDetail);
    Router.post('/delete-vehicle-media', validationMiddleware(vehicleValidationSchema.deleteVehiclesMedias, 'body'), userVehicleController.DeleteVehicleMedia);




    /**
    * Routes for handle Jobs
    */
    Router.get('/service-type', userJobController.getFlow);
    Router.get('/service-type-category', userJobController.getFlowCategory);
    Router.post('/root-ticket', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }]), validationMiddleware(jobValidationSchema.addMainJob, 'body')], userJobController.CreateTicket);
    Router.post('/child-ticket', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }]), validationMiddleware(jobValidationSchema.addSubJob, 'body')], userJobController.CreateSubTicket);
    Router.post('/request', validationMiddleware(jobValidationSchema.submitRequest, 'body'), userJobController.SubmitRequest);
    Router.delete('/delete-draft-request/:root_ticket_id', userJobController.DeleteDraftRequest);
    Router.get('/root-ticket', userJobController.GetRootTicket);
    Router.get('/root-ticket/:root_ticket_id', userJobController.GetRootTicketByID);
    Router.get('/child-ticket/:root_ticket_id', userJobController.GetChildTicket);
    Router.get('/vendor/child-ticket-request', userJobController.GetVendorChildTicketRequest);
    Router.get('/vendor/child-ticket', userJobController.GetVendorChildTicket);
    Router.put('/vendor/accept-reject', validationMiddleware(jobValidationSchema.vendorAcceptOrRejectJob, 'body'), userJobController.VendorAcceptOrRejectJob);
    Router.put('/vendor/status', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }]), validationMiddleware(jobValidationSchema.vendorUpdateJobStatusSchema, 'body')], userJobController.VendorUpdateJobStatus);


    /**
     * Routes for handle invoices
     */
    Router.get('/invoices', userInvoicesController.getVendorInvoices);
    Router.get('/invoices/:invoiceId', userInvoicesController.getVendorInvoiceById);
    Router.put('/invoices/:invoiceId', validationMiddleware(userInvoicesValidationSchema.updateInvoice, 'body'), userInvoicesController.updateInvoice);
    Router.get('/fleet-invoices', userInvoicesController.getFleetInvoices);
    Router.get('/fleet-invoices/:invoiceId', userInvoicesController.getFleetInvoiceById);


    /**
     * Routes for handle feedback
     */
    Router.post('/feedback', validationMiddleware(feedbackValidationSchema.feedback, 'body'), userFeedbackController.giveFeedback);



    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/
    return Router;
};
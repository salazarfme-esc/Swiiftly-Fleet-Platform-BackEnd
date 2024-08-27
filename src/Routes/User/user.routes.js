const Router = require('express').Router();
/**
 * All Controllers
 */
const userAuthController = require('../../controller').userAuth;
const userInfoController = require('../../controller').userInfo;
const userVehicleController = require("../../controller").userVehicle;
const userJobController = require("../../controller").userJob;
/**
 * All Middlewares
 */
const userAuthenticated = require('../../services/middleware/userAuthenticate');
const verificationAuthenticated = require('../../services/middleware/verification');
const userValidationSchema = require('../../validation').authSchema;
const userInfoValidationSchema = require('../../validation').userInfoSchema;
const vehicleValidationSchema = require("../../validation").vehicleSchema;
const jobValidationSchema = require("../../validation").jobSchema;
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
    // Router.put('update_profile', [multerService.uploadFile('file').single('user_avatar'), validationMiddleware(userInfoValidationSchema.updateProfile, 'body')], userInfoController.updateProfile);

    /**
     * Routes for handle change password
     */
    Router.put('/change-password', validationMiddleware(userInfoValidationSchema.changePassword, 'body'), userInfoController.changePassword);


    /**
     * Routes for handle vehicle
     */
    Router.post('/vehicle', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }, { name: 'document', max: 5 }]), validationMiddleware(vehicleValidationSchema.addVehicle, 'body')], userVehicleController.AddVehicle);
    Router.post('/vehicle/search', validationMiddleware(vehicleValidationSchema.searchVehicle, 'body'), userVehicleController.GetVehicle);
    Router.put('/vehicle/:id', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }, { name: 'document', max: 5 }]), validationMiddleware(vehicleValidationSchema.addVehicle, 'body')], userVehicleController.UpdateVehicle);
    Router.delete('/vehicle/:id', userVehicleController.DeleteVehicle);

    /**
    * Routes for handle Jobs
    */
    Router.get('/service-type', userJobController.getFlow);
    Router.post('/root-ticket', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }]), validationMiddleware(jobValidationSchema.addMainJob, 'body')], userJobController.CreateTicket);
    Router.post('/child-ticket', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }]), validationMiddleware(jobValidationSchema.addSubJob, 'body')], userJobController.CreateSubTicket);
    Router.post('/request', validationMiddleware(jobValidationSchema.submitRequest, 'body'), userJobController.SubmitRequest);
    Router.get('/root-ticket', userJobController.GetRootTicket);
    Router.get('/child-ticket/:root_ticket_id', userJobController.GetChildTicket);

    Router.get('/vendor/child-ticket-request', userJobController.GetVendorChildTicketRequest);
    Router.get('/vendor/child-ticket', userJobController.GetVendorChildTicket);
    Router.put('/vendor/accept-reject', validationMiddleware(jobValidationSchema.vendorAcceptOrRejectJob, 'body'), userJobController.VendorAcceptOrRejectJob);
    Router.put('/vendor/status', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }]), validationMiddleware(jobValidationSchema.vendorUpdateJobStatusSchema, 'body')], userJobController.VendorUpdateJobStatus);





    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/
    return Router;
};
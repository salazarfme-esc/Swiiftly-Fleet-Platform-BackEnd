const Router = require('express').Router();
/**
 * All Controllers
 */
const userAuthController = require('../../controller').userAuth;
const userInfoController = require('../../controller').userInfo;
const userVehicleController = require("../../controller").userVehicle;
/**
 * All Middlewares
 */
const userAuthenticated = require('../../services/middleware/userAuthenticate');
const verificationAuthenticated = require('../../services/middleware/verification');
const userValidationSchema = require('../../validation').authSchema;
const userInfoValidationSchema = require('../../validation').userInfoSchema;
const vehicleValidationSchema = require("../../validation").vehicleSchema
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
    Router.post('/vehicle', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }]), validationMiddleware(vehicleValidationSchema.addVehicle, 'body')], userVehicleController.AddVehicle);
    Router.get('/vehicle', userVehicleController.GetVehicle);
    Router.put('/vehicle/:id', [multerService.uploadFile('file').fields([{ name: 'media', max: 5 }]), validationMiddleware(vehicleValidationSchema.addVehicle, 'body')], userVehicleController.UpdateVehicle);
    Router.delete('/vehicle/:id', userVehicleController.DeleteVehicle);

    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/
    return Router;
};
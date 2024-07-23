const Router = require('express').Router();
/**
 * All Controllers
 */
const userAuthController = require('../../controller').userAuth;
const userInfoController = require('../../controller').userInfo;
/**
 * All Middlewares
 */
const userAuthenticated = require('../../services/middleware/userAuthenticate');
const verificationAuthenticated = require('../../services/middleware/verification');
const userValidationSchema = require('../../validation').authSchema;
const userInfoValidationSchema = require('../../validation').userInfoSchema;
const validationMiddleware = require('../../utils/validationMiddleware');
const multerService = require('../../services/multer');
module.exports = () => {

    /***************************
     * UPLOAD FILE ROUTES 
     ***************************/
   
    Router.post('/user/upload',multerService.uploadFile('file').single('file'), (req, res) => {
        return res.send(req.file.location);
    });
    


    /***************************
     * START UNAUTHORIZED ROUTES
     ***************************/
    /*
     **Login and Signup Route
     */
    Router.post(
        '/user/login',
        validationMiddleware(userValidationSchema.login, 'body'),
        userAuthController.login
    );

    Router.post(
        '/user/signup',
        validationMiddleware(userValidationSchema.signup, 'body'),
        userAuthController.signup
    );
    Router.post(
        '/user/forgot/password',
        validationMiddleware(userValidationSchema.forgotPassword, 'body'),
        userAuthController.forgotPassword
    );
    Router.post(
        '/user/reset/password', [
            validationMiddleware(userValidationSchema.resetPassword, 'body'),
        ],
        userAuthController.resetPassword
    );
    // Router.post(
    //     '/user/forgot/passwordMobile',
    //     validationMiddleware(userValidationSchema.forgotPasswordMobile, 'body'),
    //     userAuthController.forgotPasswordMobile
    // );


    /**
     * Driver unautherised routes
     */
    //  Router.post('/save_driver',[multerService.uploadFile('file').single('resume'),validationMiddleware(driverValidationSchema.saveDriver, 'body')],userDriverController.save_driver);


    /**
     * Social Login
     */
    Router.post(
        '/user/social/login',
        validationMiddleware(userValidationSchema.socialLogin, 'body'),
        userAuthController.socialLogin
    );
    /**
     * Email verification Route
     */
    Router.get(
        '/email/u/verification', [
            validationMiddleware(userValidationSchema.verifyEmail, 'query'),
            verificationAuthenticated,
        ],
        userAuthController.verifyEmail
    );

    Router.post(
        '/reg/email/u/verification',
        validationMiddleware(userValidationSchema.resendEmailVerification, 'body'),
        userAuthController.resendEmailVerification
    );

    /**
     * Mobile verification Route
     * */
    // Router.post(
    //     '/reg/mobile/u/verification',
    //     validationMiddleware(userValidationSchema.verifyPhone, 'body'),
    //     userAuthController.mobileverify
    // );

    // Router.post(
    //     '/reg/mobile/u/verification-password',
    //     validationMiddleware(userValidationSchema.verifyPhone, 'body'),
    //     userAuthController.verifyOtpForPassword
    // );

    /**
     * Mobile verification Route
     * */
    // Router.post(
    //     '/resend/mobile/verification',
    //     userAuthController.resendOtp
    // );

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
    Router.get('/user/profile', userInfoController.profile);
    Router.put('/user/update_profile', [multerService.uploadFile('file').single('user_avatar'), validationMiddleware(userInfoValidationSchema.updateProfile, 'body')], userInfoController.updateProfile);
    
    /**
     * Routes for handle change password
     */
    Router.put('/user/change_password', validationMiddleware(userInfoValidationSchema.changePassword, 'body'), userInfoController.changePassword);

    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/
    return Router;
};
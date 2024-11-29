'use strict';
const logger = require('../../../services/logger');
const log = new logger('AuthController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const config = require('../../../config/environments');
const jwtService = require('../../../services/jwt');
const emailService = require('../../../services/sendEmail');
const socialLoginService = require('../../../services/socialLogin');
const responseHelper = require('../../../services/customResponse');
const templates = require('../../../utils/templates/template');
const userDbHandler = dbService.User;
const verificationDbHandler = dbService.Verification;
/*******************
 * PRIVATE FUNCTIONS
 ********************/
/**
 * Method to Compare password
 */
let _comparePassword = (reqPassword, userPassword) => {
    return new Promise((resolve, reject) => {
        //compare password with bcrypt method, password and hashed password both are required
        bcrypt.compare(reqPassword, userPassword, function (err, isMatch) {
            if (err) reject(err);
            resolve(isMatch);
        });
    });
};
/**
 * Method to generate jwt token
 */
let _generateUserToken = (tokenData) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtAuthenticationToken(tokenData);
    return token;
};
/**
 * Method to generate jwt token
 */
let _generateVerificationToken = (tokenData, verification_type) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtVerificationToken(tokenData, verification_type);
    return token;
};
/**
 * Method to update user Email verification Database
 */
let _handleVerificationDataUpdate = async (id) => {
    log.info('Received request for deleting verification token::', id);
    let deletedInfo = await verificationDbHandler.deleteVerificationById(id);
    return deletedInfo;
};

let _encryptPassword = (password) => {
    let salt = config.bcrypt.saltValue;
    // generate a salt
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(salt, function (err, salt) {
            if (err) reject(err);
            // hash the password with new salt
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) reject(err);
                // override the plain password with the hashed one
                resolve(hash);
            });
        });
    });
};
/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {
    /**
     * Method to handle user login
     */
    login: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for User Login:', reqObj);
        let responseData = {};
        try {
            let query = {
                email: reqObj.email.toLowerCase(),
                user_role: reqObj.user_role
            }
            let getUser = await userDbHandler.getByQuery(query).lean().populate("service_type");
            if (!getUser.length) {
                responseData.msg = "Invalid email ID. Please provide a valid one.";
                return responseHelper.error(res, responseData);
            }

            let checkPassword = await _comparePassword(reqObj.password, getUser[0].password);
            if (!checkPassword) {
                responseData.msg = "Incorrect password. Please try again.";
                return responseHelper.error(res, responseData);
            }
            if (getUser[0].is_delete) {
                responseData.msg = "Your account has been deleted. For further queries please contact us!";
                return responseHelper.error(res, responseData);
            }
            if (!getUser[0].email_verified) {

                let verification_type = 'email';
                let verification_for = 'user';
                //generate email verification OTP
                let digits = '0123456789';
                let OTP = '';
                for (let i = 0; i < 6; i++) {
                    OTP += digits[Math.floor(Math.random() * 10)];
                }
                //send verification email after User successfully created
                //patch email verification templateBody
                let templateBody = {
                    otp: OTP,
                    email: getUser[0].email,
                    name: getUser[0].full_name

                };
                let emailBody = {
                    recipientsAddress: getUser[0].email,
                    subject: 'Security Code for Account Verification',
                    body: templates.otpVerification(templateBody)
                };
                let emailInfo = await emailService.sendEmail(emailBody);
                if (emailInfo) {
                    let verificationObj = {
                        otp: OTP,
                        user_id: getUser[0]._id,
                        verification_type: verification_type,
                        verification_for: verification_for
                    };
                    let verificationData = await verificationDbHandler.getByQuery({ user_id: getUser[0]._id })
                    log.info('new email verification entry created successfully in the database', verificationData);
                    if (verificationData.length) {
                        verificationObj.attempts = verificationData[0].attempts + 1,

                            await verificationDbHandler.updateById(verificationData[0]._id, verificationObj);
                    }
                    else {
                        verificationObj.attempts = 1,

                            await verificationDbHandler.create(verificationObj);
                    }
                }
                responseData.msg = "Please verify your Email-Id to continue. Check your email inbox for verification code.";
                responseData.data = { email_verified: getUser[0].email_verified }
                return responseHelper.success(res, responseData);
            }
            let tokenData = {
                sub: getUser[0]._id,
                email: getUser[0].email,
                phone_number: getUser[0].phone_number
            };
            let token = _generateUserToken(tokenData);
            getUser[0].token = token;

            responseData.msg = `Logged In!`;
            responseData.data = getUser[0];
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to login with error::', error);
            responseData.msg = 'failed to login';
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle user signup
     */
    signup: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for User Signup:', reqObj);
        let responseData = {};
        console.log(reqObj);
        try {
            let checkEmail = await userDbHandler.getByQuery({ email: reqObj.email.toLowerCase() });
            let checkPhoneNumber = await userDbHandler.getByQuery({ phone_number: reqObj.phone_number });
            if (checkEmail.length) {
                responseData.msg = 'Email Already Exist !!!';
                return responseHelper.error(res, responseData);
            }
            if (checkPhoneNumber.length) {
                responseData.msg = 'Phone Number Already Exist !!!';
                return responseHelper.error(res, responseData);
            }
            let submitData = {
                email: reqObj.email.toLowerCase(),
                phone_number: reqObj.phone_number,
                password: reqObj.password,
                dob: reqObj.dob,
                company_name: reqObj.company_name,
                full_name: reqObj.full_name,
                user_role: "fleet",
                login_way: "local",
                device_type: "1",

            }
            let newUser = await userDbHandler.createUser(submitData);
            log.info('User created in the database collection', newUser);

            let verification_type = 'email';
            let verification_for = 'user';
            //generate email verification OTP
            let digits = '0123456789';
            let OTP = '';
            for (let i = 0; i < 6; i++) {
                OTP += digits[Math.floor(Math.random() * 10)];
            }
            //send verification email after User successfully created
            //patch email verification templateBody
            let templateBody = {
                otp: OTP,
                email: newUser.email,
                name: newUser.full_name
            };
            let emailBody = {
                recipientsAddress: newUser.email,
                subject: 'Security Code for Account Verification',
                body: templates.otpVerification(templateBody)
            };
            let emailInfo = await emailService.sendEmail(emailBody);
            if (emailInfo) {
                let verificationObj = {
                    otp: OTP,
                    user_id: newUser._id,
                    verification_type: verification_type,
                    verification_for: verification_for
                };
                let verificationData = await verificationDbHandler.getByQuery({ user_id: newUser._id })
                log.info('new email verification entry created successfully in the database', verificationData);
                if (verificationData.length) {
                    verificationObj.attempts = verificationData[0].attempts + 1,

                        await verificationDbHandler.updateById(verificationData[0]._id, verificationObj);
                }
                else {
                    verificationObj.attempts = 1,

                        await verificationDbHandler.create(verificationObj);
                }
            }
            responseData.msg = `Please check your email inbox for verification code.`;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to get user signup with error::', error);
            responseData.msg = 'failed to create user';
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle forgot password by email
     */
    forgotPassword: async (req, res) => {
        let reqBody = req.body;
        log.info('Received request for User forgot password:', reqBody);
        let userEmail = reqBody.email.toLowerCase();
        let responseData = {};
        let isVerificationDataExists = false;
        try {
            let query = {
                email: userEmail,
                login_way: 'local',
            };
            let userData = await userDbHandler.getByQuery(query);
            if (!userData.length) {
                log.error('user email does not exist for forget password request');
                responseData.msg = 'This Email ID does not exist. Please try again with different Email ID!';
                return responseHelper.error(res, responseData);
            }
            if (userData[0].is_delete) {
                responseData.msg = "Your account has been deleted. For further queries please contact us!";
                return responseHelper.error(res, responseData);
            }

            let passwordQuery = {
                user_id: userData[0]._id,
                verification_for: "user",
                verification_type: 'password',
            };
            let passwordTokenInfo = await verificationDbHandler.getByQuery(passwordQuery);
            let digits = '0123456789';
            let OTP = '';
            for (let i = 0; i < 6; i++) {
                OTP += digits[Math.floor(Math.random() * 10)];
            }
            //let OTP='1234';

            let otpBody = {
                otp: OTP,
                name: userData[0].full_name

            };

            //if password verification data found update it with new token, else create new entry

            if (passwordTokenInfo.length) {

                isVerificationDataExists = true;
                let updatePasswordVerificationObj = {
                    attempts: passwordTokenInfo[0].attempts + 1,
                    otp: otpBody.otp
                };

                let updatedVerificationData = await verificationDbHandler.updateById(passwordTokenInfo[0]._id, updatePasswordVerificationObj);
                log.info('password verification updated in the db', updatedVerificationData);
            }


            let emailBody = {
                recipientsAddress: userData[0].email,
                subject: 'Verification Code for Reset-Password Process',
                body: templates.ResetOtpVerification(otpBody)
            };

            let emailInfo = await emailService.sendEmail(emailBody);
            if (!isVerificationDataExists) {

                let passwordResetObj = {
                    user_id: userData[0]._id,
                    verification_for: passwordQuery.verification_for,
                    verification_type: passwordQuery.verification_type,
                    otp: otpBody.otp
                };
                console.log("🚀 ~ file: index.js:372 ~ forgotPassword: ~ passwordResetObj:", passwordResetObj)
                let newPasswordVerification = await verificationDbHandler.create(passwordResetObj);
                log.info('new forgot password entry created successfully in the database', newPasswordVerification);
            }
            responseData.msg = `Please check your email inbox for verification code.`;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to process forget password request with error::', error);
            responseData.msg = 'failed to process forget password request';
            return responseHelper.error(res, responseData);
        }
    },

    /**
 *  Method to handle otp verify
 */
    verifyOtp: async (req, res) => {
        let reqBody = req.body;
        log.info('Received request for email verification ::', reqBody);
        let responseData = {};
        let user_email = reqBody.email.toLowerCase();
        try {
            let userData = await userDbHandler.getByQuery({ email: user_email, is_delete: false });
            if (!userData.length) {
                responseData.msg = "Something went wrong. Please try again later!"
                responseHelper.error(res, responseData);
            }
            let query = {
                user_id: userData[0]._id,
                verification_type: 'user',
                otp: reqBody.otp,
                verification_type: reqBody.type
            };
            let OtpInfo = await verificationDbHandler.getByQuery(query);
            if (!OtpInfo.length) {
                responseData.msg = 'Invalid verification code!';
                return responseHelper.error(res, responseData);
            }
            //update user email verification status
            let userId = OtpInfo[0].user_id;
            let updateObj = {};
            if (reqBody.type == "email") {
                updateObj.email_verified = true;
            }
            else if (reqBody.type == "password") {
                updateObj.forgot_password = true;
            }

            let updatedUser = await userDbHandler.updateById(userId, updateObj).lean();
            if (!updatedUser) {
                log.info('failed to verify user email');
                responseData.msg = 'failed to verify email';
                return responseHelper.error(res, responseData);
            }
            log.info('user email verification status updated successfully', updatedUser);
            OtpInfo[0].otp = "";
            let updatedOtpInfo = await OtpInfo[0].save();
            let tokenData = {
                phone_number: updatedUser.phone_number,
                sub: updatedUser._id,
                email: updatedUser.email
            };
            //generate jwt token with the token obj
            let jwtToken = _generateUserToken(tokenData);
            updatedUser.token = jwtToken
            responseData.msg = 'Otp verified successfully';
            if (reqBody.type == "email") {
                responseData.data = updatedUser;
            }
            else if (reqBody.type == "password") {
                responseData.data = { token: jwtToken };
            }
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to process mobile verification::', error);
            responseData.msg = 'failed to verify email';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to resend otp
     * */
    resendOtp: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        let user_email = reqObj.email.toLowerCase();
        try {
            let query = { email: user_email }
            let userData = await userDbHandler.getByQuery(query);
            if (!userData.length) {
                responseData.msg = 'Email is not registered. Please register yourself!';
                return responseHelper.error(res, responseData);
            }
            if (userData[0].is_delete) {
                responseData.msg = "Your account has been deleted. For further queries please contact us!";
                return responseHelper.error(res, responseData);
            }


            let digits = '0123456789';
            let OTP = '';
            for (let i = 0; i < 6; i++) {
                OTP += digits[Math.floor(Math.random() * 10)];
            }
            let otpBody = {
                otp: OTP,
                name: userData[0].full_name

            };
            let emailBody = {
                recipientsAddress: userData[0].email,
                subject: reqObj.type === "email" ? "Verification Code for Account Registration" : "Verification Code for Reset-Password Process",
                body: reqObj.type === "email" ? templates.otpVerification(otpBody) : templates.ResetOtpVerification(otpBody)
            };

            let emailInfo = await emailService.sendEmail(emailBody);

            if (emailInfo) {
                let verificationObj = {
                    otp: OTP,
                    user_id: userData[0]._id,
                    verification_type: "user",
                    verification_type: reqObj.type
                };
                let verificationData = await verificationDbHandler.getByQuery({ user_id: userData[0]._id, verification_type: reqObj.type })
                if (verificationData.length) {
                    verificationObj.attempts = verificationData[0].attempts + 1,

                        await verificationDbHandler.updateById(verificationData[0]._id, verificationObj);
                }
                else {
                    verificationObj.attempts = 1,

                        await verificationDbHandler.create(verificationObj);
                }
            }
            responseData.msg = `Please check your email inbox for verification code.`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error("failed to resend otp with error ::", error);
            responseData.msg = 'failed to resend Otp';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to Reset Password
     * */
    ResetPassword: async (req, res) => {
        let reqObj = req.body;
        let user = req.user;
        let id = user.sub;
        log.info('Received request for User Reset Password:', reqObj);
        let responseData = {};
        try {
            let getUser = await userDbHandler.getByQuery({ _id: id, is_delete: false }).lean();
            if (!getUser.length) {
                responseData.msg = 'Something went wrong. Please try again later!';
                return responseHelper.error(res, responseData);
            }
            // if (getUser[0].is_blocked == true) {
            //     responseData.msg = `You are blocked, Please contact support!`;
            //     return responseHelper.error(res, responseData);
            // }
            if (!getUser[0].forgot_password) {
                responseData.msg = "Something went wrong. Please try again later!";
                return responseHelper.error(res, responseData);
            }
            let tokenData = {
                sub: getUser[0]._id,
                email: getUser[0].email,
                full_name: getUser[0].full_name
            };
            let token = _generateUserToken(tokenData);

            let updateObjData = {
                password: await _encryptPassword(reqObj.new_password),
                temporary_password: false
            }
            let updateUser1 = await userDbHandler.updateById(getUser[0]._id, updateObjData)
            getUser[0].token = token
            responseData.msg = `Password saved!`;
            responseData.data = getUser[0];
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to update with error::', error);
            responseData.msg = 'Something went wrong. Please try again later!';
            return responseHelper.error(res, responseData);
        }
    }
};
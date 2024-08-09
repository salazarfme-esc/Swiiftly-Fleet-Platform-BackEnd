'use strict';
const logger = require('../../../services/logger');
const log = new logger('AdminAuthController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
const adminDbHandler = dbService.Admin;
const contactInfoDbHandler = dbService.ContactInfo;
const verificationDbHandler = dbService.AdminVerification;
const config = require('../../../config/environments');
const templates = require('../../../utils/templates/template');
const emailService = require('../../../services/sendEmail');
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

// Method to create hash password on update
let _createHashPassword = async (password) => {
    let salt = config.bcrypt.saltValue;
    const saltpass = await bcrypt.genSalt(salt);
    // now we set user password to hashed password
    let hashedPassword = await bcrypt.hash(password, saltpass);
    return hashedPassword;
}

/**
 * Method to generate jwt token
 */
let _generateAdminToken = (tokenData) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtAdminAuthenticationToken(tokenData);
    return token;
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
     * Method to handle admin login
     */
    login: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for Admin Login:', reqObj);
        let responseData = {};
        try {
            let emails = [
                'admin@swiiftly.com'
            ];
            let query = {
                email: reqObj.email
            };
            //check if admin email is present in the database, then only login request will process
            let adminData = await adminDbHandler.getByQuery(query).lean();
            //if no admin found, return error
            if (adminData.length) {
                log.info('Admin login found', adminData);
                let reqPassword = reqObj.password;
                let adminPassword = adminData[0].password;
                //compare req body password and user password,
                let isPasswordMatch = await _comparePassword(reqPassword, adminPassword);
                //if password does not match, return error
                if (!isPasswordMatch) {
                    responseData.msg = 'Incorrect Password';
                    return responseHelper.error(res, responseData);
                }
                //patch token data obj
                let tokenData = {
                    sub: adminData[0]._id,
                    email: adminData[0].email
                };
                await adminDbHandler.updateById(adminData[0]._id, { last_login: new Date() });
                //update the response Data
                //generate jwt token with the token obj
                let jwtToken = _generateAdminToken(tokenData);
                adminData[0].token = jwtToken;
                responseData.msg = 'Welcome';
                responseData.data = adminData[0];
                return responseHelper.success(res, responseData);
            } else if (emails.includes(reqObj.email)) {
                reqObj.last_login = new Date();
                reqObj.role = "1";
                let newAdmin = await adminDbHandler.create(reqObj);
                log.info('new admin login created', newAdmin);
                //patch token data obj
                let tokenData = {
                    sub: newAdmin._id,
                    email: newAdmin.email
                };
                //update the response Data
                //generate jwt token with the token obj
                newAdmin = await adminDbHandler.getById(newAdmin._id).lean();
                let jwtToken = _generateAdminToken(tokenData);
                newAdmin.token = jwtToken;
                responseData.msg = 'Welcome';
                responseData.data = newAdmin;
                return responseHelper.success(res, responseData);
            }
            responseData.msg = 'Admin doesn\'t exists';
            return responseHelper.error(res, responseData);
        } catch (error) {
            log.error('failed to get admin login with error::', error);
            responseData.msg = 'failed to get admin login';
            return responseHelper.error(res, responseData);
        }
    },

    getAllAdmin: async (req, res) => {
        let responseData = {};
        try {
            let getAdminList = await adminDbHandler.getByQuery({}, { admin_password: 0 });
            responseData.msg = "Data fetched successfully!";
            responseData.data = getAdminList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getSingleAdmin: async (req, res) => {
        let responseData = {};
        let user = req.admin;
        let id = req.params.id;
        try {
            let getAdmin = await adminDbHandler.getById(id, { admin_password: 0 });
            responseData.msg = "Data fetched successfully!";
            responseData.data = getAdmin;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    updateAdmin: async (req, res) => {
        let responseData = {};
        let admin = req.admin;
        //let id = req.params.id;
        let id = admin.sub;
        let reqObj = req.body;
        try {
            let getByQuery = await adminDbHandler.getByQuery({ _id: id });
            if (getByQuery[0]._id != id) {
                responseData.msg = "This email is already taken";
                return responseHelper.error(res, responseData);
            }
            let updatedData = {
                first_name: reqObj.first_name,
                last_name: reqObj.last_name,
            }
            if (reqObj.oldPassword) {
                let reqOldPassword = reqObj.oldPassword;
                let adminPassword = getByQuery[0].password;
                let isPasswordMatch = await _comparePassword(reqOldPassword, adminPassword);
                if (!isPasswordMatch) {
                    responseData.msg = "Old password is not correct!";
                    return responseHelper.error(res, responseData);
                }
                if (reqObj.new_password) {
                    updatedData.password = await _createHashPassword(reqObj.new_password);
                }

            }


            let updateAdmin = await adminDbHandler.updateById(id, updatedData);
            responseData.msg = "Data updated successfully!";
            responseData.data = updateAdmin;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "failed to update data";
            return responseHelper.error(res, responseData);
        }
    },

    addAdmin: async (req, res) => {
        let responseData = {};
        let user = req.admin;
        let reqObj = req.body;
        try {
            let getByQuery = await adminDbHandler.getByQuery({ email: reqObj.email });
            if (getByQuery.length) {
                responseData.msg = "This Email-Id already taken";
                return responseHelper.error(res, responseData);
            }
            let Data = {
                first_name: reqObj.first_name,
                last_name: reqObj.last_name,
                email: reqObj.email,
                password: reqObj.password,
            }
            let Admin = await adminDbHandler.create(Data);
            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    forgotPasswordByEmail: async (req, res) => {
        let reqBody = req.body;
        log.info('Received request for Admin forgot password:', reqBody);
        let responseData = {};
        let isVerificationDataExists = false;
        try {
            let query = {
                email: req.body.email,
            };
            let userData = await adminDbHandler.getByQuery({ email: req.body.email });
            if (!userData.length) {
                log.error('Admin email does not exist for forget password request');
                responseData.msg = 'Admin is not registered with us';
                return responseHelper.error(res, responseData);
            }

            let verificationType = 'email';

            //check if user already have forgot password request data in verification collection
            let passwordQuery = {
                admin_id: userData[0]._id,
                verification_type: verificationType
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
            };

            //if password verification data found update it with new token, else create new entry
            if (passwordTokenInfo.length) {
                isVerificationDataExists = true;
                let updatePasswordVerificationObj = {
                    email: userData[0].email,
                    attempts: passwordTokenInfo[0].attempts + 1,
                    otp: otpBody.otp
                };

                let updatedVerificationData = await verificationDbHandler.updateById(passwordTokenInfo[0]._id, updatePasswordVerificationObj);
                log.info('password verification updated in the db', updatedVerificationData);
            }


            let emailBody = {
                recipientsAddress: userData[0].email,
                subject: 'OTP',
                body: templates.otpVerification(otpBody)
            };

            let emailInfo = await emailService.sendEmail(emailBody);


            //patch email verification templateBody
            let templateBody = {
                type: verificationType,
                email: userData[0].email,
                otp: otpBody.otp

            };
            if (!isVerificationDataExists) {
                // if(emailInfo) {
                //     log.info('Email verification mail sent successfully',emailInfo);
                //     responseData.msg = 'OTP have been sent on the registered Email-Id';
                //     return responseHelper.success(res,responseData);
                // }
                // let emailInfo = await emailService.sendEmail(emailBody);
                // log.info('password reset mail sent successfully', emailInfo);
                let passwordResetObj = {
                    admin_id: userData[0]._id,
                    email: userData[0].email,
                    verification_type: verificationType,
                    otp: otpBody.otp
                };
                let newPasswordVerification = await verificationDbHandler.create(passwordResetObj);
                log.info('new forgot password entry created successfully in the database', newPasswordVerification);
            }
            responseData.msg = 'Email validated and OTP is sent on your mail';
            responseData.data = templateBody;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to process forget password request with error::', error);
            responseData.msg = 'failed to process forget password request';
            return responseHelper.error(res, responseData);
        }
    },

    verifyOtp: async (req, res) => {
        // let reQuery = req.query;
        // let decodedEmailToken = reQuery.token;
        let reqBody = req.body;
        log.info('Received request for otp verification ::', reqBody);
        let responseData = {};
        try {
            let verificationInfo = await verificationDbHandler.getByQuery({
                email: reqBody.email,
                otp: reqBody.otp
            });
            if (!verificationInfo.length) {
                responseData.msg = 'Otp expired or wrong otp';
                return responseHelper.error(res, responseData);
            }
            //update user email verification status
            let userId = verificationInfo[0].admin_id;
            let updateObj = {
                otp_verified: true
            };
            let updatedUser = await adminDbHandler.updateById(userId, updateObj);
            if (!updatedUser) {
                log.info('failed to verify otp');
                responseData.msg = 'failed to verify otp';
                return responseHelper.error(res, responseData);
            }
            log.info('user email verification status updated successfully', updatedUser);
            verificationInfo[0].otp = "";
            let updatedVerificationInfo = await verificationInfo[0].save();
            // let removedTokenInfo = await _handleVerificationDataUpdate(mobileInfo[0]._id);
            // log.info('mobile verification token has been removed::',removedTokenInfo);
            responseData.msg = 'Otp verified successfully';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to process email verification::', error);
            responseData.msg = 'failed to verify Otp';
            return responseHelper.error(res, responseData);
        }
    },

    resetPassword: async (req, res) => {
        // let reQuery = req.query;
        // let decodedEmailToken = reQuery.token;
        let reqBody = req.body;
        log.info('Received request for password reset====>:', reqBody);
        let newPassword = reqBody.password;
        let responseData = {};
        try {
            let query = {
                email: reqBody.email,
            };
            let passwordTokenInfo = await verificationDbHandler.getByQuery(query);
            if (!passwordTokenInfo.length) {
                log.error('Invalid request');
                responseData.msg = 'Invalid Password reset request';
                return responseHelper.error(res, responseData);
            }
            // log.info("tokenInfo", passwordTokenInfo);
            let userId = passwordTokenInfo[0].admin_id;
            let userDetail = await adminDbHandler.getByQuery({ _id: userId });
            if (userDetail[0].otp_verified) {
                let encryptedPassword = await _encryptPassword(newPassword);
                let updateUserQuery = {
                    password: encryptedPassword
                };
                let updatedUser = await adminDbHandler.updateById(userId, updateUserQuery);
                if (!updatedUser) {
                    log.error('failed to reset user password. Please try again later', updatedUser);
                    responseData.msg = 'failed to reset user password. Please try again later';
                    return responseHelper.error(res, responseData);
                }
            }
            else {
                log.error('failed to reset user password. Otpnot verified');
                responseData.msg = 'Please verify otp to reset password !';
                return responseHelper.error(res, responseData);
            }
            let updateObj = {
                otp_verified: false

            };
            let updatedUser = await adminDbHandler.updateById(userId, updateObj);
            responseData.msg = 'Password updated successfully! Please Login to continue';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to reset password with error::', error);
            responseData.msg = 'failed to reset password';
            return responseHelper.error(res, responseData);
        }
    },
};
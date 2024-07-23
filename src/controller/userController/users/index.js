'use strict';
const logger = require('../../../services/logger');
const log = new logger('userInfoController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const config = require('../../../config/environments');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
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
        bcrypt.compare(reqPassword, userPassword, function(err, isMatch) {
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
let _handleVerificationDataUpdate = async(id) => {
    log.info('Received request for deleting verification token::', id);
    let deletedInfo = await verificationDbHandler.deleteVerificationById(id);
    return deletedInfo;
};

let _encryptPassword = (password) => {
    let salt = config.bcrypt.saltValue;
    // generate a salt
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(salt, function(err, salt) {
            if (err) reject(err);
            // hash the password with new salt
            bcrypt.hash(password, salt, function(err, hash) {
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
     * Method to get User Profilr
     */
    profile: async(req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Recieved request for User Profile for User:', user);
        let responseData = {};
        try {
            let userData = await userDbHandler.getUserDetailsById(id, {user_password: 0});
            responseData.msg = `Data Fetched Successfully !!!`;
            responseData.data = userData;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get user signup with error::', error);
            responseData.msg = 'failed to get user login';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     *  Method to update Profile
     */
     updateProfile: async(req, res) => {
        let reqObj = req.body; 
        let user = req.user;
        let id = user.sub;
        log.info('Recieved request for User Profile update:', reqObj);
        let responseData = {};
        try {
            let userData = await userDbHandler.getUserDetailsById(id, {user_password: 0});
            if (!userData) {
                responseData.msg = 'Invalid user!!!';
                return responseHelper.error(res, responseData);
            }

            let checkPhoneNumber = await userDbHandler.getUserDetailsByQuery({ phone_number: reqObj.phone_number });
            let checkUsername = await userDbHandler.getUserDetailsByQuery({ user_name: reqObj.user_name });
            if (checkPhoneNumber.length && checkPhoneNumber[0]._id != id) {
                responseData.msg = 'Phone Number Already Exist !!!';
                return responseHelper.error(res, responseData);
            }
            if (checkUsername.length && checkUsername[0]._id != id) {
                responseData.msg = 'User Name Already Exist !!!';
                return responseHelper.error(res, responseData);
            }

            let user_avatar = userData.user_avatar;
            if (req.file) {
                user_avatar  = req.file.location;
            }
            let updatedObj = {
                first_name: reqObj.first_name,
                last_name: reqObj.last_name,
                user_name: reqObj.user_name,
                phone_number: reqObj.phone_number,
                user_avatar: user_avatar,
                user_bio: reqObj.user_bio,
            }
            let updateProfile = await userDbHandler.updateUserDetailsById(id, updatedObj);
            responseData.msg = `Data updated sucessfully !!!`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get user signup with error::', error);
            responseData.msg = 'failed to get user login';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle change password
     */
    changePassword: async(req, res) => {
        let reqObj = req.body; 
        let user = req.user;
        let id = user.sub;
        log.info('Recieved request for User Profile update:', reqObj);
        let responseData = {};
        try {
            let userData = await userDbHandler.getUserDetailsById(id);
            let comparePassword = await _comparePassword(reqObj.old_password, userData.user_password);
            if (!comparePassword) {
                responseData.msg = `Invalid old password !!!`;
                return responseHelper.error(res, responseData);
            }
            let compareNewAndOld = await _comparePassword(reqObj.new_password, userData.user_password);
            if (compareNewAndOld) {
                responseData.msg = `New password must be different from old password !!!`;
                return responseHelper.error(res, responseData);
            }
            let updatedObj = {
                user_password: await _encryptPassword(reqObj.new_password)
            }
            let updateProfile = await userDbHandler.updateUserDetailsById(id, updatedObj);
            responseData.msg = `Data updated sucessfully !!!`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to update with error::', error);
            responseData.msg = 'failed to update data';
            return responseHelper.error(res, responseData);
        }
    }

};
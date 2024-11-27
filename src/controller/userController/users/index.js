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
     * Method to get User Profilr
     */
    profile: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request for User Profile for User:', user);
        let responseData = {};
        try {
            let userData = await userDbHandler.getById(id, { user_password: 0 }).populate("service_type").populate("company_id");
            responseData.msg = `Data Fetched Successfully!`;
            responseData.data = userData;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get user signup with error::', error);
            responseData.msg = 'failed to get profile!';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     *  Method to update Profile
     */
    updateProfile: async (req, res) => {
        let reqObj = req.body;
        let user = req.user;
        let id = user.sub;
        log.info('Received request for User Profile update:', reqObj);
        let responseData = {};
        try {
            let userData = await userDbHandler.getById(id, { user_password: 0 });
            if (!userData) {
                responseData.msg = 'Invalid user or token expired. Please login again to continue!';
                return responseHelper.error(res, responseData);
            }

            let avatar = userData.avatar;
            if (req.file) {
                avatar = req.file.location;
            }
            let updatedObj = {
                full_name: reqObj.full_name,
                dob: reqObj.dob,
                phone_number: reqObj.phone_number,
                company_name: reqObj.company_name,
                avatar: avatar
            }
            let updateProfile = await userDbHandler.updateById(id, updatedObj);
            responseData.msg = `Data updated!`;
            responseData.data = await userDbHandler.getById(id);
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to update user profile with error::', error);
            responseData.msg = 'failed to update data!';
            return responseHelper.error(res, responseData);
        }
    },
    updateVendorProfile: async (req, res) => {
        let reqObj = req.body;
        let user = req.user;
        let id = user.sub;
        log.info('Received request for User Profile update:', reqObj);
        let responseData = {};

        try {
            // Fetch user data by ID
            let userData = await userDbHandler.getById(id, { user_password: 0 });
            if (!userData) {
                responseData.msg = 'Invalid user or token expired. Please login again to continue!';
                return responseHelper.error(res, responseData);
            }
            if (reqObj.account_number != "") {
                let user1 = await userDbHandler.getByQuery({ account_number: reqObj.account_number });
                if (user1.length && user1[0]._id != id) {
                    responseData.msg = "Bank account number already exist!";
                    return responseHelper.error(res, responseData);
                }
            }

            let avatar = userData.avatar;
            let w9_document = userData.w9_document;
            let blank_check_or_bank_letter = userData.blank_check_or_bank_letter;
            if (req.files && req.files.avatar) {
                avatar = req.files.avatar[0].location;
            }
            if (req.files && req.files.w9_document) {
                w9_document = req.files.w9_document[0].location;
            }
            if (req.files && req.files.blank_check_or_bank_letter) {
                blank_check_or_bank_letter = req.files.blank_check_or_bank_letter[0].location;
            }

            // Create an object with the fields you want to update
            let updatedObj = {
                full_name: reqObj.full_name,
                phone_number: reqObj.phone_number,
                owner_name: reqObj.owner_name,
                service_type: reqObj.service_type.split(","),

                routing_no: reqObj.routing_no,
                account_holder_name: reqObj.account_holder_name,
                account_number: reqObj.account_number,
                bank_name: reqObj.bank_name,
                bic_swift_code: reqObj.bic_swift_code,
                bank_address: reqObj.bank_address,

                w9: reqObj.w9,
                w9_document: w9_document,
                business_address: reqObj.business_address,
                avatar: avatar,
                blank_check_or_bank_letter: blank_check_or_bank_letter,
                profile_completed: true

            }

            // Check if there are changes in w9 or w9_document, if so set w9_verified to false
            if (reqObj.w9 !== userData.w9 || w9_document !== userData.w9_document) {
                updatedObj.w9_verified = false;
            }

            // Check if any bank information is changed, if so set bank_verified to false
            if (
                reqObj.routing_no !== userData.routing_no ||
                reqObj.account_holder_name !== userData.account_holder_name ||
                reqObj.account_number !== userData.account_number ||
                reqObj.bank_name !== userData.bank_name ||
                reqObj.bic_swift_code !== userData.bic_swift_code ||
                reqObj.bank_address !== userData.bank_address
            ) {
                updatedObj.bank_verified = false;
            }

            if (reqObj.availability && Array.isArray(reqObj.availability)) {
                updatedObj.availability = reqObj.availability.map(item => ({
                    day: item.day,
                    isClosed: item.isClosed || false,
                    timeSlots: item.timeSlots ? item.timeSlots.map(slot => ({
                        from: slot.from,
                        to: slot.to
                    })) : []
                }));
            }
            // Update the user data in the database
            let updateProfile = await userDbHandler.updateById(id, updatedObj);
            responseData.msg = `Data updated!`;
            responseData.data = await userDbHandler.getById(id).populate("service_type"); // Return updated user data
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to update user profile with error::', error);
            responseData.msg = 'Failed to update data!';
            return responseHelper.error(res, responseData);
        }
    },
    updateVendorProfileStatus: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let id = user.sub;
        log.info('Received request for User Profile status update:', reqObj);
        let responseData = {};

        try {
            // Fetch user data by ID
            let userData = await userDbHandler.getById(id, { user_password: 0 });
            if (!userData) {
                responseData.msg = 'Invalid user or token expired. Please login again to continue!';
                return responseHelper.error(res, responseData);
            }



            // Create an object with the fields you want to update
            let updatedObj = {
                profile_completed: reqObj.profile_completed === "true",

            }


            // Update the user data in the database
            let updateProfile = await userDbHandler.updateById(id, updatedObj);
            responseData.msg = `Data updated!`;
            responseData.data = await userDbHandler.getById(id); // Return updated user data
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to update user profile with error::', error);
            responseData.msg = 'Failed to update data!';
            return responseHelper.error(res, responseData);
        }
    },



    /**
     * Method to handle change password
     */
    changePassword: async (req, res) => {
        let reqObj = req.body;
        let user = req.user;
        let id = user.sub;
        log.info('Received request for User password update:', reqObj);
        let responseData = {};
        try {
            let userData = await userDbHandler.getById(id);

            let comparePassword = await _comparePassword(reqObj.old_password, userData.password);
            console.log("🚀 ~ changePassword: ~ comparePassword:", comparePassword)
            if (!comparePassword) {
                responseData.msg = `Invalid old password!`;
                return responseHelper.error(res, responseData);
            }
            let compareNewAndOld = await _comparePassword(reqObj.new_password, userData.password);
            console.log("🚀 ~ changePassword: ~ compareNewAndOld:", compareNewAndOld)
            if (compareNewAndOld) {
                responseData.msg = `New password must be different from old password!`;
                return responseHelper.error(res, responseData);
            }
            let updatedObj = {
                password: await _encryptPassword(reqObj.new_password),
                temporary_password: false
            }
            let updateProfile = await userDbHandler.updateById(id, updatedObj);
            responseData.msg = `Data updated successfully!`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to update with error::', error);
            responseData.msg = 'failed to change password!';
            return responseHelper.error(res, responseData);
        }
    }

};
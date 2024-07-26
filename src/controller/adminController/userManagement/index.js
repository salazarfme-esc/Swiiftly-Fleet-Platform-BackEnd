'use strict';
const logger = require('../../../services/logger');
const log = new logger('AdminUserManagementController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
const templates = require('../../../utils/templates/template');
const emailService = require('../../../services/sendEmail');
const adminDbHandler = dbService.Admin;
const UserDbHandler = dbService.User;
const Flow = require("../../../services/db/models/flow")
const config = require('../../../config/environments');
const { response } = require('express');
const crypto = require('crypto');

/*******************
 * PRIVATE FUNCTIONS
 ********************/
function generateStrongPassword(length = 16) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
}

/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {
    /**
     * Method to handle add Vendor or Fleet
     */
    addUser: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        log.info("Received request for adding the vendor or fleet manager.", reqObj)
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let checkEmail = await UserDbHandler.getByQuery({ email: reqObj.email.toLowerCase() });
            let checkPhoneNumber = await UserDbHandler.getByQuery({ phone_number: reqObj.phone_number });
            if (checkEmail.length) {
                responseData.msg = 'Email Already Exist!';
                return responseHelper.error(res, responseData);
            }
            if (checkPhoneNumber.length) {
                responseData.msg = 'Phone Number Already Exist!';
                return responseHelper.error(res, responseData);
            }
            let password = generateStrongPassword();

            let submitData = {
                first_name: reqObj.first_name,
                last_name: reqObj.last_name,
                user_name: reqObj.user_name,
                email: reqObj.email,
                phone_number: reqObj.phone_number,
                password: password,
                email_verified: true,
                login_way: "local",
                user_role: reqObj.user_role,
            }
            let createData = await UserDbHandler.createUser(submitData);
            if (createData) {
                let emailBody = {
                    recipientsAddress: createData.email,
                    subject: 'Security Code for Account Verification',
                    body: templates.invitationToJoinSWIFTLY(submitData)
                };
                let emailInfo = await emailService.sendEmail(emailBody);
            }

            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to add data with error::', error);
            responseData.msg = "failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle get Vendor or Fleet
     */
    GetUser: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.query;
        const limit = parseInt(req.query.limit); // Ensure limit is a number
        const skip = parseInt(req.query.skip); // Ensure skip is a number
        log.info("Received request for getting the vendor or fleet manager.", reqObj)
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let Data = await UserDbHandler.getByQuery({ user_role: reqObj.user_role, is_delete: false }).skip(skip).limit(limit).sort({ "created_at": -1 });
            responseData.msg = "Data fetched successfully!";
            responseData.data = Data
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = "failed to fetch data";
            return responseHelper.error(res, responseData);
        }
    },


    /**
    * Method to handle delete Vendor or Fleet
    */
    DeleteUser: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let id = req.params.id;
        log.info("Received request for deleting the vendor or fleet manager.", id)
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let Data = await UserDbHandler.getByQuery({ _id: id });
            if (!Data.length) {
                responseData.msg = "Invalid request!";
                return responseHelper.error(res, responseData);
            }

            await UserDbHandler.updateById(id, { is_delete: true })
            responseData.msg = "Data deleted successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to delete data with error::', error);
            responseData.msg = "failed to delete data";
            return responseHelper.error(res, responseData);
        }
    },
};
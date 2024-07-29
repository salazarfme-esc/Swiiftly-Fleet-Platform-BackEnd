'use strict';
const logger = require('../../../services/logger');
const log = new logger('AdminJobController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
const adminDbHandler = dbService.Admin;
const MainJobDbHandler = dbService.MainJob;
const SubJobDbHandler = dbService.SubJob;
const Flow = require("../../../services/db/models/flow")
const config = require('../../../config/environments');
const { response } = require('express');
/*******************
 * PRIVATE FUNCTIONS
 ********************/


/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {

    /**
     * Method to handle get Job Requests
     */
    getRequests: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        const limit = parseInt(req.query.limit); // Ensure limit is a number
        const skip = parseInt(req.query.skip); // Ensure skip is a number
        log.info("Received request to get the Job Requests")
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getMainData = await MainJobDbHandler.getByQuery({}).skip(skip).limit(limit).lean().populate("service_category").populate("vehicle_id").populate("user_id");
            let finalData = await Promise.all(getMainData.map(async (item) => {
                item.child = await SubJobDbHandler.getByQuery({ root_ticket_id: item._id }).populate("service_category").populate("question_id");
                return item;
            }))
            responseData.msg = "Data fetched successfully!";
            responseData.data = finalData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = "failed to fetch data";
            return responseHelper.error(res, responseData);
        }
    },
};
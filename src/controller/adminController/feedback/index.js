'use strict';
const logger = require('../../../services/logger');
const log = new logger('AdminFeedbackController').getChildLogger();
const dbService = require('../../../services/db/services');
const responseHelper = require('../../../services/customResponse');
const feedbackDbHandler = dbService.Feedback;
const AdminDbHandler = dbService.Admin;
module.exports = {
    /**
     * Method to get all feedbacks
     */
    getAllFeedbacks: async (req, res) => {
        let responseData = {};
        let adminId = req.admin.sub;
        let skip = parseInt(req.query.skip);
        let limit = parseInt(req.query.limit);
        try {
            let admin = await AdminDbHandler.getById(adminId);
            if (!admin) {
                responseData.msg = "Invalid token or session expired!";
                return responseHelper.error(res, responseData);
            }
            let feedbacks = await feedbackDbHandler.getByQuery({}).skip(skip).limit(limit).populate('user_id');

            responseData.msg = "Feedbacks fetched successfully!";
            responseData.data = {
                count: await feedbackDbHandler.getByQuery({}).countDocuments(),
                feedbacks: feedbacks
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch feedbacks with error::', error);
            responseData.msg = "Failed to fetch feedbacks";
            return responseHelper.error(res, responseData);
        }
    },
    getDetailedFeedback: async (req, res) => {
        let responseData = {};
        let adminId = req.admin.sub;
        let feedbackId = req.params.feedbackId;
        try {
            let admin = await AdminDbHandler.getById(adminId);
            if (!admin) {
                responseData.msg = "Invalid token or session expired!";
                return responseHelper.error(res, responseData);
            }
            let feedbacks = await feedbackDbHandler.getByQuery({}).skip(skip).limit(limit).populate('user_id');

            responseData.msg = "Feedbacks fetched successfully!";
            responseData.data = {
                count: await feedbackDbHandler.getByQuery({}).countDocuments(),
                feedbacks: feedbacks
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch feedbacks with error::', error);
            responseData.msg = "Failed to fetch feedbacks";
            return responseHelper.error(res, responseData);
        }
    }
}; 
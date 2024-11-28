'use strict';
const logger = require('../../../services/logger');
const log = new logger('FeedbackController').getChildLogger();
const dbService = require('../../../services/db/services');
const responseHelper = require('../../../services/customResponse');
const feedbackDbHandler = dbService.Feedback;
const UserDbHandler = dbService.User;


module.exports = {
    /**
     * Method to give feedback
     */
    giveFeedback: async (req, res) => {
        let responseData = {};
        let userId = req.user.sub;
        let reqObj = req.body;

        try {
            let user = await UserDbHandler.getById(userId);
            if (!user) {
                responseData.msg = "User not found!";
                return responseHelper.error(res, responseData);
            }
            let feedbackData = {
                user_id: userId,
                rating: reqObj.rating,
                comments: reqObj.comments
            };

            let newFeedback = await feedbackDbHandler.create(feedbackData);
            responseData.msg = "Feedback added successfully!";
            responseData.data = newFeedback;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to give feedback with error::', error);
            responseData.msg = "Failed to give feedback";
            return responseHelper.error(res, responseData);
        }
    },
}; 
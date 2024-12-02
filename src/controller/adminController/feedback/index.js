'use strict';
const logger = require('../../../services/logger');
const log = new logger('AdminFeedbackController').getChildLogger();
const dbService = require('../../../services/db/services');
const responseHelper = require('../../../services/customResponse');
const feedbackDbHandler = dbService.Feedback;
const feedbackDBAggregate = require('../../../services/db/models/feedback');
const AdminDbHandler = dbService.Admin;
const moment = require('moment');
module.exports = {
    /**
     * Method to get all feedbacks
     */
    getAllFeedbacks: async (req, res) => {
        const responseData = {};
        const adminId = req.admin.sub;
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 10;

        // Extract filter parameters from query
        const { startDate, endDate, rating } = req.query;

        // Build filter object for feedbacks
        const feedbackFilter = {};
        if (startDate || endDate) {
            feedbackFilter.created_at = {}; // Assuming feedbacks have a 'createdAt' field
            if (startDate) {
                feedbackFilter.created_at.$gte = moment(startDate).startOf('day').toDate(); // Use moment to parse start date
            }
            if (endDate) {
                feedbackFilter.created_at.$lte = moment(endDate).endOf('day').toDate(); // Use moment to parse end date
            }
        }
        if (rating) {
            feedbackFilter.rating = parseInt(rating); // Filter by specific rating if provided
        }
        try {
            // Validate admin
            const admin = await AdminDbHandler.getById(adminId);
            if (!admin) {
                responseData.msg = "Invalid token or session expired!";
                return responseHelper.error(res, responseData);
            }

            // Aggregation pipeline to calculate overall stats without filters
            const statsAggregationPipeline = [
                {
                    $group: {
                        _id: null,
                        overallRating: { $avg: "$rating" },
                        ratingCounts: {
                            $push: "$rating"
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        overallRating: { $round: ["$overallRating", 2] },
                        ratingCounts: 1,
                        totalCount: { $size: "$ratingCounts" } // Calculate total count of ratings
                    }
                },
                {
                    $addFields: {
                        ratingPercentages: {
                            $arrayToObject: {
                                $map: {
                                    input: { $range: [1, 6] }, // Ratings from 1 to 5
                                    as: "rating",
                                    in: {
                                        k: { $toString: "$$rating" }, // Convert rating to string for key
                                        v: {
                                            $multiply: [
                                                {
                                                    $divide: [
                                                        {
                                                            $size: {
                                                                $filter: {
                                                                    input: "$ratingCounts",
                                                                    cond: { $eq: ["$$this", "$$rating"] }
                                                                }
                                                            }
                                                        },
                                                        "$totalCount" // Use totalCount for percentage calculation
                                                    ]
                                                },
                                                100
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ];

            // Get overall stats
            const overallStats = await feedbackDBAggregate.aggregate(statsAggregationPipeline);

            // Aggregation pipeline to count filtered feedbacks
            const countAggregationPipeline = [
                { $match: feedbackFilter }, // Apply filters for counting
                { $count: "totalCount" } // Count the number of documents
            ];

            const countResult = await feedbackDBAggregate.aggregate(countAggregationPipeline);
            const totalCount = countResult[0] ? countResult[0].totalCount : 0; // Get the total count of filtered feedbacks

            // Aggregation pipeline to get filtered feedbacks
            const feedbacksAggregationPipeline = [
                { $match: feedbackFilter }, // Apply filters for feedbacks
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } } // Optional: handle missing users gracefully
            ];

            const feedbacks = await feedbackDBAggregate.aggregate(feedbacksAggregationPipeline);

            // Destructure results
            const stats = overallStats[0] || {};

            responseData.msg = "Feedbacks fetched successfully!";
            responseData.data = {
                count: totalCount, // Count according to filters
                data: feedbacks,
                overallRating: stats.overallRating || 0,
                ratingPercentages: stats.ratingPercentages || {}
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error("Failed to fetch feedbacks with error::", error);
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
            let feedbacks = await feedbackDbHandler.getByQuery({ _id: feedbackId }).populate('user_id');
            if (!feedbacks.length) {
                responseData.msg = "Feedback not found!";
                return responseHelper.error(res, responseData);
            }

            responseData.msg = "Feedbacks fetched successfully!";
            responseData.data =
                feedbacks[0];
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch feedbacks with error::', error);
            responseData.msg = "Failed to fetch feedbacks";
            return responseHelper.error(res, responseData);
        }
    }
}; 
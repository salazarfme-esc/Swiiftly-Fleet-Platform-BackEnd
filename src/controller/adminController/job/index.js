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
const MainJobAggregate = require("../../../services/db/models/mainJob")
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
        const limit = parseInt(req.query.limit) || 10; // Default limit to 10
        const skip = parseInt(req.query.skip) || 0; // Default skip to 0
        log.info("Received request to get the Job Requests");

        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Use aggregation pipeline for more efficient querying and populating
            let finalData = await MainJobAggregate.aggregate([
                { $match: { status: 'created' } }, // Match the updated job request with status 'created'
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "flowcategories",
                        localField: "service_category",
                        foreignField: "_id",
                        as: "service_category"
                    }
                },
                {
                    $lookup: {
                        from: "vehicles",
                        localField: "vehicle_id",
                        foreignField: "_id",
                        as: "vehicle_id"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_id"
                    }
                },
                { $unwind: "$service_category" },
                { $unwind: "$vehicle_id" },
                { $unwind: "$user_id" },
                {
                    $lookup: {
                        from: "subjobs",
                        localField: "_id",
                        foreignField: "root_ticket_id",
                        as: "child",
                        pipeline: [
                            {
                                $lookup: {
                                    from: "flowcategories",
                                    localField: "service_category",
                                    foreignField: "_id",
                                    as: "service_category"
                                }
                            },
                            {
                                $lookup: {
                                    from: "flowquestions",
                                    localField: "question_id",
                                    foreignField: "_id",
                                    as: "question_id"
                                }
                            },
                            { $unwind: "$service_category" },
                            { $unwind: "$question_id" }
                        ]
                    }
                }
            ]).exec();

            responseData.msg = "Data fetched successfully!";
            responseData.data = finalData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = "Failed to fetch data";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle Accept or Reject for the Job Requests
     */
    AcceptRejectRequest: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        const root_ticket_id = req.params.root_ticket_id;
        log.info("Received request to Accept or Reject the Job Requests");
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            let TicketData = await MainJobDbHandler.getById(root_ticket_id)
            if (!TicketData) {
                responseData.msg = "Job request not found!";
                return responseHelper.error(res, responseData);
            }
            let updatedStatus = {
                status: req.body.status ? 'accepted' : 'rejected'
            }
            if (req.body.status) {
                let UpdateRootStatus = await MainJobDbHandler.updateById(root_ticket_id, updatedStatus);
                let UpdateChildStatus = await SubJobDbHandler.updateByQuery({ root_ticket_id: root_ticket_id }, updatedStatus);
                responseData.msg = "Job request accepted!";
            } else {
                let UpdateRootStatus = await MainJobDbHandler.updateById(root_ticket_id, updatedStatus);
                let UpdateChildStatus = await SubJobDbHandler.updateByQuery({ root_ticket_id: root_ticket_id }, updatedStatus);
                responseData.msg = "Job request rejected!";
            }
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update job status with error::', error);
            responseData.msg = "Something went wrong! Please try again later.";
            return responseHelper.error(res, responseData);
        }
    },
    /**
 * Method to handle updating the sequence of sub-jobs
 */
    UpdateSubJobSequence: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        const root_ticket_id = req.params.root_ticket_id;
        log.info("Received request to update the sequence of sub-jobs", req.body);
        try {
            let adminData = await adminDbHandler.getById(admin);
            if (!adminData) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            let mainJobData = await MainJobDbHandler.getById(root_ticket_id);
            if (!mainJobData) {
                responseData.msg = "Main job not found!";
                return responseHelper.error(res, responseData);
            }

            const { subJobId, newIndex } = req.body;

            // Fetch all sub-jobs for the main job
            let subJobs = await SubJobDbHandler.getByQuery({ root_ticket_id: root_ticket_id });
            if (!subJobs || subJobs.length === 0) {
                responseData.msg = "No sub-jobs found!";
                return responseHelper.error(res, responseData);
            }

            // Sort sub-jobs by their current sequence
            subJobs.sort((a, b) => a.sequence - b.sequence);

            // Find the sub-job that needs to be updated
            let movedSubJob = subJobs.find(job => job._id.toString() === subJobId);
            if (!movedSubJob) {
                responseData.msg = "Sub-job not found!";
                return responseHelper.error(res, responseData);
            }

            // Remove the sub-job from its current position
            subJobs = subJobs.filter(job => job._id.toString() !== subJobId);

            // Adjust newIndex to 0-based index for array manipulation
            const adjustedNewIndex = newIndex - 1;

            // Insert the sub-job into the new position
            subJobs.splice(adjustedNewIndex, 0, movedSubJob);

            // Update sequence for all sub-jobs
            for (let i = 0; i < subJobs.length; i++) {
                let updateSequence = await SubJobDbHandler.updateById(subJobs[i]._id, { sequence: i + 1 });
                if (!updateSequence) {
                    responseData.msg = "Failed to update sub-job sequence!";
                    return responseHelper.error(res, responseData);
                }
            }

            responseData.msg = "Sub-job sequence updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update sub-job sequence with error:', error);
            responseData.msg = "Something went wrong! Please try again later.";
            return responseHelper.error(res, responseData);
        }
    },

};
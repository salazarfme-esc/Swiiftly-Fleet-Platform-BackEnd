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
const VendorDbHandler = dbService.User;
const MainJobAggregate = require("../../../services/db/models/mainJob")
const Flow = require("../../../services/db/models/flow")
const config = require('../../../config/environments');
const { response } = require('express');
const mongoose = require('mongoose');
const moment = require('moment');

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
        const limit = parseInt(req.query.limit);
        const skip = parseInt(req.query.skip);
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
            responseData.data = { count: await MainJobDbHandler.getByQuery({ status: 'created' }).countDocuments(), data: finalData };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = "Failed to fetch data";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle get Accepted Job Requests
     */
    getAcceptedJobs: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        log.info("Received request to get the Accepted Job Requests");

        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Define match criteria based on query parameters
            let matchCriteria = { status: req.query.status };

            // Apply optional filters if they exist in the query
            if (req.query.user_id) {
                matchCriteria.user_id = mongoose.Types.ObjectId(req.query.user_id);
            }
            if (req.query.service_category_id) {
                matchCriteria.service_category = mongoose.Types.ObjectId(req.query.service_category_id);
            }
            if (req.query.date) {
                // Parse the input date from the query parameter
                const inputDate = new Date(req.query.date);

                // Create a start date (beginning of the day in UTC)
                const startDate = new Date(inputDate.setUTCHours(0, 0, 0, 0));

                // Create an end date (end of the day in UTC)
                const endDate = new Date(inputDate.setUTCHours(23, 59, 59, 999));

                // Log the generated dates for debugging
                log.info(`Filtering by date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

                // Use the correct field name for filtering
                matchCriteria.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
            console.log("Match criteria:", matchCriteria);


            // Get the total count of documents matching the criteria
            let count = await MainJobAggregate.countDocuments(matchCriteria);

            // Use aggregation pipeline for more efficient querying and populating
            let finalData = await MainJobAggregate.aggregate([
                { $match: matchCriteria },
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
                { $unwind: { path: "$service_category", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$vehicle_id", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$user_id", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "subjobs",
                        let: { mainJobId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$root_ticket_id", "$$mainJobId"] } } },
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
                                    from: "users",
                                    localField: "vendor_id",
                                    foreignField: "_id",
                                    as: "vendor_id"
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
                            { $unwind: { path: "$service_category", preserveNullAndEmptyArrays: true } },
                            { $unwind: { path: "$question_id", preserveNullAndEmptyArrays: true } },
                            {
                                $addFields: {
                                    vendor_id: {
                                        $cond: {
                                            if: { $eq: ["$vendor_id", []] },
                                            then: null,
                                            else: { $arrayElemAt: ["$vendor_id", 0] }
                                        }
                                    }
                                }
                            },
                            // Apply vendor_id filter if provided
                            ...(req.query.vendor_id ? [
                                { $match: { vendor_id: mongoose.Types.ObjectId(req.query.vendor_id) } }
                            ] : [])
                        ],
                        as: "child"
                    }
                },
                {
                    $addFields: {
                        childCount: { $size: "$child" } // Add the count of subjobs
                    }
                },
                {
                    $match: req.query.subjob_count ? { childCount: parseInt(req.query.subjob_count) } : {} // Filter by subjob count if provided
                },
                {
                    $addFields: {
                        child: {
                            $map: {
                                input: "$child",
                                as: "c",
                                in: {
                                    $mergeObjects: ["$$c", {
                                        vendor_id: { $ifNull: ["$$c.vendor_id", null] }
                                    }]
                                }
                            }
                        }
                    }
                }
            ]).exec();

            responseData.msg = "Data fetched successfully!";
            responseData.data = { count: count, data: finalData };
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
                status: req.body.status ? 'accepted' : 'rejected',
                status_reason: req.body.status_reason
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
    /**
    * Method to assign a vendor to a sub-ticket
    */
    AssignVendorToSubTicket: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        const { subTicketId, vendorId, time_estimation } = req.body;
        const reqObj = req.body;
        log.info("Received request to assign a vendor to a sub-ticket");

        try {
            // Check if admin is valid
            let adminData = await adminDbHandler.getById(admin);
            if (!adminData) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Check if the vendor exists in the database
            let vendorData = await VendorDbHandler.getByQuery({ _id: vendorId, user_role: 'vendor' });
            if (!vendorData.length) {
                responseData.msg = "Vendor not found!";
                return responseHelper.error(res, responseData);
            }

            // Check if the sub-ticket exists in the database
            let subTicketData = await SubJobDbHandler.getById(subTicketId);
            if (!subTicketData) {
                responseData.msg = "Sub-ticket not found!";
                return responseHelper.error(res, responseData);
            }

            // Fetch the root ticket ID from the sub-ticket data
            const rootTicketId = subTicketData.root_ticket_id;

            // Fetch all sub-tasks for the root ticket, sorted by sequence
            let subJobs = await SubJobDbHandler.getByQuery({ root_ticket_id: rootTicketId }).sort({ sequence: 1 });
            if (!subJobs || subJobs.length === 0) {
                responseData.msg = "No sub-jobs found!";
                return responseHelper.error(res, responseData);
            }

            // Check if the sub-ticket is the first in the sequence
            const isFirstJob = subJobs[0]._id.equals(subTicketId);

            // Update the sub-ticket with the vendor ID, status, and active status if it's the first job
            let updateData = {
                vendor_id: vendorId,
                status: "vendor_assigned",
                time_estimation: time_estimation,
                is_dropoff: reqObj.is_dropoff,
                dropoff_address: {
                    street: reqObj.street,
                    address: reqObj.address,
                    city: reqObj.city,
                    district: reqObj.district,
                    state: reqObj.state,
                    pin: reqObj.pin,
                    country: reqObj.country,
                },
                dropoff_location: {
                    type: 'Point',
                    coordinates: reqObj.coordinates,
                },
                ...(isFirstJob && { active: true })
            };
            let updateSubTicket = await SubJobDbHandler.updateById(subTicketId, updateData);

            if (!updateSubTicket) {
                responseData.msg = "Failed to assign vendor to sub-ticket!";
                return responseHelper.error(res, responseData);
            }

            let subJobsNew = await SubJobDbHandler.getByQuery({ root_ticket_id: rootTicketId }).sort({ sequence: 1 });
            // Check if all sub-jobs have statuses from the allowed set
            const allowedStatuses = ["vendor_assigned", "delay", "vendor_rejected", "vendor_accepted", "completed", "in-progress"];
            let allStatusesValid = subJobsNew.every(job => allowedStatuses.includes(job.status));

            if (allStatusesValid) {
                // Update the main ticket status to "in-progress"
                let updateMainTicket = await MainJobDbHandler.updateById(rootTicketId, { status: "in-progress" });

                if (!updateMainTicket) {
                    responseData.msg = "Failed to update the main ticket status!";
                    return responseHelper.error(res, responseData);
                }
            }

            responseData.msg = "Vendor assigned to sub-ticket successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to assign vendor to sub-ticket with error:', error);
            responseData.msg = "Something went wrong! Please try again later.";
            return responseHelper.error(res, responseData);
        }
    },



};
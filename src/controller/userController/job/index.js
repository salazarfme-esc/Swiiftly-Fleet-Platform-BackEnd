'use strict';
const logger = require('../../../services/logger');
const log = new logger('UserJobController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const config = require('../../../config/environments');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
const userDbHandler = dbService.User;
const VehicleDbHandler = dbService.Vehicle;
const FlowQuestionDbHandler = dbService.FlowQuestion;
const FlowCategoryDbHandler = dbService.FlowCategory;
const MainJobDbHandler = dbService.MainJob;
const SubJobDbHandler = dbService.SubJob;
const FlowDbHandler = dbService.Flow;
const FleetInvoiceDbHandler = dbService.FleetInvoice;
const NotificationDbHandler = dbService.Notification;
const Flow = require("../../../services/db/models/flow");
const crypto = require('crypto');
const mainJob = require('../../../services/db/models/mainJob');
const moment = require('moment');

/*******************
 * PRIVATE FUNCTIONS
 ********************/


// Function to generate a unique ticket IDs
const generateTicketId = () => {
    // Generate 3 bytes of random data
    return crypto.randomBytes(3).toString('hex').slice(0, 6);
};
// Function to generate a unique invoice number
function generateInvoiceNumber() {
    return `INV-${Date.now()}`;
}
/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {
    /**
    * Method to handle get flow
    */
    getFlow: async (req, res) => {
        let responseData = {};
        let user = req.user.sub;
        log.info("Received request to get the Job Types")
        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await Flow.aggregate([
                { $match: { status: { $ne: 'draft' } } },
                {
                    $lookup: {
                        from: 'flowcategories', // The collection name for FlowCategory
                        localField: 'flow_category',
                        foreignField: '_id',
                        as: 'flow_category'
                    }
                },
                {
                    $unwind: '$flow_category'
                },
                {
                    $lookup: {
                        from: 'flowquestions', // The collection name for FlowQuestion
                        localField: 'flow_question',
                        foreignField: '_id',
                        as: 'flow_question'
                    }
                },
                {
                    $unwind: '$flow_question'
                },
                {
                    $lookup: {
                        from: 'flowcategories', // Lookup for the independent flow_category key in question_details
                        localField: 'flow_question.flow_category',
                        foreignField: '_id',
                        as: 'flow_question.flow_category'
                    }
                },
                {
                    $unwind: '$flow_question.flow_category'
                },
                {
                    $group: {
                        _id: '$flow_category._id',
                        category: { $first: '$flow_category' },
                        questions: {
                            $push: {
                                sequence: '$sequence',
                                question_details: '$$ROOT', // Push the entire document
                                created_at: '$created_at',
                                updated_at: '$updated_at',
                                __v: '$__v'
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        flow_category: '$category',
                        questions: {
                            $sortArray: {
                                input: '$questions',
                                sortBy: { sequence: 1 }
                            }
                        }
                    }
                },
                {
                    $sort: {
                        'flow_category.created_at': -1
                    }
                }
            ]);

            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = "failed to fetch data";
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle get flow category
     */
    getFlowCategory: async (req, res) => {
        let responseData = {};
        let reqObj = req.query;
        try {
            // Get all categories
            let allCategories = await FlowCategoryDbHandler.getByQuery({});

            // Only filter categories if isFlow is true
            if (reqObj.isFlow === "true") {
                // Get all flow questions to check if flows exist for categories
                let allFlows = await FlowDbHandler.getByQuery({});

                // Filter out categories that already have an associated flow
                let filteredCategories = allCategories.filter(category =>
                    !allFlows.some(flow => flow.flow_category.toString() === category._id.toString())
                );

                responseData.msg = "Data fetched successfully!";
                responseData.data = filteredCategories;
            } else {
                responseData.msg = "Data fetched successfully!";
                responseData.data = allCategories;
            }

            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = "Failed to fetch data";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to handle get flow
    */
    CreateTicket: async (req, res) => {
        let responseData = {};
        let user = req.user.sub;
        const reqObj = req.body;
        log.info("Received request to create a ticket", reqObj);
        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "fleet" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            let getCategory = await FlowCategoryDbHandler.getById(reqObj.service_category);
            if (!getCategory) {
                responseData.msg = "Please select a valid job type!";
                return responseHelper.error(res, responseData);
            }

            let getVehicle = await VehicleDbHandler.getByQuery({ _id: reqObj.vehicle_id, user_id: user });
            if (!getVehicle.length) {
                responseData.msg = "Please select a valid vehicle!";
                return responseHelper.error(res, responseData);
            }

            let media = [];
            if (req.files && req.files.media) {
                for (let i = 0; i < req.files.media.length; i++) {
                    media.push(req.files.media[i].location);
                }
            }

            let submitData = {
                service_category: reqObj.service_category,
                user_id: user,
                vehicle_id: reqObj.vehicle_id,
                ticket_id: generateTicketId(),
                description: reqObj.description,
                status: 'draft',
                address: {
                    street: reqObj.street,
                    address: reqObj.address,
                    city: reqObj.city,
                    district: reqObj.district,
                    state: reqObj.state,
                    pin: reqObj.pin,
                    country: reqObj.country,
                },
                location: {
                    type: 'Point',
                    coordinates: reqObj.coordinates,
                },
                location_history: [{
                    type: 'Point',
                    coordinates: reqObj.coordinates,
                }],
                address_history: [{
                    street: reqObj.street,
                    address: reqObj.address,
                    city: reqObj.city,
                    district: reqObj.district,
                    state: reqObj.state,
                    pin: reqObj.pin,
                    country: reqObj.country,
                }],
                media: media,
            };
            let saveData = await MainJobDbHandler.create(submitData)
            responseData.msg = "Ticket created successfully!";
            responseData.data = saveData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to create ticket with error::', error);
            responseData.msg = "Failed to create ticket";
            return responseHelper.error(res, responseData);
        }
    },
    /**
    * Method to handle creation of a sub-ticket
    */
    CreateSubTicket: async (req, res) => {
        let responseData = {};
        const reqObj = req.body;
        let user = req.user.sub;
        log.info("Received request to create a sub-ticket", reqObj);

        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "fleet" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getCategory = await FlowCategoryDbHandler.getById(reqObj.service_category);
            if (!getCategory) {
                responseData.msg = "Please select a valid job type!";
                return responseHelper.error(res, responseData);
            }

            let getParentTicket = await MainJobDbHandler.getByQuery({ _id: reqObj.root_ticket_id, user_id: user });
            if (!getParentTicket.length) {
                responseData.msg = "Please provide a valid parent ticket ID!";
                return responseHelper.error(res, responseData);
            }
            let getQuestion = await FlowQuestionDbHandler.getById(reqObj.question_id);
            if (!getQuestion) {
                responseData.msg = "Please provide a valid question ID!";
                return responseHelper.error(res, responseData);
            }
            let SubJobsSequence = await SubJobDbHandler.getByQuery({ root_ticket_id: reqObj.root_ticket_id });
            // Handle media files
            let media = [];
            if (req.files && req.files.media) {
                for (let i = 0; i < req.files.media.length; i++) {
                    media.push(req.files.media[i].location);
                }
            }

            // Prepare sub-ticket data
            let submitData = {
                service_category: reqObj.service_category,
                root_ticket_id: reqObj.root_ticket_id,
                question_id: reqObj.question_id,
                answer: reqObj.answer,
                ticket_id: generateTicketId(), // Generate a unique ticket ID
                note: reqObj.note,
                media: media,
                status: 'draft', // Default status for new sub-tickets
                sequence: SubJobsSequence.length + 1
            };

            // Save sub-ticket to database
            let saveData = await SubJobDbHandler.create(submitData);
            responseData.msg = "Sub-ticket created successfully!";
            responseData.data = await SubJobDbHandler.getById(saveData._id).populate("question_id");
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to create sub-ticket with error::', error);
            responseData.msg = "Failed to create sub-ticket";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to handle submit request
    */
    SubmitRequest: async (req, res) => {
        let responseData = {};
        const reqObj = req.body;
        let user = req.user.sub;
        log.info("Received request submit request", reqObj);

        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "fleet" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getParentTicket = await MainJobDbHandler.getByQuery({ _id: reqObj.root_ticket_id, user_id: user });
            if (!getParentTicket.length) {
                responseData.msg = "Please provide a valid parent ticket ID!";
                return responseHelper.error(res, responseData);
            }
            let submitData = {
                status: 'created'
            };

            // Save status to database
            let UpdateDataParentTicket = await MainJobDbHandler.updateById(reqObj.root_ticket_id, submitData);
            let UpdateDataChildTicket = await SubJobDbHandler.updateByQuery({ root_ticket_id: reqObj.root_ticket_id }, submitData);

            if (UpdateDataParentTicket) {
                let notificationObj = {
                    title: "🚗🔧 New Service Request Alert",
                    description: "The Fleet Manager 🧑‍💼 has requested a new service 📝: Please Accept ✅ or Reject ❌ it.",
                    is_redirect: true,
                    redirection_location: "admin_job",
                    user_id: user,
                    notification_to_role: "admin",
                    notification_from_role: "fleet",
                    job_id: reqObj.root_ticket_id,
                    admin_id: null
                }
                await NotificationDbHandler.create(notificationObj);
            }
            responseData.msg = "Request submitted successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to submit request with error::', error);
            responseData.msg = "Failed to submit request";
            return responseHelper.error(res, responseData);
        }
    },
    /**
    * Method to handle delete request for main job and sub-jobs if status is draft
    */
    DeleteDraftRequest: async (req, res) => {
        let responseData = {};
        const { root_ticket_id } = req.params;
        let user = req.user.sub;
        log.info("Received request to delete draft request", { root_ticket_id });

        try {
            // Check if the user is valid
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "fleet" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Check if the main job is in draft status
            let getParentTicket = await MainJobDbHandler.getByQuery({ _id: root_ticket_id, user_id: user, status: 'draft' });
            if (!getParentTicket.length) {
                responseData.msg = "No draft main job found with the provided ID!";
                return responseHelper.error(res, responseData);
            }

            // Delete the main job
            await MainJobDbHandler.deleteById(root_ticket_id);

            // Delete associated sub-jobs
            await SubJobDbHandler.deleteByQuery({ root_ticket_id, status: 'draft' });

            responseData.msg = "Draft request and associated sub-jobs deleted successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to delete draft request with error::', error);
            responseData.msg = "Failed to delete draft request";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to handle get Root Tickets
    */
    GetRootTicket: async (req, res) => {
        let responseData = {};
        let user = req.user.sub;
        log.info("Received request to get Root tickets");
        const limit = parseInt(req.query.limit);
        const skip = parseInt(req.query.skip);
        const { service_category, date, vehicle_nickname } = req.query; // Extracting new query parameters
        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "fleet" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Prepare filters
            let filters = { user_id: user, status: req.query.status };
            if (service_category) {
                filters.service_category = { $in: service_category.split(',').map(id => id.trim()) }; // Convert to array
            }
            if (date) {
                const startOfDay = new Date(date).setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(date).setUTCHours(23, 59, 59, 999);
                filters.created_at = { $gte: new Date(startOfDay), $lte: new Date(endOfDay) }; // Date filter
            }
            if (vehicle_nickname) {
                // Find vehicle IDs by nickname
                const vehicles = await VehicleDbHandler.getByQuery({ nickname: { $regex: vehicle_nickname, $options: 'i' } }); // Case insensitive substring search
                const vehicleIds = vehicles.map(vehicle => vehicle._id);
                filters.vehicle_id = { $in: vehicleIds }; // Filter by vehicle IDs
            }

            let getData = await MainJobDbHandler.getByQuery(filters).sort({ created_at: -1 })
                .populate("service_category").populate("vehicle_id").populate("make").populate("model").skip(skip).limit(limit);

            // Fetch child tickets for each root ticket
            const rootTicketsWithChildren = await Promise.all(getData.map(async (rootTicket) => {
                const childTickets = await SubJobDbHandler.getByQuery({ root_ticket_id: rootTicket._id }).sort({ created_at: -1 })
                    .populate("service_category")
                    .populate("question_id");

                return {
                    ...rootTicket.toObject(),
                    child_tickets: childTickets,
                    child_tickets_count: childTickets.length
                };
            }));
            responseData.msg = "Tickets fetched successfully!";
            responseData.data = { count: await MainJobDbHandler.getByQuery(filters).countDocuments(), data: rootTicketsWithChildren };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch tickets with error::', error);
            responseData.msg = "Failed to fetch tickets";
            return responseHelper.error(res, responseData);
        }
    },
    GetRootTicketByID: async (req, res) => {
        let responseData = {};
        let user = req.user.sub;
        let root_ticket_id = req.params.root_ticket_id;
        log.info("Received request to get Root tickets");
        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "fleet" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await MainJobDbHandler.getByQuery({ user_id: user, _id: root_ticket_id }).populate("service_category").populate("vehicle_id");

            responseData.msg = "Tickets fetched successfully!";
            responseData.data = getData[0];
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch tickets with error::', error);
            responseData.msg = "Failed to fetch tickets";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to handle get Child Tickets
    */
    GetChildTicket: async (req, res) => {
        let responseData = {};
        let user = req.user.sub;
        log.info("Received request to get Child tickets");
        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "fleet" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            let getData = await SubJobDbHandler.getByQuery({ root_ticket_id: req.params.root_ticket_id })
                .populate("service_category").populate("question_id").sort({ "sequence": 1 });

            responseData.msg = "Tickets fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch tickets with error::', error);
            responseData.msg = "Failed to fetch tickets";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to handle get Vendor Child Tickets Requests
    */
    GetVendorChildTicketRequest: async (req, res) => {
        let responseData = {};
        let user = req.user.sub;
        log.info("Received request to get Vendor Child Ticket Requests");
        const limit = parseInt(req.query.limit);
        const skip = parseInt(req.query.skip);
        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "vendor" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            let getData = await SubJobDbHandler.getByQuery({ vendor_id: user, active: true, status: "vendor_assigned" })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: "root_ticket_id",
                    populate: { path: "vehicle_id" }
                })
                .populate("service_category")
                .populate("question_id");

            responseData.msg = "Tickets fetched successfully!";
            responseData.data = { count: await SubJobDbHandler.getByQuery({ vendor_id: user, active: true, status: "vendor_assigned" }).countDocuments(), data: getData };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch tickets with error::', error);
            responseData.msg = "Failed to fetch tickets";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to handle get Vendor Child Tickets
    */
    GetVendorChildTicket: async (req, res) => {
        let responseData = {};
        let user = req.user.sub;
        log.info("Received request to get Vendor Child Ticket");
        const limit = parseInt(req.query.limit);
        const skip = parseInt(req.query.skip);
        // Define allowed statuses
        const allowedStatuses = ['vendor_accepted', 'completed', 'in-progress', 'delayed'];

        // Check if the provided status is valid
        if (req.query.status && !allowedStatuses.includes(req.query.status)) {
            responseData.msg = "Invalid status parameter!";
            return responseHelper.error(res, responseData);
        }

        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "vendor" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let query = { vendor_id: user, status: req.query.status };
            if (req.query.service_type) {
                query.service_category = { $in: req.query.service_type.split(',').map(id => id.trim()) };
            }
            if (req.query.date) {
                const startOfDay = new Date(req.query.date).setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(req.query.date).setUTCHours(23, 59, 59, 999);
                query.created_at = { $gte: new Date(startOfDay), $lte: new Date(endOfDay) };
            }
            let getData = await SubJobDbHandler.getByQuery(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: "root_ticket_id",
                    populate: { path: "vehicle_id" }
                })
                .populate("question_id")
                .populate("service_category");

            responseData.msg = "Tickets fetched successfully!";
            responseData.data = { count: await SubJobDbHandler.getByQuery(query).countDocuments(), data: getData };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch tickets with error::', error);
            responseData.msg = "Failed to fetch tickets";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method for vendor to accept or reject a job
    */
    VendorAcceptOrRejectJob: async (req, res) => {
        let responseData = {};
        let vendor = req.user.sub;
        const { subTicketId, status, status_reason } = req.body;
        log.info("Received request from vendor to accept or reject a job");

        try {
            // Check if the vendor exists in the database
            let vendorData = await userDbHandler.getByQuery({ _id: vendor, user_role: "vendor" });
            if (!vendorData.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Check if the sub-ticket exists in the database
            let subTicketData = await SubJobDbHandler.getByQuery({ _id: subTicketId, active: true, status: "vendor_assigned" });
            if (!subTicketData.length) {
                responseData.msg = "Sub-ticket not found!";
                return responseHelper.error(res, responseData);
            }

            // Update the sub-ticket with the new status and reason if necessary
            let updateData = {
                status: status ? "vendor_accepted" : "vendor_rejected",
                ...(status_reason && { status_reason })
            };
            if (!status && !status_reason) {
                responseData.msg = "Rejection reason is required when rejecting the job!";
                return responseHelper.error(res, responseData);
            }

            let updateSubTicket = await SubJobDbHandler.updateById(subTicketId, updateData);
            if (updateSubTicket) {
                let notificationObj = {
                    title: `${status ? "🛠️🎉 Task Accepted" : "🚫 Task Rejected"}`,
                    description: `${vendorData[0].full_name} has ${status ? "accepted ✅" : "rejected ❌"} the assigned task of Service request root ticket ${subTicketData[0].root_ticket_id}.`,
                    is_redirect: true,
                    redirection_location: "admin_kanban",
                    user_id: vendor,
                    notification_to_role: "admin",
                    notification_from_role: "vendor",
                    job_id: subTicketData[0].root_ticket_id,
                    admin_id: null
                }
                await NotificationDbHandler.create(notificationObj);
            }

            if (!updateSubTicket) {
                responseData.msg = "Failed to update the sub-ticket status!";
                return responseHelper.error(res, responseData);
            }

            responseData.msg = `Job has been ${status ? "accepted" : "rejected"} successfully!`;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update job status with error:', error);
            responseData.msg = "Something went wrong! Please try again later.";
            return responseHelper.error(res, responseData);
        }
    },

    /**
 * Method for vendor to update the status of a job
 */
    VendorUpdateJobStatus: async (req, res) => {
        let responseData = {};
        let vendor = req.user.sub;
        const { subTicketId, status, time_estimation, cost_estimation, vendor_note, last_oil_change } = req.body;
        log.info("Received request from vendor to update job status");

        // Define allowed statuses
        const allowedStatuses = ['in-progress', 'delayed', 'completed'];

        try {
            // Check if the vendor exists in the database
            let vendorData = await userDbHandler.getByQuery({ _id: vendor, user_role: "vendor" });
            if (!vendorData.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Check if the sub-ticket exists in the database
            let subTicketData = await SubJobDbHandler.getByQuery({ _id: subTicketId, vendor_id: vendor });
            if (!subTicketData.length) {
                responseData.msg = "Sub-ticket not found or you are not authorized to update this ticket!";
                return responseHelper.error(res, responseData);
            }

            // Validate the status
            if (!allowedStatuses.includes(status)) {
                responseData.msg = "Invalid status provided!";
                return responseHelper.error(res, responseData);
            }

            let media = [];
            if (req.files && req.files.media) {
                for (let i = 0; i < req.files.media.length; i++) {
                    media.push(req.files.media[i].location);
                }
            }

            // Validate and prepare data based on status
            let updateData = { status };

            if (status === 'delayed' && !time_estimation) {
                responseData.msg = "Time estimation is required when the status is set to delayed!";
                return responseHelper.error(res, responseData);
            }

            // if (status === 'completed' && !media.length) {
            //     responseData.msg = "Vendor media is required when the status is set to completed!";
            //     return responseHelper.error(res, responseData);
            // }

            if (status === 'delayed') {
                updateData.time_estimation = time_estimation;

            }

            if (status === 'completed') {
                updateData.vendor_media = media;
                updateData.active = false;
                updateData.cost_estimation = cost_estimation;
                updateData.vendor_note = vendor_note;
                updateData.completed_at = new Date();
            }

            // Update the sub-ticket with the new status and additional data
            let updateSubTicket = await SubJobDbHandler.updateById(subTicketId, updateData);

            if (updateSubTicket) {
                let notificationObj = {
                    title: `${status === 'completed' ? "✅🏁 Task Completed" : status === 'delayed' ? "⏳⚠️ Status Update: Delayed" : "🚧🛠️ Task In-Progress"}`,
                    description: `${vendorData[0].full_name} has updated the ticket status as ${status === 'completed' ? "completed 🎯" : status === 'delayed' ? "delayed 🕒" : "in progress 🚧🛠️"} ${vendor_note ? "with reason" + vendor_note : ""}`,
                    is_redirect: true,
                    redirection_location: "admin_kanban",
                    user_id: vendor,
                    notification_to_role: "admin",
                    notification_from_role: "vendor",
                    job_id: subTicketData[0].root_ticket_id,
                    admin_id: null
                }
                await NotificationDbHandler.create(notificationObj);
            }

            let rootTicketData = await MainJobDbHandler.getByQuery({ _id: subTicketData[0].root_ticket_id });
            console.log("🚀 ~ VendorUpdateJobStatus: ~ last_oil_change:", last_oil_change, typeof last_oil_changes)
            let lastOilChange = last_oil_change ? moment().utc().startOf('day').toISOString() : '';
            let vehicleUpdate = await VehicleDbHandler.updateById(rootTicketData[0].vehicle_id, { last_oil_change: lastOilChange });

            if (!updateSubTicket) {
                responseData.msg = "Failed to update the sub-ticket status!";
                return responseHelper.error(res, responseData);
            }

            // If the status is completed, find the next job and activate it
            if (status === 'completed') {
                // Fetch the next job in sequence
                const rootTicketId = subTicketData[0].root_ticket_id;
                const currentSequence = subTicketData[0].sequence;

                let nextJob = await SubJobDbHandler.getByQuery({
                    root_ticket_id: rootTicketId,
                    sequence: currentSequence + 1
                });

                // Activate the next job if it exists
                if (nextJob.length > 0) {
                    let activateNextJob = await SubJobDbHandler.updateById(nextJob[0]._id, { active: true });

                    if (!activateNextJob) {
                        responseData.msg = "Failed to activate the next sub-job!";
                        return responseHelper.error(res, responseData);
                    }
                } else {
                    // Check if all sub-jobs are completed
                    let allSubJobs = await SubJobDbHandler.getByQuery({ root_ticket_id: rootTicketId });
                    const allCompleted = allSubJobs.every(job => job.status === 'completed');

                    if (allCompleted) {
                        // Update the root ticket status to completed
                        let updateRootTicket = await MainJobDbHandler.updateById(rootTicketId, { status: 'completed', completed_at: new Date() });

                        if (!updateRootTicket) {
                            responseData.msg = "Failed to update the root ticket status!";
                            return responseHelper.error(res, responseData);
                        }
                        let vehicleID = await VehicleDbHandler.getById(rootTicketData[0].vehicle_id);
                        let notificationObj = {
                            title: "🏁🔧 Service Request Completed",
                            description: `Swiiftly Admin has updated the service request status as completed ✅ for ${vehicleID.nickname}, Now the vehicle is available 🚘.`,
                            is_redirect: true,
                            redirection_location: "fleet_job_request",
                            user_id: rootTicketData[0].user_id,
                            notification_to_role: "fleet",
                            notification_from_role: "admin",
                            job_id: rootTicketData[0]._id,
                            admin_id: null
                        }
                        await NotificationDbHandler.create(notificationObj);
                        let subJobs = await SubJobDbHandler.getByQuery({ root_ticket_id: rootTicketId });
                        // Prepare sub_jobs array with sub_job_id and amount
                        let subJobsArray = subJobs.map(job => ({
                            sub_job_id: job._id,
                            amount: job.cost_estimation // Assuming cost_estimation is the amount
                        }));

                        let CreateObject = {
                            fleet_id: rootTicketData[0].user_id,
                            root_ticket_id: rootTicketId,
                            total_amount: subJobs.reduce((sum, job) => sum + parseFloat(job.cost_estimation), 0),
                            invoice_number: generateInvoiceNumber(),
                            status: 'draft',
                            sub_jobs: subJobsArray // Added sub_jobs array
                        };

                        let createInvoice = await FleetInvoiceDbHandler.create(CreateObject);
                        if (!createInvoice) {
                            responseData.msg = "Failed to create the invoice!";
                            return responseHelper.error(res, responseData);
                        }
                    }
                }
                // Update main job with drop-off address and location if present
                if (subTicketData[0].is_dropoff) {
                    const mainJob = await MainJobDbHandler.getByQuery({ _id: rootTicketId });

                    // Update dropoff location and address
                    mainJob[0].location = subTicketData[0].dropoff_location;
                    mainJob[0].address = subTicketData[0].dropoff_address;

                    // Add dropoff location and address to history
                    mainJob[0].location_history.push({
                        ...subTicketData[0].dropoff_location,
                        timestamp: new Date()
                    });

                    mainJob[0].address_history.push({
                        ...subTicketData[0].dropoff_address,
                        timestamp: new Date()
                    });
                    // Save changes
                    await mainJob[0].save();

                }
            }

            responseData.msg = `Job status has been updated to ${status} successfully!`;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update job status with error:', error);
            responseData.msg = "Something went wrong! Please try again later.";
            return responseHelper.error(res, responseData);
        }
    },




};
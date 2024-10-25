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
const Flow = require("../../../services/db/models/flow");
const crypto = require('crypto');
const mainJob = require('../../../services/db/models/mainJob');

/*******************
 * PRIVATE FUNCTIONS
 ********************/


// Function to generate a unique ticket IDs
const generateTicketId = () => {
    // Generate 3 bytes of random data
    return crypto.randomBytes(3).toString('hex').slice(0, 6);
};
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
            responseData.msg = "Request submitted successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to submit request with error::', error);
            responseData.msg = "Failed to submit request";
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
        try {
            let getByQuery = await userDbHandler.getByQuery({ _id: user, user_role: "fleet" });
            if (!getByQuery.length) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await MainJobDbHandler.getByQuery({ user_id: user, status: req.query.status }).sort({ created_at: -1 })
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
            responseData.data = { count: await MainJobDbHandler.getByQuery({ user_id: user, status: req.query.status }).countDocuments(), data: rootTicketsWithChildren };
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

            let getData = await SubJobDbHandler.getByQuery({ vendor_id: user, active: true, status: "vendor_assigned" }).sort({ created_at: -1 }).skip(skip).limit(limit)
                .populate("root_ticket_id").populate("service_category").populate("question_id");

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
            if (req.query.service_category) {
                query.service_category = req.query.service_category;
            }
            if (req.query.date) {
                const startOfDay = new Date(req.query.date).setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(req.query.date).setUTCHours(23, 59, 59, 999);
                query.created_at = { $gte: new Date(startOfDay), $lte: new Date(endOfDay) };
            }
            let getData = await SubJobDbHandler.getByQuery(query).sort({ created_at: -1 }).skip(skip).limit(limit).populate("question_id").populate("root_ticket_id").populate("service_category")
                .populate("root_ticket_id").populate("service_category").populate("question_id");

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
        const { subTicketId, status, time_estimation, cost_estimation, vendor_note, meter_reading } = req.body;
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
            }

            // Update the sub-ticket with the new status and additional data
            let updateSubTicket = await SubJobDbHandler.updateById(subTicketId, updateData);
            let rootTicketData = await MainJobDbHandler.getByQuery({ _id: subTicketData[0].root_ticket_id });
            let vehicleUpdate = await VehicleDbHandler.updateById(rootTicketData[0].vehicle_id, { meter_reading: meter_reading });

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
                        let updateRootTicket = await MainJobDbHandler.updateById(rootTicketId, { status: 'completed' });

                        if (!updateRootTicket) {
                            responseData.msg = "Failed to update the root ticket status!";
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
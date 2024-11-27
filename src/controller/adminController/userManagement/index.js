'use strict';
const logger = require('../../../services/logger');
const log = new logger('AdminUserManagementController').getChildLogger();
const mongoose = require('mongoose');
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
const templates = require('../../../utils/templates/template');
const emailService = require('../../../services/sendEmail');
const adminDbHandler = dbService.Admin;
const UserDbHandler = dbService.User;
const MainJobDbHandler = dbService.MainJob;
const SubJobDbHandler = dbService.SubJob;
const VehicleDbHandler = dbService.Vehicle;
const VehicleAggregate = require("../../../services/db/models/vehicles");
const MainJobAggregate = require("../../../services/db/models/mainJob")
const Flow = require("../../../services/db/models/flow")
const User = require("../../../services/db/models/user")
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
            if (getByQuery.is_company && reqObj.user_role === 'vendor') {
                responseData.msg = "You are not authorized to access this resource!";
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


            let w9_document = '';
            let blank_check_or_bank_letter = '';
            if (req.files && req.files.avatar) {
                avatar = req.files.avatar[0].location;
            }
            if (req.files && req.files.w9_document) {
                w9_document = req.files.w9_document[0].location;
            }
            if (req.files && req.files.blank_check_or_bank_letter) {
                blank_check_or_bank_letter = req.files.blank_check_or_bank_letter[0].location;
            }
            let submitData = {
                full_name: reqObj.full_name,
                email: reqObj.email,
                phone_number: reqObj.phone_number,
                password: password,
                email_verified: true,
                login_way: "local",
                user_role: reqObj.user_role,
                company_name: reqObj.company_name,
                temporary_password: true,
                w9: reqObj.w9,
                w9_document: w9_document,
                blank_check_or_bank_letter: blank_check_or_bank_letter,
                net: reqObj.net,
                service_type: reqObj.service_type ? reqObj.service_type.split(",") : [],
                owner_name: reqObj.owner_name,
                profile_completed: false,
                company_id: reqObj.user_role === 'fleet' ? getByQuery._id : null
            }
            if (w9_document || reqObj.w9) {
                submitData.w9_verified = true
            }
            let createData = await UserDbHandler.createUser(submitData);
            if (createData) {
                let emailBody = {
                    recipientsAddress: createData.email,
                    subject: 'Security Code for Account Verification',
                    body: templates.invitationToJoinSWIIFTLY(submitData)
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
        log.info("Received request for getting the vendor or fleet manager.", reqObj);

        try {
            // Fetch admin details
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            if (getByQuery.is_company && reqObj.user_role === 'vendor') {
                responseData.msg = "You are not authorized to access this resource!";
                return responseHelper.error(res, responseData);
            }

            // Set base query for users
            let userQuery = { user_role: reqObj.user_role, is_delete: false };
            if (reqObj.search) {
                userQuery['full_name'] = { $regex: reqObj.search, $options: 'i' };
            }

            // If the user role is 'vendor', apply additional filters
            if (reqObj.user_role === 'vendor') {
                // Apply the filter for service_type using $in
                if (reqObj.service_type) {
                    userQuery['service_type'] = { $in: reqObj.service_type.split(",") };
                }

                // Check the verified parameter
                if (reqObj.verified === 'true') {
                    // Both bank_verified and w9_verified must be true
                    userQuery['$and'] = [{ bank_verified: true }, { w9_verified: true }];
                } else if (reqObj.verified === 'false') {
                    // Either bank_verified or w9_verified must be false
                    userQuery['$or'] = [{ bank_verified: false }, { w9_verified: false }];
                }

                // Fetch the filtered vendors
                let vendors = await UserDbHandler.getByQuery(userQuery).populate("service_type")
                    .skip(skip)
                    .limit(limit)
                    .sort({ "created_at": -1 });

                responseData.msg = "Vendors data fetched successfully!";
                responseData.data = {
                    count: await UserDbHandler.getByQuery(userQuery).countDocuments(),
                    data: vendors
                };
            }
            // For fleet role, run the original logic
            else if (reqObj.user_role === 'fleet') {
                userQuery.company_id = getByQuery._id;
                let aggregationPipeline = [
                    { $match: userQuery }, // Match fleet users
                    {
                        $lookup: {
                            from: 'vehicles',
                            localField: '_id',
                            foreignField: 'user_id',
                            as: 'vehicles'
                        }
                    },
                    {
                        $lookup: {
                            from: "mainjobs",
                            let: { userId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$user_id', '$$userId'] },
                                                { $eq: ['$status', 'in-progress'] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: 'inProgressJobs'
                        }
                    },
                    {
                        $addFields: {
                            totalVehicles: { $size: '$vehicles' }, // Count the number of vehicles
                            inProgressJobs: { $size: '$inProgressJobs' } // Count the in-progress jobs
                        }
                    },
                    {
                        $project: {
                            vehicles: 0 // Remove the 'vehicles' field after counting
                        }
                    }
                ];

                let aggregationPipelineCount = [...aggregationPipeline]; // Copy the base pipeline for counting

                // Apply filters for totalVehicles and inProgressJobs
                if (reqObj.minVehicles || reqObj.maxVehicles) {
                    aggregationPipeline.push({
                        $match: {
                            totalVehicles: {
                                ...(reqObj.minVehicles ? { $gte: parseInt(reqObj.minVehicles) } : {}),
                                ...(reqObj.maxVehicles ? { $lte: parseInt(reqObj.maxVehicles) } : {})
                            }
                        }
                    });
                    aggregationPipelineCount.push({
                        $match: {
                            totalVehicles: {
                                ...(reqObj.minVehicles ? { $gte: parseInt(reqObj.minVehicles) } : {}),
                                ...(reqObj.maxVehicles ? { $lte: parseInt(reqObj.maxVehicles) } : {})
                            }
                        }
                    });
                }

                if (reqObj.minInProgressJobs || reqObj.maxInProgressJobs) {
                    aggregationPipeline.push({
                        $match: {
                            inProgressJobs: {
                                ...(reqObj.minInProgressJobs ? { $gte: parseInt(reqObj.minInProgressJobs) } : {}),
                                ...(reqObj.maxInProgressJobs ? { $lte: parseInt(reqObj.maxInProgressJobs) } : {})
                            }
                        }
                    });
                    aggregationPipelineCount.push({
                        $match: {
                            inProgressJobs: {
                                ...(reqObj.minInProgressJobs ? { $gte: parseInt(reqObj.minInProgressJobs) } : {}),
                                ...(reqObj.maxInProgressJobs ? { $lte: parseInt(reqObj.maxInProgressJobs) } : {})
                            }
                        }
                    });
                }

                // Add sort, skip, and limit stages after the filters are applied
                aggregationPipeline.push(
                    { $sort: { "created_at": -1 } },
                    { $skip: skip },
                    { $limit: limit }
                );

                // Execute the aggregation
                let usersWithDetails = await User.aggregate(aggregationPipeline);

                let totalCount = await User.aggregate(aggregationPipelineCount).count("total");

                responseData.msg = "Fleet data fetched successfully!";
                responseData.data = {
                    count: totalCount.length > 0 ? totalCount[0].total : 0,
                    data: usersWithDetails
                };
            }

            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch data with error::', error);
            responseData.msg = "Failed to fetch data";
            return responseHelper.error(res, responseData);
        }
    },

    GetUserDetail: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.query;
        let userId = req.params.userId;
        console.log("🚀 ~ GetUserDetail: ~ userId:", userId);
        log.info("Received request for getting the vendor or fleet manager.", reqObj);

        try {
            // Fetch admin details
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Fetch user details by userId
            let user = await UserDbHandler.getByQuery({ _id: userId }).populate("service_type").lean();

            if (!user || user.length === 0) {
                responseData.msg = "User not found!";
                return responseHelper.error(res, responseData);
            }
            if (getByQuery.is_company) {
                if (!user[0].company_id || user[0].user_role !== 'fleet' || user[0].company_id.toString() != getByQuery._id.toString()) {
                    responseData.msg = "You are not authorized to access this resource!";
                    return responseHelper.error(res, responseData);
                }
            }

            // If the user role is 'fleet', add extra information
            if (user[0].user_role === 'fleet') {
                let totalVehicles = await VehicleDbHandler.getByQuery({ user_id: user[0]._id }).countDocuments();
                let inProgressJobs = await MainJobDbHandler.getByQuery({ user_id: user[0]._id, status: 'in-progress' }).countDocuments();
                user[0].totalVehicles = totalVehicles;
                user[0].inProgressJobs = inProgressJobs;
            }

            // If user is vendor, do not add extra vehicle/job details
            responseData.msg = "Data fetched successfully!";
            responseData.data = user[0];
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch data with error::', error);
            responseData.msg = "Failed to fetch data";
            return responseHelper.error(res, responseData);
        }
    },

    GetUserVehiclesData: async (req, res) => {
        let userId = req.params.userId; // Assuming the user ID is passed as a path parameter
        let admin = req.admin.sub;
        log.info('Received request for vehicles data with user id:', userId);
        let responseData = {};

        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            // Verify user existence
            let userData = await UserDbHandler.getByQuery({ _id: userId, company_id: getByQuery._id });
            if (!userData.length) {
                responseData.msg = 'Fleet Manager not found!';
                return responseHelper.error(res, responseData);
            }
            // Aggregate data for vehicles related to the user
            let vehicleData = await VehicleAggregate.aggregate([
                {
                    $match: {
                        user_id: mongoose.Types.ObjectId(userId),
                        // is_deleted: false // Exclude deleted vehicles
                    }
                },
                {
                    $group: {
                        _id: {
                            brand: "$make",
                            model: "$model"
                        },
                        totalCars: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.brand",
                        totalCars: { $sum: "$totalCars" },
                        models: {
                            $push: {
                                modelId: "$_id.model",
                                count: "$totalCars"
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'makes', // The collection name for brands/makes
                        localField: '_id',
                        foreignField: '_id',
                        as: 'brand'
                    }
                },
                {
                    $unwind: "$brand"
                },
                {
                    $lookup: {
                        from: 'models', // The collection name for models
                        localField: "models.modelId",
                        foreignField: "_id",
                        as: "modelDetails"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        brand: 1, // Include the full brand object
                        totalCars: 1,
                        totalModels: { $size: "$modelDetails" },
                        models: {
                            $map: {
                                input: "$modelDetails",
                                as: "modelDetail",
                                in: {
                                    model: "$$modelDetail",
                                    count: {
                                        $reduce: {
                                            input: "$models",
                                            initialValue: 0,
                                            in: {
                                                $cond: [
                                                    { $eq: ["$$this.modelId", "$$modelDetail._id"] },
                                                    { $add: ["$$value", "$$this.count"] },
                                                    "$$value"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]);

            // Use aggregation pipeline for more efficient querying and populating
            let jobData = await MainJobAggregate.aggregate([
                {
                    $match: {
                        status: req.query.status,
                        user_id: mongoose.Types.ObjectId(userId)
                    }
                },
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
                            }
                        ]
                    }
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
            ]);

            responseData.msg = "Vehicle data fetched successfully!";
            responseData.data = { totalVehicles: await VehicleDbHandler.getByQuery({ user_id: userId }).countDocuments(), vehicleData, jobData };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to fetch vehicle data with error::', error);
            responseData.msg = 'Failed to fetch vehicle data!';
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
        log.info("Received request for deleting the vendor or fleet manager.", id);

        try {
            // Fetch admin details
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Fetch the user details
            let user = await UserDbHandler.getByQuery({ _id: id });
            if (!user.length) {
                responseData.msg = "Invalid request!";
                return responseHelper.error(res, responseData);
            }
            if (getByQuery.is_company) {
                if (!user[0].company_id || user[0].user_role !== 'fleet' || user[0].company_id.toString() != getByQuery._id.toString()) {
                    responseData.msg = "You are not authorized to access this resource!";
                    return responseHelper.error(res, responseData);
                }
            }

            // Check for 'fleet' user role
            if (user[0].user_role === 'fleet') {
                // Check if any main job is not equal to "completed" or "draft"
                let mainJobsInProgress = await MainJobDbHandler.getByQuery({
                    user_id: user[0]._id,
                    status: { $nin: ['completed', 'draft'] }
                }).countDocuments();

                if (mainJobsInProgress > 0) {
                    responseData.msg = "Cannot delete user because a job is in progress.";
                    return responseHelper.error(res, responseData);
                }
            }

            // Check for 'vendor' user role
            if (user[0].user_role === 'vendor') {
                // Check if any sub-jobs exist with the vendor_id and status not equal to 'vendor_accepted', 'vendor_assigned', 'in-progress', 'delayed'
                let subJobsInProgress = await SubJobDbHandler.getByQuery({
                    vendor_id: user[0]._id,
                    status: { $nin: ['vendor_accepted', 'vendor_assigned', 'in-progress', 'delayed'] }
                }).countDocuments();

                if (subJobsInProgress > 0) {
                    responseData.msg = "Cannot delete user because sub-jobs are in an invalid state.";
                    return responseHelper.error(res, responseData);
                }
            }

            // Proceed to delete the user (soft delete)
            await UserDbHandler.updateById(id, { is_delete: true });
            responseData.msg = "User deleted successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to delete user with error::', error);
            responseData.msg = "Failed to delete user";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to handle update Vendor status
    */
    UpdateVendorStatus: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let id = req.params.userId;
        let reqObj = req.body;
        log.info("Received request for updating the vendor status.", id);

        try {
            // Fetch admin details
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Fetch the user details
            let user = await UserDbHandler.getByQuery({ _id: id, user_role: 'vendor' });
            if (!user.length) {
                responseData.msg = "Invalid request!";
                return responseHelper.error(res, responseData);
            }
            let updateData = {
                bank_verified: reqObj.bank_verified,
                w9_verified: reqObj.w9_verified
            }


            // Proceed to delete the user (soft delete)
            await UserDbHandler.updateById(id, updateData);
            responseData.msg = "Vendor status updated successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to update vendor with error::', error);
            responseData.msg = "Failed to update vendor status";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to handle update Vendor Info
    */
    UpdateVendorInfo: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let id = req.params.userId;
        let reqObj = req.body;
        log.info("Received request for updating the vendor info.", id);

        try {
            // Fetch admin details
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Fetch the user details
            let user = await UserDbHandler.getByQuery({ _id: id, user_role: 'vendor' });
            if (!user.length) {
                responseData.msg = "Invalid request!";
                return responseHelper.error(res, responseData);
            }
            if (reqObj.account_number != "") {
                let user1 = await UserDbHandler.getByQuery({ account_number: reqObj.account_number });
                if (user1.length && user1[0]._id != id) {
                    responseData.msg = "Bank account number already exist!";
                    return responseHelper.error(res, responseData);
                }
            }

            let w9_document = user[0].w9_document;
            let blank_check_or_bank_letter = user[0].blank_check_or_bank_letter;
            if (req.files && req.files.w9_document) {
                w9_document = req.files.w9_document[0].location;
            }
            if (req.files && req.files.blank_check_or_bank_letter) {
                blank_check_or_bank_letter = req.files.blank_check_or_bank_letter[0].location;
            }
            let updateData = {
                routing_no: reqObj.routing_no,
                account_holder_name: reqObj.account_holder_name,
                account_number: reqObj.account_number,
                bank_name: reqObj.bank_name,
                bic_swift_code: reqObj.bic_swift_code,
                bank_address: reqObj.bank_address,

                w9: reqObj.w9,
                w9_document: w9_document,
                full_name: reqObj.full_name,
                net: reqObj.net,
                service_type: reqObj.service_type ? reqObj.service_type.split(",") : [],
                owner_name: reqObj.owner_name,
                phone_number: reqObj.phone_number,
                business_address: reqObj.business_address,
                blank_check_or_bank_letter: blank_check_or_bank_letter,

            }


            // Proceed to delete the user (soft delete)
            await UserDbHandler.updateById(id, updateData);
            responseData.msg = "Vendor information updated successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to update vendor with error::', error);
            responseData.msg = "Failed to update vendor information!";
            return responseHelper.error(res, responseData);
        }
    },

};
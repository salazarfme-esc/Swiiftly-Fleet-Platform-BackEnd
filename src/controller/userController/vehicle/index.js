'use strict';
const logger = require('../../../services/logger');
const mongoose = require('mongoose');
const log = new logger('UserVehicleController').getChildLogger();
const dbService = require('../../../services/db/services');
const responseHelper = require('../../../services/customResponse');
const userDbHandler = dbService.User;
const VehicleDbHandler = dbService.Vehicle;
const VehicleAggregate = require("../../../services/db/models/vehicles");
const makeDbHandler = dbService.Make;
const modelDbHandler = dbService.Model;
const MainJobDbHandler = dbService.MainJob;
/*******************
 * PRIVATE FUNCTIONS
 ********************/

/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {
    /**
     *  Method to add Vehicle
     */
    AddVehicle: async (req, res) => {
        let reqObj = req.body;
        let user = req.user;
        let id = user.sub;
        log.info('Received request for add vehicle:', reqObj);
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            let checkVehicle = await VehicleDbHandler.getByQuery({ identification_number: reqObj.identification_number });
            if (checkVehicle.length) {
                responseData.msg = 'Vehicle with this identification number already exists!';
                return responseHelper.error(res, responseData);
            }

            // Check if the make exists, if not create it
            let make = await makeDbHandler.getByQuery({ title: reqObj.make });
            let makeId;

            if (make.length) {
                makeId = make[0]._id; // Use the existing make ID
            } else {
                let newMake = await makeDbHandler.create({ title: reqObj.make });
                makeId = newMake._id; // Use the newly created make ID
            }

            // Check if the model exists for the given make, if not create it
            let model = await modelDbHandler.getByQuery({ title: reqObj.model, make_id: makeId });
            let modelId;

            if (model.length) {
                modelId = model[0]._id; // Use the existing model ID
            } else {
                let newModel = await modelDbHandler.create({ title: reqObj.model, make_id: makeId });
                modelId = newModel._id; // Use the newly created model ID
            }

            let media = [];
            let document = [];

            if (req.files && req.files.media) {
                for (let i = 0; i < req.files.media.length; i++) {
                    media.push(req.files.media[i].location);
                }
            }
            if (req.files && req.files.document) {
                for (let i = 0; i < req.files.document.length; i++) {
                    document.push(req.files.document[i].location);
                }
            }

            let submitData = {
                identification_number: reqObj.identification_number || '',
                nickname: reqObj.nickname || '',
                year: reqObj.year || '',
                make: makeId, // Store the make ID
                model: modelId, // Store the model ID
                color: reqObj.color || '',
                registration_due_date: reqObj.registration_due_date || '',
                last_oil_change: reqObj.last_oil_change || '',
                license_plate: reqObj.license_plate || '',
                address: {
                    street: reqObj.street || '',
                    address: reqObj.address || '',
                    city: reqObj.city || '',
                    district: reqObj.district || '',
                    state: reqObj.state || '',
                    pin: reqObj.pin || '',
                    country: reqObj.country || '',
                },
                location: {
                    type: 'Point',
                    coordinates: reqObj.coordinates || [0.0000, 0.0000],
                },
                media: media || [],
                document: document || [],
                user_id: id
            }

            let saveData = await VehicleDbHandler.create(submitData);
            responseData.msg = 'Data saved!';
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to save data with error::', error);
            responseData.msg = 'Failed to save data!';
            return responseHelper.error(res, responseData);
        }
    },

    GetVehicle: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request for get vehicle with id:', id);
        const limit = parseInt(req.query.limit);
        const skip = parseInt(req.query.skip);
        const searchValue = req.body.search;
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }
            // Construct MongoDB query using $or for various fields
            const queryConditions = [
                { identification_number: { $regex: searchValue, $options: 'i' } },
                { nickname: { $regex: searchValue, $options: 'i' } },
                { year: { $regex: searchValue, $options: 'i' } },
                // { make: { $regex: searchValue, $options: 'i' } },
                // { model: { $regex: searchValue, $options: 'i' } },
                { color: { $regex: searchValue, $options: 'i' } },
                { registration_due_date: { $regex: searchValue, $options: 'i' } },
                { last_oil_change: { $regex: searchValue, $options: 'i' } },
                { license_plate: { $regex: searchValue, $options: 'i' } },
                { 'address.street': { $regex: searchValue, $options: 'i' } },
                { 'address.address': { $regex: searchValue, $options: 'i' } },
                { 'address.city': { $regex: searchValue, $options: 'i' } },
                { 'address.district': { $regex: searchValue, $options: 'i' } },
                { 'address.state': { $regex: searchValue, $options: 'i' } },
                { 'address.pin': { $regex: searchValue, $options: 'i' } },
                { 'address.country': { $regex: searchValue, $options: 'i' } }
            ];

            // Search using $or operator across all specified fields
            const searchResults = await VehicleDbHandler.getByQuery({
                $or: queryConditions
            }).skip(skip).limit(limit);
            responseData.msg = "Data fetched!";
            responseData.data = searchResults;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get data with error::', error);
            responseData.msg = 'failed to get data!';
            return responseHelper.error(res, responseData);
        }
    },
    GetBrandStatistics: async (req, res) => {
        let user = req.user;
        let userId = user.sub;
        let brandName = req.body.brand || ''; // Get the brand name from the request body
        log.info('Received request for brand statistics with user id:', userId, 'and brand:', brandName);
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: userId, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            // Aggregate data by brand (make)
            let matchStage = { user_id: mongoose.Types.ObjectId(userId) };

            if (brandName) {
                // Get the make ID if brandName is provided
                let makes = await makeDbHandler.getByQuery({
                    title: { $regex: brandName, $options: 'i' } // Case-insensitive substring search
                });
                if (!makes.length) {
                    responseData.msg = 'Brand not found!';
                    responseData.data = [];
                    return responseHelper.success(res, responseData);
                }
                let makeIds = makes.map(make => make._id);
                matchStage['make'] = { $in: makeIds };
            }

            let brandStatistics = await VehicleAggregate.aggregate([
                {
                    $match: matchStage
                },
                {
                    $group: {
                        _id: "$make",
                        carCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'makes', // The collection name for makes
                        localField: '_id',
                        foreignField: '_id',
                        as: 'make'
                    }
                },
                {
                    $unwind: "$make"
                },
                {
                    $lookup: {
                        from: 'mainjobs', // The collection name for MainJob
                        let: { make_id: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$vehicle_id", "$$make_id"] },
                                            { $ne: ["$status", "completed"] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'inService'
                    }
                },
                {
                    $addFields: {
                        inServiceCount: { $size: "$inService" },
                        inServicePercentage: {
                            $cond: {
                                if: { $eq: ["$carCount", 0] },
                                then: 0,
                                else: { $multiply: [{ $divide: ["$inServiceCount", "$carCount"] }, 100] }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        brand: "$make.title",
                        carCount: 1,
                        inServicePercentage: {
                            $ifNull: ["$inServicePercentage", 0] // Ensure the percentage is never null
                        }
                    }
                }
            ]);

            responseData.msg = "Brand statistics fetched successfully!";
            responseData.data = brandStatistics;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get brand statistics with error::', error);
            responseData.msg = 'Failed to get brand statistics!';
            return responseHelper.error(res, responseData);
        }
    },

    GetCarsByBrandStatus: async (req, res) => {
        let user = req.user;
        let userId = user.sub;
        let brandName = req.body.brand;
        let modelSearch = req.body.model || ''; // Get the model search substring from the request body
        log.info('Received request for cars by brand with user id:', userId, 'and brand:', brandName, 'and model search:', modelSearch);
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: userId, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            // Find the brand (make) by name
            let make = await makeDbHandler.getByQuery({ title: brandName });
            if (!make.length) {
                responseData.msg = 'Brand not found!';
                return responseHelper.error(res, responseData);
            }
            let makeId = make[0]._id;

            // Find all vehicles under this brand owned by the user
            let vehicles = await VehicleDbHandler.getByQuery({ make: makeId, user_id: userId }).populate('model');

            if (!vehicles.length) {
                responseData.msg = "No vehicles found for this brand!";
                responseData.data = {
                    inService: [],
                    notInService: []
                };
                return responseHelper.success(res, responseData);
            }

            // Find all service jobs for these vehicles
            let vehicleIds = vehicles.map(vehicle => vehicle._id);
            let serviceJobs = await MainJobDbHandler.getByQuery({
                vehicle_id: { $in: vehicleIds },
                status: { $ne: "completed" }
            });

            // Segregate vehicles into in service and not in service
            let vehiclesInService = [];
            let vehiclesNotInService = [];

            vehicles.forEach(vehicle => {
                const inService = serviceJobs.some(job => job.vehicle_id.equals(vehicle._id));
                if (inService) {
                    vehiclesInService.push(vehicle);
                } else {
                    vehiclesNotInService.push(vehicle);
                }
            });

            // Filter by model search within inService and notInService arrays
            const filterByModel = (vehicles) => {
                return vehicles.filter(vehicle => vehicle.model.title.toLowerCase().includes(modelSearch.toLowerCase()));
            };

            vehiclesInService = filterByModel(vehiclesInService);
            vehiclesNotInService = filterByModel(vehiclesNotInService);

            // Function to segregate vehicles by model
            const segregateByModel = (vehicles) => {
                return vehicles.reduce((result, vehicle) => {
                    const modelName = vehicle.model.title;
                    if (!result[modelName]) {
                        result[modelName] = [];
                    }
                    result[modelName].push(vehicle);
                    return result;
                }, {});
            };

            // Segregate each group by model
            const inServiceByModel = segregateByModel(vehiclesInService);
            const notInServiceByModel = segregateByModel(vehiclesNotInService);

            // Convert the segregated objects into an array format
            const formatResponse = (segregatedData) => {
                return Object.keys(segregatedData).map(modelName => ({
                    model: modelName,
                    vehicles: segregatedData[modelName]
                }));
            };

            responseData.msg = "Cars by brand status fetched successfully!";
            responseData.data = {
                inService: formatResponse(inServiceByModel),
                notInService: formatResponse(notInServiceByModel)
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get cars by brand status with error::', error);
            responseData.msg = 'Failed to get cars by brand status!';
            return responseHelper.error(res, responseData);
        }
    },





    UpdateVehicle: async (req, res) => {
        let reqObj = req.body;
        let user_id = req.user.sub;
        let id = req.params.id;
        log.info('Received request for update vehicle with id:', id);
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: user_id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            let vehicleData = await VehicleDbHandler.getByQuery({ _id: id, user_id: user_id });
            if (!vehicleData.length) {
                responseData.msg = 'Vehicle not found!';
                return responseHelper.error(res, responseData);
            }

            let checkVehicle = await VehicleDbHandler.getByQuery({
                identification_number: reqObj.identification_number,
                _id: { $ne: id }
            });
            if (checkVehicle.length) {
                responseData.msg = 'Vehicle with this identification number already exists!';
                return responseHelper.error(res, responseData);
            }

            // Check if the make exists, if not create it
            let make = await makeDbHandler.getByQuery({ title: reqObj.make });
            let makeId;

            if (make.length) {
                makeId = make[0]._id; // Use the existing make ID
            } else {
                let newMake = await makeDbHandler.create({ title: reqObj.make, image: reqObj.make_image || '' });
                makeId = newMake._id; // Use the newly created make ID
            }

            // Check if the model exists for the given make, if not create it
            let model = await modelDbHandler.getByQuery({ title: reqObj.model, make_id: makeId });
            let modelId;

            if (model.length) {
                modelId = model[0]._id; // Use the existing model ID
            } else {
                let newModel = await modelDbHandler.create({ title: reqObj.model, make_id: makeId });
                modelId = newModel._id; // Use the newly created model ID
            }

            let media = vehicleData[0].media || [];
            let document = vehicleData[0].document || [];

            if (req.files && req.files.media) {
                for (let i = 0; i < req.files.media.length; i++) {
                    media.push(req.files.media[i].location);
                }
            }

            if (req.files && req.files.document) {
                for (let i = 0; i < req.files.document.length; i++) {
                    document.push(req.files.document[i].location);
                }
            }

            let updateData = {
                identification_number: reqObj.identification_number || vehicleData[0].identification_number,
                nickname: reqObj.nickname || vehicleData[0].nickname,
                year: reqObj.year || vehicleData[0].year,
                make: makeId, // Use the make ID
                model: modelId, // Use the model ID
                color: reqObj.color || vehicleData[0].color,
                registration_due_date: reqObj.registration_due_date || vehicleData[0].registration_due_date,
                last_oil_change: reqObj.last_oil_change || vehicleData[0].last_oil_change,
                license_plate: reqObj.license_plate || vehicleData[0].license_plate,
                address: {
                    street: reqObj.street || vehicleData[0].address.street,
                    address: reqObj.address || vehicleData[0].address.address,
                    city: reqObj.city || vehicleData[0].address.city,
                    district: reqObj.district || vehicleData[0].address.district,
                    state: reqObj.state || vehicleData[0].address.state,
                    pin: reqObj.pin || vehicleData[0].address.pin,
                    country: reqObj.country || vehicleData[0].address.country,
                },
                location: {
                    type: 'Point',
                    coordinates: reqObj.coordinates || vehicleData[0].location.coordinates,
                },
                media: media,
                document: document,
            };

            let saveData = await VehicleDbHandler.updateById(id, updateData);
            responseData.msg = `Data updated!`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = 'failed to update data!';
            return responseHelper.error(res, responseData);
        }
    },

    DeleteVehicle: async (req, res) => {
        let id = req.params.id;
        let user_id = req.user.sub;
        log.info('Received request for delete vehicle with id:', id);
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: user_id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }
            let vehicleData = await VehicleDbHandler.getByQuery({ _id: id, user_id: user_id });
            if (!vehicleData) {
                responseData.msg = 'Vehicle not found!';
                return responseHelper.error(res, responseData);
            }

            await VehicleDbHandler.deleteById(id);
            responseData.msg = `Data deleted!`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to delete data with error::', error);
            responseData.msg = 'failed to delete data!';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle get makes
     */
    getMakes: async (req, res) => {
        let responseData = {};
        try {
            let makes = await makeDbHandler.getByQuery({});
            responseData.msg = "Makes fetched successfully!";
            responseData.data = makes;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch makes with error::', error);
            responseData.msg = "Failed to fetch makes";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to handle get models
    */
    getModels: async (req, res) => {
        let responseData = {};
        let id = req.params.id;
        try {
            let models = await modelDbHandler.getByQuery({ make_id: id }).populate('make_id', 'title');
            responseData.msg = "Models fetched successfully!";
            responseData.data = models;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch models with error::', error);
            responseData.msg = "Failed to fetch models";
            return responseHelper.error(res, responseData);
        }
    },
};
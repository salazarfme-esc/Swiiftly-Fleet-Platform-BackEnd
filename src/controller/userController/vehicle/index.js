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
const excelToJson = require('convert-excel-to-json');
const fs = require('fs');
const path = require('path');
const config = require('../../../config/environments');
const AWS = require('aws-sdk');


/*******************
 * PRIVATE FUNCTIONS
 ********************/


AWS.config.update({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region // Optional: Specify your AWS region if different from default
});
const s3 = new AWS.S3();


const downloadFile = async (bucketName, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const params = { Bucket: bucketName, Key: filePath };

            const downloadStream = s3.getObject(params).createReadStream();
            const writeStream = fs.createWriteStream(`./excel/${filePath}`);

            downloadStream.pipe(writeStream)
                .on('error', (err) => {
                    console.error('Error downloading file:', err);
                    reject(err); // Reject the promise if there's an error
                })
                .on('finish', () => {
                    console.log('File downloaded successfully!');
                    resolve(); // Resolve the promise when download is finished
                });
        } catch (err) {
            console.error('Error:', err);
            reject(err); // Reject the promise if there's an error
        }
    });
};

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

            let checkVehicle = await VehicleDbHandler.getByQuery({
                $or: [
                    { identification_number: reqObj.identification_number },
                    { license_plate: reqObj.license_plate }
                ]
            });

            if (checkVehicle.length) {
                responseData.msg = 'Vehicle with this identification number or license plate already exists!';
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
    BulkUploadVehicles: async (req, res) => {
        let responseData = {};
        let response = {
            successCount: 0,
            failureCount: 0,
            failedRecords: []
        };
        let user = req.user;
        let id = user.sub;
        log.info('Received bulk upload request.');

        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }
            if (!req.file) {
                responseData.msg = 'Please upload a file!';
                return responseHelper.error(res, responseData);
            }
            const filePath = req.file.key; // S3 key of the uploaded file
            const bucketName = config.aws.s3Bucket;
            const fileExtension = path.extname(filePath).toLowerCase();

            // Download the file from S3
            const fileData = await downloadFile(bucketName, filePath);

            // Convert Excel to JSON
            const excelData = excelToJson({
                sourceFile: `./excel/${filePath}`, // Corrected path variable
                header: {
                    rows: 1
                },
                columnToKey: {
                    A: 'identification_number',
                    B: 'nickname',
                    C: 'year',
                    D: 'make',
                    E: 'model',
                    F: 'color',
                    G: 'registration_due_date',
                    H: 'last_oil_change',
                    I: 'license_plate',
                    J: 'street',
                    K: 'address',
                    L: 'city',
                    M: 'district',
                    N: 'state',
                    O: 'pin',
                    P: 'country',
                    Q: 'coordinates',
                    R: 'media',
                    S: 'document'
                }
            });

            for (let record of excelData.Sheet1) { // Assuming the sheet name is 'Sheet1'
                try {
                    // Validate uniqueness of VIN and License Plate
                    let checkVehicle = await VehicleDbHandler.getByQuery({
                        $or: [
                            { identification_number: record.identification_number },
                            { license_plate: record.license_plate }
                        ]
                    });

                    if (checkVehicle.length) {
                        response.failureCount++;
                        response.failedRecords.push({
                            record,
                            reason: 'Vehicle with this identification number or license plate already exists!'
                        });
                        continue;
                    }

                    // Check or Create Make and Model
                    let make = await makeDbHandler.getByQuery({ title: record.make });
                    let makeId;

                    if (make.length) {
                        makeId = make[0]._id;
                    } else {
                        let newMake = await makeDbHandler.create({ title: record.make });
                        makeId = newMake._id;
                    }

                    let model = await modelDbHandler.getByQuery({ title: record.model, make_id: makeId });
                    let modelId;

                    if (model.length) {
                        modelId = model[0]._id;
                    } else {
                        let newModel = await modelDbHandler.create({ title: record.model, make_id: makeId });
                        modelId = newModel._id;
                    }

                    let media = record.media ? record.media.split(',') : [];
                    let document = record.document ? record.document.split(',') : [];

                    let submitData = {
                        identification_number: record.identification_number || '',
                        nickname: record.nickname || '',
                        year: record.year || '',
                        make: makeId,
                        model: modelId,
                        color: record.color || '',
                        registration_due_date: record.registration_due_date || '',
                        last_oil_change: record.last_oil_change || '',
                        license_plate: record.license_plate || '',
                        address: {
                            street: record.street || '',
                            address: record.address || '',
                            city: record.city || '',
                            district: record.district || '',
                            state: record.state || '',
                            pin: record.pin || '',
                            country: record.country || '',
                        },
                        location: {
                            type: 'Point',
                            coordinates: record.coordinates ? record.coordinates.split(',').map(Number) : [0.0000, 0.0000],
                        },
                        media: media,
                        document: document,
                        user_id: id
                    };

                    await VehicleDbHandler.create(submitData);
                    response.successCount++;
                } catch (error) {
                    log.error('Failed to save record:', record, 'Error:', error);
                    response.failureCount++;
                    response.failedRecords.push({
                        record,
                        reason: 'Failed to save record due to an error.'
                    });
                }
            }
            fs.unlinkSync(`./excel/${filePath}`); // Corrected unlinking
            responseData.msg = 'Bulk upload completed!';
            responseData.data = response;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to process bulk upload:', error);
            responseData.msg = 'Failed to process bulk upload!';
            return responseHelper.error(res, responseData);
        }
    },

    GetVehicle: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request for get vehicle with id:', id);
        const limit = parseInt(req.query.limit) || 10; // Default limit
        const skip = parseInt(req.query.skip) || 0; // Default skip
        const searchValue = req.body.search || '';
        const { make, model, status } = req.body; // Extract make, model, and status from request body
        let responseData = {};

        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            // Step 1: Construct MongoDB query for vehicle search
            let query = { user_id: mongoose.Types.ObjectId(id), is_deleted: false };

            if (make) {
                const makeMatches = await makeDbHandler.getByQuery({
                    title: { $regex: make, $options: 'i' }
                }).lean();
                const makeIds = makeMatches.map(make => make._id);
                if (makeIds.length) {
                    query.make = { $in: makeIds };
                }
            }

            if (model) {
                const modelMatches = await modelDbHandler.getByQuery({
                    title: { $regex: model, $options: 'i' }
                }).lean();
                const modelIds = modelMatches.map(model => model._id);
                if (modelIds.length) {
                    query.model = { $in: modelIds };
                }
            }

            if (searchValue) {
                query.$or = [
                    { identification_number: { $regex: searchValue, $options: 'i' } },
                    { nickname: { $regex: searchValue, $options: 'i' } },
                    // { year: { $regex: searchValue, $options: 'i' } },
                    // { color: { $regex: searchValue, $options: 'i' } },
                    // { registration_due_date: { $regex: searchValue, $options: 'i' } },
                    // { last_oil_change: { $regex: searchValue, $options: 'i' } },
                    { license_plate: { $regex: searchValue, $options: 'i' } },
                    // { 'address.street': { $regex: searchValue, $options: 'i' } },
                    // { 'address.address': { $regex: searchValue, $options: 'i' } },
                    // { 'address.city': { $regex: searchValue, $options: 'i' } },
                    // { 'address.district': { $regex: searchValue, $options: 'i' } },
                    // { 'address.state': { $regex: searchValue, $options: 'i' } },
                    // { 'address.pin': { $regex: searchValue, $options: 'i' } },
                    // { 'address.country': { $regex: searchValue, $options: 'i' } }
                ];
            }

            // Step 2: Fetch vehicles based on the constructed query without pagination
            let vehicles = await VehicleDbHandler.getByQuery(query)
                .populate('make')
                .populate('model')
                .lean();

            // Step 3: Determine "in service" status for each vehicle
            const vehicleIds = vehicles.map(vehicle => vehicle._id);
            const inServiceJobs = await MainJobDbHandler.getByQuery({
                vehicle_id: { $in: vehicleIds },
                status: { $ne: 'completed' }
            }).lean();

            const inServiceVehicleIds = new Set(inServiceJobs.map(job => job.vehicle_id.toString()));

            vehicles = vehicles.map(vehicle => ({
                ...vehicle,
                inService: inServiceVehicleIds.has(vehicle._id.toString())
            }));

            // Step 4: Filter based on inService status if provided
            if (status === "inService") {
                vehicles = vehicles.filter(vehicle => vehicle.inService === true);
            } else if (status === "available") {
                vehicles = vehicles.filter(vehicle => vehicle.inService === false);
            }

            // Step 5: Apply pagination after filtering
            const totalRecords = vehicles.length; // Total records after filtering
            vehicles = vehicles.slice(skip, skip + limit);

            // Step 6: Return paginated results with total count
            responseData.msg = "Data fetched!";
            responseData.data = {
                vehicles,
                totalRecords
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get data with error::', error);
            responseData.msg = 'failed to get data!';
            return responseHelper.error(res, responseData);
        }
    },

    GetVehicleDetail: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        let vehicleId = req.params.vehicleId;
        log.info('Received request for get vehicle with id:', id);
        let responseData = {};

        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }


            let VehicleData = await VehicleDbHandler.getById(vehicleId).populate('make')
                .populate('model');
            if (!VehicleData) {
                responseData.msg = 'Vehicle not found!';
                return responseHelper.error(res, responseData);
            }

            responseData.msg = 'Data fetched!';
            responseData.data = VehicleData;
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
        let yearFilters = req.body.yearFilters || []; // An array of objects with { brand: <brand_id>, year: <year> }
        log.info('Received request for brand statistics with user id:', userId, 'and year filters:', yearFilters);
        let responseData = {};

        try {
            let userData = await userDbHandler.getByQuery({ _id: userId, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            // Aggregate data by brand (make)
            let matchStage = {
                user_id: mongoose.Types.ObjectId(userId),
                is_deleted: false // Exclude deleted vehicles
            };

            let brandStatistics = await VehicleAggregate.aggregate([
                {
                    $match: matchStage
                },
                {
                    $group: {
                        _id: {
                            make: "$make",
                            model: "$model"
                        },
                        totalCars: { $sum: 1 },
                        carsByYear: {
                            $push: {
                                year: "$year",
                                count: 1
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$_id.make",
                        totalCars: { $sum: "$totalCars" },
                        models: {
                            $push: {
                                model: "$_id.model",
                                count: "$totalCars",
                                carsByYear: "$carsByYear"
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
                        localField: "models.model",
                        foreignField: "_id",
                        as: "modelDetails"
                    }
                },
                {
                    $addFields: {
                        models: {
                            $map: {
                                input: "$modelDetails",
                                as: "modelDetail",
                                in: {
                                    model: {
                                        _id: "$$modelDetail._id",
                                        title: "$$modelDetail.title"
                                    },
                                    count: {
                                        $let: {
                                            vars: {
                                                idx: { $indexOfArray: ["$models.model", "$$modelDetail._id"] }
                                            },
                                            in: { $arrayElemAt: ["$models.count", "$$idx"] }
                                        }
                                    },
                                    carsByYear: {
                                        $let: {
                                            vars: {
                                                idx: { $indexOfArray: ["$models.model", "$$modelDetail._id"] }
                                            },
                                            in: { $arrayElemAt: ["$models.carsByYear", "$$idx"] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        yearCarsSum: {
                            $sum: {
                                $reduce: {
                                    input: "$models.carsByYear",
                                    initialValue: [],
                                    in: { $concatArrays: ["$$value", "$$this"] }
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        yearCarsSum: {
                            $sum: "$yearCarsSum.count"
                        },
                        yearPercentage: {
                            $cond: {
                                if: { $eq: ["$totalCars", 0] },
                                then: 0,
                                else: { $multiply: [{ $divide: ["$yearCarsSum", "$totalCars"] }, 100] }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        brand: 1, // Include the full brand object
                        totalCars: 1,
                        models: 1,
                        yearCarsSum: 1,
                        yearPercentage: 1
                    }
                }
            ]);

            // Apply year and brand filtering separately based on conditions

            // If yearFilters is not provided, use the current year for filtering
            if (yearFilters.length === 0) {
                const currentYear = new Date().getFullYear();
                brandStatistics = brandStatistics.map(brand => {
                    brand.models = brand.models.map(model => {
                        // Filter by current year, if no cars for the current year, set count to 0
                        let filteredCars = model.carsByYear.filter(car => car.year === currentYear);
                        if (filteredCars.length === 0) {
                            model.count = 0;
                            model.carsByYear = [];
                        } else {
                            model.count = filteredCars.reduce((acc, car) => acc + car.count, 0);
                        }
                        return model;
                    });

                    brand.yearCarsSum = brand.models.reduce((sum, model) => sum + model.count, 0);
                    brand.yearPercentage = (brand.yearCarsSum / brand.totalCars) * 100;
                    return brand;
                });
            }
            // If yearFilters is provided, apply both brand and year filters
            else {
                brandStatistics = brandStatistics.filter(brand => {
                    let yearFilter = yearFilters.find(filter => filter.brand.toString() === brand.brand._id.toString());
                    if (yearFilter) {
                        brand.models = brand.models.map(model => {
                            let filteredCars = model.carsByYear.filter(car => car.year === yearFilter.year);
                            if (filteredCars.length === 0) {
                                model.count = 0;
                                model.carsByYear = []; // No matching cars for the specified year
                            } else {
                                model.count = filteredCars.reduce((acc, car) => acc + car.count, 0); // Recalculate the model count based on the filtered year
                            }
                            return model;
                        });
            
                        // Calculate the yearCarsSum and yearPercentage for the brand
                        brand.yearCarsSum = brand.models.reduce((sum, model) => sum + model.count, 0);
                        brand.yearPercentage = (brand.yearCarsSum / brand.totalCars) * 100;
            
                        return true; // Keep this brand in the output
                    }
                    return false; // Exclude this brand if it doesn't match the year filter
                });
            
                // If no matching brand was found, return the brand with models having count 0 and carsByYear as []
                if (brandStatistics.length === 0) {
                    let filteredBrand = await Brand.findById(yearFilters[0].brand); // Fetch the brand details from the database
                    let models = await Model.find({ make: filteredBrand._id }); // Fetch all models for the brand
                    brandStatistics = [{
                        brand: filteredBrand,
                        totalCars: 0,
                        models: models.map(model => ({
                            model: model,
                            count: 0,
                            carsByYear: []
                        })),
                        yearCarsSum: 0,
                        yearPercentage: 0
                    }];
                }
            }
            
            

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
                $or: [
                    { identification_number: reqObj.identification_number },
                    { license_plate: reqObj.license_plate }
                ], _id: { $ne: id }
            });
            if (checkVehicle.length) {
                responseData.msg = 'Vehicle with this identification number or license plate already exists!';
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


            // Convert comma-separated strings to arrays
            let mediaToDelete = reqObj.delete_media ? reqObj.delete_media.split(',').map(item => item.trim()) : [];
            let documentsToDelete = reqObj.delete_documents ? reqObj.delete_documents.split(',').map(item => item.trim()) : [];

            // Delete images from media
            if (mediaToDelete.length > 0) {
                media = media.filter(image => !mediaToDelete.includes(image));
            }

            // Delete images from documents
            if (documentsToDelete.length > 0) {
                document = document.filter(doc => !documentsToDelete.includes(doc));
            }

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

    BulkDeleteVehicles: async (req, res) => {
        let responseData = {};
        let response = {
            deletedCount: 0,
            skippedCount: 0,
            skippedVehicles: []
        };
        let user = req.user;
        let userId = user.sub;
        log.info('Received bulk delete request.');

        try {
            let userData = await userDbHandler.getByQuery({ _id: userId, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            // Get vehicle IDs from the request and split into an array
            let vehicleIds = req.body.vehicleIds.split(',');

            for (let vehicleId of vehicleIds) {
                try {
                    // Check if the vehicle belongs to the user
                    let vehicle = await VehicleDbHandler.getByQuery({ _id: vehicleId, user_id: userId });

                    if (!vehicle.length) {
                        response.skippedCount++;
                        response.skippedVehicles.push({ vehicleId, reason: 'Vehicle does not belong to the user.' });
                        continue;
                    }

                    // Check if the vehicle has any services in progress
                    let inProgressService = await MainJobDbHandler.getByQuery({ vehicle_id: vehicleId, status: 'in-progress' });

                    if (inProgressService.length) {
                        response.skippedCount++;
                        response.skippedVehicles.push({ vehicleId, reason: 'Service in progress.' });
                        continue;
                    }

                    // Soft delete the vehicle by setting is_deleted to true
                    await VehicleDbHandler.updateByQuery({ _id: vehicleId }, { is_deleted: true });

                    response.deletedCount++;
                } catch (error) {
                    log.error('Failed to delete vehicle:', vehicleId, 'Error:', error);
                    response.skippedCount++;
                    response.skippedVehicles.push({ vehicleId, reason: 'Failed due to error.' });
                }
            }

            responseData.msg = 'Bulk delete completed!';
            responseData.data = response;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to process bulk delete:', error);
            responseData.msg = 'Failed to process bulk delete!';
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
    DeleteVehicleMedia: async (req, res) => {
        let { vehicleId, media, documents } = req.body; // Expecting vehicleId, mediaImages (comma-separated), and documents (comma-separated)
        let user = req.user;
        let userId = user.sub;
        let responseData = {};

        try {
            // Validate user
            let userData = await userDbHandler.getByQuery({ _id: userId, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            // Validate vehicle
            let vehicle = await VehicleDbHandler.getById(vehicleId);
            if (!vehicle) {
                responseData.msg = 'Vehicle not found!';
                return responseHelper.error(res, responseData);
            }

            // Convert comma-separated strings to arrays
            let mediaToDelete = media ? media.split(',').map(item => item.trim()) : [];
            let documentsToDelete = documents ? documents.split(',').map(item => item.trim()) : [];

            // Delete images from media
            if (mediaToDelete.length > 0) {
                vehicle.media = vehicle.media.filter(image => !mediaToDelete.includes(image));
            }

            // Delete images from documents
            if (documentsToDelete.length > 0) {
                vehicle.document = vehicle.document.filter(doc => !documentsToDelete.includes(doc));
            }

            // Save updated vehicle data
            await VehicleDbHandler.updateById(vehicleId, { media: vehicle.media, document: vehicle.document });
            responseData.msg = 'Media deleted successfully!';
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to delete images/documents with error::', error);
            responseData.msg = 'Failed to delete media!';
            return responseHelper.error(res, responseData);
        }
    },

};
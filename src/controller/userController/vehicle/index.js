'use strict';
const logger = require('../../../services/logger');
const log = new logger('UserVehicleController').getChildLogger();
const dbService = require('../../../services/db/services');
const responseHelper = require('../../../services/customResponse');
const userDbHandler = dbService.User;
const VehicleDbHandler = dbService.Vehicle;
const makeDbHandler = dbService.Make;
const modelDbHandler = dbService.Model;
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
                { make: { $regex: searchValue, $options: 'i' } },
                { model: { $regex: searchValue, $options: 'i' } },
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
        try {
            let models = await modelDbHandler.getByQuery({}).populate('make_id', 'title');
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
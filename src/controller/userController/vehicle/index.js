'use strict';
const logger = require('../../../services/logger');
const log = new logger('UserVehicleController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const config = require('../../../config/environments');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
const userDbHandler = dbService.User;
const VehicleDbHandler = dbService.Vehicle;
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
                responseData.msg = 'Vehicle with this identification number already exist!';
                return responseHelper.error(res, responseData);
            }

            let media = [];

            if (req.files && req.files.media) {
                for (let i = 0; i < req.files.media.length; i++) {
                    media.push(req.files.media[i].location);
                }
            }
            let submitData = {
                identification_number: reqObj.identification_number || '',
                nickname: reqObj.nickname || '',
                year: reqObj.year || '',
                make: reqObj.make || '',
                model: reqObj.model || '',
                color: reqObj.color || '',
                registration_due_date: reqObj.registration_due_date || '',
                last_oil_change: reqObj.last_oil_change || '',
                license_plate: reqObj.license_plate || '',
                address: {
                    street: reqObj.street || '',
                    landmark: reqObj.landmark || '',
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
                user_id: id
            }
            let saveData = await VehicleDbHandler.create(submitData);
            responseData.msg = `Data saved!`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to save data with error::', error);
            responseData.msg = 'failed to save data!';
            return responseHelper.error(res, responseData);
        }
    },
    GetVehicle: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request for get vehicle with id:', id);
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }
            let vehicleData = await VehicleDbHandler.getByQuery({ user_id: id });

            responseData.msg = "Data fetched!";
            responseData.data = vehicleData;
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
            if (!vehicleData) {
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

            let media = vehicleData[0].media;
            if (req.files && req.files.media) {
                for (let i = 0; i < req.files.media.length; i++) {
                    media.push(req.files.media[i].location);
                }
            }

            let updateData = {
                identification_number: reqObj.identification_number,
                nickname: reqObj.nickname,
                year: reqObj.year,
                make: reqObj.make,
                model: reqObj.model,
                color: reqObj.color,
                registration_due_date: reqObj.registration_due_date,
                last_oil_change: reqObj.last_oil_change,
                license_plate: reqObj.license_plate,
                address: {
                    street: reqObj.street,
                    landmark: reqObj.landmark,
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
                media: media,
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
    }

};
'use strict';
const logger = require('../../../services/logger');
const log = new logger('MakeController').getChildLogger();
const dbService = require('../../../services/db/services');
const responseHelper = require('../../../services/customResponse');
const makeDbHandler = dbService.Make;
const modelDbHandler = dbService.Model;

/**************************
 *** Operations for Make & Model
 **************************/
module.exports = {
    /**
     * Method to handle add make
     */
    addMake: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        try {
            let existingMake = await makeDbHandler.getByQuery({ title: reqObj.title });
            if (existingMake.length) {
                responseData.msg = "Make with this title already exists!";
                return responseHelper.error(res, responseData);
            }
            let image = "";
            if (req.file) {
                image = req.file.location;
            }

            let createData = await makeDbHandler.create({ title: reqObj.title, image: image });
            responseData.msg = "Make added successfully!";
            responseData.data = createData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to add make with error::', error);
            responseData.msg = "Failed to add make";
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
     * Method to handle update make
     */
    updateMake: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        let id = req.params.id;
        try {
            let existingMake = await makeDbHandler.getById(id);
            if (!existingMake) {
                responseData.msg = "Make not found!";
                return responseHelper.error(res, responseData);
            }
            let image = existingMake.image;
            if (req.file) {
                image = req.file.location;
            }

            let updateData = await makeDbHandler.updateById(id, { title: reqObj.title, image: image });
            responseData.msg = "Make updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update make with error::', error);
            responseData.msg = "Failed to update make";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle delete make
     */
    deleteMake: async (req, res) => {
        let responseData = {};
        let id = req.params.id;
        try {
            let deleteData = await makeDbHandler.deleteById(id);
            if (!deleteData) {
                responseData.msg = "Failed to delete make";
                return responseHelper.error(res, responseData);
            }
            responseData.msg = "Make deleted successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to delete make with error::', error);
            responseData.msg = "Failed to delete make";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle add model
     */
    addModel: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        try {
            // Check if the provided make_id is valid
            let validMake = await makeDbHandler.getById(reqObj.make_id);
            if (!validMake) {
                responseData.msg = "Invalid make ID!";
                return responseHelper.error(res, responseData);
            }

            let existingModel = await modelDbHandler.getByQuery({ title: reqObj.title, make_id: reqObj.make_id });
            if (existingModel.length) {
                responseData.msg = "Model with this title already exists for the given make!";
                return responseHelper.error(res, responseData);
            }

            let createData = await modelDbHandler.create({ title: reqObj.title, make_id: reqObj.make_id });
            responseData.msg = "Model added successfully!";
            responseData.data = createData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to add model with error::', error);
            responseData.msg = "Failed to add model";
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

    /**
     * Method to handle update model
     */
    updateModel: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        let id = req.params.id;
        try {
            let existingModel = await modelDbHandler.getById(id);
            if (!existingModel) {
                responseData.msg = "Model not found!";
                return responseHelper.error(res, responseData);
            }

            // Check if the provided make_id is valid
            let validMake = await makeDbHandler.getById(reqObj.make_id);
            if (!validMake) {
                responseData.msg = "Invalid make ID!";
                return responseHelper.error(res, responseData);
            }

            let updateData = await modelDbHandler.updateById(id, { title: reqObj.title, make_id: reqObj.make_id });
            responseData.msg = "Model updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update model with error::', error);
            responseData.msg = "Failed to update model";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle delete model
     */
    deleteModel: async (req, res) => {
        let responseData = {};
        let id = req.params.id;
        try {
            let deleteData = await modelDbHandler.deleteById(id);
            if (!deleteData) {
                responseData.msg = "Failed to delete model";
                return responseHelper.error(res, responseData);
            }
            responseData.msg = "Model deleted successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to delete model with error::', error);
            responseData.msg = "Failed to delete model";
            return responseHelper.error(res, responseData);
        }
    },
};

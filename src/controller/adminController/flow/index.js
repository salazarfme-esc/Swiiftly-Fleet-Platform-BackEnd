'use strict';
const logger = require('../../../services/logger');
const log = new logger('AdminFlowController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
const adminDbHandler = dbService.Admin;
const contactInfoDbHandler = dbService.ContactInfo;
const FlowCategoryDbHandler = dbService.FlowCategory;
const FlowQuestionDbHandler = dbService.FlowQuestion;
const FlowDbHandler = dbService.Flow;
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
     * Method to handle add flow category
     */
    addFlowCategory: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await FlowCategoryDbHandler.getByQuery({ name: reqObj.name });
            if (getData.length) {
                responseData.msg = "Flow type with this name already exist!";
                return responseHelper.error(res, responseData);
            }
            let Data = {
                name: reqObj.name,
                description: reqObj.description,

            }
            let createData = await FlowCategoryDbHandler.create(Data);
            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to add data with error::', error);
            responseData.msg = "failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle get flow category
     */
    getFlowCategory: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await FlowCategoryDbHandler.getByQuery({});
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
     * Method to handle update flow category
     */
    updateFlowCategory: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        let id = req.params.id;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getDataById = await FlowCategoryDbHandler.getById(id);
            if (!getDataById) {
                responseData.msg = "Data does not exist!";
                return responseHelper.error(res, responseData);
            }
            let getData = await FlowCategoryDbHandler.getByQuery({ name: reqObj.name });
            if (getData.length) {
                responseData.msg = "Flow type with this name already exist!";
                return responseHelper.error(res, responseData);
            }
            let Data = {
                name: reqObj.name,
                description: reqObj.description,

            }
            let updateData = await FlowCategoryDbHandler.updateById(id, Data);
            responseData.msg = "Data updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "failed to update data";
            return responseHelper.error(res, responseData);
        }
    },




    /**
     * Method to handle add flow question
     */
    addFlowQuestion: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await FlowQuestionDbHandler.getByQuery({ question: reqObj.question });
            if (getData.length) {
                responseData.msg = "Flow question with this question already exist!";
                return responseHelper.error(res, responseData);
            }
            let submitData = {
                flow_category: reqObj.flow_category,  // this should be the ObjectId of the related FlowCategory
                question: reqObj.question,            // this should be a string
                question_type: reqObj.question_type,  // this should be 'single_choice' or 'multiple_choice'
                options: reqObj.options.map(option => ({
                    option: option.option,            // this should be a string
                    action: option.action             // this should be a boolean
                })),
            };
            let createData = await FlowQuestionDbHandler.create(submitData);
            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to add data with error::', error);
            responseData.msg = "failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle get flow question
     */
    getFlowQuestion: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await FlowQuestionDbHandler.getByQuery({}).populate("flow_category", "name description");
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
     * Method to handle update flow question
     */
    updateFlowQuestion: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        let id = req.params.id;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getDataById = await FlowQuestionDbHandler.getById(id);
            if (!getDataById) {
                responseData.msg = "Data does not exist!";
                return responseHelper.error(res, responseData);
            }
            let getData = await FlowQuestionDbHandler.getByQuery({ question: reqObj.question });
            if (getData.length) {
                responseData.msg = "Flow question with this question already exist!";
                return responseHelper.error(res, responseData);
            }
            let submitData = {
                flow_category: reqObj.flow_category,  // this should be the ObjectId of the related FlowCategory
                question: reqObj.question,            // this should be a string
                question_type: reqObj.question_type,  // this should be 'single_choice' or 'multiple_choice'
                options: reqObj.options.map(option => ({
                    option: option.option,            // this should be a string
                    action: option.action             // this should be a boolean
                })),
            };
            console.log("🚀 ~ updateFlowQuestion: ~ submitData:", submitData)
            let updateData = await FlowQuestionDbHandler.updateById(id, submitData);
            responseData.msg = "Data updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "failed to update data";
            return responseHelper.error(res, responseData);
        }
    },


    /**
     * Method to handle add flow 
     */
    addFlow: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await FlowDbHandler.getByQuery({ sequence: reqObj.sequence, flow_category: reqObj.flow_category });
            if (getData.length) {
                responseData.msg = "Sequence already exist!";
                return responseHelper.error(res, responseData);
            }
            let submitData = {
                flow_category: reqObj.flow_category,
                flow_question: reqObj.flow_question,
                sequence: reqObj.sequence,
            };
            let createData = await FlowDbHandler.create(submitData);
            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to add data with error::', error);
            responseData.msg = "failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle get flow
     */
    getFlow: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await Flow.aggregate([
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
     * Method to handle update flow
     */
    updateFlow: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let reqObj = req.body;
        let id = req.params.id;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getDataById = await FlowDbHandler.getById(id);
            if (!getDataById) {
                responseData.msg = "Data does not exist!";
                return responseHelper.error(res, responseData);
            }
            let getData = await FlowDbHandler.getByQuery({
                flow_category: reqObj.flow_category, sequence: reqObj.sequence
            });
            if (getData.length && getData[0]._id.toString() !== id) {
                responseData.msg = "Sequence already exist!";
                return responseHelper.error(res, responseData);
            }
            let submitData = {
                flow_category: reqObj.flow_category,
                flow_question: reqObj.flow_question,
                sequence: reqObj.sequence,
            };
            let updateData = await FlowDbHandler.updateById(id, submitData);
            responseData.msg = "Data updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "failed to update data";
            return responseHelper.error(res, responseData);
        }
    },
};
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
const MainJobDbHandler = dbService.MainJob;
const SubJobDbHandler = dbService.SubJob;
const Flow = require("../../../services/db/models/flow")
const config = require('../../../config/environments');
const { response } = require('express');
const mongoose = require("mongoose");
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
        let reqObj = req.query;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

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
            if (getData.length && getData[0]._id !== id) {
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
    * Method to handle delete flow category
    */
    deleteFlowCategory: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let id = req.params.id;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            let getDataById = await FlowCategoryDbHandler.getById(id);
            if (!getDataById) {
                responseData.msg = "Category does not exist!";
                return responseHelper.error(res, responseData);
            }
            let getFlowQuestion = await FlowQuestionDbHandler.getByQuery({ flow_category: id });
            if (getFlowQuestion.length) {
                responseData.msg = "Cannot delete category because flow questions are associated with it!";
                return responseHelper.error(res, responseData);
            }

            let getFlowData = await FlowDbHandler.getByQuery({ flow_category: id });
            if (getFlowData.length) {
                responseData.msg = "Cannot delete category because a flow sequence is associated with it!";
                return responseHelper.error(res, responseData);
            }


            // Delete category by ID
            let deleteData = await FlowCategoryDbHandler.deleteById(id);
            responseData.msg = "Category deleted successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to delete category with error::', error);
            responseData.msg = "Failed to delete category";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to get flow category by ID
     */
    getFlowCategoryById: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let id = req.params.id;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            let getDataById = await FlowCategoryDbHandler.getById(id);
            if (!getDataById) {
                responseData.msg = "Category does not exist!";
                return responseHelper.error(res, responseData);
            }

            responseData.msg = "Category fetched successfully!";
            responseData.data = getDataById;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to fetch category with error::', error);
            responseData.msg = "Failed to fetch category";
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
                options: reqObj.options?.map(option => ({
                    option: option.option,            // this should be a string
                    action: option.action             // this should be a boolean
                })),
                action: reqObj.action
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
        const limit = parseInt(req.query.limit); // Ensure limit is a number
        const skip = parseInt(req.query.skip); // Ensure skip is a number
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let getData = await FlowQuestionDbHandler.getByQuery({}).populate("flow_category", "name description").skip(skip).limit(limit);
            responseData.msg = "Data fetched successfully!";
            responseData.data = { count: await FlowQuestionDbHandler.getByQuery({}).populate("flow_category", "name description").countDocuments(), data: getData };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = "failed to fetch data";
            return responseHelper.error(res, responseData);
        }
    },

    /**
    * Method to get flow Question by ID
    */
    getFlowQuestionById: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let id = req.params.id;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            let getDataById = await FlowQuestionDbHandler.getById(id).populate("flow_category");
            if (!getDataById) {
                responseData.msg = "Question does not exist!";
                return responseHelper.error(res, responseData);
            }

            responseData.msg = "Question fetched successfully!";
            responseData.data = getDataById;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to fetch Question with error::', error);
            responseData.msg = "Failed to fetch question";
            return responseHelper.error(res, responseData);
        }
    },

    /**
   * Method to handle delete flow Question
   */
    deleteFlowQuestion: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let id = req.params.id;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            let getDataById = await FlowQuestionDbHandler.getById(id);
            if (!getDataById) {
                responseData.msg = "Question does not exist!";
                return responseHelper.error(res, responseData);
            }

            let getFlowData = await FlowDbHandler.getByQuery({ flow_question: id });
            if (getFlowData.length) {
                responseData.msg = "Cannot delete question because a flow sequence is associated with it!";
                return responseHelper.error(res, responseData);
            }


            // Delete category by ID
            let deleteData = await FlowQuestionDbHandler.deleteById(id);
            responseData.msg = "Question deleted successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to delete category with error::', error);
            responseData.msg = "Failed to delete category";
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
            if (getData.length && getData[0]._id !== id) {
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
            // Check admin validity
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // // Fetch all flows in the same category
            // let flows = await FlowDbHandler.getByQuery({ flow_category: reqObj.flow_category });
            // if (!flows || flows.length === 0) {
            //     responseData.msg = "No flows found for the specified category!";
            //     return responseHelper.error(res, responseData);
            // }

            // Sort flows by their sequence
            flows.sort((a, b) => a.sequence - b.sequence);

            // Check if the new sequence already exists
            let existingFlowAtSequence = flows.find(flow => flow.sequence === reqObj.sequence);
            if (existingFlowAtSequence) {
                // Shift flows with sequence >= reqObj.sequence by 1
                for (let i = 0; i < flows.length; i++) {
                    if (flows[i].sequence >= reqObj.sequence) {
                        let updateSequence = await FlowDbHandler.updateById(flows[i]._id, { sequence: flows[i].sequence + 1 });
                        if (!updateSequence) {
                            responseData.msg = "Failed to update existing flow sequences!";
                            return responseHelper.error(res, responseData);
                        }
                    }
                }
            }

            // Create the new flow with the desired sequence
            let submitData = {
                flow_category: reqObj.flow_category,
                flow_question: reqObj.flow_question,
                sequence: reqObj.sequence, // This is now guaranteed to be unique
                status: 'draft' // default to draft status
            };
            let createData = await FlowDbHandler.create(submitData);

            responseData.msg = "Flow added and sequence adjusted successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to add flow with error::', error);
            responseData.msg = "Failed to add flow";
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
                    $addFields: {
                        "flow_category.status": "$status"
                    }
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
    * Method to handle get flow by category ID
    */
    getFlowByCategoryId: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        let categoryId = req.params.categoryId; // Get the category ID from the request parameters
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Query to get flow data for the specific category ID
            let getData = await Flow.aggregate([
                {
                    $match: { 'flow_category': mongoose.Types.ObjectId(categoryId) } // Match by the category ID
                },
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
                    $addFields: {
                        "flow_category.status": "$status"
                    }
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

            if (getData.length === 0) {
                responseData.msg = "No data found for the given category ID!";
                return responseHelper.success(res, responseData);
            }

            responseData.msg = "Data fetched successfully!";
            responseData.data = getData[0]; // Return the specific category's flow data
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = "Failed to fetch data";
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
            console.log("🚀 ~ updateFlow: ~ getData:", getData)
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

    publishFLow: async (req, res) => {
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
            let getByQueryFlow = await FlowDbHandler.getByQuery({ flow_category: id });
            if (!getByQueryFlow.length) {
                responseData.msg = "Data does not exist!";
                return responseHelper.error(res, responseData);
            }

            let mainJobs = await MainJobDbHandler.getByQuery({ service_category: id });
            let subJob = await SubJobDbHandler.getByQuery({ service_category: id });

            if (reqObj.status == "draft" && (mainJobs.length || subJob.length)) {
                responseData.msg = "Cannot draft published flow with existing jobs!";
                return responseHelper.error(res, responseData);
            }
            let updateData = await FlowDbHandler.updateByQuery({ flow_category: id }, { status: reqObj.status });
            responseData.msg = "Status updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update status with error::', error);
            responseData.msg = "failed to update status";
            return responseHelper.error(res, responseData);
        }
    },
    UpdateFlowSequence: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        log.info("Received request to update the sequence of flows", req.body);
        try {
            let adminData = await adminDbHandler.getById(admin);
            if (!adminData) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            const { flow_id, newIndex, flow_category } = req.body;

            // Fetch all flows for the specified category
            let flows = await FlowDbHandler.getByQuery({ flow_category: flow_category });
            if (!flows || flows.length === 0) {
                responseData.msg = "No flows found!";
                return responseHelper.error(res, responseData);
            }

            // Sort flows by their current sequence
            flows.sort((a, b) => a.sequence - b.sequence);

            // Find the flow that needs to be updated
            let movedFlow = flows.find(flow => flow.flow_question.toString() === flow_id);
            if (!movedFlow) {
                responseData.msg = "Flow not found!";
                return responseHelper.error(res, responseData);
            }

            // Remove the flow from its current position
            flows = flows.filter(flow => flow.flow_question.toString() !== flow_id);

            // Adjust newIndex to 0-based index for array manipulation
            const adjustedNewIndex = newIndex - 1;

            // Insert the flow into the new position
            flows.splice(adjustedNewIndex, 0, movedFlow);

            // Update sequence for all flows
            for (let i = 0; i < flows.length; i++) {
                let updateSequence = await FlowDbHandler.updateById(flows[i]._id, { sequence: i + 1 });
                if (!updateSequence) {
                    responseData.msg = "Failed to update flow sequence!";
                    return responseHelper.error(res, responseData);
                }
            }

            responseData.msg = "Flow sequence updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update flow sequence with error:', error);
            responseData.msg = "Something went wrong! Please try again later.";
            return responseHelper.error(res, responseData);
        }
    },
    DeleteFlowBySequence: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        const { flow_category, sequence } = req.body;
        log.info("Received request to delete a flow item", req.body);

        try {
            let adminData = await adminDbHandler.getById(admin);
            if (!adminData) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Fetch the flow item to be deleted
            let flowToDelete = await FlowDbHandler.getByQuery({ flow_category: flow_category, sequence: sequence });
            if (!flowToDelete || flowToDelete.length === 0) {
                responseData.msg = "Flow item not found!";
                return responseHelper.error(res, responseData);
            }

            // Delete the flow item
            let deleteFlow = await FlowDbHandler.deleteById(flowToDelete[0]._id);
            if (!deleteFlow) {
                responseData.msg = "Failed to delete flow item!";
                return responseHelper.error(res, responseData);
            }

            // Fetch all flows with a sequence greater than the deleted item
            let flowsToUpdate = await FlowDbHandler.getByQuery({ flow_category: flow_category, sequence: { $gt: sequence } });

            // Update the sequence of the remaining flows
            for (let i = 0; i < flowsToUpdate.length; i++) {
                let updateSequence = await FlowDbHandler.updateById(flowsToUpdate[i]._id, { sequence: flowsToUpdate[i].sequence - 1 });
                if (!updateSequence) {
                    responseData.msg = "Failed to update flow sequences!";
                    return responseHelper.error(res, responseData);
                }
            }

            responseData.msg = "Flow item deleted and sequences updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to delete flow item with error:', error);
            responseData.msg = "Something went wrong! Please try again later.";
            return responseHelper.error(res, responseData);
        }
    },


};
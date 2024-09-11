const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
/**
 * JOI Validation Schema for Auth Route
 */
module.exports = {
    flowQuestion: Joi.object().keys({
        flow_category: Joi.string().required().label('Flow Category'),
        question: Joi.string().required().label('Question'),
        question_type: Joi.string().valid('single_choice', 'multiple_choice', 'text', 'location').required().label('Question Type'),
        options: Joi.when('question_type', {
            is: 'text',
            then: Joi.array().items(Joi.object().keys({
                option: Joi.string().label('Option'),
                action: Joi.boolean().label('Action')
            })).default([]).label('Options'),
            otherwise: Joi.array().items(Joi.object().keys({
                option: Joi.string().required().label('Option'),
                action: Joi.boolean().required().label('Action')
            })).min(1).required().label('Options')
        }),
        action: Joi.boolean().label('Action')
    }),
    flow: Joi.object().keys({
        flow_category: Joi.string().required().label('Flow Category'),
        flow_question: Joi.string().required().label('Flow Question'),
        sequence: Joi.number().required().label('Sequence')
    }),

    flowCategory: Joi.object().keys({
        name: Joi.string().required().label('Name'),
        description: Joi.string().required().label('Description')
    }),
    deleteFlowItem: Joi.object().keys({
        sequence: Joi.number().required().label('Sequence'),
        flow_category: Joi.string().required().label('Flow Category')
    }),
    updateFlowSequence: Joi.object().keys({
        flow_id: Joi.string().required().label('Flow ID'),
        newIndex: Joi.number().required().label('New Index'),
        flow_category: Joi.string().required().label('Flow Category')
    })
};

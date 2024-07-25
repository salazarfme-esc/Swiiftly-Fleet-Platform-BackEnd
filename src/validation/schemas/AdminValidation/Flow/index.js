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
        question_type: Joi.string().valid('single_choice', 'multiple_choice').required().label('Question Type'),
        options: Joi.array().items(
            Joi.object().keys({
                option: Joi.string().required().label('Option'),
                action: Joi.boolean().required().label('Action')
            })
        ).required().label('Options')
    }),
    flow: Joi.object().keys({
        flow_category: Joi.string().required().label('Flow Category'),
        flow_question: Joi.string().required().label('Flow Question'),
        sequence: Joi.number().required().label('Sequence')
    }),

    flowCategory: Joi.object().keys({
        name: Joi.string().required().label('Name'),
        description: Joi.string().required().label('Description')
    })
};

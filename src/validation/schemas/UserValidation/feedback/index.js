const Joi = require('@hapi/joi');
/**
 * JOI Validation Schema for Feedback Route
 */
module.exports = {
    feedback: Joi.object().keys({
        rating: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .required()
            .label('Rating')
            .messages({
                'number.base': 'Rating must be a number.',
                'number.integer': 'Rating must be an integer.',
                'number.min': 'Rating must be at least 1.',
                'number.max': 'Rating must be at most 5.',
                'any.required': 'Rating is required.'
            }),
        comments: Joi.string()
            .max(500)
            .optional()
            .label('Comments')
            .messages({
                'string.base': 'Comments must be a string.',
                'string.max': 'Comments cannot exceed 500 characters.'
            }),
    }),
};
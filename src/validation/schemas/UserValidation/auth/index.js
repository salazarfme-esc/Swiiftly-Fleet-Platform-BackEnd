const Joi = require('@hapi/joi');
/**
 * JOI Validation Schema for Auth Route
 */
module.exports = {
    login: Joi.object().keys({
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .required()
            .label('Email')
            .messages({
                'string.email': 'Please provide a valid email address.',
                'any.required': 'Email is required.'
            }),
        password: Joi.string()
            .min(6)
            .required()
            .label('Password')
            .messages({
                'string.min': 'Password must be at least 6 characters long.',
                'any.required': 'Password is required.'
            }),
    }),
    signup: Joi.object().keys({
        phone_number: Joi.string()
            .pattern(/^[0-9]{6,16}$/)
            .required()
            .label('Phone Number')
            .messages({
                'string.pattern.base': 'Phone Number must be between 6 and 16 digits long and contain only numbers.',
                'any.required': 'Phone Number is required.'
            }),
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .required()
            .label('Email')
            .messages({
                'string.email': 'Please provide a valid email address.',
                'any.required': 'Email is required.'
            }),
        dob: Joi.date()
            .iso()
            .required()
            .label('Date Of Birth')
            .messages({
                'date.base': 'Date Of Birth must be a valid date.',
                'date.format': 'Date Of Birth must be in format (YYYY-MM-DD).',
                'any.required': 'Date Of Birth is required.'
            }),
        password: Joi.string()
            .min(6)
            .required()
            .label('Password')
            .messages({
                'string.min': 'Password must be at least 6 characters long.',
                'any.required': 'Password is required.'
            }),
        confirm_password: Joi.string()
            .valid(Joi.ref('password'))
            .required()
            .label('Confirm Password')
            .messages({
                'any.only': 'Confirm Password must match the Password.',
                'any.required': 'Confirm Password is required.'
            })
    }),
    forgotPassword: Joi.object().keys({
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .required()
            .label('Email')
            .messages({
                'string.email': 'Please provide a valid email address.',
                'any.required': 'Email is required.'
            }),
    }),
    resendOtp: Joi.object().keys({
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .required()
            .label('Email')
            .messages({
                'string.email': 'Please provide a valid email address.',
                'any.required': 'Email is required.'
            }),
        type: Joi.string().valid("email", "password").required().label('Type'),
    }),
    resetPassword: Joi.object().keys({
        new_password: Joi.string().min(6).required().label('Password'),
        confirm_password: Joi.string()
            .valid(Joi.ref('new_password'))
            .required()
            .error(new Error('Confirm password and password must be same')),
    }),
    verifyOtp: Joi.object().keys({
        email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .label('Email')
        .messages({
            'string.email': 'Please provide a valid email address.',
            'any.required': 'Email is required.'
        }),
        otp: Joi.string().min(6).max(6).required().label('OTP'),
        type: Joi.string().valid("email", "password").required().label('Type'),

    }),
};
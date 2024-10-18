const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
/**
 * JOI Validation Schema for User Management Route
 */
module.exports = {
    addUser: Joi.object().keys({
        full_name: Joi.string().required().label('Full Name'),
        email: Joi.string().email().required().label('Email'),
        phone_number: Joi.string().pattern(/^[0-9]{6,16}$/).required().label('Phone Number'),
        user_role: Joi.string().valid('vendor', 'fleet').required().label('User Role'),
        company_name: Joi.string().when('user_role', {
            is: 'fleet',
            then: Joi.string().required().label('Company Name'),
            otherwise: Joi.string().required().allow('').label('Company Name')
        }),
        w9: Joi.string().when('user_role', {
            is: 'vendor',
            then: Joi.string().required().allow('').label('W9'),
            otherwise: Joi.string().required().allow('').label('W9')
        }),
        net: Joi.string().valid('30', '15').when('user_role', {
            is: 'vendor',
            then: Joi.string().required().label('Net'),
            otherwise: Joi.string().required().allow('').label('Net')
        }),
        service_type: Joi.string().when('user_role', {
            is: 'vendor',
            then: Joi.string().required().label('Service Type'),
            otherwise: Joi.string().required().allow('').label('Service Type')
        }),
        owner_name: Joi.string().when('user_role', {
            is: 'vendor',
            then: Joi.string().required().label('Owner Name'),
            otherwise: Joi.string().required().allow('').label('Owner Name')
        }),
    }),
    UpdateVendorStatus: Joi.object().keys({
        bank_verified: Joi.boolean().required().label('Bank Status'),
        w9_verified: Joi.boolean().required().label('W9 Status'),
    }),
    UpdateVendorInfo: Joi.object().keys({
        full_name: Joi.string().allow("").label('Full Name'),
        phone_number: Joi.string().pattern(/^[0-9]{6,16}$/).allow("").label('Phone Number'),
        owner_name: Joi.string().trim().allow("").label("Owner Name"),
        service_type: Joi.string().allow("").label('Service Type'),
        business_address: Joi.string().trim().allow("").label('Business Address'),
        net: Joi.string().allow("").label('Net'),
        routing_no: Joi.string()
            .length(9)
            .pattern(/^[0-9]{9}$/)
            .optional()
            .allow("")
            .label('Routing Number')
            .messages({
                'string.length': 'Routing Number must be exactly 9 digits long.',
                'string.pattern.base': 'Routing Number must contain only numbers.'
            }),

        account_holder_name: Joi.string()
            .trim()
            .max(100)
            .required()
            .allow("")
            .pattern(/^[A-Za-z\s'-.]+$/)
            .label('Account Holder Name')
            .messages({
                'string.max': 'Account Holder Name must be less than or equal to 100 characters.',
                'any.required': 'Account Holder Name is required.',
                'string.pattern.base': 'Account Holder Name must only contain letters, spaces, apostrophes, and hyphens.'
            }),

        account_number: Joi.string()
            .trim()
            .min(8)
            .max(20)
            .required()
            .allow("")
            .pattern(/^[A-Za-z0-9]+$/)
            .label('Account Number')
            .messages({
                'string.min': 'Account Number must be at least 8 characters long.',
                'string.max': 'Account Number must be less than or equal to 20 characters.',
                'any.required': 'Account Number is required.',
                'string.pattern.base': 'Account Number must not contain special characters.'
            }),

        bank_name: Joi.string()
            .trim()
            .max(100)
            .required()
            .allow("")
            .pattern(/^[A-Za-z\s'-.]+$/)
            .label('Bank Name')
            .messages({
                'string.max': 'Bank Name must be less than or equal to 100 characters.',
                'any.required': 'Bank Name is required.',
                'string.pattern.base': 'Bank Name must only contain letters, spaces, apostrophes, and hyphens.'
            }),

        bic_swift_code: Joi.string()
            .trim()
            .required()
            .allow("")
            .min(8)  // Minimum 8 characters
            .max(11) // Maximum 11 characters
            .regex(/^[A-Z0-9]+$/) // Ensure only uppercase letters and numbers are allowed
            .label('BIC/SWIFT Code')
            .messages({
                'string.empty': 'BIC/SWIFT Code is required.',
                'string.min': 'BIC/SWIFT Code must be at least 8 characters long.',
                'string.max': 'BIC/SWIFT Code must be no more than 11 characters long.',
                'string.pattern.base': 'BIC/SWIFT Code must contain only uppercase letters and numbers.',
            }),


        bank_address: Joi.string()
            .trim()
            .max(150)
            .required()
            .allow("")
            .label('Bank Address')
            .messages({
                'string.max': 'Bank Address must be less than or equal to 150 characters.',
                'any.required': 'Bank Address is required.',
                'string.pattern.base': 'Bank Address must only contain letters, numbers, spaces, and common punctuation (e.g., commas, periods, slashes).'
            }),

        w9: Joi.string().trim().allow("").label('W9'),
    })
};

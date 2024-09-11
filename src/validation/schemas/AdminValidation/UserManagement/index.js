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
            then: Joi.string().required().label('W9'),
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
    })
};

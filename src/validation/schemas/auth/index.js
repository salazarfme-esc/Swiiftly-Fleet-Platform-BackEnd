const Joi = require('@hapi/joi');
/**
 * JOI Validation Schema for Auth Route
 */
module.exports = {
    login: Joi.object().keys({
        user_email: Joi.string().min(3).required().label('Email'),
        user_password: Joi.string().min(6).required().label('Password'),
    }),
    signup: Joi.object().keys({
        first_name: Joi.string().regex(/^[a-zA-Z. ]*$/).error(new Error('User First name should not contain any special characters and numbers!')),
        last_name: Joi.string().regex(/^[a-zA-Z. ]*$/).error(new Error('User last name should not contain any special characters and numbers!')),
        user_name: Joi.string().required().regex(/^[a-zA-Z. ]*$/).error(new Error('Username should not contain any special characters and numbers!')),
        phone_number: Joi.string().min(10).required().label('Phone Number'),
        user_email: Joi.string().required().label('Email'),
        // user_role: Joi.string().required().label('Role'),
        user_password: Joi.string().min(6).required().label('Password'),
        /* confirm_password: Joi.string()
             .valid(Joi.ref('user_password'))
             .required()
             .error(new Error('Confirm password and password must be same')),*/
    }),
    socialLogin: Joi.object().keys({
        type: Joi.string().valid('google', 'facebook', 'apple').required().label('type'),
        access_token: Joi.string().required().label('token'),
        device_type: Joi.string().required().label('Device Type'),
        device_token: Joi.string().required().label('Device Token'),
        first_name: Joi.string().allow("").optional().label('First Name'),
        last_name: Joi.string().allow("").optional().label('Last Name'),
        user_email: Joi.string().allow("").optional().label('User Email')
    }),
    forgotPassword: Joi.object().keys({
        user_email: Joi.string().email().required().label('Email'),
        // app_type: Joi.string().required().label('App type'),
    }),
    forgotPasswordMobile: Joi.object().keys({
        phone_number: Joi.number().min(10).required().label('Mobile Number'),
        app_type: Joi.string().required().label('App type')
    }),
    resetPassword: Joi.object().keys({
        token: Joi.string().trim().required().label('token'),
        type: Joi.string().trim().required().label('type'),
        new_password: Joi.string().min(6).required().label('Password'),
        confirm_password: Joi.string()
            .valid(Joi.ref('new_password'))
            .required()
            .error(new Error('Confirm password and password must be same')),
    }),
    verifyEmail: Joi.object().keys({
        token: Joi.string().required().label('token'),
        type: Joi.string().valid('email').required().label('type'),
    }),
    verifyPhone: Joi.object().keys({
        otp: Joi.string().min(5).max(5).required().label('token'),
    }),
    resendEmailVerification: Joi.object().keys({
        user_email: Joi.string().email().required().label('Email'),
    }),
    applyKyc: Joi.object().keys({
        user_id: Joi.string().required().label('user_id'),
        user_name: Joi.string().required().label('user_name'),
        user_email: Joi.string().required().label('user_email'),
        phone_number: Joi.string().required().label('phone_number'),
        street: Joi.string().required().label('street'),
        country: Joi.string().required().label('country'),
        city: Joi.string().required().label('city'),
        state: Joi.string().required().label('state'),
        zip_code: Joi.string().required().label('zip_code'),
        who_am_i: Joi.string().required().label('who_am_i'),
    }),
};
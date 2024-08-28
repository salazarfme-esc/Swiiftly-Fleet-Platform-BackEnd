const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
/**
 * JOI Validation Schema for Profile Route
 */
const number_validation = /^[0-9]*$/;
const float_number_validation = /^[0-9.]*$/;
module.exports = {
  updateProfile: Joi.object().keys({
    full_name: Joi.string().trim().allow("").label("Full Name"),
    company_name: Joi.string()
      .required()
      .label('Company Name'),
    dob: Joi.string().trim().allow("").label("DOB"),
    phone_number: Joi.string()
      .pattern(/^[0-9]{6,16}$/)
      .required()
      .label('Phone Number')
      .messages({
        'string.pattern.base': 'Phone Number must be between 6 and 16 digits long and contain only numbers.',
        'any.required': 'Phone Number is required.'
      }),
  }),
  changePassword: Joi.object().keys({
    old_password: Joi.string().required().label("Old Password"),
    new_password: Joi.string().required().label("New Password"),
    confirm_password: Joi.string()
      .valid(Joi.ref('new_password'))
      .required()
      .label('Confirm Password')
      .messages({
        'any.only': 'Confirm Password must match the New Password.',
        'any.required': 'Confirm Password is required.'
      })
  }),

};

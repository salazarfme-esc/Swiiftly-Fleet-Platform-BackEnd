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
    full_name: Joi.string().trim().required().allow("").label("Full Name"),
    company_name: Joi.string()
      .required()
      .label('Company Name'),
    dob: Joi.string().trim().required().allow("").label("DOB"),
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
  updateVendorProfileValidation: Joi.object().keys({
    full_name: Joi.string().trim().required().allow("").label("Full Name"),
    phone_number: Joi.string()
      .pattern(/^[0-9]{6,16}$/)
      .required()
      .label('Phone Number')
      .messages({
        'string.pattern.base': 'Phone Number must be between 6 and 16 digits long and contain only numbers.',
        'any.required': 'Phone Number is required.'
      }),
    owner_name: Joi.string().trim().optional().allow("").label("Owner Name"),
    service_type: Joi.string().required().label('Service Type'),

    routing_no: Joi.string().trim().optional().allow("").label('Routing Number'),
    account_holder_name: Joi.string().trim().optional().allow("").label('Account Holder Name'),
    account_number: Joi.string().trim().optional().allow("").label('Account Number'),
    bank_name: Joi.string().trim().optional().allow("").label('Bank Name'),
    bic_swift_code: Joi.string().trim().optional().allow("").label('BIC/SWIFT Code'),
    bank_address: Joi.string().trim().optional().allow("").label('Bank Address'),

    w9: Joi.string().trim().optional().allow("").label('W9'),
    business_address: Joi.string().trim().optional().allow("").label('Business Address'),

    availability: Joi.array().items(
      Joi.object({
        day: Joi.string()
          .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
          .required()
          .label("Day"),
        isClosed: Joi.boolean().required().label("Is Closed"),
        timeSlots: Joi.array().items(
          Joi.object({
            from: Joi.string().required().label("From Time"),
            to: Joi.string().required().label("To Time")
          })
        ).when('isClosed', {
          is: false, // Time slots are required only if the day is not closed
          then: Joi.array().min(1).required().label("Time Slots")
        })
      })
    ).optional().label("Availability")
  })

};

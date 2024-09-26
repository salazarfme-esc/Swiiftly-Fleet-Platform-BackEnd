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
            from: Joi.string().required().allow("").label("From Time"),
            to: Joi.string().required().allow("").label("To Time")
          })
        ).when('isClosed', {
          is: false, // Time slots are required only if the day is not closed
          then: Joi.array().min(1).required().label("Time Slots")
        })
      })
    ).optional().label("Availability")
  })


};

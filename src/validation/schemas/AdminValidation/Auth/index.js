const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
/**
 * JOI Validation Schema for Auth Route
 */
module.exports = {
	login: Joi.object().keys({
		email: Joi
			.string()
			.required()
			.label('Email'),
		password: Joi
			.string()
			.min(8)
			.required()
			.label('Password')
	}),
	add_admin: Joi.object().keys({
		name: Joi
			.string()
			.trim()
			.required()
			.label("Name"),
		email: Joi
			.string()
			.trim()
			.required()
			.label('Email'),
		password: Joi
			.string()
			.min(8)
			.required()
			.label('Password'),
		confirm_password: Joi
			.string()
			.min(8)
			.valid(Joi.ref('password'))
			.required()
			.error(new Error('Confirm password and password must be same')),
	}),
	update_admin: Joi.object().keys({
		name: Joi
			.string()
			.trim()
			.allow("")
			.label("Name"),
		phone_number: Joi.string()
			.pattern(/^[0-9]{6,16}$/)
			.required()
			.label('Phone Number')
			.messages({
				'string.pattern.base': 'Phone Number must be between 6 and 16 digits long and contain only numbers.',
				'any.required': 'Phone Number is required.'
			}),
	}),
	forgotPassword: Joi.object().keys({
		email: Joi
			.string()
			.required()
			.label('Email'),
	}),
	resetPassword: Joi.object().keys({
		email: Joi.string().email().required().label('Email'),
		password: Joi.string().min(6).max(20).required().label('New Password'),
		confirm_password: Joi.string()
			.valid(Joi.ref('password'))
			.required()
			.error(new Error('Confirm password and password must be same')),
	}),
	verifyOtp: Joi.object().keys({
		email: Joi.string().email().required().label('Email'),
		otp: Joi.string().min(6).max(6).required().label('Otp'),
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

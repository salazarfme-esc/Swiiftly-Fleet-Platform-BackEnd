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
		first_name: Joi
			.string()
			.trim()
			.required()
			.label("First Name"),
		last_name: Joi
			.string()
			.trim()
			.allow("")
			.label("Last Name"),
		hourly_rate: Joi
			.string()
			.trim()
			.allow("")
			.label("Hourly Rate"),
		social_security_number: Joi
			.string()
			.trim()
			.allow("")
			.label("Social Security Number"),
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
		first_name: Joi
			.string()
			.trim()
			.label("First Name"),
		last_name: Joi
			.string()
			.trim()
			.allow("")
			.label("Last Name"),
		hourly_rate: Joi
			.string()
			.trim()
			.allow("")
			.label("Hourly Rate"),
		social_security_number: Joi
			.string()
			.trim()
			.allow("")
			.label("Social Security Number"),
		email: Joi
			.string()
			.trim()
			.label('Email'),
		// id: Joi
		// 	.string()
		// 	.trim()
		// 	.required()
		// 	.label('Id'),
		oldPassword: Joi
			.string()
			.min(8)
			.required()
			.allow("")
			.label('Password'),
		new_password: Joi
			.string()
			.min(8)
			.required()
			.allow("")
			.label('New password'),
		confirm_password: Joi
			.string()
			.min(8)
			.valid(Joi.ref('new_password'))
			.required()
			.allow("")
			.error(new Error('Confirm password and new password must be same')),
	}),
};

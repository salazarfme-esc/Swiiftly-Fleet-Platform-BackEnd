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
		role: Joi
			.string()
			.trim()
			.required()
			.label('Role'),
		email: Joi
			.string()
			.email()
			.trim()
			.required()
			.label('Email'),
		phone_number: Joi
			.string()
			.trim()
			.pattern(/^[0-9]{6,16}$/) // Ensure phone number is between 6 and 16 digits
			.required()
			.label('Phone Number')
			.messages({
				'string.pattern.base': 'Phone Number must be between 6 and 16 digits long and contain only numbers.',
				'any.required': 'Phone Number is required.'
			}),
		is_company: Joi
			.boolean()
			.required()
			.label('Is Company'),
		company_name: Joi
			.string()
			.when('is_company', {
				is: true,
				then: Joi.required(),
				otherwise: Joi.optional()
			})
			.label('Company Name'),
		address: Joi
			.object()
			.when('is_company', {
				is: true,
				then: Joi.required(),
				otherwise: Joi.optional()
			})
			.keys({
				street: Joi.string().trim().required().label("Street"),
				address: Joi.string().trim().required().label("address"),
				city: Joi.string().trim().required().label("City"),
				state: Joi.string().trim().required().label("State"),
				pin: Joi.string().trim().required().label("PIN"),
				country: Joi.string().trim().required().allow("").label("Country"),
				coordinates: Joi.array().items(Joi.number().required()).length(2).default([0.0000, 0.0000]).label("Coordinates"),
			})
			.label('Business Address'),
		permissions: Joi.array()
			.items(Joi.object({
				tab: Joi.string()
					.valid("Dashboard", "Vendor", "Work Flow", "Invoices",
						"Fleet Manager", "Reports", "Service Request", "Feedback", "Company", "Roles")
					.required(),
				read: Joi.boolean().required(),
				edit: Joi.boolean().required()
			}))
			.when(Joi.object({ is_company: true }).unknown(), {
				then: Joi.optional(),
				otherwise: Joi.required()
			})
			.label('Permissions')
	}),
	update_Sub_Admin:
		Joi.object().keys({
			name: Joi
				.string()
				.trim()
				.required()
				.label("Name"),
			role: Joi
				.string()
				.trim()
				.required()
				.label('Role'),
			phone_number: Joi
				.string()
				.trim()
				.pattern(/^[0-9]{6,16}$/) // Ensure phone number is between 6 and 16 digits
				.required()
				.label('Phone Number')
				.messages({
					'string.pattern.base': 'Phone Number must be between 6 and 16 digits long and contain only numbers.',
					'any.required': 'Phone Number is required.'
				}),
			permissions: Joi.array()
				.items(Joi.object({
					tab: Joi.string()
						.valid("Dashboard", "Vendor", "Work Flow", "Invoices",
							"Fleet Manager", "Reports", "Service Request", "Feedback", "Company", "Roles")
						.required(),
					read: Joi.boolean().required(),
					edit: Joi.boolean().required()
				}))
				.required() // Ensure permissions are provided
				.label('Permissions'),
			company_name: Joi
				.string()
				.required()
				.allow("")
				.label('Company Name'),
			address: Joi
				.object()
				.keys({
					street: Joi.string().trim().required().allow("").label("Street"),
					address: Joi.string().trim().required().allow("").label("Address"),
					city: Joi.string().trim().required().allow("").label("City"),
					state: Joi.string().trim().required().allow("").label("State"),
					pin: Joi.string().trim().required().allow("").label("PIN"),
					country: Joi.string().trim().required().allow("").label("Country"),
					coordinates: Joi.array().items(Joi.number().required()).length(2).default([0.0000, 0.0000]).label("Coordinates"),
				})
				.required()
				.label('Business Address'),

		}),
	update_admin: Joi.object().keys({
		name: Joi
			.string()
			.trim()
			.required()
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
	changeStatusSubAdmin: Joi.object().keys({
		is_active: Joi.boolean().required().label('Is Active?')
	}),
	deleteSubAdmin: Joi.object().keys({
		is_deleted: Joi.boolean().required().label('Is Delete?')
	}),
	MarkNotificationAsRead: Joi.object().keys({
		notification_ids: Joi.string().required().label('Notification Ids')
	}),
};

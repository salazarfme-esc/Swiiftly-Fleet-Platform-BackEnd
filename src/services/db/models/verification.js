'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Creating Verification Schema Model
 */
const VerificationSchema = new Schema({
	otp: {
		type: String,
		default: ''
	},
	user_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Users'
	},
	admin_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Admins'
	},
	attempts: {
		type: Number,
		default: 0
	},
	verification_type: {
		type: String,
		required: true,
		enum: ['email', 'password']
	},
	verification_for: {
		type: String,
		required: true,
		enum: ['admin', 'user']
	}
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Verifications', VerificationSchema);

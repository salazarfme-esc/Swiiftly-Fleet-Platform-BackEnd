'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Creating Verification Schema Model
 */
const AdminVerificationSchema = new Schema({
	email: {
		type: String,
		required: true,
		trim: true,
	},
	otp: {
		type: String,
		default: ''
	},
	admin_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'Admins'
	},
	attempts: {
		type: Number,
		default: 0
	},
	verification_type: {
		type: String,
		required: true,
		enum: ['email','password','mobile']
	}
},{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('AdminVerification', AdminVerificationSchema);

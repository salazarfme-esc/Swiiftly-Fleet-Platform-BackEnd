'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const config = require('../../../config/environments');
/**
 * Creating User Schema Model
 */
const userSchema = new Schema({
    user_name: {
        type: String,
        default: '',
        trim: true,
    },
    full_name: {
        type: String,
        trim: true,
    },
    device_token: {
        type: String,
        default: ''
    },
    device_type: {
        type: String,
        default: '1',
        enum: ['1', '2']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true // Always convert `test` to lowercase
    },
    password: {
        type: String,
        default: '',
        trim: true,
    },
    email_verified: {
        type: Boolean,
        default: false,
    },
    phone_number: {
        type: String,
        trim: true,
    },
    phone_verified: {
        type: Boolean,
        default: false,
    },
    forgot_password: {
        type: Boolean,
        default: false,
    },
    login_way: {
        type: String,
        enum: ['local'],
        default: 'local',
    },
    avatar: {
        type: String,
        default: '',
    },
    dob: {
        type: String,
        default: ""
    },
    user_role: {
        type: String,
        enum: ['fleet', 'vendor'],
        default: '',
    },
    is_delete: {
        type: Boolean,
        default: false
    },
    company_name: {
        type: String,
        default: ''
    },
    owner_name: {
        type: String,
        default: ''
    },
    temporary_password: {
        type: Boolean,
        default: false
    },
    w9: {
        type: String,
        default: '',
    },
    w9_document: {
        type: String,
        default: '',
    },
    net: {
        type: String,
        enum: ['30', '15', ''],
        default: '',
    },
    service_type: {
        type: [mongoose.Schema.Types.ObjectId],
		ref: 'FlowCategory',
        default: [],
    },
    w9_verified: {
        type: Boolean,
        default: false
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
/**
 * Method to Encrypt User password before Saving to Database
 */
userSchema.pre('save', function (next) {
    let user = this;
    let salt = config.bcrypt.saltValue;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) {
        return next();
    }
    // generate a salt
    bcrypt.genSalt(salt, function (err, salt) {
        if (err) return next(err);
        // hash the password with new salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);
            // override the plain password with the hashed one
            user.password = hash;
            next();
        });
    });
});
userSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Users', userSchema);
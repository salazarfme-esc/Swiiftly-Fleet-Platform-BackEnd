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
    first_name: {
        type: String,
        trim: true,
    },
    last_name: {
        type: String,
        trim: true,
    },
    device_token: {
        type: String,
        default: ''
    },
    device_type:{
        type: String,
        default: '1',
        enum: ['1', '2']
    },
    access_token: {
        type: String,
        default: ''
    },
    user_email: {
        type: String,
        required: true,
        trim: true,
    },
    user_password: {
        type: String,
        default: '',
        trim: true,
    },
    user_email_verified: {
        type: Boolean,
        default: false,
    },
    phone_number: {
        type: String,
        trim: true,
    },
    user_phone_verified: {
        type: Boolean,
        default: false,
    },
    login_way: {
        type: String,
        enum: ['local', 'facebook', 'google', 'apple'],
        default: 'local',
    },
    user_avatar: {
        type: String,
        default: '',
    },
    user_bio: {
        type: String,
        default: '',
    },
    // dob: {
    //     type: String,
    //     default: ""
    // },
    // sex: {
    //     type: String,
    //     enum: [null, 'male', 'female', 'others'],
    //     default: null
    // },
    // address: {
    //     street: { type: String, default: "" },
    //     landmark: { type: String, default: "" },
    //     city: { type: String, default: "" },
    //     district: { type: String, default: "" },
    //     state: { type: String, default: "" },
    //     pin: { type: String, default: "" },
    //     country: { type: String, default: "" },
    // },
    // location: {
    //     type: {
    //         type: String,
    //         enum: ['Point'], // 'location.type' must be 'Point'[lng,lat]
    //         default: 'Point',
    //     },
    //     coordinates: { type: [], default: [0.0000, 0.0000] },
    // },
    // insurance_expired_date: { type: String, default: "" },
    // insurance_employer_name: { type: String, default: "" },
    // insurance_company_name: { type: String, default: "" },
    // insurance_employer_phone: { type: String, default: "" },
    // insurance_type: { type: String, default: "" },
    // insurance_holder_name: { type: String, default: "" },
    // insurance_nominee: { type: String, default: "" },
    // insurance_number: { type: String, default: "" },
    // image_front: { type: String, default: "" },
    // image_back: { type: String, default: "" },
    // speciality: {
    //     type: mongoose.SchemaTypes.ObjectID,
    //     ref: 'Speciality',
    //     default: null
    // },
    // doctor_profile: {
    //     type: mongoose.SchemaTypes.ObjectId,
    //     ref: 'DoctorProfile'
    // },
    // family_members: {
    //     type: [{
    //         type: mongoose.SchemaTypes.ObjectId,
    //         ref: 'FamilyMembers',
    //         required: true,
    //     }, ],
    //     default: [],
    // },
    // identification: {
    //     type: String,
    //     default: ''
    // },
    // languages: {
    //     type: [String],
    //     default: ['English']
    // },
    // isAuthorised: {
    //     type: Boolean,
    //     default: false
    // },
    // user_role: {
    //     type: String,
    //     enum: ['patient', 'doctor', 'lab', 'pharmacy'],
    //     default: 'patient',
    // },
    // isUserBasicProfileComplete: {
    //     type: Boolean,
    //     default: false
    // }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
/**
 * Method to Encrypt User password before Saving to Database
 */
userSchema.pre('save', function(next) {
    let user = this;
    let salt = config.bcrypt.saltValue;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('user_password')) {
        return next();
    }
    // generate a salt
    bcrypt.genSalt(salt, function(err, salt) {
        if (err) return next(err);
        // hash the password with new salt
        bcrypt.hash(user.user_password, salt, function(err, hash) {
            if (err) return next(err);
            // override the plain password with the hashed one
            user.user_password = hash;
            next();
        });
    });
});
userSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Users', userSchema);
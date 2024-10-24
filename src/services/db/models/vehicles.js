'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating Vehicle Schema Model
 */
const VehicleSchema = new Schema({
    identification_number: {
        type: String,
        required: true
    },
    license_plate: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    make: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Make', // Reference to the Make model
        required: true
    },
    model: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Model', // Reference to the Model model
        required: true
    },
    color: {
        type: String,
        required: true
    },
    registration_due_date: {
        type: String,
        required: true
    },
    issue_date: {
        type: String,
        required: true
    },
    in_fleet: {
        type: String,
        required: false
    },
    de_fleet: {
        type: String,
        required: false
    },
    registration_place: {
        type: String,
        required: true
    },
    gas_electric: {
        type: String,
        enum: ['gas', 'electric'],
        required: false
    },
    last_oil_change: {
        type: String,
        required: false
    },
    meter_reading: {
        type: String,
        required: false
    },
    address: {
        street: { type: String, default: "" },
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        district: { type: String, default: "" },
        state: { type: String, default: "" },
        pin: { type: String, default: "" },
        country: { type: String, default: "" },
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
            default: [0.0000, 0.0000]
        }
    },
    media: {
        type: [String],
        default: [],
    },
    document: {
        type: [String],
        default: [],
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

VehicleSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Vehicle', VehicleSchema);

'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating MainJob Schema Model
 */
const MainJobSchema = new Schema({
    service_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowCategory',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    ticket_id: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: "",
        required: true
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
    address: {
        street: { type: String, default: "" },
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        district: { type: String, default: "" },
        state: { type: String, default: "" },
        pin: { type: String, default: "" },
        country: { type: String, default: "" },
    },
    location_history: [{
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0.0000, 0.0000]
        },
        timestamp: { type: Date, default: Date.now }
    }],
    address_history: [{
        street: { type: String, default: "" },
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        district: { type: String, default: "" },
        state: { type: String, default: "" },
        pin: { type: String, default: "" },
        country: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now }
    }],
    media: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: ["draft", "in-progress", "created", "accepted", "rejected", "completed"],
        default: "draft",
        required: true
    },
    time_estimation: {
        type: String,
        default: "",
    },
    cost_estimation: {
        type: String,
        default: "",
    },
    status_reason: {
        type: String,
        default: "",
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


// Indexes for optimizing queries
MainJobSchema.index({ status: 1 });
MainJobSchema.index({ service_category: 1 });
MainJobSchema.index({ user_id: 1 });
MainJobSchema.index({ vehicle_id: 1 });
MainJobSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('MainJob', MainJobSchema);

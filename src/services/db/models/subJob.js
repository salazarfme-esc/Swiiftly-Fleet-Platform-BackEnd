'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating SubJob Schema Model
 */
const SubJobSchema = new Schema({
    service_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowCategory',
        required: true
    },
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        default: null
    },
    root_ticket_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MainJob',
        required: true
    },
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowQuestion',
        required: true
    },
    answer: {
        type: String,
        default: "",
        required: true
    },
    ticket_id: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: "",
        required: true
    },
    media: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: ["draft", "in-progress", "created", "accepted", "rejected", "completed", "vendor_assigned", "delayed", "vendor_rejected", "vendor_accepted"],
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
    sequence: {
        type: Number,
        default: 0,
        required: true
    },
    active: {
        type: Boolean,
        default: false
    },
    vendor_media: {
        type: [String],
        default: [],
    },
    is_dropoff: {
        type: Boolean,
        default: false
    },
    dropoff_location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0.0000, 0.0000]
        }
    },
    dropoff_address: {
        street: { type: String, default: "" },
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        district: { type: String, default: "" },
        state: { type: String, default: "" },
        pin: { type: String, default: "" },
        country: { type: String, default: "" },
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Indexes for optimizing queries
SubJobSchema.index({ root_ticket_id: 1 });
SubJobSchema.index({ service_category: 1 });
SubJobSchema.index({ vendor_id: 1 });
SubJobSchema.index({ question_id: 1 });
SubJobSchema.index({ status: 1 });

module.exports = mongoose.model('SubJob', SubJobSchema);

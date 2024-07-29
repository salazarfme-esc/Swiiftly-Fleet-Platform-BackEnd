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
        required: true
    },
    root_ticket_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubJob',
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
        enum: ["draft", "in-progress", "accepted", "rejected", "completed", "vendor_rejected", "vendor_accepted"],
        default: "draft",
        required: true
    },
    time_estimation: {
        type: String,
        default: "",
        required: true
    },
    cost_estimation: {
        type: String,
        default: "",
        required: true
    },
    status_reason: {
        type: String,
        default: "",
        required: true
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

SubJobSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SubJob', SubJobSchema);

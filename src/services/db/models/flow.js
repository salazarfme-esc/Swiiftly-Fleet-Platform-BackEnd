'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Creating Flow Schema Model
 */
const FlowSchema = new Schema({
    flow_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowCategory',
        required: true
    },
    flow_question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowCategory',
        required: true
    },
    sequence: {
        type: Number,
        default: 0,
        required: true
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Flow', FlowSchema);

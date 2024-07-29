'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Creating FlowQuestion Schema Model
 */
const FlowQuestionSchema = new Schema({
    flow_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowCategory',
        required: true
    },
    question: {
        type: String,
        default: '',
        required: true
    },
    question_type: {
        type: String,
        enum: ['single_choice', 'multiple_choice', 'text'],
        required: true
    },
    options: {
        type: [
            {
                option: {
                    type: String,
                },
                action: {
                    type: Boolean,
                    default: false
                }
            }
        ],
        default: []
    },
    action: {
        type: Boolean,
        default: false
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('FlowQuestion', FlowQuestionSchema);

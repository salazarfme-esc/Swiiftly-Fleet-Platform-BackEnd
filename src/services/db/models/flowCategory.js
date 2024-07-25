'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Creating FlowCategory Schema Model
 */
const FlowCategorySchema = new Schema({
    name: {
        type: String,
        default: '',
        required: true
    },
    description: {
        type: String,
        default: '',
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('FlowCategory', FlowCategorySchema);

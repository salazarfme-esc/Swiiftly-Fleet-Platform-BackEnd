'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating Model Schema
 */
const ModelSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    make_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Make', // Reference to the Make model
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Model', ModelSchema);

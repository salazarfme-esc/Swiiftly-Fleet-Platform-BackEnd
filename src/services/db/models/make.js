'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating Make Schema Model
 */
const MakeSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String, // Assuming the image is stored as a URL or path to the image
        default: ""
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Make', MakeSchema);

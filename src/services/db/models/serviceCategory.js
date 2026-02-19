'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating Service Category Schema Model (Tires, Towing, Cleaning, etc.)
 */
const ServiceCategorySchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true // 保证服务名字不重复
    },
    description: {
        type: String,
        default: ""
    },
    is_active: {
        type: Boolean,
        default: true // 如果以后某个服务下架了，改成 false 即可
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('ServiceCategory', ServiceCategorySchema);
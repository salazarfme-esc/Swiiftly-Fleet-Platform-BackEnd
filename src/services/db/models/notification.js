'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating Notification Schema Model
 */
const NotificationSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    is_redirect: {
        type: Boolean,
        default: false,
        required: true
    },
    redirection_location: {
        type: String,
        enum: ['admin_job', 'admin_kanban', 'admin_vendor_profile', 'admin_invoice', 'vendor_kanban', 'vendor_profile', 'vendor_invoice', 'fleet_job_request', 'fleet_invoice', 'fleet_vehicle', ""],
        required: false
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: false
    },
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admins',
        required: false
    },
    job_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MainJob',
        required: false
    },
    notification_from_role: {
        type: String,
        required: true,
        enum: ['admin', 'fleet', 'vendor'] // Adjust roles as necessary
    },
    notification_to_role: {
        type: String,
        required: true,
        enum: ['admin', 'fleet', 'vendor'] // Adjust roles as necessary
    },
    is_read: {
        type: Boolean,
        default: false,
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Notification', NotificationSchema); 
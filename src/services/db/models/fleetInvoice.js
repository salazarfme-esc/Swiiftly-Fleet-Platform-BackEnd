'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating Fleet Invoice Schema Model
 */
const InvoiceSchema = new Schema({
    fleet_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    invoice_number: {
        type: String,
        required: true,
        unique: true
    },
    invoice_date: {
        type: Date,
        default: Date.now
    },
    total_amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue'],
        default: 'draft'
    },
    root_ticket_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MainJob',
        required: true
    },
    sub_jobs: [{
        sub_job_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubJob',
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    }],
    tax: {
        type: Number,
        default: 0
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Add index for faster querying
InvoiceSchema.index({ fleet_id: 1, invoice_date: -1 });

module.exports = mongoose.model('FleetInvoice', InvoiceSchema);

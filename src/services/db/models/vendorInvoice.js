'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating Vendor Invoice Schema Model
 */
const InvoiceSchema = new Schema({
    vendor_id: {
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
        enum: ['draft', 'published', 'paid', 'overdue'],
        default: 'draft'
    },
    sub_jobs: [{
        sub_job_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubJob',
            required: true
        },
        ticket_id: {
            type: String,
            required: true
        },
        parent_ticket_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MainJob',
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    }],
},{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Add index for faster querying
InvoiceSchema.index({ vendor_id: 1, invoice_date: -1 });

module.exports = mongoose.model('VendorInvoice', InvoiceSchema);

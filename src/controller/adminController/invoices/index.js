'use strict';
const logger = require('../../../services/logger');
const log = new logger('AdminInvoicesController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
const adminDbHandler = dbService.Admin;
const VendorInvoiceDbHandler = dbService.vendorInvoice;
const SubJobDbHandler = dbService.SubJob;
const config = require('../../../config/environments');
const { response } = require('express');
const mongoose = require("mongoose");
const moment = require('moment'); // Import Moment.js
/*******************
 * PRIVATE FUNCTIONS
 ********************/


/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {
    /**
     * Method to handle get vendor draft invoices
     */
    getVendorInvoices: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        const { status, skip, limit, latest } = req.query;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Get today's date in UTC
            const today = moment.utc(); // Current date in UTC
            const currentDay = today.day(); // 0 (Sunday) to 6 (Saturday)

            // Calculate the start of the current week (Monday) in UTC
            const startOfCurrentWeek = today.clone().startOf('isoWeek'); // Start of the current week (Monday)
            const startOfNextWeek = startOfCurrentWeek.clone().add(1, 'week'); // Start of next week (next Monday)
            console.log("🚀 ~ getVendorInvoices: ~ startOfNextWeek:", startOfNextWeek)

            let queryDate;

            if (latest === 'true') {
                // If today is Monday
                if (currentDay === 1) {
                    // Set queryDate to the previous Monday at 12:00 AM UTC
                    queryDate = startOfCurrentWeek.clone().subtract(1, 'week').startOf('day'); // Previous Monday
                } else {
                    // If today is not Monday, use the current week's Monday
                    queryDate = startOfCurrentWeek.startOf('day'); // Current week's Monday at 12:00 AM
                }
            } else {
                // If today is Monday
                if (currentDay === 1) {
                    // Set queryDate to the previous Monday at 12:00 AM UTC
                    queryDate = startOfCurrentWeek.clone().subtract(1, 'week').startOf('day'); // Previous Monday
                } else {
                    // If today is not Monday, return data before the current week's Monday
                    queryDate = startOfCurrentWeek.startOf('day'); // Current week's Monday at 12:00 AM
                }
            }

            console.log("🚀 ~ getVendorInvoices: ~ queryDate:", queryDate.toISOString());

            // Fetch invoices based on the calculated date
            let getData;
            if (latest === 'true') {
                getData = await VendorInvoiceDbHandler.getByQuery({
                    status,
                    created_at: {
                        $gte: queryDate.toDate(), // Convert to JavaScript Date object
                        $lt: startOfNextWeek.startOf('day').toDate() // Convert to JavaScript Date object
                    }
                }).sort({ created_at: -1 }).skip(parseInt(skip)).limit(parseInt(limit));
            } else {
                getData = await VendorInvoiceDbHandler.getByQuery({
                    status,
                    created_at: {
                        $lt: queryDate.toDate() // Convert to JavaScript Date object
                    }
                }).sort({ created_at: -1 }).skip(parseInt(skip)).limit(parseInt(limit));
            }

            if (!getData.length) {
                responseData.msg = "No draft invoices found!";
                return responseHelper.error(res, responseData);
            }
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to get data with error::', error);
            responseData.msg = "failed to get data";
            return responseHelper.error(res, responseData);
        }
    },
    updateInvoice: async (req, res) => {
        let admin = req.admin.sub;
        const { invoiceId } = req.params; // Get invoice ID from URL parameters
        const { status, sub_jobs } = req.body; // Get status and sub_jobs from request body
        let responseData = {};

        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            // Find the invoice by ID
            const invoice = await VendorInvoiceDbHandler.getById(invoiceId);
            if (!invoice) {
                responseData.msg = "Invoice not found!";
                return responseHelper.error(res, responseData);
            }

            // Update the invoice status
            if (status) {
                invoice.status = status;
            }

            // Update sub_jobs amounts
            if (sub_jobs && Array.isArray(sub_jobs)) {
                for (const sub_job of sub_jobs) {
                    const existingSubJob = invoice.sub_jobs.find(job => job.sub_job_id === sub_job.sub_job_id);
                    if (existingSubJob) {
                        // Update the amount in the invoice's sub_jobs
                        existingSubJob.amount = sub_job.amount;

                        // Update the actual amount in the subjob collection
                        await SubJobDbHandler.updateById(sub_job.sub_job_id, { cost_estimation: sub_job.amount });
                    }
                }
            }

            // Save the updated invoice
            await invoice.save();

            responseData.msg = "Invoice updated successfully!";
            responseData.data = invoice;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update invoice with error::', error);
            responseData.msg = "Failed to update invoice";
            return responseHelper.error(res, responseData);
        }
    },
};
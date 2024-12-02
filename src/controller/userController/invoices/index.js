'use strict';
const logger = require('../../../services/logger');
const log = new logger('VendorInvoicesController').getChildLogger();
const dbService = require('../../../services/db/services');
const responseHelper = require('../../../services/customResponse');
const UserDbHandler = dbService.User; // Assuming there's a Vendor handler
const VendorInvoiceDbHandler = dbService.vendorInvoice;
const SubJobDbHandler = dbService.SubJob;
const moment = require('moment'); // Import Moment.js
const FleetInvoiceDbHandler = dbService.FleetInvoice;

module.exports = {
    /**
     * Method to handle get vendor draft invoices
     */
    getVendorInvoices: async (req, res) => {
        let responseData = {};
        let vendor = req.user.sub; // Assuming vendor information is stored here
        const { status, skip, limit, start_amount, end_amount, issue_date } = req.query;
        try {
            let getByQuery = await UserDbHandler.getById(vendor);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Build the query object
            let query = {
                vendor_id: vendor // Assuming you want to filter invoices by the logged-in vendor
            };

            // Apply filters if present
            if (status) {
                query.status = status; // Filter by status
            }
            if (start_amount) {
                query.total_amount = { ...query.total_amount, $gte: parseFloat(start_amount) }; // Filter by start amount
            }
            if (end_amount) {
                query.total_amount = { ...query.total_amount, $lte: parseFloat(end_amount) }; // Filter by end amount
            }
            if (issue_date) {
                const startOfIssueDate = moment(issue_date).startOf('day').toDate(); // Start of the issue date
                const endOfIssueDate = moment(issue_date).endOf('day').toDate(); // End of the issue date
                query.invoice_date = { $gte: startOfIssueDate, $lte: endOfIssueDate }; // Filter by issue date range
            }

            // Fetch all invoices, filtering by status if provided
            let getData = await VendorInvoiceDbHandler.getByQuery(query)
                .sort({ created_at: -1 })
                .skip(parseInt(skip))
                .limit(parseInt(limit))
                .populate("vendor_id")
                .populate({
                    path: "sub_jobs.sub_job_id",
                    populate: { path: "service_category" } // Populate service_category inside sub_jobs.sub_job_id
                });
            responseData.msg = "Data fetched successfully!";
            responseData.data = { count: await VendorInvoiceDbHandler.getByQuery(query).countDocuments(), data: getData };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to get data with error::', error);
            responseData.msg = "failed to get data";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle updating vendor invoices
     */
    updateInvoice: async (req, res) => {
        let vendor = req.user.sub; // Assuming vendor information is stored here
        const { invoiceId } = req.params; // Get invoice ID from URL parameters
        const { status, sub_jobs } = req.body; // Get status and sub_jobs from request body
        let responseData = {};

        try {
            let getByQuery = await UserDbHandler.getById(vendor);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Find the invoice by ID
            const invoice = await VendorInvoiceDbHandler.getByQuery({ _id: invoiceId });
            if (!invoice.length) {
                responseData.msg = "Invoice not found!";
                return responseHelper.error(res, responseData);
            }

            // Check if the invoice date is today
            const today = moment.utc().startOf('day'); // Get today's date at 00:00:00 UTC
            const invoiceDate = moment(invoice[0].invoice_date).startOf('day'); // Get the invoice date at 00:00:00 UTC

            // Check if the invoice date is not today
            if (!invoiceDate.isSame(today, 'day')) {
                responseData.msg = "Invoices can only be edited on the same day they were created!";
                return responseHelper.error(res, responseData);
            }

            // Update the invoice status
            if (status) {
                invoice[0].status = status; // Update to the provided status
            }

            // Update sub_jobs amounts and calculate total_amount
            let totalAmount = 0; // Initialize total amount
            if (sub_jobs && Array.isArray(sub_jobs)) {
                for (const sub_job of sub_jobs) {
                    const existingSubJob = invoice[0].sub_jobs.find(job => job.sub_job_id.toString() === sub_job.sub_job_id);
                    if (existingSubJob) {
                        // Update the amount in the invoice's sub_jobs
                        existingSubJob.amount = sub_job.amount;

                        // Update the actual amount in the subjob collection
                        await SubJobDbHandler.updateById(sub_job.sub_job_id, { cost_estimation: sub_job.amount });
                    }
                }
            }

            // Calculate the total amount from sub_jobs
            totalAmount = invoice[0].sub_jobs.reduce((sum, job) => sum + job.amount, 0);
            invoice[0].total_amount = totalAmount; // Update the total_amount field

            // Save the updated invoice
            await invoice[0].save();

            responseData.msg = "Invoice updated successfully!";
            responseData.data = invoice;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update invoice with error::', error);
            responseData.msg = "Failed to update invoice";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle getting an invoice by ID
     */
    getVendorInvoiceById: async (req, res) => {
        let vendor = req.user.sub; // Assuming vendor information is stored here
        const { invoiceId } = req.params; // Get invoice ID from URL parameters
        let responseData = {};

        try {
            let getByQuery = await UserDbHandler.getById(vendor);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Find the invoice by ID
            const invoice = await VendorInvoiceDbHandler.getByQuery({ _id: invoiceId, vendor_id: vendor }).populate("vendor_id").populate({
                path: "sub_jobs.sub_job_id",
                populate: { path: "service_category" } // Populate service_category inside sub_jobs.sub_job_id
            });
            if (!invoice) {
                responseData.msg = "Invoice not found!";
                return responseHelper.error(res, responseData);
            }


            responseData.msg = "Invoice fetched successfully!";
            responseData.data = invoice;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to get invoice with error::', error);
            responseData.msg = "Failed to get invoice";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle getting fleet invoices
     */
    getFleetInvoices: async (req, res) => {
        let responseData = {};
        let fleet = req.user.sub; // Assuming fleet information is stored here
        const { status, skip, limit, start_amount, end_amount, issue_date } = req.query;
        try {
            let getByQuery = await UserDbHandler.getById(fleet);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Build the query object for fleet invoices
            let query = {
                fleet_id: fleet // Assuming you want to filter invoices by the logged-in fleet
            };

            // Apply filters if present
            if (status) {
                query.status = status; // Filter by status
            } else {
                query.status = { $ne: "draft" };
            }
            if (start_amount) {
                query.total_amount = { ...query.total_amount, $gte: parseFloat(start_amount) }; // Filter by start amount
            }
            if (end_amount) {
                query.total_amount = { ...query.total_amount, $lte: parseFloat(end_amount) }; // Filter by end amount
            }
            if (issue_date) {
                const startOfIssueDate = moment(issue_date).startOf('day').toDate(); // Start of the issue date
                const endOfIssueDate = moment(issue_date).endOf('day').toDate(); // End of the issue date
                query.invoice_date = { $gte: startOfIssueDate, $lte: endOfIssueDate }; // Filter by issue date range
            }

            // Fetch all fleet invoices, filtering by status if provided
            let getData = await FleetInvoiceDbHandler.getByQuery(query)
                .sort({ created_at: -1 })
                .skip(parseInt(skip))
                .limit(parseInt(limit))
                .populate("fleet_id")
                .populate({
                    path: "root_ticket_id",
                    populate: { path: "vehicle_id" } // Populate vehicle_id inside root_ticket_id
                })
                .populate({
                    path: "root_ticket_id",
                    populate: { path: "service_category" } // Populate service_category inside root_ticket_id
                })
                .populate({
                    path: "sub_jobs.sub_job_id",
                    populate: { path: "service_category" } // Populate service_category inside sub_jobs.sub_job_id
                });

            responseData.msg = "Fleet invoices fetched successfully!";
            responseData.data = { count: await FleetInvoiceDbHandler.getByQuery(query).countDocuments(), data: getData };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to get fleet invoices with error::', error);
            responseData.msg = "Failed to get fleet invoices";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle getting a fleet invoice by ID
     */
    getFleetInvoiceById: async (req, res) => {
        let fleet = req.user.sub; // Assuming fleet information is stored here
        const { invoiceId } = req.params; // Get invoice ID from URL parameters
        let responseData = {};

        try {
            let getByQuery = await UserDbHandler.getById(fleet);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Find the fleet invoice by ID
            const invoice = await FleetInvoiceDbHandler.getByQuery({ _id: invoiceId, fleet_id: fleet })
                .populate("fleet_id")
                .populate({
                    path: "root_ticket_id",
                    populate: { path: "vehicle_id" } // Populate vehicle_id inside root_ticket_id
                })
                .populate({
                    path: "sub_jobs.sub_job_id",
                    populate: { path: "service_category" } // Populate service_category inside sub_jobs.sub_job_id
                });
            if (!invoice) {
                responseData.msg = "Fleet invoice not found!";
                return responseHelper.error(res, responseData);
            }

            responseData.msg = "Fleet invoice fetched successfully!";
            responseData.data = invoice[0];
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to get fleet invoice with error::', error);
            responseData.msg = "Failed to get fleet invoice";
            return responseHelper.error(res, responseData);
        }
    },
}; 
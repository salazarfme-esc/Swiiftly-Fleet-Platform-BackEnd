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
const FleetInvoiceDbHandler = dbService.FleetInvoice;
const UserDbHandler = dbService.User;
const MainJobDbHandler = dbService.MainJob;
const NotificationDbHandler = dbService.Notification;

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
        const { status, skip, limit, latest, start_amount, end_amount, issue_date, search } = req.query;
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
            const endOfCurrentWeek = startOfCurrentWeek.clone().add(1, 'week'); // End of the current week (next Monday)

            let queryDate;
            let queryEndDate;



            if (latest === 'true') {
                // If today is Monday
                if (currentDay === 1) {
                    // Set queryDate to the previous Monday at 12:00 AM UTC
                    queryDate = startOfCurrentWeek.clone().subtract(1, 'week').startOf('day'); // Previous Monday
                    queryEndDate = endOfCurrentWeek.clone().subtract(1, 'week').startOf('day'); // Previous Monday
                } else {
                    // If today is not Monday, use the current week's Monday
                    queryDate = startOfCurrentWeek.startOf('day'); // Current week's Monday at 12:00 AM
                    queryEndDate = endOfCurrentWeek.startOf('day'); // Current week's Monday at 12:00 AM
                }
            } else {
                // If today is Monday
                if (currentDay === 1) {
                    // Set queryDate to the previous Monday at 12:00 AM UTC
                    queryDate = startOfCurrentWeek.clone().subtract(1, 'week').startOf('day'); // Previous Monday
                    queryEndDate = endOfCurrentWeek.clone().subtract(1, 'week').startOf('day'); // Previous Monday
                } else {
                    // If today is not Monday, return data before the current week's Monday
                    queryDate = startOfCurrentWeek.startOf('day'); // Current week's Monday at 12:00 AM
                    queryEndDate = endOfCurrentWeek.startOf('day'); // Current week's Monday at 12:00 AM
                }
            }

            // Build the query object
            let query = {
                invoice_date: latest === 'true' ? {
                    $gte: queryDate.toDate(),
                    $lt: queryEndDate.toDate()
                } : {
                    $lt: queryDate.toDate()
                }
            };
            if (search) {
                let user = await UserDbHandler.getByQuery({ user_role: "vendor", full_name: { $regex: search, $options: 'i' } });
                if (!user.length) {
                    responseData.msg = "Data fetched successfully!";
                    responseData.data = { count: 0, data: [] };
                    return responseHelper.success(res, responseData);
                }
                let userIds = user.map(user => user._id);
                if (userIds.length) {
                    query.vendor_id = { $in: userIds };
                }
            }

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

            // Fetch invoices based on the constructed query
            let getData = await VendorInvoiceDbHandler.getByQuery(query)
                .sort({ invoice_date: -1 })
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
            const invoice = await VendorInvoiceDbHandler.getByQuery({ _id: invoiceId });
            if (!invoice.length) {
                responseData.msg = "Invoice not found!";
                return responseHelper.error(res, responseData);
            }

            // Update the invoice status
            if (status) {
                invoice[0].status = status;
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
    getInvoiceById: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub; // Assuming admin information is stored here
        const { invoiceId } = req.params; // Get invoice ID from URL parameters

        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Find the invoice by ID
            const invoice = await VendorInvoiceDbHandler.getByQuery({ _id: invoiceId })
                .populate("vendor_id") // Populate vendor details
                .populate({
                    path: "sub_jobs.sub_job_id",
                    populate: { path: "service_category" } // Populate service_category inside sub_jobs.sub_job_id
                });
            if (!invoice.length) {
                responseData.msg = "Invoice not found!";
                return responseHelper.error(res, responseData);
            }

            responseData.msg = "Invoice fetched successfully!";
            responseData.data = invoice[0]; // Return the first invoice object
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to get invoice with error::', error);
            responseData.msg = "Failed to get invoice";
            return responseHelper.error(res, responseData);
        }
    },
    getFleetInvoices: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub;
        const { status, skip, limit, start_amount, end_amount, issue_date, search } = req.query;
        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }

            // Build the query object without day restrictions
            let query = {};
            if (getByQuery.is_company) {
                let fleetIDs = await UserDbHandler.getByQuery({ company_id: getByQuery._id, user_role: "fleet", full_name: { $regex: search, $options: 'i' } }).then(users => users.map(user => user._id))
                query.fleet_id = { $in: fleetIDs };
            }
            else {
                let fleetIDs = await UserDbHandler.getByQuery({ user_role: "fleet", full_name: { $regex: search, $options: 'i' } }).then(users => users.map(user => user._id))
                query.fleet_id = { $in: fleetIDs };
            }



            // Apply filters if present
            if (status) {
                query.status = status; // Filter by status
            } else {
                if (getByQuery.is_company) {
                    query.status = { $ne: "draft" };
                }
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

            // Fetch invoices based on the constructed query
            let getData = await FleetInvoiceDbHandler.getByQuery(query)
                .sort({ invoice_date: -1 })
                .skip(parseInt(skip))
                .limit(parseInt(limit))
                .populate({
                    path: "fleet_id",
                    populate: { path: "company_id" } // Populate company_id inside fleet_id
                })
                .populate("fleet_id")
                .populate({
                    path: "root_ticket_id",
                    populate: { path: "vehicle_id" } // Populate vehicle_id inside root_ticket_id
                })
                .populate({
                    path: "sub_jobs.sub_job_id",
                    populate: { path: "service_category" } // Populate service_category inside sub_jobs.sub_job_id
                });

            responseData.msg = "Data fetched successfully!";
            responseData.data = { count: await FleetInvoiceDbHandler.getByQuery(query).countDocuments(), data: getData };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to get data with error::', error);
            responseData.msg = "failed to get data";
            return responseHelper.error(res, responseData);
        }
    },
    updateFleetInvoice: async (req, res) => {
        let admin = req.admin.sub;
        const { invoiceId } = req.params; // Get invoice ID from URL parameters
        const { status, sub_jobs, tax } = req.body; // Get status, sub_jobs, and tax from request body
        let responseData = {};

        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            if (getByQuery.is_company) {
                responseData.msg = "You are not authorized to access this resource!";
                return responseHelper.error(res, responseData);
            }
            // Find the invoice by ID
            const invoice = await FleetInvoiceDbHandler.getByQuery({ _id: invoiceId });
            if (!invoice.length) {
                responseData.msg = "Invoice not found!";
                return responseHelper.error(res, responseData);
            }

            // Update the invoice status
            if (status) {
                invoice[0].status = status;
            }

            // Update sub_jobs amounts and calculate total_amount
            let totalAmount = 0; // Initialize total amount
            if (sub_jobs && Array.isArray(sub_jobs)) {
                for (const sub_job of sub_jobs) {
                    const existingSubJob = invoice[0].sub_jobs.find(job => job.sub_job_id.toString() === sub_job.sub_job_id);
                    if (existingSubJob) {
                        // Update the amount in the invoice's sub_jobs
                        existingSubJob.amount = sub_job.amount;
                    }
                }
            }

            // Calculate the total amount from sub_jobs
            totalAmount = invoice[0].sub_jobs.reduce((sum, job) => sum + job.amount, 0);

            // Add tax if provided
            if (tax) {
                const taxAmount = (totalAmount * (parseFloat(tax) / 100)); // Calculate tax amount
                totalAmount += taxAmount; // Add tax to total amount
                invoice[0].tax = tax;
            }

            invoice[0].total_amount = totalAmount; // Update the total_amount field

            // Save the updated invoice
            await invoice[0].save();

            let vehicleData = await MainJobDbHandler.getByQuery({ _id: invoice[0].root_ticket_id }).populate("vehicle_id");
            // Send notification if status is "sent"
            if (status === "sent") {
                let notificationObj = {
                    title: "🧾📋 Invoice Raised",
                    description: `Swiiftly Admin has raised the invoice 🧾 for "${vehicleData[0].vehicle_id.nickname}".`,
                    is_redirect: true,
                    redirection_location: "fleet_invoice",
                    user_id: invoice[0].fleet_id,
                    notification_to_role: "fleet",
                    notification_from_role: "admin",
                    job_id: null,
                    admin_id: null
                };
                await NotificationDbHandler.create(notificationObj);
            }

            responseData.msg = "Fleet invoice updated successfully!";
            responseData.data = await FleetInvoiceDbHandler.getByQuery({ _id: invoiceId })
                .populate("fleet_id") // Populate fleet details
                .populate("root_ticket_id")
                .populate("sub_jobs.sub_job_id");
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update fleet invoice with error::', error);
            responseData.msg = "Failed to update fleet invoice";
            return responseHelper.error(res, responseData);
        }
    },
    getFleetInvoiceById: async (req, res) => {
        let responseData = {};
        let admin = req.admin.sub; // Assuming admin information is stored here
        const { invoiceId } = req.params; // Get invoice ID from URL parameters

        try {
            let getByQuery = await adminDbHandler.getById(admin);
            if (!getByQuery) {
                responseData.msg = "Invalid login or token expired!";
                return responseHelper.error(res, responseData);
            }
            let query = { _id: invoiceId };
            // Find the invoice by ID
            const invoice = await FleetInvoiceDbHandler.getByQuery(query)
                .populate("fleet_id") // Populate fleet details
                .populate("root_ticket_id")
                .populate({
                    path: "root_ticket_id",
                    populate: { path: "vehicle_id" } // Populate vehicle_id inside root_ticket_id
                })
                .populate({
                    path: "sub_jobs.sub_job_id",
                    populate: { path: "service_category" } // Populate service_category inside sub_jobs.sub_job_id
                });
            if (!invoice.length || (getByQuery.is_company && invoice[0].fleet_id.company_id.toString() != getByQuery._id.toString())) {
                responseData.msg = "Invoice not found!";
                return responseHelper.error(res, responseData);
            }

            responseData.msg = "Invoice fetched successfully!";
            responseData.data = invoice[0]; // Return the first invoice object
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to get invoice with error::', error);
            responseData.msg = "Failed to get invoice";
            return responseHelper.error(res, responseData);
        }
    },
};

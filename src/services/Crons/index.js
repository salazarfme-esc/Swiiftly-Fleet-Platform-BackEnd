'use strict';
var cron = require('node-cron');
const dbService = require("../db/services");
const SubJobDbHandler = dbService.SubJob;
const VendorInvoiceDbHandler = dbService.vendorInvoice;
const NotificationDbHandler = dbService.Notification;
const VehicleDbHandler = dbService.Vehicle;
const moment = require('moment');
const emailService = require('../sendEmail');
const templates = require('../../utils/templates/template');

// Function to calculate the start and end dates of the last week
function getLastWeekRange() {
    const now = moment().utc();
    // Find the start of the previous week (Monday)
    const startOfWeek = now.clone().startOf('week').subtract(1, 'week').add(1, 'days'); // Previous week Monday
    // Calculate the end of the week (Sunday)
    const endOfWeek = startOfWeek.clone().endOf('week'); // Previous week Sunday

    return { start: startOfWeek.toDate(), end: endOfWeek.toDate() };
}

// Function to generate a unique invoice number
function generateInvoiceNumber() {
    return `INV-${Date.now()}`;
}

/*********************************************
 * SERVICE FOR HANDLING INVOICES
 *********************************************/
module.exports = {
    Crons: () => {
        // Schedule job every Monday at midnight (00:00 UTC)
        cron.schedule('0 0 * * 1', async () => {
            try {
                const { start, end } = getLastWeekRange();

                // Fetch all completed sub-jobs from the last week
                let completedSubJobs = await SubJobDbHandler.getByQuery({
                    status: 'completed',
                    updated_at: { $gte: start, $lte: end }
                });

                // Group by vendor
                let vendorJobs = {};
                completedSubJobs.forEach(job => {
                    if (!vendorJobs[job.vendor_id]) {
                        vendorJobs[job.vendor_id] = [];
                    }
                    vendorJobs[job.vendor_id].push(job);
                });

                // Create invoices for each vendor
                for (const [vendorId, jobs,] of Object.entries(vendorJobs)) {
                    const totalAmount = jobs.reduce((sum, job) => sum + parseFloat(job.cost_estimation), 0);
                    const invoiceNumber = generateInvoiceNumber(); // Generate a unique invoice number

                    let invoiceData = {
                        vendor_id: vendorId,
                        invoice_number: invoiceNumber,
                        start_date: start,
                        end_date: end,
                        total_amount: totalAmount,
                        sub_jobs: jobs.map(job => ({
                            sub_job_id: job._id,
                            ticket_id: job.ticket_id,
                            parent_ticket_id: job.root_ticket_id,
                            amount: parseFloat(job.cost_estimation)
                        }))
                    };

                    let createInvoice = await VendorInvoiceDbHandler.create(invoiceData);

                    if (createInvoice) {
                        let notificationObj = {
                            title: "🧾📆 Weekly Invoice Generated",
                            description: `Hey (Vendor Name)! Your weekly invoice 🧾 has been generated. You have 24 hours to review and make any changes ✍️. If no updates are made, the invoice will be sent automatically to Swiftly Admin at midnight ✅.`,
                            is_redirect: true,
                            redirection_location: "vendor_invoice",
                            user_id: vendorId,
                            notification_to_role: "vendor",
                            notification_from_role: "admin",
                            job_id: null,
                            admin_id: null
                        }
                        await NotificationDbHandler.create(notificationObj);

                    }

                    console.log('Invoices created successfully!');
                }
            } catch (error) {
                console.error('Error creating invoices:', error);
            }
        });

        // Schedule job every Tuesday at 12:15 AM (UTC) to notify admin and vendors
        cron.schedule('15 0 * * 2', async () => {
            try {
                // Get the start and end of Monday
                const startOfMonday = moment().subtract(1, 'days').startOf('day').toDate();
                const endOfMonday = moment().subtract(1, 'days').endOf('day').toDate();

                // Fetch all invoices generated on Monday
                let invoices = await VendorInvoiceDbHandler.getByQuery({
                    created_at: { $gte: startOfMonday, $lte: endOfMonday }
                });

                // Notify admin about new invoices
                let adminNotificationObj = {
                    title: "🧾📆 Invoice Update",
                    description: "🆕 New invoices 🧾 have been generated from vendors for the last week 📅. Please review them 👀!",
                    is_redirect: true,
                    redirection_location: "admin_invoice",
                    user_id: null, // Assuming this is for admin, set accordingly
                    notification_to_role: "admin",
                    notification_from_role: "vendor",
                    job_id: null,
                    admin_id: null
                };
                await NotificationDbHandler.create(adminNotificationObj);
                console.log('Admin notified about new invoices successfully!');

                // Notify each vendor about their generated invoice
                for (const invoice of invoices) {
                    let vendorNotificationObj = {
                        title: "✉️🧾 Invoice Sent to Admin",
                        description: `Your invoice (Number: ${invoice.invoice_number}) has been sent to the admin for review. Please contact admin if you have any concern.`,
                        is_redirect: true,
                        redirection_location: "vendor_invoice",
                        user_id: invoice.vendor_id,
                        notification_to_role: "vendor",
                        notification_from_role: "admin",
                        job_id: null,
                        admin_id: null
                    };
                    await NotificationDbHandler.create(vendorNotificationObj);
                }
            } catch (error) {
                console.error('Error notifying admin and vendors:', error);
            }
        });

        // Schedule job every day at 1 AM (UTC) to check for oil change notifications
        cron.schedule('0 1 * * *', async () => {
            try {
                const threeMonthsAgo = moment().subtract(3, 'months').format('YYYY-MM-DD'); // Calculate the date 3 months ago in the correct format

                // Fetch all vehicles where last_oil_change is older than 3 months
                let vehiclesDueForOilChange = await VehicleDbHandler.getByQuery({
                    last_oil_change: { $lt: threeMonthsAgo },
                    is_deleted: false // Ensure we only check active vehicles
                });

                // Notify fleet managers for each vehicle due for oil change
                for (const vehicle of vehiclesDueForOilChange) {
                    let notificationObj = {
                        title: "⏳🛢️🚗  Oil Change Reminder",
                        description: `Your vehicle (ID: ${vehicle._id}, Nickname: ${vehicle.nickname}) is due for an oil change. Please schedule it at your earliest convenience.`,
                        is_redirect: true,
                        redirection_location: "fleet_vehicle", // Adjust as necessary
                        user_id: vehicle.user_id, // Assuming user_id is the fleet manager's ID
                        notification_to_role: "fleet",
                        notification_from_role: "admin",
                        job_id: null,
                        admin_id: null
                    };
                    await NotificationDbHandler.create(notificationObj);
                }

                console.log('Oil change notifications sent successfully!');
            } catch (error) {
                console.error('Error sending oil change notifications:', error);
            }
        });
    },
};

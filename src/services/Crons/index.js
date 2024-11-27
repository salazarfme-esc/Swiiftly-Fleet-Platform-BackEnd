'use strict';
var cron = require('node-cron');
const dbService = require("../db/services");
const SubJobDbHandler = dbService.SubJob;
const VendorInvoiceDbHandler = dbService.vendorInvoice;
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
        cron.schedule('0 * * * *', async () => {
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
                for (const [vendorId, jobs] of Object.entries(vendorJobs)) {
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

                    await VendorInvoiceDbHandler.create(invoiceData);
                }

                console.log('Invoices created successfully!');
            } catch (error) {
                console.error('Error creating invoices:', error);
            }
        });
    },
};

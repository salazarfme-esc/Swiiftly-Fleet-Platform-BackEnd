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
    // Find the start of the current week (Sunday)
    const startOfWeek = now.clone().startOf('week').subtract(1, 'week'); // Previous week Sunday
    // Calculate the end of the week (Saturday)
    const endOfWeek = startOfWeek.clone().endOf('week'); // Saturday

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
        // Schedule job every Sunday at midnight (00:00 UTC)
        cron.schedule('0 0 * * 0', async () => {
            try {
                const { start, end } = getLastWeekRange();
                console.log("🚀 ~ cron.schedule ~ end:", end)
                console.log("🚀 ~ cron.schedule ~ start:", start)

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
                    console.log("🚀 ~ cron.schedule ~ jobs:", jobs)
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

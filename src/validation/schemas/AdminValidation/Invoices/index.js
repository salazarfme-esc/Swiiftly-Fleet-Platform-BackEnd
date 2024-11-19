const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);

/**
 * JOI Validation Schema for Invoice Route
 */
module.exports = {
    /**
     * Validation schema for updating an invoice
     */
    updateInvoice: Joi.object().keys({

        status: Joi.string().required().allow('admin-updated', 'paid', 'overdue', 'vendor-updated').label('Status'), // Validate status if provided
        sub_jobs: Joi.array().required().items(Joi.object().keys({
            sub_job_id: Joi.string().required().label('Sub Job ID'), // Validate sub job ID
            amount: Joi.number().required().label('Amount') // Validate amount
        })).label('Sub Jobs') // Validate sub_jobs as an array of objects
    }),
    updateFleetInvoice: Joi.object().keys({

        status: Joi.string().required().allow('draft','sent', 'paid', 'overdue').label('Status'), // Validate status if provided
        sub_jobs: Joi.array().required().items(Joi.object().keys({
            sub_job_id: Joi.string().required().label('Sub Job ID'), // Validate sub job ID
            amount: Joi.number().required().label('Amount') // Validate amount
        })).label('Sub Jobs'), // Validate sub_jobs as an array of objects
        tax: Joi.number().required().label('Tax') // Validate tax if provided

    }),
};

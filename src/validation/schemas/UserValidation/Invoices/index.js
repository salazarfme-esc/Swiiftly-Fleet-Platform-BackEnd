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

        sub_jobs: Joi.array().optional().items(Joi.object().keys({
            sub_job_id: Joi.string().required().label('Sub Job ID'), // Validate sub job ID
            amount: Joi.number().required().label('Amount') // Validate amount
        })).label('Sub Jobs') // Validate sub_jobs as an array of objects
    }),
};

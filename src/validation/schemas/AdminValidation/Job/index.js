const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);

/**
 * JOI Validation Schema for Job Route
 */
module.exports = {
    acceptOrRejectRequest: Joi.object().keys({
        status: Joi.boolean().required().label('Status'), // Should be ObjectId as a string
        status_reason: Joi.string().allow("").label('Status Reason'), // Should be ObjectId as a string
    }),

    assignVendorToSubTicket: Joi.object().keys({
        subTicketId: Joi.string().required().label('Sub-Ticket ID'), // Validates if subTicketId is a string
        vendorId: Joi.string().required().label('Vendor ID'), // Validates if vendorId is a string
        cost_estimation: Joi.string().required().label('Cost Estimation'),
        time_estimation: Joi.string().required().label('Time Estimation')
    }),
    updateSubJobSequence: Joi.object().keys({
        subJobId: Joi.string().required().label('Sub-Job ID'), // Validates if subJobId is a string
        newIndex: Joi.number().integer().min(1).required().label('New Index') // Validates if newIndex is an integer starting from 1
    }),
};

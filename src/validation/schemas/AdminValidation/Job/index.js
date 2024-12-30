const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);

/**
 * JOI Validation Schema for Job Route
 */
module.exports = {
    acceptOrRejectRequest: Joi.object().keys({
        status: Joi.boolean().required().label('Status'), // Should be ObjectId as a string
        status_reason: Joi.string().required().allow("").label('Status Reason'), // Should be a string
    }),

    assignVendorToSubTicket: Joi.object().keys({
        subTicketId: Joi.string().required().label('Sub-Ticket ID'),
        vendorId: Joi.string().required().label('Vendor ID'),
        time_estimation: Joi.string().required().label('Time Estimation'),
        coordinates: Joi.array().items(Joi.number().required()).length(2).default([0.0000, 0.0000]).label("Coordinates"),
        is_dropoff: Joi.boolean().required().label('Is Dropoff'),
        street: Joi.string().trim().when('is_dropoff', { is: true, then: Joi.string().trim().required().allow("").label("Street"), otherwise: Joi.string().trim().required().allow("").label("Street") }),
        address: Joi.string().trim().when('is_dropoff', { is: true, then: Joi.string().trim().required().label("Address"), otherwise: Joi.string().trim().required().allow("").label("Address") }),
        city: Joi.string().trim().when('is_dropoff', { is: true, then: Joi.string().trim().required().label("City"), otherwise: Joi.string().trim().required().allow("").label("City") }),
        // district: Joi.string().trim().when('is_dropoff', { is: true, then: Joi.string().trim().required().label("District"), otherwise: Joi.string().trim().required().allow("").label("District") }),
        state: Joi.string().trim().when('is_dropoff', { is: true, then: Joi.string().trim().required().label("State"), otherwise: Joi.string().trim().required().allow("").label("State") }),
        pin: Joi.string().trim().when('is_dropoff', { is: true, then: Joi.string().trim().required().label("PIN"), otherwise: Joi.string().trim().required().allow("").label("PIN") }),
        country: Joi.string().trim().when('is_dropoff', { is: true, then: Joi.string().trim().required().label("Country"), otherwise: Joi.string().trim().required().allow("").label("Country") }),
    }),
    updateSubJobSequence: Joi.object().keys({
        subJobId: Joi.string().required().label('Sub-Job ID'), // Validates if subJobId is a string
        newIndex: Joi.number().integer().min(1).required().label('New Index') // Validates if newIndex is an integer starting from 1
    }),
};

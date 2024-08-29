const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
/**
 * JOI Validation Schema for Job Route
 */
module.exports = {
    addMainJob: Joi.object().keys({
        service_category: Joi.string().required().label('Service Category ID'), // Should be ObjectId as a string
        vehicle_id: Joi.string().required().label('Vehicle ID'), // Should be ObjectId as a string
        description: Joi.string().required().label('Description'),
        street: Joi.string().trim().required().label("Street"),
        address: Joi.string().trim().required().label("address"),
        city: Joi.string().trim().required().label("City"),
        district: Joi.string().trim().required().allow("").label("District"),
        state: Joi.string().trim().required().label("State"),
        pin: Joi.string().trim().required().label("PIN"),
        country: Joi.string().trim().required().allow("").label("Country"),
        coordinates: Joi.array().items(Joi.number().required()).length(2).default([0.0000, 0.0000]).label("Coordinates"),
    }),
    addSubJob: Joi.object().keys({
        service_category: Joi.string().required().label('Service Category ID'), // Should be ObjectId as a string
        root_ticket_id: Joi.string().required().label('Parent Ticket ID'), // Should be ObjectId as a string
        question_id: Joi.string().required().label('Question ID'),
        answer: Joi.string().required().label('Answer'),
        note: Joi.string().required().label('Note'),
    }),
    submitRequest: Joi.object().keys({
        root_ticket_id: Joi.string().required().label('Parent Ticket ID'), // Should be ObjectId as a string
    }),
    vendorAcceptOrRejectJob: Joi.object().keys({
        subTicketId: Joi.string().required().label('Sub Ticket ID'),
        status: Joi.boolean().required().label('Status'), // true for accept, false for reject
        status_reason: Joi.string().required().allow("").label('Status Reason') // Required if status is false
    }),
    vendorUpdateJobStatusSchema: Joi.object({
        subTicketId: Joi.string().required().label('Sub Ticket ID'), // Must be a valid string and is required
        status: Joi.string().valid('in-progress', 'delayed', 'completed').required().label('Status'), // Must be one of the allowed statuses
        time_estimation: Joi.when('status', {
            is: 'delayed',
            then: Joi.string().required().label('Time Estimation'), // Required if status is 'delayed'
            otherwise: Joi.allow("") // Not allowed for other statuses
        }),
        cost_estimation: Joi.when('status', {
            is: 'completed',
            then: Joi.string().required().label('Cost Estimation'), // Required if status is 'delayed'
            otherwise: Joi.allow("") // Not allowed for other statuses
        })

    })

};

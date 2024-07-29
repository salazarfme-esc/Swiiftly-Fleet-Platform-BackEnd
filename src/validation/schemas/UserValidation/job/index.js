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
        coordinates: Joi.array().items(Joi.number().required()).length(2).default([0.0000, 0.0000]).label("Coordinates"),
        street: Joi.string().trim().optional().allow("").label("Street"),
        landmark: Joi.string().trim().optional().allow("").label("Landmark"),
        city: Joi.string().trim().optional().allow("").label("City"),
        district: Joi.string().trim().optional().allow("").label("District"),
        state: Joi.string().trim().optional().allow("").label("State"),
        pin: Joi.string().trim().optional().allow("").label("PIN"),
        country: Joi.string().trim().optional().allow("").label("Country"),
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

};

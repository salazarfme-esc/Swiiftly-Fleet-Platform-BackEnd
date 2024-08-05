const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
/**
 * JOI Validation Schema for Vehicle Route
 */
module.exports = {
    addVehicle: Joi.object().keys({
        identification_number: Joi.string().trim().required().label("Identification Number"),
        license_plate: Joi.string().trim().required().label("License Plate"),
        last_oil_change: Joi.string().trim().required().label("Last Oil Change"),
        nickname: Joi.string().trim().required().label("Nickname"),
        year: Joi.string().trim().required().label("Year"),
        make: Joi.string().trim().required().label("Make"),
        model: Joi.string().trim().required().label("Model"),
        color: Joi.string().trim().required().label("Color"),
        registration_due_date: Joi.string().trim().required().label("Registration Due Date"),
        street: Joi.string().trim().optional().allow("").label("Street"),
        landmark: Joi.string().trim().optional().allow("").label("Landmark"),
        city: Joi.string().trim().optional().allow("").label("City"),
        district: Joi.string().trim().optional().allow("").label("District"),
        state: Joi.string().trim().optional().allow("").label("State"),
        pin: Joi.string().trim().optional().allow("").label("PIN"),
        country: Joi.string().trim().optional().allow("").label("Country"),
        coordinates: Joi.array().items(Joi.number().required()).length(2).default([0.0000, 0.0000]).label("Coordinates"),
    }),
    searchVehicle: Joi.object().keys({
        search: Joi.string().trim().allow("").label("Search"),
    }),

};

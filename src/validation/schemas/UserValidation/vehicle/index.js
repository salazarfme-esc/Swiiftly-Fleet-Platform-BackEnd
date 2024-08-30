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
        street: Joi.string().trim().required().label("Street"),
        address: Joi.string().trim().required().label("address"),
        city: Joi.string().trim().required().label("City"),
        district: Joi.string().trim().required().allow("").label("District"),
        state: Joi.string().trim().required().label("State"),
        pin: Joi.string().trim().required().label("PIN"),
        country: Joi.string().trim().required().allow("").label("Country"),
        coordinates: Joi.array().items(Joi.number().required()).length(2).default([0.0000, 0.0000]).label("Coordinates"),
    }),
    searchVehicle: Joi.object().keys({
        search: Joi.string().trim().required().allow("").label("Search"),
        make: Joi.string().trim().required().allow("").label("Make"),
        model: Joi.string().trim().required().allow("").label("Model"),
        status: Joi.string().required().allow("").label("Status"),
    }),
    getCarsByBrandStatusValidation: Joi.object({
        brand: Joi.string().allow('').label('Brand'), // required brand name
        model: Joi.string().required().allow('').label('Model')  // required model name
    }),
    getBrandStatisticsValidation : Joi.object({
        brand: Joi.string().allow('').label('Brand') // required brand name
    })


};

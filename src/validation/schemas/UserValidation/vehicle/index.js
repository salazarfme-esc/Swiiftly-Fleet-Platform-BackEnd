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
        last_oil_change: Joi.string().trim().required().allow("").label("Last Oil Change"),
        nickname: Joi.string().trim().required().label("Nickname"),
        year: Joi.string().trim().required().label("Year"),
        make: Joi.string().trim().required().label("Make"),
        model: Joi.string().trim().required().label("Model"),
        color: Joi.string().trim().required().label("Color"),
        registration_due_date: Joi.string().trim().required().label("Expiration Date"),
        issue_date: Joi.string().trim().required().label("Issue Date"),
        registration_place: Joi.string().trim().required().label("Registration Place"),
        in_fleet: Joi.string().trim().required().label("In FLeet Date"),
        street: Joi.string().trim().required().allow("").label("Street"),
        address: Joi.string().trim().required().label("address"),
        city: Joi.string().trim().required().label("City"),
        district: Joi.string().trim().required().allow("").label("District"),
        state: Joi.string().trim().required().label("State"),
        pin: Joi.string().trim().required().label("PIN"),
        country: Joi.string().trim().required().allow("").label("Country"),
        gas_electric: Joi.string().trim().required().valid('gas', 'electric').label("Gas Or Electric"),
        coordinates: Joi.array().items(Joi.number().required()).length(2).default([0.0000, 0.0000]).label("Coordinates"),
    }),
    updateVehicle: Joi.object().keys({
        identification_number: Joi.string().trim().required().label("Identification Number"),
        license_plate: Joi.string().trim().required().label("License Plate"),
        last_oil_change: Joi.string().trim().required().allow("").label("Last Oil Change"),
        nickname: Joi.string().trim().required().label("Nickname"),
        year: Joi.string().trim().required().label("Year"),
        make: Joi.string().trim().required().label("Make"),
        model: Joi.string().trim().required().label("Model"),
        color: Joi.string().trim().required().label("Color"),
        registration_due_date: Joi.string().trim().required().label("Expiration Date"),
        issue_date: Joi.string().trim().required().label("Issue Date"),
        registration_place: Joi.string().trim().required().label("Registration Place"),
        in_fleet: Joi.string().trim().required().label("In FLeet Date"),
        de_fleet: Joi.string().trim().allow("").label("De Fleet Date"),
        street: Joi.string().trim().required().allow("").label("Street"),
        address: Joi.string().trim().required().label("address"),
        city: Joi.string().trim().required().label("City"),
        district: Joi.string().trim().required().allow("").label("District"),
        state: Joi.string().trim().required().label("State"),
        pin: Joi.string().trim().required().label("PIN"),
        country: Joi.string().trim().required().allow("").label("Country"),
        coordinates: Joi.array().items(Joi.number().required()).length(2).default([0.0000, 0.0000]).label("Coordinates"),
        delete_media: Joi.string().required().allow("").trim().label("Delete Media"),
        gas_electric: Joi.string().trim().required().valid('gas', 'electric').label("Gas Or Electric"),
        delete_documents: Joi.string().required().allow("").trim().label("Delete Documents"),
    }),
    searchVehicle: Joi.object().keys({
        search: Joi.string().trim().required().allow("").label("Search"),
        make: Joi.string().trim().required().allow("").label("Make"),
        model: Joi.string().trim().required().allow("").label("Model"),
        status: Joi.string().required().allow("").label("Status"),
        is_defleet: Joi.string().optional().allow("").label("Is Defleet"),
    }),
    getCarsByBrandStatusValidation: Joi.object({
        brand: Joi.string().allow('').label('Brand'), // required brand name
        model: Joi.string().required().allow('').label('Model')  // required model name
    }),
    getBrandStatisticsValidation: Joi.object({
        yearFilters: Joi.array().items(
            Joi.object({
                brand: Joi.string().required().label('Brand ID'), // Brand ID is required
                year: Joi.string().required().allow("").label('Year') // Year is required
            })
        ).optional().label('Year Filters'),
        make: Joi.string().trim().required().allow("").label("Make"),

    }), // The yearFilters array is optional    }),
    deleteVehicles: Joi.object({
        vehicleIds: Joi.string().required().trim().label("Vehicle ID's")
    }),
    deleteVehiclesMedias: Joi.object({
        media: Joi.string().required().allow("").trim().label("Media"),
        documents: Joi.string().required().allow("").trim().label("Documents"),
        vehicleId: Joi.string().required().trim().label("Vehicle ID's")

    }),


};

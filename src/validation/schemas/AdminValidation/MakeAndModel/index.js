const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);

/**
 * JOI Validation Schema for Make and Model APIs
 */
module.exports = {
    // Validation schema for adding or updating a Make
    addOrUpdateMake: Joi.object().keys({
        title: Joi.string().trim().required().label('Make Title'),
    }),

    // Validation schema for adding or updating a Model
    addOrUpdateModel: Joi.object().keys({
        title: Joi.string().trim().required().label('Model Title'),
        make_id: Joi.string().trim().required().label('Make ID')
    }),
};

const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
/**
 * JOI Validation Schema for Job Route
 */
module.exports = {
    acceptOrRejectRequest: Joi.object().keys({
        status: Joi.boolean().required().label('Status'), // Should be ObjectId as a string
    }),

};

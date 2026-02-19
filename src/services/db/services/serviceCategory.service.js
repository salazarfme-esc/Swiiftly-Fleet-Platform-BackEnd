'use strict';
// 引入我们刚才建的 Model
const ServiceCategory = require('../models/serviceCategory');

module.exports = {
    create: async (objToSave) => {
        return await ServiceCategory.create(objToSave);
    },
    getByQuery: async (query) => {
        return await ServiceCategory.find(query).lean();
    },
    getById: async (id) => {
        return await ServiceCategory.findById(id).lean();
    },
    updateById: async (id, objToUpdate) => {
        return await ServiceCategory.findByIdAndUpdate(id, objToUpdate, { new: true }).lean();
    }
};
"use strict";
const FlowCategoryModel = require("../models/flowCategory");
let instance;
/*********************************************
 * METHODS FOR HANDLING FlowCategory MODEL QUERIES
 *********************************************/
class FlowCategory {
    constructor() {
        //if FlowCategory instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._FlowCategoryController = FlowCategoryModel;
    }
    create(Obj) {
        let model = new this._FlowCategoryController(Obj);
        return model.save(Obj);
    }

    getById(FlowCategoryId, projection) {
        if (projection) {
            return this._FlowCategoryController.findOne({ _id: FlowCategoryId }, projection);
        }
        return this._FlowCategoryController.findOne({ _id: FlowCategoryId });
    }
    getByQuery(query, projection = {}) {
        return this._FlowCategoryController.find(query, projection);
    }

    updateById(FlowCategoryId, updatedObj) {
        return this._FlowCategoryController.findByIdAndUpdate(FlowCategoryId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._FlowCategoryController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(FlowCategoryId) {
        return this._FlowCategoryController.findByIdAndRemove(FlowCategoryId);
    }
    deleteByQuery(query) {
        return this._FlowCategoryController.deleteMany(query);
    }
}
module.exports = new FlowCategory();
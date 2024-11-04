"use strict";
const FlowModel = require("../models/flow");
let instance;
/*********************************************
 * METHODS FOR HANDLING Flow MODEL QUERIES
 *********************************************/
class Flow {
    constructor() {
        //if Flow instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._FlowController = FlowModel;
    }
    create(Obj) {
        let model = new this._FlowController(Obj);
        return model.save(Obj);
    }
   
    getById(FlowId, projection) {
        if (projection) {
            return this._FlowController.findOne({ _id: FlowId }, projection);
        }
        return this._FlowController.findOne({ _id: FlowId });
    }
    getByQuery(query, projection = {}) {
        return this._FlowController.find(query, projection);
    }

    updateById(FlowId, updatedObj) {
        return this._FlowController.findByIdAndUpdate(FlowId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._FlowController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(FlowId) {
        return this._FlowController.findByIdAndRemove(FlowId);
    }
    deleteByQuery(query) {
        return this._FlowController.deleteMany(query);
    }
}
module.exports = new Flow();
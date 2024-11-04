"use strict";
const FlowQuestionModel = require("../models/flowQuestion");
let instance;
/*********************************************
 * METHODS FOR HANDLING FlowQuestion MODEL QUERIES
 *********************************************/
class FlowQuestion {
    constructor() {
        //if FlowQuestion instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._FlowQuestionController = FlowQuestionModel;
    }
    create(Obj) {
        let model = new this._FlowQuestionController(Obj);
        return model.save(Obj);
    }
   
    getById(FlowQuestionId, projection) {
        if (projection) {
            return this._FlowQuestionController.findOne({ _id: FlowQuestionId }, projection);
        }
        return this._FlowQuestionController.findOne({ _id: FlowQuestionId });
    }
    getByQuery(query, projection = {}) {
        return this._FlowQuestionController.find(query, projection);
    }

    updateById(FlowQuestionId, updatedObj) {
        return this._FlowQuestionController.findByIdAndUpdate(FlowQuestionId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._FlowQuestionController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(FlowQuestionId) {
        return this._FlowQuestionController.findByIdAndRemove(FlowQuestionId);
    }
    deleteByQuery(query) {
        return this._FlowQuestionController.deleteMany(query);
    }
}
module.exports = new FlowQuestion();
"use strict";
const SubJobModel = require("../models/subJob");
let instance;
/*********************************************
 * METHODS FOR HANDLING SubJob MODEL QUERIES
 *********************************************/
class SubJob {
    constructor() {
        //if SubJob instance already exists then return
        if (instance) {
            return instance;w
        }
        this.instance = this;
        this._SubJobController = SubJobModel;
    }
    create(Obj) {
        let model = new this._SubJobController(Obj);
        return model.save(Obj);
    }
   
    getById(SubJobId, projection) {
        if (projection) {
            return this._SubJobController.findOne({ _id: SubJobId }, projection);
        }
        return this._SubJobController.findOne({ _id: SubJobId });
    }
    getByQuery(query, projection = {}) {
        return this._SubJobController.find(query, projection);
    }

    updateById(SubJobId, updatedObj) {
        return this._SubJobController.findByIdAndUpdate(SubJobId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._SubJobController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(SubJobId) {
        return this._SubJobController.findByIdAndRemove(SubJobId);
    }
    deleteByQuery(query) {
        return this._Controller.deleteMany(query);
    }
}
module.exports = new SubJob();
"use strict";
const MainJobModel = require("../models/mainJob");
let instance;
/*********************************************
 * METHODS FOR HANDLING MainJob MODEL QUERIES
 *********************************************/
class MainJob {
    constructor() {
        //if MainJob instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._MainJobController = MainJobModel;
    }
    create(Obj) {
        let model = new this._MainJobController(Obj);
        return model.save(Obj);
    }
   
    getById(MainJobId, projection) {
        if (projection) {
            return this._MainJobController.findOne({ _id: MainJobId }, projection);
        }
        return this._MainJobController.findOne({ _id: MainJobId });
    }
    getByQuery(query, projection = {}) {
        return this._MainJobController.find(query, projection);
    }

    updateById(MainJobId, updatedObj) {
        return this._MainJobController.findByIdAndUpdate(MainJobId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._MainJobController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(MainJobId) {
        return this._MainJobController.findByIdAndRemove(MainJobId);
    }
    deleteByQuery(query) {
        return this._MainJobController.deleteMany(query);
    }
}
module.exports = new MainJob();
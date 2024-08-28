"use strict";
const MakeModel = require("../models/make");
let instance;
/*********************************************
 * METHODS FOR HANDLING Make MODEL QUERIES
 *********************************************/
class Make {
    constructor() {
        //if Make instance already exists then return
        if (instance) {
            return instance; 
        }
        this.instance = this;
        this._MakeController = MakeModel;
    }
    create(Obj) {
        let model = new this._MakeController(Obj);
        return model.save(Obj);
    }

    getById(MakeId, projection) {
        if (projection) {
            return this._MakeController.findOne({ _id: MakeId }, projection);
        }
        return this._MakeController.findOne({ _id: MakeId });
    }
    getByQuery(query, projection = {}) {
        return this._MakeController.find(query, projection);
    }

    updateById(MakeId, updatedObj) {
        return this._MakeController.findByIdAndUpdate(MakeId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._MakeController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(MakeId) {
        return this._MakeController.findByIdAndRemove(MakeId);
    }
    deleteByQuery(query) {
        return this._Controller.deleteMany(query);
    }
}
module.exports = new Make();
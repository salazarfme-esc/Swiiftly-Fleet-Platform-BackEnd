"use strict";
const VehicleModel = require("../models/vehicles");
let instance;
/*********************************************
 * METHODS FOR HANDLING Vehicle MODEL QUERIES
 *********************************************/
class Vehicle {
    constructor() {
        //if Vehicle instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._VehicleController = VehicleModel;
    }
    create(Obj) {
        let model = new this._VehicleController(Obj);
        return model.save(Obj);
    }

    getById(VehicleId, projection) {
        if (projection) {
            return this._VehicleController.findOne({ _id: VehicleId }, projection);
        }
        return this._VehicleController.findOne({ _id: VehicleId });
    }
    getByQuery(query, projection = {}) {
        return this._VehicleController.find(query, projection);
    }

    updateById(VehicleId, updatedObj) {
        return this._VehicleController.findByIdAndUpdate(VehicleId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._VehicleController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(VehicleId) {
        return this._VehicleController.findByIdAndRemove(VehicleId);
    }
    deleteByQuery(query) {
        return this._VehicleController.deleteMany(query);
    }
}
module.exports = new Vehicle();
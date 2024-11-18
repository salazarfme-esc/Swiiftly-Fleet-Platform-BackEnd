"use strict";
const FleetInvoiceModel = require("../models/fleetInvoice");
let instance;
/*********************************************
 * METHODS FOR HANDLING FleetInvoice MODEL QUERIES
 *********************************************/
class FleetInvoice {
    constructor() {
        //if FleetInvoice instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._FleetInvoiceController = FleetInvoiceModel;
    }
    create(Obj) {
        let model = new this._FleetInvoiceController(Obj);
        return model.save(Obj);
    }

    getById(FleetInvoiceId, projection) {
        if (projection) {
            return this._FleetInvoiceController.findOne({ _id: FleetInvoiceId }, projection);
        }
        return this._FleetInvoiceController.findOne({ _id: FleetInvoiceId });
    }
    getByQuery(query, projection = {}) {
        return this._FleetInvoiceController.find(query, projection);
    }

    updateById(FleetInvoiceId, updatedObj) {
        return this._FleetInvoiceController.findByIdAndUpdate(FleetInvoiceId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._FleetInvoiceController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(FleetInvoiceId) {
        return this._FleetInvoiceController.findByIdAndRemove(FleetInvoiceId);
    }
    deleteByQuery(query) {
        return this._FleetInvoiceController.deleteMany(query);
    }
}
module.exports = new FleetInvoice();
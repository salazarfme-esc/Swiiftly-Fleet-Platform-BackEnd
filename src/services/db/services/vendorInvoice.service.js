"use strict";
const VendorInvoiceModel = require("../models/vendorInvoice");
let instance;
/*********************************************
 * METHODS FOR HANDLING VendorInvoice MODEL QUERIES
 *********************************************/
class VendorInvoice {
    constructor() {
        //if VendorInvoice instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._VendorInvoiceController = VendorInvoiceModel;
    }
    create(Obj) {
        let model = new this._VendorInvoiceController(Obj);
        return model.save(Obj);
    }
   
    getById(VendorInvoiceId, projection) {
        if (projection) {
            return this._VendorInvoiceController.findOne({ _id: VendorInvoiceId }, projection);
        }
        return this._VendorInvoiceController.findOne({ _id: VendorInvoiceId });
    }
    getByQuery(query, projection = {}) {
        return this._VendorInvoiceController.find(query, projection);
    }

    updateById(VendorInvoiceId, updatedObj) {
        return this._VendorInvoiceController.findByIdAndUpdate(VendorInvoiceId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._VendorInvoiceController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(VendorInvoiceId) {
        return this._VendorInvoiceController.findByIdAndRemove(VendorInvoiceId);
    }
    deleteByQuery(query) {
        return this._Controller.deleteMany(query);
    }
}
module.exports = new VendorInvoice();
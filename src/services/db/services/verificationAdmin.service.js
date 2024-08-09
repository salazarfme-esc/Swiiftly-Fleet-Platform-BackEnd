'use strict';
const VerificationModel = require('../models/verificationAdmin');
let instance;
/*********************************************
 * METHODS FOR HANDLING VERIFICATION MODEL QUERIES
 *********************************************/
class Verification {
    constructor() {
        //if Verification  instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._controller = VerificationModel;
    }
    create(VerificationObj) {
        let model = new this._controller(VerificationObj);
        return model.save(VerificationObj);
    }
    getById(Id, projection) {
        if (projection) {
            return this._controller.findOne({ _id: Id }, projection);
        }
        return this._controller.findOne({ _id: Id });
    }
    getByQuery(query, projection = {}) {
        return this._controller.find(query, projection);
    }
    updateById(Id, updatedObj) {
        return this._controller.findByIdAndUpdate(Id, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._controller.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(Id) {
        return this._controller.findByIdAndRemove(Id);
    }
    deleteByQuery(query) {
        return this._controller.deleteMany(query);
    }
}
module.exports = new Verification();
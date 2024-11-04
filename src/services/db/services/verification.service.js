'use strict';
const verificationModel = require('../models/verification');
let instance;
/******************************************************
 * METHODS FOR HANDLING EMAIL VERIFICATION MODEL QUERIES
 *******************************************************/
class Verification {
	constructor() {
		//if email instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._verificationController = verificationModel;
	}
	create(verificationObj) {
		let model = new this._verificationController(verificationObj);
		return model.save(verificationObj);
	}
	getByQuery(query, projection = {}) {
		return this._verificationController.find(query, projection);
	}
	updateByQuery(query, updatedObj, option) {
		return this._verificationController.updateMany(query, { $set: updatedObj }, option);
	}
	updateById(userId, updatedObj) {
        return this._verificationController.findByIdAndUpdate(userId, { $set: updatedObj });
    }
	deleteById(id) {
		return this._verificationController.findByIdAndRemove(id);
	}
	deleteByQuery(query) {
		return this._verificationController.deleteMany(query);
	}
}
module.exports = new Verification();

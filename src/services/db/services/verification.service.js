'use strict';
const verificationModel = require('../models/verification');
let instance;
/******************************************************
 * METHODS FOR HANDLING EMAIL VERIFICATION MODEL QUERIES
 *******************************************************/
class Verification {
	constructor() {
		//if email instance already exists then return
		if(instance) {
			return instance;
		}
		this.instance = this;
		this._verificationController = verificationModel;
	}
	createVerification(verificationObj) {
		let model = new this._verificationController(verificationObj);
		return model.save(verificationObj);
	}
	getVerificationDetailsByQuery(query,projection = {}){
		return this._verificationController.find(query, projection);
	}
	updateVerificationByQuery(query, updatedObj, option) {
		return this._verificationController.updateMany(query, { $set: updatedObj }, option);
	}
	deleteVerificationById(id) {
		return this._verificationController.findByIdAndRemove(id);
	}
}
module.exports = new Verification();

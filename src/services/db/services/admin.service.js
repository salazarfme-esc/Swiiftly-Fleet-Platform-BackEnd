'use strict';
const adminModel = require('../models/admin');
let instance;
/*********************************************
 * METHODS FOR HANDLING ADMIN MODEL QUERIES
 *********************************************/
class Admin {
	constructor() {
		//if admin instance already exists then return
		if(instance) {
			return instance;
		}
		this.instance = this;
		this._adminController = adminModel;
	}
	createAdmin(adminObj) {
		let model = new this._adminController(adminObj);
		return model.save(adminObj);
	}
	getAdminDetailsById(adminId, projection) {
		if (projection) {
			return this._adminController.findOne({ _id: adminId }, projection);
		}
		return this._adminController.findOne({ _id: adminId });
	}
	getAdminDetailsByQuery(query,projection = {}){
		return this._adminController.find(query, projection);
	}
	updateAdminDetailsById(adminId, updatedObj) {
		return this._adminController.findByIdAndUpdate(adminId, { $set : updatedObj });
	}
	updateAdminByQuery(query, updatedObj, option) {
		return this._adminController.updateMany(query, { $set: updatedObj }, option);
	}
	deleteAdminById(adminId) {
		return this._adminController.findByIdAndRemove(adminId);
	}
}
module.exports = new Admin();

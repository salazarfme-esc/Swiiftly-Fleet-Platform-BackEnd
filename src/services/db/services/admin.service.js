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
	create(adminObj) {
		let model = new this._adminController(adminObj);
		return model.save(adminObj);
	}
	getById(adminId, projection) {
		if (projection) {
			return this._adminController.findOne({ _id: adminId }, projection);
		}
		return this._adminController.findOne({ _id: adminId });
	}
	getByQuery(query,projection = {}){
		return this._adminController.find(query, projection);
	}
	updateById(adminId, updatedObj) {
		return this._adminController.findByIdAndUpdate(adminId, { $set : updatedObj });
	}
	updateByQuery(query, updatedObj, option) {
		return this._adminController.updateMany(query, { $set: updatedObj }, option);
	}
	deleteById(adminId) {
		return this._adminController.findByIdAndRemove(adminId);
	}
	deleteByQuery(query) {
        return this._adminController.deleteMany(query);
    }
}
module.exports = new Admin();

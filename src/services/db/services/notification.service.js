'use strict';
const notificationModel = require('../models/notification');
let instance;
/*********************************************
 * METHODS FOR HANDLING notification MODEL QUERIES
 *********************************************/
class notification {
	constructor() {
		//if notification instance already exists then return
		if(instance) {
			return instance;
		}
		this.instance = this;
		this._notificationController = notificationModel;
	}
	create(notificationObj) {
		let model = new this._notificationController(notificationObj);
		return model.save(notificationObj);
	}
	getById(notificationId, projection) {
		if (projection) {
			return this._notificationController.findOne({ _id: notificationId }, projection);
		}
		return this._notificationController.findOne({ _id: notificationId });
	}
	getByQuery(query,projection = {}){
		return this._notificationController.find(query, projection);
	}
	updateById(notificationId, updatedObj) {
		return this._notificationController.findByIdAndUpdate(notificationId, { $set : updatedObj });
	}
	updateByQuery(query, updatedObj, option) {
		return this._notificationController.updateMany(query, { $set: updatedObj }, option);
	}
	deleteById(notificationId) {
		return this._notificationController.findByIdAndRemove(notificationId);
	}
	deleteByQuery(query) {
        return this._notificationController.deleteMany(query);
    }
}
module.exports = new notification();

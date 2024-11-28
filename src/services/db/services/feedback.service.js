'use strict';
const feedbackModel = require('../models/feedback');
let instance;
/*********************************************
 * METHODS FOR HANDLING feedback MODEL QUERIES
 *********************************************/
class feedback {
	constructor() {
		//if feedback instance already exists then return
		if(instance) {
			return instance;
		}
		this.instance = this;
		this._feedbackController = feedbackModel;
	}
	create(feedbackObj) {
		let model = new this._feedbackController(feedbackObj);
		return model.save(feedbackObj);
	}
	getById(feedbackId, projection) {
		if (projection) {
			return this._feedbackController.findOne({ _id: feedbackId }, projection);
		}
		return this._feedbackController.findOne({ _id: feedbackId });
	}
	getByQuery(query,projection = {}){
		return this._feedbackController.find(query, projection);
	}
	updateById(feedbackId, updatedObj) {
		return this._feedbackController.findByIdAndUpdate(feedbackId, { $set : updatedObj });
	}
	updateByQuery(query, updatedObj, option) {
		return this._feedbackController.updateMany(query, { $set: updatedObj }, option);
	}
	deleteById(feedbackId) {
		return this._feedbackController.findByIdAndRemove(feedbackId);
	}
	deleteByQuery(query) {
        return this._feedbackController.deleteMany(query);
    }
}
module.exports = new feedback();

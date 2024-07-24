"use strict";
const userModel = require("../models/user");
let instance;
/*********************************************
 * METHODS FOR HANDLING USER MODEL QUERIES
 *********************************************/
class User {
    constructor() {
        //if user instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._userController = userModel;
    }
    createUser(userObj) {
        let model = new this._userController(userObj);
        return model.save(userObj);
    }
    getFeaturedUsers() {
        return this._userController.find({ featured: true }, { password: 0 });
    }
    getById(userId, projection) {
        if (projection) {
            return this._userController.findOne({ _id: userId }, projection);
        }
        return this._userController.findOne({ _id: userId });
    }
    getByQuery(query, projection = {}) {
        return this._userController.find(query, projection);
    }

    updateById(userId, updatedObj) {
        return this._userController.findByIdAndUpdate(userId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._userController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(userId) {
        return this._userController.findByIdAndRemove(userId);
    }
    deleteByQuery(query) {
        return this._Controller.deleteMany(query);
    }
}
module.exports = new User();
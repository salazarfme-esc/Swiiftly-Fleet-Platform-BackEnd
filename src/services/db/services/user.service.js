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
    getUserDetailsById(userId, projection) {
        if (projection) {
            return this._userController.findOne({ _id: userId }, projection);
        }
        return this._userController.findOne({ _id: userId });
    }
    getUserDetailsByQuery(query, projection = {}) {
        return this._userController.find(query, projection);
    }

    updateUserDetailsById(userId, updatedObj) {
        return this._userController.findByIdAndUpdate(userId, { $set: updatedObj });
    }
    updateUserByQuery(query, updatedObj, option) {
        return this._userController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteUserById(userId) {
        return this._userController.findByIdAndRemove(userId);
    }
}
module.exports = new User();
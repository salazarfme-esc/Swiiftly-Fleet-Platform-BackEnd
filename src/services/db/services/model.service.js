"use strict";
const ModelModel = require("../models/model");
let instance;
/*********************************************
 * METHODS FOR HANDLING Model MODEL QUERIES
 *********************************************/
class Model {
    constructor() {
        //if Model instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._ModelController = ModelModel;
    }
    create(Obj) {
        let model = new this._ModelController(Obj);
        return model.save(Obj);
    }

    getById(ModelId, projection) {
        if (projection) {
            return this._ModelController.findOne({ _id: ModelId }, projection);
        }
        return this._ModelController.findOne({ _id: ModelId });
    }
    getByQuery(query, projection = {}) {
        return this._ModelController.find(query, projection);
    }

    updateById(ModelId, updatedObj) {
        return this._ModelController.findByIdAndUpdate(ModelId, { $set: updatedObj });
    }
    updateByQuery(query, updatedObj, option) {
        return this._ModelController.updateMany(query, { $set: updatedObj }, option);
    }
    deleteById(ModelId) {
        return this._ModelController.findByIdAndRemove(ModelId);
    }
    deleteByQuery(query) {
        return this._ModelController.deleteMany(query);
    }
}
module.exports = new Model();
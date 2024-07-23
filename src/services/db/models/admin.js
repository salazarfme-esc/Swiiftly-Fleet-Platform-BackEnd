"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const config = require("../../../config/environments");
/**
 * Creating User Schema Model
 */
const adminUserSchema = new Schema(
  {
    first_name: {
      type: String,
      trim: true,
      default: ''
    },
    last_name: {
      type: String,
      trim: true,
      default: ''
    },
    hourly_rate: {
      type: String,
      default: "",
      trim: true,
    },
    social_security_number: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type:String,
      required: true,
    },
    last_login: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["1", "2"],
      default: "2"
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);
/**
 * Method to Encrypt Admin password before Saving to Database
 */
adminUserSchema.pre("save", function (next) {
  let admin = this;
  let salt = config.bcrypt.saltValue;
  // only hash the password if it has been modified (or is new)
  if (!admin.isModified("password")) {
    return next();
  }
  // generate a salt
  bcrypt.genSalt(salt, function (err, salt) {
    if (err) return next(err);
    // hash the password with new salt
    bcrypt.hash(admin.password, salt, function (err, hash) {
      if (err) return next(err);
      // override the plain password with the hashed one
      admin.password = hash;
      next();
    });
  });
});

module.exports = mongoose.model("Admins", adminUserSchema);

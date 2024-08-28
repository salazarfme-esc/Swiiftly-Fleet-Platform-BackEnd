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
    name: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    last_login: {
      type: String,
      default: "",
    },
    phone_number: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: ""
    },
    permission: {
      type: [String],
      enum: ["Dashboard", "Store Locate", "Vendor", "Work Flow", "Invoices", "Fleet Manager", "Reports", "Service Request", "Feedback"],
      default: []
    },
    otp_verified: {
      type: Boolean,
      default: false,
    },
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

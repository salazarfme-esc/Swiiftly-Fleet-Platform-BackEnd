'use strict';
const AWS = require("aws-sdk");
exports.sendOtp = (mobileNo, msg) => {
    return new AWS.SNS({ apiVersion: "2020-6-10" })
        .publish({
            Message: msg,
            PhoneNumber: "+91" + mobileNo,
        })
        .promise();
};

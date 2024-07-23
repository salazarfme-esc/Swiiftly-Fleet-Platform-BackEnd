'use strict';
const sgMail = require('@sendgrid/mail');
const config = require('../../config/environments');

sgMail.setApiKey(config.emailServiceInfo.senderEmail);

const AWS = require("aws-sdk");
module.exports = {
	sendEmail: async (emailBody) => {
		try {
			// send mail with defined transport object
			let emailInfo = {
				from: 'support@swiftly.com', // sender address
				to: emailBody.recipientsAddress, // list of receivers
				subject: emailBody.subject, // Subject line
				html: emailBody.body
			};
			sgMail.send(emailInfo);
			return true;
		}
		catch(error) {
			return error;
		}
	},
	sendSignupEmail:async (emailBody) => {
		try {
			// send mail with defined transport object
			let emailInfo = {
				from: 'support@swiftly.com', // sender address
				to: 'swiftly.com@gmail.com', // list of receivers
				subject: emailBody.subject, // Subject line
				html: emailBody.body
			};
			sgMail.send(emailInfo);
			return true;
		}
		catch(error) {
			return error;
		}
	},

	sendOtp: async (mobileNo, msg) => {
		return new AWS.SNS({ apiVersion: "2020-6-10" })
			.publish({
				Message: msg,
				PhoneNumber: "+91" + mobileNo,
			})
			.promise();
	}
};

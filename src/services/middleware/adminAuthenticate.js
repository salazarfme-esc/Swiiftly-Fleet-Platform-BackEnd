'use strict';
const jwtDecode = require('jsonwebtoken');
const responseHelper = require('../customResponse');
const config  = require('../../config/environments');
const logger = require('../logger');
const log = new logger('MiddlewareController').getChildLogger();
/***************************************************************
 * SERVICE FOR HANDLING ADMIN AUTH TOKEN AUTHENTICATION
 **************************************************************/
module.exports = (req, res, next) => {
	/**
	 * Method to Authenticate Admin token
	 */
	let reqHeaders = req.get('Authorization');
	let responseData = {};
	try {
		let adminAuthToken = reqHeaders.split(' ')[1];
		log.info('Received request for validating admin auth token',adminAuthToken);
		let decodedToken = jwtDecode.verify(adminAuthToken,config.adminJwtTokenInfo.secretKey);
		log.info('admin auth token extracted successfully with data:',decodedToken);
		req.admin = decodedToken;
		next();
	}catch(error) {
		log.error('failed to validate admin auth token with error::',error);
		if(error.TokenExpiredError) {
			responseData.msg = 'Token has been expired';
		}else {
			responseData.msg = 'Unauthorized request';
		}
		return responseHelper.unAuthorize(res,responseData);
	}
};
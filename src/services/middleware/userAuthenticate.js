'use strict';
const passport = require('passport');
const responseHelper = require('../customResponse');
const logger = require('../logger');
const log = new logger('MiddlewareController').getChildLogger();
/*********************************************
 * SERVICE FOR HANDLING TOKEN AUTHENTICATION
 *********************************************/
module.exports = (req, res, next) => {
	let responseData = {};
	/**
	 * Method to Authenticate Jwt token using Passport Jwt Strategy
	 */
	passport.authenticate('jwt', { session: false }, function(error, user, info) {// eslint-disable-line
		//If error, then return the error
		if (error) {
			log.error('failed to validate jwt token with error::',error);
			responseData.msg = 'failed to process request';
			return responseHelper.error(res,responseData);
		}
		//if user data not found then return the unauthorized response
		if (!user) {
			log.error('failed to extract jwt token info with error::',error);
			responseData.msg = 'unAuthorized request';
			return responseHelper.unAuthorize(res,responseData);
		}
		log.info('token extracted successfully with data:',user);
		//push the extracted jwt token data to the request object
		req.user = user;
		next();
	})(req, res, next);
};
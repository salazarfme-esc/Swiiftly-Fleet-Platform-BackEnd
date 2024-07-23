'use strict';
/*************************************
 * SERVICE FOR HANDLING API RESPONSE
 *************************************/
module.exports = {
	/**
	* Helper Method to handle API success Response
	*/
	success: (res, body = { msg:'Action completed successfully',data: {} }) => {
		return res.status(200).send({
			status: true,
			message: body.msg,
			result: body.data
		});
	},
	/**
	* Helper Method to handle API error Response
	*/
	error: (res, body = { msg: 'failed to process request' }) => {
		return res.status(403).send({
			status: false,
			message: body.msg
		});
	},
	/**
	* Helper Method to handle API unauthorize Response
	*/
	unAuthorize: (res, body = { msg:'unauthorize request' }) => {
		return res.status(401).send({
			status: false,
			message: body.msg
		});
	}
};
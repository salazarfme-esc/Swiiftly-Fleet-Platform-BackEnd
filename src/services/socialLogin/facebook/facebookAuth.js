const axios = require('axios');
const config = require('../../../config/environments');
const facebookClientId = config.socialLogin.facebook_client_id;
const facebookClientSecret  = config.socialLogin.facebook_client_secret;
module.exports  = (token) => {
	let appToken;
	let url ='https://graph.facebook.com/oauth/access_token?client_id=' + facebookClientId + '&client_secret=' + facebookClientSecret + '&grant_type=client_credentials';
	return axios(url, { method: 'GET' })
		.then(response => {
			appToken = response.data.access_token;
			return axios(
				'https://graph.facebook.com/debug_token?input_token=' + token + '&access_token=' + appToken,
				{
					method: 'GET'
				}
			);
		})
		.then(response => {
			const { app_id, is_valid } = response.data.data;
			if (app_id !== facebookClientId) {
				return new Error(
					'invalid app id'
				);
			}
			if (!is_valid) {
				return new Error('token is not valid');
			}
			return axios(
				'https://graph.facebook.com/me?fields=id,name,picture,email&access_token=' + token,
				{
					method: 'GET'
				}
			);
		})
		.then(response => {
			const { id, picture, email, name } = response.data;
			let user = {
				name: name,
				pic: picture.data.url,
				id: id,
				email_verified: true,
				email: email
			};
			return user;
		})
		.catch(error => {//eslint-disable-line
			return new Error('failed to authenticate facebook user');
		});
};
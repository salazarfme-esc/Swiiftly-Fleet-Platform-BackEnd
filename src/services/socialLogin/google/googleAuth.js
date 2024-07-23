const { OAuth2Client } = require('google-auth-library');
const config = require('../../../config/environments');
const googleClientId = config.socialLogin.google_client_id;
const client = new OAuth2Client(googleClientId);

module.exports = (token) => {
	return client
		.verifyIdToken({ idToken: token, audience: googleClientId })
		.then(data => {
			const payload = data.getPayload();
			const audience = payload.aud;
			if (audience !== googleClientId) {
				return new Error('error while authenticating google user: audience mismatch');
			}
			return {
				name: payload['name'],
				avatar: payload['picture'],
				id: payload['sub'],
				email_verified: payload['email_verified'],
				email: payload['email']
			};
		})
		.then(user => {
			return user;
		})
		.catch(error => {//eslint-disable-line
			return new Error('failed to authenticate google login token');
		});
};
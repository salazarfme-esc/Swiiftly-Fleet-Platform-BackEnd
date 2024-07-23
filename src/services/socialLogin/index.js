const facebookAuth = require('./facebook/facebookAuth');
const googleAuth = require('./google/googleAuth');
module.exports = {
	facebook : facebookAuth,
	google : googleAuth
};
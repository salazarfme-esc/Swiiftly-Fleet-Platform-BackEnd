'use strict';;
const { v4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

const { S3 } = require('@aws-sdk/client-s3');

const config = require('../../config/environments');
// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
aws.config.update({
	secretAccessKey: config.aws.secretAccessKey,
	accessKeyId: config.aws.accessKeyId,
	region: config.aws.region
});
const s3 = new S3({
	credentials: {
		secretAccessKey: config.aws.secretAccessKey,
		accessKeyId: config.aws.accessKeyId,
	},

	region: config.aws.region,
});
/*const maxSize = 1 * 1000 * 1000;*/
let _fileStorage = (type) => {
	let bucketName = '';
	try {
		if (type === 'file') {
			bucketName = config.aws.s3Bucket;
		} else if (type === 'avatar') {
			bucketName = config.aws.s3Bucket;
		} else if (type === 'image') {
			bucketName = config.aws.s3Bucket;
		} else {
			return new Error('Invalid type for aws s3 service');
		}
		return multer({
			storage: multerS3({
				s3: s3,
				bucket: bucketName,
				contentType: multerS3.AUTO_CONTENT_TYPE,
				metadata: function (req, file, cb) {//eslint-disable-inline
					cb(null, {
						fileName: file.originalname,
						mimetype: file.mimetype,
						/*fileSize: maxSize*/
					});
				},
				key: function (req, file, cb) {//eslint-disable-inine
					let uploadedFileName = v4() + '-' + file.fieldname + Date.now() + path.extname(file.originalname);
					cb(null, uploadedFileName);
				}
			})
		});
	} catch (error) {
		return error;
	}
};
let _deleteImageObject = (imgKey) => {
	let params = {
		Bucket: config.aws.s3Bucket,
		Key: imgKey
	};
	return new Promise((resolve, reject) => {
		s3.deleteObject(params, function (err, data) {
			if (err) reject(err.stack);	// an error occurred
			else resolve(data);	// successful response
		});
	});
};
module.exports = {
	uploadFile: _fileStorage,
	deleteFile: _deleteImageObject
};

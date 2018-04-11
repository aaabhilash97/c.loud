var AWS = require('aws-sdk');
const path = require('path');
AWS.config.loadFromPath(
    path.resolve(process.env.AWS_CRED_JSON.replace('~', process.env.HOME)));

var s3 = new AWS.S3();

module.exports = {
    s3: s3
};
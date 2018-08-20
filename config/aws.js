const AWS = require('aws-sdk');
const path = require('path');

// Load AWS config from AWS_CRED_JSON environment  variable
AWS.config.loadFromPath(
    path.resolve(process.env.AWS_CRED_JSON.replace('~', process.env.HOME))
);

const S3 = new AWS.S3();

module.exports = {
    S3: S3
};
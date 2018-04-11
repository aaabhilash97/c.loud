const { query, header } = require('express-validator/check');

const { sanitizeQuery } = require('express-validator/filter');

const upload = [

    query('partNumber').exists(),
    sanitizeQuery('partNumber').toInt(),

    query('uploadId').exists(),
    sanitizeQuery('uploadId'),

    header('Content-MD5').isMD5(),

    header('Content-Length').exists().isByteLength({min: 0, max: 5242880})
];

const upload_finish = [
    query('uploadId').exists(),
    sanitizeQuery('uploadId')
];


module.exports = {
    upload,
    upload_finish
};
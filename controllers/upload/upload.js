// const _ = require("lodash");

// const models = require("../../models");
const { matchedData } = require('express-validator/filter');
const { PassThrough } = require('stream');

const config = require('../../config');
const logger = config.logger.logger;

const _u = require("./upload_utils.js");
const file_utils = require("../file/file_utils.js");


const F = "[upload/index.js]";

const FILE_BUCKET = process.env.FILE_BUCKET;
const CError = global.CError;


async function upload(req, res) {
    const S = F + 'upload';
    try {
        const query = matchedData(req, { locations: ['query'] });

        const UploadId = query.uploadId || query.UploadId;
        const partNumber = query.partNumber;
        const contentLength = req.header('content-length');
        const contentMD5 = req.header('content-md5');
        const upload_details = await _u.getByUploadId(UploadId);
        if (!upload_details) throw new CError('No such upload exists', 'NoSuchUpload', 400, false);
        const s3UploadId = upload_details.s3_upload_id;
        const s3KeyName = upload_details.s3_key_name;
        if (!s3UploadId || !s3KeyName) throw new CError('No such upload exists', 'NoSuchUpload', 400, false);
        let pass = new PassThrough();
        pass.length = Number(contentLength);
        req.pipe(pass);
        let params = {
            /* required */
            Bucket: FILE_BUCKET,
            /* required */
            Key: s3KeyName,
            /* required */
            PartNumber: partNumber,
            /* required */
            UploadId: s3UploadId,
            Body: pass,
            ContentLength: contentLength
        };
        if (contentMD5) params['ContentMD5'] = contentMD5;

        // content = null;
        let data = await _u.uploadPart(params);
        logger.info(S, 'Part upload', data, pass.length); // successful response
        return res.status(200).json(data);
    } catch (err) {
        // content = null;
        logger.debug(S, err, err.stack); // an error occurred
        err.reason = 'Part Upload Failed.';
        return global.send_error_response(err, res);
    }
}

async function upload_finish(req, res) {
    const S = F + 'upload_finish';
    try {
        const userId = req.user.userId;
        const query = matchedData(req, { locations: ['query'] });
        const UploadId = query.uploadId || query.UploadId;
        const upload_details = await _u.getByUploadId(UploadId);
        if (!upload_details) throw new CError('No such upload exists', 'NoSuchUpload', 400, false);
        const s3UploadId = upload_details.s3_upload_id;
        const s3KeyName = upload_details.s3_key_name;
        let s3_params = {
            key: s3KeyName,
            s3_upload_id: s3UploadId
        };
        await _u.completeS3Upload(s3_params);
        await file_utils.completUpload(userId, UploadId);
        await _u.removeUploadId(UploadId);
        return res.status(200).json({
            msg: "uploaded successfully"
        });
    } catch (err) {
        logger.debug(S, err, err.stack); // an error occurred
        return global.send_error_response(err, res);
    }
}


module.exports = {
    upload,
    upload_finish
};
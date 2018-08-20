const config = require("../../config");
const logger = config.logger.logger;
const S3 = config.aws.S3;
const r_client1 = config.redis.client1;
const UPLOAD_EXPIRY = Number(process.env.UPLOAD_EXPIRY);

const F = '[upload_utils.js]';

const FILE_BUCKET = process.env.FILE_BUCKET;

function getByUploadId(key) {
    return new Promise((resolve, reject) => {
        r_client1.hgetall(key, function (error, result) {
            r_client1.expire(key, UPLOAD_EXPIRY);
            return error ? reject(error) : resolve(result);
        });
    });
}

function uploadPart(params) {
    const S = F + '[upload]';
    return new Promise((resolve, reject) => {
        let s3_params = {
            /* required */
            Bucket: FILE_BUCKET,
            /* required */
            Key: params.s3KeyName || params.Key || params.key,
            /* required */
            PartNumber: params.partNumber || params.PartNumber,
            /* required */
            UploadId: params.s3UploadId || params.UploadId,
            Body: params.content || params.Body,
            ContentLength: params.contentLength || params.ContentLength
        };
        S3.uploadPart(s3_params, function (err, data) {
            if (err) {
                logger.error(S, err); // an error occurred
                err.reason = 'Part Upload Failed.';
                return reject(err);
            } else {
                logger.info(S, 'Part upload', data); // successful response
                return resolve(data);
            }
        });
    });
}

function listParts(params, nextMarker) {
    let S = F + '[listParts]';
    return new Promise((resolve, reject) => {
        let s3_params = {
            /* required */
            Bucket: FILE_BUCKET,
            /* required */
            Key: params.Key || params.key,
            /* required */
            UploadId: params.UploadId || params.upload_id || params.s3_upload_id,
            MaxParts: 200,
            PartNumberMarker: nextMarker || 0
        };
        S3.listParts(s3_params, function (error, data) {
            if (error) {
                logger.error(S, error, s3_params);
                return reject(error);
            } else {
                logger.debug(S, 'Parts listed');
                if (data.IsTruncated) {
                    setTimeout(async () => {
                        try {
                            let next_parts = await listParts(
                                s3_params, data.NextPartNumberMarker);
                            return resolve(data.Parts.concat(next_parts));
                        } catch (exception) {
                            return reject(exception);
                        }
                    });
                } else {
                    return resolve(data.Parts);
                }
            }
        });
    });
}


function completeS3Upload(params) {
    let S = F + '[completeS3Upload]';
    return new Promise(async (resolve, reject) => {
        try {
            let multi_parts = await listParts(params);
            multi_parts = multi_parts.map((x) => {
                return {
                    PartNumber: x.PartNumber,
                    ETag: x.ETag
                };
            });
            let s3_params = {
                Bucket: FILE_BUCKET,
                Key: params.Key || params.key,
                MultipartUpload: {
                    Parts: multi_parts
                },
                UploadId: params.UploadId || params.upload_id || params.s3_upload_id,
            };
            S3.completeMultipartUpload(s3_params, function (error, data) {
                if (error) {
                    logger.error(S, error, s3_params);
                    return reject(error);
                } else {
                    logger.debug(S, 'successful');
                    return resolve(data);
                }
            });
        } catch (exception) {
            return reject(exception);
        }
    });
}

async function completeUpload(params) {
    await completeS3Upload(params);

}


module.exports = {
    getByUploadId,
    uploadPart,
    listParts,
    completeS3Upload,
    completeUpload
};
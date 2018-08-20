const { matchedData } = require('express-validator/filter');
const md5 = require('md5');
const uuidv4 = require('uuid/v4');
const path = require('path');
const _u = require("./file_utils.js");
const _upload_utils = require("../upload/upload_utils.js");

const config = require('../../config');
const logger = config.logger.logger;

const M = "[file/index.js] ";


async function create(req, res) {
    const S = M + "[create]";
    try {
        const sessionId = req.session_id;
        const file = matchedData(req, { locations: ['body'] });
        const UserId = file.UserId = req.user.userId || req.user.UserId;
        const Name = file.Name = path.basename(file.FilePath);

        const Hash = file.Hash;
        const sameFile = await _u.getFile({
            UserId: UserId,
            FilePath: file.FilePath,
            Hash: Hash
        });
        if (sameFile) {
            logger.info(S, "File with same Hash already exists");
            await _u.makeFileVersionActive({
                UserId: UserId,
                Parent: sameFile.Parent,
                Name: Name,
                Hash
            });
            return res.status(200).json({
                status: "success",
                code: 'FILE_CREATED',
                msg: "File created",
                file: file
            });
        } else {
            let fileWithSameHash = await _u.getFileWithSameFileHash(Hash);
            if (fileWithSameHash) {
                file.FileIdentifier = fileWithSameHash.FileIdentifier;
                logger.info(S, "file with same fileHash already exists", file);

                let folderPath = path.dirname(file.FilePath);
                let parentFolder = await _u.createFolders({ UserId, folderPath });
                file.Parent = parentFolder.id;
                await _u.createFile(file);
                await _u.makeFileVersionActive({
                    UserId: UserId,
                    Parent: file.Parent,
                    Name: Name,
                    Hash
                });
                return res.status(200).json({
                    status: "success",
                    code: 'FILE_CREATED',
                    msg: "File created",
                    file: file
                });
            } else {
                let folderPath = path.dirname(file.FilePath);
                let parentFolder = await _u.createFolders({ UserId, folderPath });
                file.Parent = parentFolder._id;
                let UploadId = 'u_' + md5(sessionId + file.FilePath + file.Hash);
                file.UploadId = UploadId;
                file.Owner = file.Owner || UserId;
                let multipart_upload_id;
                try {
                    file.FileIdentifier = uuidv4();
                    let s3_key_name = `files/${file.FileIdentifier}`;
                    await _u.addToPendingFiles(file);
                    multipart_upload_id = await _u.createMultipartUpload(s3_key_name);
                    await _u.saveUploadId(UploadId, {
                        s3_upload_id: multipart_upload_id,
                        s3_key_name: s3_key_name
                    });
                } catch (error) {
                    if (error.code === 11000) {
                        try {
                            const upload_details = await _upload_utils.getByUploadId(UploadId);
                            if (upload_details) {
                                let parts = await _upload_utils.listParts({
                                    Key: upload_details.s3_key_name,
                                    s3_upload_id: upload_details.s3_upload_id
                                });
                                return res.status(200).json({
                                    status: "success",
                                    code: 'UPLOAD_IN_PROGRESS',
                                    msg: "Upload in progress.",
                                    file: file,
                                    uploadId: UploadId,
                                    parts: parts
                                });
                            } else {
                                throw new Error('Internal error');
                            }
                        } catch (exception) {
                            logger.error(S, exception);
                            await _u.deletePendingFile(UserId, UploadId);
                            throw new Error(exception);
                        }
                    } else {
                        throw new Error(error);
                    }
                }

                logger.info(S, "Added file to pending files", file);
                return res.status(200).json({
                    status: 'success',
                    code: 'UPLOAD_INITIATED',
                    msg: 'Initiated multipart upload.',
                    file: file,
                    uploadId: UploadId,
                    parts: []
                });
            }
        }
    } catch (ex) {
        logger.error(S, (ex && ex.reason || ex));
        return global.send_error_response(ex, res);
    }
}


module.exports = {
    create
};
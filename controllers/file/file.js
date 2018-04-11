const { matchedData } = require('express-validator/filter');
const md5 = require('md5');
const uuidv4 = require('uuid/v4');

const _u = require("./file_utils.js");
const _upload_utils = require("../upload/upload_utils.js");

const config = require('../../config');
const logger = config.logger.logger;

const M = "[file/index.js] ";


async function create(req, res){
    const S = M + "[create] ";
    try{
        let file = matchedData(req, { locations: ['body'] });
        let userId = req.user.userId;
        file.userId = userId;
        let versionHash = md5(file.fileHash + JSON.stringify(file.properties));
        let same_file = await _u.getFile({
            userId: file.userId,
            filePath: file.filePath,
            versionHash: versionHash
        });
        if(same_file){
            logger.info(S, "file with same versionHash already exists", same_file);
            await _u.makeFileVersionActive({
                userId: file.userId,
                filePath: file.filePath,
                versionHash: versionHash
            });
            return res.status(200).json({
                status: "success",
                msg: "File created",
                file: file
            });
        }else{
            let file_with_same_fileHash = await _u.getFileWithSameFileHash(file.fileHash);
            file.versionHash = versionHash;
            if(file_with_same_fileHash){
                file.fileIdentifier = file_with_same_fileHash.fileIdentifier;
                logger.info(S, "file with same fileHash already exists", file);
                await _u.createFile(file);
                await _u.makeFileVersionActive({
                    userId: file.userId,
                    filePath: file.filePath,
                    versionHash: versionHash
                });
                return res.status(200).json({
                    status: "success",
                    msg: "File created",
                    file: file
                });
            }else{
                let uploadId = 'u_' + md5(req.session_id + file.filePath + file.versionHash);
                file.uploadId = uploadId;

                let multipart_upload_id;
                try{
                    file.fileIdentifier = uuidv4();
                    let s3_key_name =  `files/${file.fileIdentifier}`;
                    await _u.addToPendingFiles(file);
                    multipart_upload_id = await _u.createMultipartUpload(s3_key_name);
                    await _u.saveUploadId(uploadId, {
                        s3_upload_id:multipart_upload_id,
                        s3_key_name: s3_key_name
                    });
                }catch(error){
                    if(error.code === 11000){
                        try{
                            const upload_details = await _upload_utils.getByUploadId(uploadId);
                            if(upload_details){
                                let parts = await _upload_utils.listParts({
                                    Key: upload_details.s3_key_name,
                                    s3_upload_id: upload_details.s3_upload_id
                                });
                                return res.status(200).json({
                                    status: "success",
                                    msg: "Please complete upload",
                                    file: file,
                                    uploadId: uploadId,
                                    parts: parts
                                });
                            }else{
                                throw new Error('Internal error');
                            }
                        }catch(exception){
                            logger.error(S, exception);
                            await _upload_utils.deletePendingFile(userId, uploadId);
                            throw new Error(exception);
                        }
                    }else{
                        throw new Error(error);
                    }
                }

                logger.info(S, "Added file to pending files", file);
                return res.status(200).json({
                    status: "success",
                    msg: "Please complete upload",
                    file: file,
                    uploadId: uploadId,
                    parts: []
                });
            }
        }
    }catch(ex){
        logger.error(S, (ex&&ex.reason||ex));
        return global.send_error_response(ex, res);
    }
}


module.exports = {
    create
};
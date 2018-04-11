/**
 * @author abhilash.km
 */

const _ = require("lodash");

const models = require("../../models");

const config = require('../../config');
const logger = config.logger.logger;
const s3 = config.aws.s3;
const r_client1 = config.redis.client1;


const FILE_BUCKET = process.env.FILE_BUCKET;
const UPLOAD_EXPIRY = Number(process.env.UPLOAD_EXPIRY);

const F = "[file/utils.js]";

function getFile(file) {
    const S = F + "[getActiveFile]";
    return new Promise((resolve, reject) => {
        file = _.clone(file);
        models.Files.findOne(file, function(error, file) {
            if (error) {
                logger.debug(S, error);
                return reject(error);
            }
            return resolve(file);
        });
    });
}


function createFile(file) {
    const S = F + "[createFile]";
    return new Promise((resolve, reject) => {
        file = _.clone(file);
        models.Files.create(file, function(error, file) {
            if (error) {
                logger.debug(S, error);
                if (error.code == 11000) {
                    error.reason = "File request already exists.";
                    return resolve(file);
                }
                return reject(error);
            }
            return resolve(file);
        });
    });
}


function getFileWithSameFileHash(fileHash) {
    const S = F + "[getFileWithSameHash]";
    return new Promise((resolve, reject) => {
        models.Files.findOne({
            fileHash: fileHash
        }, function(error, file) {
            if (error) {
                logger.debug(S, error);
                return reject(error);
            }
            return resolve(file);
        });
    });
}


function makeFileVersionActive(file) {
    const S = F + "[makeFileActive]";
    return new Promise((resolve, reject) => {
        file = _.clone(file);
        models.Files.update({
            userId: file.userId,
            filePath: file.filePath,
            versionHash: file.versionHash
        }, { $set: { active: true } }, function(error) {
            if (error) {
                logger.debug(S, error);
                return reject(error);
            }
            models.Files.update({
                userId: file.userId,
                filePath: file.filePath,
                versionHash: { $ne: file.versionHash }
            }, { $set: { active: false } }, function(error, result) {
                if (error) {
                    logger.debug(S, error);
                    return reject(error);
                }
                return resolve(result);
            });
        });
    });
}


function addToPendingFiles(file) {
    return new Promise((resolve, reject) => {
        let uploadId = file.uploadId;
        return models.PendFiles.create({
            userId: file.userId,
            uploadId: uploadId,
            file: file
        }).catch((error) => {
            return reject(error);
        }).then(() => {
            return resolve(file);
        });
    });
}

function getPendingFile(userId, uploadId) {
    return new Promise((resolve, reject) => {
        return models.PendFiles.findOne({
            userId: userId,
            uploadId: uploadId
        }).catch((error) => {
            return reject(error);
        }).then((file) => {
            return resolve(file.file);
        });
    });
}

function deletePendingFile(userId, uploadId) {
    return new Promise((resolve, reject) => {
        return models.PendFiles.remove({
            userId: userId,
            uploadId: uploadId
        }).catch((error) => {
            return reject(error);
        }).then((file) => {
            return resolve(file.file);
        });
    });
}

function completUpload(userId, uploadId){
    return new Promise(async (resolve, reject) => {
        try{
            let file = await getPendingFile(userId, uploadId);
            await createFile(file);
            await makeFileVersionActive({
                userId: file.userId,
                filePath: file.filePath,
                versionHash: file.versionHash
            });
            await deletePendingFile(userId, uploadId);
            return resolve(file);
        }catch(exception){
            return reject(exception);
        }

    });
}


function createSync(params) {
    return new Promise((resolve, reject) => {
        models.Sync.create({
            userId: params.userId,
            filePath: params.filePath,
            old_filePath: '',
            event: params.event
        }).catch((error) => {
            return reject(error);
        }).then(() => {
            return resolve(params);
        });
    });
}

function createMultipartUpload(key_name) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: FILE_BUCKET,
            Key: key_name
        };
        s3.createMultipartUpload(params, function(err, data) {
            if(err){
                return reject(err);
            }else{
                return resolve(data.UploadId);
            }
        });
    });
}


function saveUploadId(key, value){
    return new Promise((resolve, reject) => {
        r_client1.hmset(key, value, function(error, result){
            r_client1.expire(key, UPLOAD_EXPIRY);
            return error?reject(error):resolve(result);
        });
    });
}



module.exports = {
    getFile,
    createFile,
    getFileWithSameFileHash,
    makeFileVersionActive,
    addToPendingFiles,
    createSync,
    createMultipartUpload,
    saveUploadId,
    getPendingFile,
    completUpload
};
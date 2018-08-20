/**
 * @author abhilash.km
 */

const _ = require('lodash');
const path = require('path');
const models = require('../../models');

const config = require('../../config');
const logger = config.logger.logger;
const S3 = config.aws.S3;
const r_client1 = config.redis.client1;


const FILE_BUCKET = process.env.FILE_BUCKET;
const UPLOAD_EXPIRY = Number(process.env.UPLOAD_EXPIRY);

const CError = global.CError;

const F = "[file/utils.js]";


/**
 * @description Get file from db
 * @param {*} { UserId, FilePath, Hash } FilePath=/samplefolder/sample.file
 * @returns
 */
async function getFile({ UserId, FilePath, Hash, throwError }) {
    try {
        let dirNames = path.dirname(FilePath).split('/').filter(x => x);
        let fileName = path.basename(FilePath);
        let Parent;
        let folder;
        for (let dirName of dirNames) {
            if (dirName === '/') {
                Parent = 'root';
                continue;
            }
            folder = await models.Files.findOne({
                UserId,
                Parent
            });
            if (_.isEmpty(folder)) {
                throw new CError('Folder Not found.', 'ERR_FOLDER_NOT_FOUND');
            }
            Parent = folder._id;
        }
        let file = await models.Files.findOne({
            UserId,
            Parent,
            Name: fileName,
            Hash
        });
        if (_.isEmpty(file)) {
            throw new CError('File Not Exists', 'ERR_FILE_NOT_FOUND');
        }
        file[Symbol.for('Parent')] = folder;
        return file;
    } catch (error) {
        if (throwError) {
            throw error;
        }
        return null;
    }
}


/**
 * @description create directories and sub directories like mkdir -p /folder1/folder2/
 * @param {*} { UserId, folderPath }
 * @returns
 */
async function createFolders({ UserId, folderPath }) {
    let dirNames = folderPath.split('/').filter(x => x);
    if (_.isEmpty(dirNames)) {
        dirNames = ['/'];
    }
    let Parent = 'root';
    let Name = '';
    let folder;
    for (let dirName of dirNames) {
        if (dirName === '/') {
            Name = 'root';
        } else {
            Name = dirName;
        }
        folder = await models.Files.findOne({
            UserId,
            Name,
            ResourceType: 'folder'
        });

        // Create folder if not exists
        if (_.isEmpty(folder)) {
            folder = createFolder({
                UserId,
                Name,
                Parent,
                Hash: Name
            });
            Parent = folder._id;
        } else {
            Parent = folder._id;
        }
    }
    return folder;
}

function createFolder({ UserId, Name, Parent, Hash, LastModified }) {
    return new Promise((resolve, reject) => {
        const S = F + "[createFolder]";
        let folder = {
            UserId: UserId,
            Owner: UserId,
            Parent: Parent,
            Name: Name,
            FileIdentifier: 'folder',
            Hash: Hash,
            ResourceType: 'folder',
            Size: 0,
            LastModified: LastModified || new Date().getTime(),
            Type: 'application/x-folder',
            Active: true,
            HashVerified: true
        };
        models.Files.create(folder, function (error, file) {
            if (error) {
                logger.error(S, error);
                if (error.code == 11000) {
                    error.reason = "Folder already exists.";
                    return resolve(file);
                }
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
        models.Files.create(file, function (error, file) {
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


async function getFileWithSameFileHash(Hash) {
    return await models.Files.findOne({
        Hash: Hash,
        HashVerified: true
    });
}


async function makeFileVersionActive(file) {
    file = _.clone(file);
    await models.Files.update({
        UserId: file.UserId,
        Parent: file.Parent,
        Name: file.Name,
        Hash: file.Hash,
        ResourceType: 'file'
    }, { $set: { Active: true } });

    return await models.Files.update({
        UserId: file.UserId,
        Parent: file.Parent,
        Name: file.Name,
        Hash: { $ne: file.Hash },
        ResourceType: 'file'
    }, { $set: { Active: false } });
}


function addToPendingFiles(file) {
    return models.PendFiles.create({
        UserId: file.UserId,
        UploadId: file.UploadId,
        File: file
    });
}

function getPendingFile(UserId, UploadId) {
    return models.PendFiles.findOne({
        UserId: UserId,
        UploadId: UploadId
    });
}

function deletePendingFile(UserId, UploadId) {
    return models.PendFiles.remove({
        UserId: UserId,
        UploadId: UploadId
    });
}


async function completUpload(UserId, UploadId) {
    let file = await getPendingFile(UserId, UploadId);
    await createFile(file.File._doc);
    await makeFileVersionActive({
        UserId: file.userId,
        Parent: file.Parent,
        Name: file.Name,
        Hash: file.Hash
    });
    await deletePendingFile(UserId, UploadId);
    return file;
}


function createSync(params) {
    return models.Sync.create({
        UserId: params.UserId,
        Parent: params.Parent,
        Name: params.Name,
        Event: params.Event
    });
}

function createMultipartUpload(key_name) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: FILE_BUCKET,
            Key: key_name
        };
        S3.createMultipartUpload(params, function (err, data) {
            if (err) {
                return reject(err);
            } else {
                return resolve(data.UploadId);
            }
        });
    });
}


function saveUploadId(key, value) {
    return new Promise((resolve, reject) => {
        r_client1.hmset(key, value, function (error, result) {
            r_client1.expire(key, UPLOAD_EXPIRY);
            return error ? reject(error) : resolve(result);
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
    completUpload,
    createFolders,
    deletePendingFile
};
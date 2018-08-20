let async = window.async;
let SparkMD5 = window.SparkMD5;
let uploadQ;
let partSize = 6000000;
window.fileAdded = function () {
    var oFiles = document.getElementById("uploadInput").files,
        nFiles = oFiles.length;
    for (let nFileId = 0; nFileId < nFiles; nFileId++) {
        uploadQ.push({
            file: oFiles[nFileId],
            start: 0,
            end: partSize,
            partNumber: 1
        }, function (err) {
            if (err) console.log('uploadQ task failed: ', err);
        });
    }
};

function finish_upload(part, callback) {
    let uploadId = part.uploadId;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', `/upload/finish?&uploadId=${uploadId}`, true);

    xhr.onload = function (e) {
        if (e.target.readyState === 4 && e.target.status === 200) {
            console.log('completed', e);
            return callback();
        } else if (e.target.readyState === 4 && e.target.status !== 200) {
            return callback();
        }
    };
    xhr.onerror = function (e) {
        console.log('errored', e);
        return callback(e);
    };
    xhr.onabort = function (e) {
        console.log('aborted', e);
        return callback(e);
    };

    // Listen to the upload progress.
    xhr.upload.onprogress = function (e) {
        console.log((e.loaded / e.total) * 100);
    };

    xhr.send();
}


function upload(part, callback) {
    let content_length = part.content.byteLength;
    if (content_length === 0) return callback();
    let content_md5 = SparkMD5.ArrayBuffer.hash(part.content);
    let partNumber = part.partNumber;
    let uploadId = part.uploadId;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', `/upload?partNumber=${partNumber}&uploadId=${uploadId}`, true);

    xhr.setRequestHeader('Content-MD5', content_md5);
    xhr.onload = function (e) {
        if (e.target.readyState === 4 && e.target.status === 200) {
            console.log('completed', e);
            return callback();
        } else if (e.target.readyState === 4 && e.target.status !== 200) {
            return callback();
        }
    };
    xhr.onerror = function (e) {
        console.log('errored', e);
        return callback(e);
    };
    xhr.onabort = function (e) {
        console.log('aborted', e);
        return callback(e);
    };

    // Listen to the upload progress.
    xhr.upload.onprogress = function (e) {
        console.log((e.loaded / e.total) * 100);
    };

    xhr.send(part.content);
}
function parseJSON(t) {
    try {
        return JSON.parse(t);
    } catch (exception) {
        return t;
    }
}
let userId = 'chalu';
function createFile(task, callback) {
    if (task.uploadId) return callback();
    let _h = userId + '|' + task.file.name + '|' + task.file.size + '|' + task.file.lastModified;
    var enc = new TextEncoder(); // always utf-8
    let fileHash = SparkMD5.ArrayBuffer.hash(enc.encode(_h));
    let payload = {
        "filePath": `/${task.file.name}`,
        "fileHash": fileHash,
        "properties": {},
        "type": task.file.type || 'application/octet-tream',
        "size": task.file.size,
        "lastModified": task.file.lastModified
    };
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/file/create', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function (e) {
        if (e.target.readyState === 4 && e.target.status === 200) {
            console.log('completed', e);
            let JSONresponse = parseJSON(e.target.response);
            task.uploadId = JSONresponse.uploadId;
            task.parts = JSONresponse.parts;
            return callback();
        } else if (e.target.readyState === 4 && e.target.status !== 200) {
            return callback();
        }
    };
    xhr.onerror = function (e) {
        console.log('errored', e);
        return callback();
    };
    xhr.onabort = function (e) {
        console.log('aborted', e);
        return callback();
    };

    xhr.send(JSON.stringify(payload));
}


uploadQ = async.priorityQueue(function (task, callback) {
    sha512(task);
    return;
    let reader = new FileReader();
    reader.onload = function (file) {
        createFile(task, function () {
            if (!task.uploadId) {
                console.log('upload failed');
                return callback('failed');
            }
            upload({
                content: file.target.result,
                uploadId: task.uploadId,
                partNumber: task.partNumber
            }, function () {
                if (task.start > task.file.size) {
                    finish_upload({
                        uploadId: task.uploadId
                    }, function () {
                        console.log('finished');
                    });
                    return;
                }
                task.start = task.start + partSize;
                task.end = task.end + partSize;
                task.partNumber = task.partNumber + 1;

                uploadQ.push(task, function (err) {
                    if (err) console.log('uploadQ task failed: ', err);
                });
                callback();
            });
        });
    };
    let file = task.file.slice(task.start, task.end);
    reader.readAsArrayBuffer(file);
}, 2);


function sha512(task) {
    let reader = new FileReader();
    var sha256 = window.CryptoJS.algo.SHA512.create();
    reader.onload = function (file) {
        console.log(task.start, task.end);
        sha256.update(arrayBufferToWordArray(file.target.result));
        if (task.start < task.file.size) {
            let file1 = task.file.slice(task.start, task.end);
            reader.readAsArrayBuffer(file1);
            task.start = Number(task.end);
            task.end = task.end + partSize;
        } else {
            console.log(sha256.finalize().toString());
        }
    };
    setInterval(() => {
        console.log('mmmmm');
        document.getElementById('gg').innerHTML = Math.random();
    }, 1000);
    let file = task.file.slice(task.start, task.end);
    reader.readAsArrayBuffer(file);
    task.start = Number(task.end);
    task.end = task.end + partSize;
}


function arrayBufferToWordArray(ab) {
    var i8a = new Uint8Array(ab);
    var a = [];
    for (var i = 0; i < i8a.length; i += 4) {
        a.push(i8a[i] << 24 | i8a[i + 1] << 16 | i8a[i + 2] << 8 | i8a[i + 3]);
    }
    return CryptoJS.lib.WordArray.create(a, i8a.length);
}

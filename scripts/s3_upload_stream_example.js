const dotenv = require('dotenv');
// Load environment variables from .env file
dotenv.load();

const config = require("../config");
const fs = require('fs');
const s3Stream = require('s3-upload-stream')(config.aws.s3);
const path = require('path');

// Create the streams
var read = fs.createReadStream(
    path.resolve('~/Desktop/Archive.zip'.replace('~', process.env.HOME)), {
        start: 36700160
    });
var upload = s3Stream.upload({
    "Bucket": "c-loud-bucket",
    "Key": "Archive.zip"
}, {
    UploadId: 'YbBjKU0._D6Qvrq0yAJRVwjiDBJLqnLY4pxQGnau1Iuxk4U3NgsYgNg7R_SpCY5o4.uSZmv.gHqhNNuHeDjL7FL_ydyM5qz4ZvFXYlY07jc-',
    Parts: [
        {
            PartNumber: 1,
            ETag: '"6f16b60cc62f4bb8f62360dc26d6ed1a"',
        },
        {
            PartNumber: 2,
            ETag: '"d93d9f5282b5a09bb849b77cc3c813a6"',
        },
        {
            PartNumber: 3,
            ETag: '"3747cb4e5476aa8dcd5e51babb183481"',
        },
        {
            PartNumber: 4,
            ETag: '"69ab35d23da0a0226ccc26c0875f14ba"',
        },
        {
            PartNumber: 5,
            ETag: '"86c00f75aaf91ddf4e46c05e4b5a9397"',
        },
        {
            PartNumber: 6,
            ETag: '"a3b8a4cee83955844279a9ffd415952a"',
        },
        {
            PartNumber: 7,
            ETag: '"634f9d125c2c341fdc04185c4da67e51"',
        }
    ]
});


// Optional configuration
upload.maxPartSize(1 * 1024 * 1024); // 20 MB
upload.concurrentParts(5);

// Handle errors.
upload.on('error', function(error) {
    console.log(error);
});

/* Handle progress. Example details object:
   { ETag: '"f9ef956c83756a80ad62f54ae5e7d34b"',
     PartNumber: 5,
     receivedSize: 29671068,
     uploadedSize: 29671068 }
*/
upload.on('part', function(details) {
    console.log("Part: ", details);
});

/* Handle upload completion. Example details object:
   { Location: 'https://bucketName.s3.amazonaws.com/filename.ext',
     Bucket: 'bucketName',
     Key: 'filename.ext',
     ETag: '"bf2acbedf84207d696c8da7dbb205b9f-5"' }
*/
upload.on('uploaded', function(details) {
    console.log("Uploaded: ", details);
});

// Pipe the incoming filestream through compression, and up to S3.
read.pipe(upload);
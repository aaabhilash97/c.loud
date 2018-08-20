const dotenv = require('dotenv');
// Load environment variables from .env file
dotenv.load();

const config = require("../config");


var params = {
    Bucket: "c-loud-bucket"
};
config.aws.S3.listMultipartUploads(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
    data.Uploads.forEach(function (u) {
        var params = {
            Bucket: "c-loud-bucket",
            Key: u.Key,
            UploadId: u.UploadId
        };
        config.aws.S3.abortMultipartUpload(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data); // successful response
            /*
            data = {
            }
            */
        });
    });
});
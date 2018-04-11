const dotenv = require('dotenv');
// Load environment variables from .env file
dotenv.load();

const config = require("../config");

var params = {
    "Bucket": "c-loud-bucket",
    "Key": "files/d119c23b-778e-4f33-ae81-193f6c1cd410",
    UploadId: "s_lLzR.2sADDJTIYgsJfzwtoADGQmbIksCsTg6REbv5Z7BhTHSWpUyep6xhiAgc0bEJPy6xllil60lunFbP3em6yX_w29KnEw_t2.ZtxgU7WfHqsotYQEj0Cy8bUUuYz"
};
config.aws.s3.listParts(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data);
});
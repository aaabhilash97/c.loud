const dotenv = require('dotenv');
// Load environment variables from .env file
dotenv.load();

const config = require("../config");


var params = {
    Bucket: "c-loud-bucket"
};
config.aws.s3.listMultipartUploads(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
});
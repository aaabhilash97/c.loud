var fs = require("fs");
var request = require("request");

var options = {
    method: 'POST',
    url: 'http://localhost:3000/uploads',
    headers: {
        'Cache-Control': 'no-cache',
        'content-type': 'multipart/form-data;'
    },
    formData: {
        file: {
            value: fs.createReadStream("/Users/abhilashkm/Desktop/Archive 2.zip"),
            options: {
                filename: 'template-matching-ocr.zip',
                contentType: null
            }
        }
    }
};

request(options, function(error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
});
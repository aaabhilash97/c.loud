var request = require("request");


function upload_part(part_n, file_name) {
    var options = {
        method: 'POST',
        url: 'http://localhost:3005/upload',
        qs: {
            uploadId: 'u_baeb36929896c78c79e7d5fa6478a3e3',
            partNumber: part_n
        },
        headers: {
            'Postman-Token': '3aac4857-a4b6-b2b7-c2c1-56e66f47c512',
            'Cache-Control': 'no-cache',
            'content-md5': '8e2b16dfd174aecba216de2820ac7629'
        }
    };

    request(options);
}

const fs = require('fs');

async function upload(){
    try{
        let f = fs.createWriteStream();
        for(let x=0; x*5120 < file.size; x++){

        }
    }catch(ex){
        //
    }

}
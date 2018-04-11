const async = require('async');
const bytes = require('bytes');
const fs = require('fs');
const md5 = require('md5');
const crypto = require('crypto');
function checksumFile(algorithm, path, start, end) {
    return new Promise((resolve, reject) =>{
        let stream = fs.createReadStream(path, {start: start, end: end});
        let hash = crypto.createHash(algorithm);
        console.log(start, end);
        stream.on('error', err => reject(err));
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

let p ='/Users/abhilashkm/Desktop/Archive.zip';

let block_size = bytes('15MB');
fs.stat(p, function(error, stat){
    if(error) return;
    console.log(stat);
    var i = 0;
    let hash = '';
    async.whilst(
        function() {
            return i < stat.size;
        },
        function(callback) {
            setTimeout(async ()=>{
                let end = i + block_size;
                if(end > stat.size) end = stat.size;
                let _r = await checksumFile('md5', p, i, end)
                i = end;
                console.log(_r);
                hash = hash + _r;
                callback(null, hash);
            })
        },
        function (err, n) {
            let hash = crypto.createHash('md5');
            hash.update(n);
            console.log('aa: ', hash.digest('hex'));
            // 5 seconds have passed, n = 5
        }
    );
});


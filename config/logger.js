const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');
var logDirectory = path.join(process.env.LOG_DIR);
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// ensure log directory exists
var accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: logDirectory
});

module.exports = {
    access: accessLogStream,
    logger: console
};

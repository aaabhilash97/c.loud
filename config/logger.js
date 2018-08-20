const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');
const logDirectory = path.join(process.env.LOG_DIR);
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// ensure log directory exists
const accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: logDirectory
});

module.exports = {
    access: accessLogStream,
    logger: console
};

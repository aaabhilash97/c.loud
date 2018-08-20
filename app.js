process.on('uncaughtException', (err) => {
    console.error('uncaughtException', err);
    process.exit(1);
});

const dotenv = require('dotenv');
// Load environment variables from .env file
dotenv.load();
require('./global');

// Import config
const config = require('./config');

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
const methodOverride = require('method-override');
const expressValidator = require('express-validator');
const helmet = require("helmet");
const app = express();

const routes = require('./routes');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('port', process.env.PORT);
app.use(compression());

const ACCESS_LOG_F = ':req[authorization] - :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
app.use(morgan(ACCESS_LOG_F, { stream: config.logger.access }));


app.use(expressValidator());
app.use(methodOverride('_method'));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(helmet());

app.use(function (req, res, next) {
    req.session_id = "manasasasasasa-dskdks";
    req.user = {
        merchanhtId: "c.loud",
        userId: "chalu",
        domain: "c.loud.com"
    };
    return next();
});

// Route/Page to test upload.
app.get('/upload', function (req, res) {
    return res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});
app.use(routes);


// Production error handler
if (app.get('env') === 'production') {
    app.use(function (err, req, res) {
        console.error(err.stack);
        res.sendStatus(err.status || 500);
    });
}

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
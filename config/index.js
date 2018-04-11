const logger = require("./logger");
const aws = require("./aws");
const redis = require("./redis");

module.exports = {
    logger: logger,
    aws: aws,
    redis: redis
};
const redis = require("redis");

// Client1 for saving [UPLOADID]
const client1 = redis.createClient({
    db: 1
});

module.exports = {
    client1
};
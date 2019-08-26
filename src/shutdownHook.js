/** @format */

const { promisify } = require('util');
const signale = require('signale');
const { redisClient } = require('./config/storage');

module.exports = client => {
    const shutdownHook = async () => {
        await client.destroy();
        await promisify(redisClient.quit).bind(redisClient)();

        signale.complete('Bot destroyed');
    };

    process.once('SIGHUP', shutdownHook);
    process.once('SIGINT', shutdownHook);
    process.once('SIGTERM', shutdownHook);
};

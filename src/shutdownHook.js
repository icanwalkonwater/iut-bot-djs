/** @format */

const signale = require('signale');

module.exports = client => {
    const shutdownHook = async () => {
        await client.destroy();
        signale.complete('Bot destroyed');
    };

    process.on('SIGHUP', shutdownHook);
    process.on('SIGINT', shutdownHook);
    process.on('SIGTERM', shutdownHook);
};

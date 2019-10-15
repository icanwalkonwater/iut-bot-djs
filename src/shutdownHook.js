/** @format */

import { promisify } from 'util';
import signale from 'signale';
import { redisClient } from './config/storage';

export default client => {
    const shutdownHook = async () => {
        await client.destroy();
        await promisify(redisClient.quit).bind(redisClient)();

        signale.complete('Bot destroyed');
    };

    process.once('SIGHUP', shutdownHook);
    process.once('SIGINT', shutdownHook);
    process.once('SIGTERM', shutdownHook);
};

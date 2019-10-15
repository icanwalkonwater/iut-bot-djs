/** @format */

import signale from 'signale';
import * as Discord from 'discord.js';
import shutdownHook from './shutdownHook';
import eventRegister from './eventRegister';

// Init env right away
require('dotenv').config();

// Configure logging
signale.config({
    displayTimestamp: true,
    displayDate: true
});

// Create discord client
const client = new Discord.Client({
    messageCacheLifetime: 600,
    messageSweepInterval: 3600,
    disabledEvents: ['TYPING_START']
});

// Setting up the shutdown hook
shutdownHook(client);

// Register events
eventRegister(client);

// Ready hook
client.once('ready', () => {
    signale.success('Ready !');
});

// Start redis client
require('./config/storage');

// Start bot
const token = process.env.TOKEN || throw Error('No token provided !');

signale.pending('Starting...');
client
    .login(token)
    .then(() => {
        return client.user.setActivity(process.env.COMMAND_PREFIX + 'help', {
            type: 'PLAYING'
        });
    })
    .then(() => {
        signale.complete('Started !');
    });

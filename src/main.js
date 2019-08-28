/** @format */

// Init env right away
require('dotenv').config();

// Configure logging
const signale = require('signale');
signale.config({
    displayTimestamp: true,
    displayDate: true
});

const Discord = require('discord.js');

// Create discord client
const client = new Discord.Client({
    messageCacheLifetime: 600,
    messageSweepInterval: 3600,
    disabledEvents: ['TYPING_START']
});

// Setting up the shutdown hook
require('./shutdownHook')(client);

// Register events
require('./eventRegister')(client);

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

/** @format */

require('dotenv').config();
const signale = require('signale');
const Discord = require('discord.js');

// Create discord client
const client = new Discord.Client({
    messageCacheLifetime: 600,
    messageSweepInterval: 3600,
    disabledEvents: ['TYPING_START']
});

// Setting up the shutdown hook
require('./shutdownHook')(client);

// Register everything
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
client.login(token).then(() => {
    signale.complete('Started !');
});

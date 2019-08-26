/** @format */

const { Command } = require('./Command');
const { createInfoMessage, createErrorMessage } = require('../messageUtils');
const { permissionError } = require('./errors');

class StopCommand extends Command {
    constructor() {
        super(
            ['stop', 'shutdown'],
            'Stop the bot',
            StopCommand.prototype.execute
        );
    }

    execute(msg) {
        if (msg.author.id !== process.env.OWNER_ID) {
            msg.channel.send(createErrorMessage(permissionError));
            return;
        }

        msg.channel.send(createInfoMessage('Shutting down...')).then(() => {
            // Sens signal to self
            process.kill(process.pid, 'SIGINT');
        });
    }
}

module.exports = new StopCommand();

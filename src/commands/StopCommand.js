/** @format */

import { Command } from './Command';
import { createInfoMessage } from '../messageUtils';
import { ownerGuard } from './commandUtils';

class StopCommand extends Command {
    constructor() {
        super(
            ['stop', 'shutdown', 'reboot'],
            'Stop the bot',
            StopCommand.prototype.execute
        );
    }

    execute(msg) {
        if (!ownerGuard(msg)) {
            return;
        }

        msg.channel.send(createInfoMessage('Shutting down...')).then(() => {
            // Sens signal to self
            process.kill(process.pid, 'SIGINT');
        });
    }
}

export default new StopCommand();

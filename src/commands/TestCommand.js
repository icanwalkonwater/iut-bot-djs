/** @format */

const { Command } = require('./Command');
const { group } = require('./commandUtils');
const { createInfoMessage } = require('../messageUtils');

class TestCommand extends Command {
    constructor() {
        super(['test', 't'], 'Test command', TestCommand.prototype.execute);

        this.addExecutorMapping(/get/i, this.getExecutor);
        this.addExecutorMapping(group(/add/, /(\S+)/), this.addExecutor);
        this.addExecutorMapping(
            group(/set/, /(\w+)/, /(\d+)/),
            this.setExecutor
        );
    }

    execute(msg) {
        msg.channel.send(createInfoMessage('No args'));
    }

    getExecutor(msg) {
        msg.channel.send(createInfoMessage('Get'));
    }

    addExecutor(msg, arg) {
        msg.channel.send(createInfoMessage(`Add ${arg}`));
    }

    setExecutor(msg, key, val) {
        msg.channel.send(createInfoMessage(`Set ${key} to ${val}`));
    }
}

module.exports = new TestCommand();

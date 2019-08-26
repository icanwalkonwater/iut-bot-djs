/** @format */

const { Command } = require('./Command');
const { group } = require('./commandProcessor');
const { createInfoMessage } = require('../messageUtils');

class TestCommand extends Command {
    constructor() {
        super(['test', 't'], 'Test command', TestCommand.prototype.execute);

        this.addExecutorMapping(/get/i, TestCommand.prototype.getExecutor);
        this.addExecutorMapping(
            group(/add/, /(\S+)/),
            TestCommand.prototype.addExecutor
        );
        this.addExecutorMapping(
            group(/set/, /(\w+)/, /(\d+)/),
            TestCommand.prototype.setExecutor
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

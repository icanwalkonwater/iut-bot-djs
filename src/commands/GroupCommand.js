/** @format */

const { Command } = require('./Command');
const { createInfoMessageWithTitle } = require('../messageUtils');
const { getGroupIds } = require('../config/groupsManager');

class GroupCommand extends Command {
    constructor() {
        super('group');
        this.addExecutorMapping(/list/i, GroupCommand.prototype.executorList);
    }

    executorList(msg) {
        msg.channel.send(
            createInfoMessageWithTitle('Groups list', getGroupIds().join(','))
        );
    }
}

module.exports = new GroupCommand();

/** @format */

const { group } = require('./commandProcessor');

class TestCommand {
    constructor() {
        this.name = ['test', 't'];
        this.description = 'Test command';

        this.executor = {
            executor: this.execute,
            children: [
                group(/get/i, this.getExecutor),
                group(/add/i, undefined, group(/(\S+)/, this.addExecutor)),
                group(
                    /set/i,
                    undefined,
                    group(/(\w+)/, undefined, group(/(\d+)/, this.setExecutor))
                )
            ]
        };
    }

    execute(msg) {
        msg.reply('No args');
    }

    getExecutor(msg) {
        msg.reply('Get');
    }

    addExecutor(msg, arg) {
        msg.reply(`Add ${arg}`);
    }

    setExecutor(msg, key, val) {
        msg.reply(`Set ${key} to ${val}`);
    }
}

/*
const executeSub = msg => {
    msg.reply('sub1');
};

const executeSub2 = (msg, arg) => {
    msg.reply(`sub2: ${arg}`);
};
const old = {
    name: ['test', 't'],
    description: 'Test command',
    executor: {
        executor: execute,
        children: [
            group(/get/i, executeSub),
            group(/add\s+(\S+)/i, executeSub2),
            group(/set/, undefined, [group(/(\w+) (\d+)/, undefined)])
        ]
    }
};*/

module.exports = new TestCommand();

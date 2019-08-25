/** @format */

const signale = require('signale');
const {
    RouteMismatchError,
    CommandNotFoundError
} = require('./commands/errors');
const commandProcessor = require('./commands/commandProcessor');
const commandRegistry = require('./commands/commandRegistry');

// ***** Side effect *****
// Register commands
for (let command of commandRegistry) {
    commandProcessor.register(command);
}

module.exports = client => {
    client.on('message', msg => {
        // Ignore bot message, including self
        if (msg.author.bot) {
            return;
        }

        // Check if command

        // TODO: put into config
        const commandPrefix = '!';
        if (msg.content.startsWith(commandPrefix)) {
            const raw = msg.content.slice(commandPrefix.length);

            try {
                // Process command
                const { executor, args } = commandProcessor.parse(msg, raw);
                // Execute the command
                executor(...args);
            } catch (e) {
                if (
                    e instanceof CommandNotFoundError ||
                    e instanceof RouteMismatchError
                ) {
                    msg.reply(`An error occured: ${e.message || e}`);
                }

                throw e;
            }
        }
    });
};

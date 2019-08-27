/** @format */

const signale = require('signale');
const {
    RouteMismatchError,
    CommandNotFoundError
} = require('./commands/errors');
const { createErrorMessage } = require('./messageUtils');
const commandProcessor = require('./commands/commandProcessor');
const commandRegistry = require('./commands/commandRegistry');
const welcomeForm = require('./forms/welcomeForm');

// ***** Side effect *****
// Register commands
for (let command of commandRegistry) {
    commandProcessor.register(command);
}

module.exports = client => {
    // Command listener
    client.on('message', msg => {
        // Ignore bot message, including self
        if (msg.author.bot) return;

        if (msg.content.startsWith(process.env.COMMAND_PREFIX)) {
            const raw = msg.content.slice(process.env.COMMAND_PREFIX.length);

            try {
                // Process command
                const { executor, args, options } = commandProcessor.parse(
                    msg,
                    raw
                );

                // Execute the command
                signale.info(
                    `Command (${msg.author.tag} ${msg.author.id}): ${msg.content}`
                );

                const res = executor(msg, ...args, options);
                if (res instanceof Promise) {
                    res.catch(e => {
                        signale.error(e);
                        msg.channel.send(
                            createErrorMessage(
                                "Something's fucky, please contact an admin"
                            )
                        );
                    });
                }
            } catch (e) {
                if (e instanceof CommandNotFoundError) {
                    // Silently ignore
                    return;
                } else if (e instanceof RouteMismatchError) {
                    msg.channel.send(
                        createErrorMessage(
                            'No route found, check your arguments again'
                        )
                    );
                    return;
                }

                // Real error, log it
                signale.error(e);
            }
        }
    });

    client.on('guildMemberAdd', async member => {
        if (member.guild.id !== process.env.GUILD_ID) return;

        // Trigger welcome form
        await welcomeForm(
            member.user,
            member.dmChannel || (await member.createDM())
        );
    });
};

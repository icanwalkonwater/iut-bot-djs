/** @format */

import signale from 'signale';
import { CommandNotFoundError, RouteMismatchError } from './commands/errors';
import { createErrorMessage } from './messageUtils';
import commandProcessor from './commands/commandProcessor';
import commandRegistry from './commands/commandRegistry';
import { fetchUserSettings } from './config/storage';
import welcomeForm from './forms/welcomeForm';

// ***** Side effect *****
// Register commands
for (let command of commandRegistry) {
    commandProcessor.register(command);
}

export default client => {
    // Command listener
    client.on('message', msg => {
        // Ignore messages from other guilds
        if (msg?.guild?.id !== process.env.GUILD_ID) return;

        // Ignore bot message, including self
        if (msg.author.bot) return;

        // If is a command-like message
        if (msg.content.startsWith(process.env.COMMAND_PREFIX)) {
            const raw = msg.content.slice(process.env.COMMAND_PREFIX.length);
            return commandHandler(msg, raw);
        }
    });

    // Fun
    client.on('message', msg => {
        if (/barre verticale stp.*/i.test(msg.content)) {
            msg.channel.send(`<@${msg.author.id}>, |`);
        }
    });

    // Welcome form
    client.on('guildMemberAdd', async member => {
        if (member.guild.id !== process.env.GUILD_ID) return;

        // Check if already exists in the DB
        if (await fetchUserSettings(member.id)) return;

        // Trigger welcome form
        await welcomeForm(
            member.user,
            member.dmChannel || (await member.createDM())
        );
    });
};

const commandHandler = (msg, raw) => {
    try {
        // Process command
        const { executor, args, options } = commandProcessor.parse(msg, raw);

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
            signale.debug(`No command found: ${msg.content}`);
            return;
        } else if (e instanceof RouteMismatchError) {
            msg.channel.send(
                createErrorMessage('No route found, check your arguments again')
            );
            return;
        }

        // Real error, log it
        signale.error(e);
    }
};

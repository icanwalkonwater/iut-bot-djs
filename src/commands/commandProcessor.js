/** @format */

const signale = require('signale');
const { RouteMismatchError, CommandNotFoundError } = require('./errors');

const commandMap = new Map();

/**
 * Register a command to the internal registry.
 *
 * @param command - The command to register
 */
const register = command => {
    // Register every aliases of the command
    if (Array.isArray(command.name)) {
        command.name.forEach(n => commandMap.set(n, command));
    } else {
        commandMap.set(command.name, command);
    }
};

/**
 * Parse a raw message into an executor and a list of parsed arguments.
 * Return false if no executor can be match anywhere.
 *
 * @param msg - The message event
 * @param raw - The starting message
 * @return {{args: *, executor: *, options: *}}
 * @throws CommandNotFoundError When the command can't be found in the registry.
 * @throws RouteMismatchError If the message can't be associated with any route.
 */
const parse = (msg, raw) => {
    // Split at the first whitespace
    const commandName = raw.split(/\s/, 1)[0].toLowerCase();

    // Check and retrieve command
    const command = commandMap.get(commandName);
    if (!command) {
        throw new CommandNotFoundError();
    }

    // Remove command name
    raw = raw.slice(commandName.length).trimLeft();

    // Collect options
    // One character options: short options
    // Other ones: long options
    const regex = /(?:\s|^)-(?:(\w)|-(\w{2,}))(?:=(\w+))?/g;
    const collector = function*() {
        let match;
        while ((match = regex.exec(raw)) !== null) {
            // Group 1 is short option
            // Group 2 is long option
            // Group 3 is argument
            const optName = match[1] || match[2];

            if (match[3]) {
                yield { [optName]: match[3] };
            } else {
                yield { [optName]: true };
            }
        }
    };

    let options = [...collector()];
    if (options.length) {
        options.reduce((prev, next) => {
            return { ...prev, ...next };
        });
    }

    // And strip them
    raw = raw.replace(regex, '').trim();

    // No args
    if (!raw.length) {
        if (typeof command.rootExecutor === 'function') {
            return { executor: command.rootExecutor, args: [], options };
        } else {
            throw new RouteMismatchError(
                'No root executor found for this command !'
            );
        }
    }

    // Has args
    // Walk through routes until a match is found
    for (const [regex, executor] of command.executorMap) {
        const match = regex.exec(raw);
        if (match !== null) {
            // It's a match
            return { executor, args: match.slice(1), options };
        }
    }

    // No matches
    throw new RouteMismatchError('No route found for these arguments !');
};

module.exports = {
    register,
    parse
};

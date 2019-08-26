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
 * Utility method to group multiple regex separated by any number of whitespaces.
 * This method exist to avoid redundancy.
 *
 * @param patterns - The patterns to concatenate
 */
const group = (...patterns) => {
    const combined = patterns.map(p => p.source).join(groupSeparator);
    return new RegExp(combined, 'i');
};
const groupSeparator = /\s+/.source;

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
    const commandName = raw.split(/\s/, 1)[0];

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

// Internal function
const walkChildren = (msg, raw, executor) => {
    let regex = executor.test;
    // Match only from the start of the string
    regex = new RegExp(`^${regex.source}`);

    const match = regex.exec(raw);

    if (!match) {
        // No match, continue
        return false;
    }

    // It's a match, collect eventual dynamic args
    const args = match.slice(1);

    // Cut the matched part
    raw = raw.slice(match[0].length).trimLeft();

    // If there are children 'routes'
    if (Array.isArray(executor.children)) {
        // Recurse through each one
        for (let child of executor.children) {
            const res = walkChildren(msg, raw, child);

            // If the walking revealed a match, stop there
            if (res !== false) {
                // Append already matched arguments
                res.args = [...args, res.args];
                return res;
            }
        }
    }

    // No child routes or no match in the child routes
    // Fallback on the local executor
    if (executor.executor) {
        return { executor, args };
    } else {
        return false;
    }
};

module.exports = {
    register,
    group,
    parse
};

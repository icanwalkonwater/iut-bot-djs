/** @format */

const { RouteMismatchError, CommandNotFoundError } = require('./errors');

const commandMap = new Map();

/**
 * Register a command to the internal registry.
 *
 * @param command - The command to register
 */
const register = command => {
    if (Array.isArray(command.name)) {
        command.name.forEach(n => commandMap.set(n, command));
    } else {
        commandMap.set(command.name, command);
    }
};

/**
 * Utility method to generate complex sub command paths.
 * Can be chained.
 *
 * @param regex - The grammar of the command section
 * @param executor - The executor associated with this path
 * @param children - The child groups, can be dynamically created by chaning group() functions.
 */
const group = (regex, executor, children = []) => {
    // Create the basic props
    const groupCreator = (r, e, c) => ({
        test: r,
        executor: e,
        children: c
    });

    // Allow easy to use command grouping
    const recurser = (r, e, c = []) => {
        const subGroup = groupCreator(r, e, c);
        subGroup.group = recurser.bind(subGroup);

        console.log(this.constructor);
        this.children.push(subGroup);
        return subGroup;
    };

    const rootGroup = groupCreator(regex, executor, children);
    rootGroup.group = recurser.bind(rootGroup);
    return rootGroup;
};

/**
 * Parse a raw message into an executor and a list of parsed arguments.
 * Return false if no executor can be match anywhere.
 *
 * @param msg - The message event
 * @param raw - The starting message
 * @returns {boolean|{args: Array, executor: Function}}
 */
const parse = (msg, raw) => {
    const commandName = raw.split(' ', 1)[0];

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
    const regex = /\s-(?:(\w)|-(\w{2,}))/g;
    const options = [
        ...(function*() {
            let match;
            while ((match = regex.exec(raw)) !== null) {
                yield match[1];
            }
        })()
    ].map(o => o.toLowerCase());

    // And strip them
    raw = raw.replace(regex, '').trim();

    // If no args
    if (!raw.length) {
        const defaultExecutor = command.executor.executor;

        if (typeof defaultExecutor === 'function') {
            defaultExecutor(msg);
        } else {
            throw new RouteMismatchError(
                'This command likely need some arguments'
            );
        }
    } else if (Array.isArray(command.executor.children)) {
        for (let child of command.executor.children) {
            const res = walkChildren(msg, raw, child);

            // If res is successful, stop there
            if (res !== false) {
                return res;
            }
        }

        // No matches
        throw new RouteMismatchError(
            'No route can be found for the current argument set'
        );
    }
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

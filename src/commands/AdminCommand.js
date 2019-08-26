/** @format */

const { inspect } = require('util');
const { Command } = require('./Command');
const { group } = require('./commandProcessor');
const {
    createErrorMessage,
    createDetailedErrorMessage,
    createInfoMessage,
    createInfoMessageWithTitle,
    createSuccessMessageWithTitle
} = require('../messageUtils');
const { permissionError } = require('./errors');
const { redisClient } = require('../config/storage');

class AdminCommand extends Command {
    constructor() {
        super(['admin', 'sudo'], 'Admin command');

        // Arbitrary redis command (with args)
        this.addExecutorMapping(
            group(/redis/, /([a-z]+)/, /(.+)/),
            this.executorRedis
        );

        // Arbitrary redis command (no args)
        this.addExecutorMapping(group(/redis/, /([a-z]+)/), (msg, method) =>
            this.executorRedis(msg, method)
        );

        // Arbitrary JS eval with context
        this.addExecutorMapping(group(/eval/, /(.+)/), this.executorEvalJs);
    }

    guard(msg) {
        if (msg.author.id === process.env.OWNER_ID) {
            return true;
        } else {
            msg.channel.send(createErrorMessage(permissionError));
            return false;
        }
    }

    executorRedis(msg, method, args) {
        // Only the owner can use this for obvious reason
        if (!this.guard(msg)) return;

        // Sanitize a bit
        method = method.toUpperCase();
        if (args) args = args.split(/\s+/);

        if (typeof redisClient[method] === 'function') {
            let redisCommand = method;
            if (args) redisCommand += ' ' + args.join(' ');

            // Callback
            const callback = (err, res) => {
                if (err) {
                    msg.channel.send(
                        createDetailedErrorMessage(
                            'Command failed',
                            `**Command**: \`${redisCommand}\`
                             **Error**: ${err.message || err}`
                        )
                    );
                } else {
                    if (typeof res === 'object') {
                        res = JSON.stringify(res, undefined, 2);
                    }

                    msg.channel.send(
                        createSuccessMessageWithTitle(
                            'Command succeeded',
                            `**Command**: \`${redisCommand}\`
                             **Result**: \`\`\`json\n${res}\`\`\``
                        )
                    );
                }
            };

            // Execute the command (with or without args)
            if (args) {
                redisClient[method](args, callback);
            } else {
                redisClient[method](callback);
            }
        } else {
            msg.channel.send(
                createErrorMessage("This redis command doesn't exist !")
            );
        }
    }

    executorEvalJs(msg, string, options) {
        // Only the owner can use this for obvious reason
        if (!this.guard(msg)) return;

        const fn = new Function('client', 'msg', string);

        let res;
        try {
            res = fn(msg.client, msg);
        } catch (e) {
            res = e;
        }

        if (typeof res === 'object') {
            // Compute depth
            let depth = options.depth;

            // Default to 0
            if (depth === true || !depth) {
                depth = 0;
            }

            res = inspect(res, {
                depth: +depth,
                getters: true,
                showHidden: true
            });
        }

        // Truncate output to 1500 characters
        if (res?.length > 1500) {
            const len = res.length;
            res = res.slice(0, 1500);
            res += `\n${len - 1500} more characters...`;
        }

        msg.channel.send(
            createInfoMessageWithTitle(
                'Eval',
                `**Code**: \`\`\`js\n${string}\`\`\`
                 **Result**: \`\`\`js\n${res}\`\`\``
            )
        );
    }
}

module.exports = new AdminCommand();

/** @format */

const { inspect } = require('util');
const { Command } = require('./Command');
const { group, userMentionToIdPattern, ownerGuard } = require('./commandUtils');
const {
    createErrorMessage,
    createDetailedErrorMessage,
    createInfoMessageWithTitle,
    createSuccessMessage,
    createSuccessMessageWithTitle
} = require('../messageUtils');
const { redisClient } = require('../config/storage');
const welcomeForm = require('../forms/welcomeForm');

class AdminCommand extends Command {
    constructor() {
        super(['admin', 'sudo'], 'Admin command');

        // Resend welcome form
        this.addExecutorMapping(
            group(/resend-welcome/, userMentionToIdPattern),
            ownerGuard,
            this.executorResendWelcomeForm
        );
        this.addExecutorMapping(/resend-welcome/i, ownerGuard, (msg, opts) =>
            this.executorResendWelcomeForm(msg, msg.author.id, opts)
        );

        // Arbitrary redis command (with args)
        this.addExecutorMapping(
            group(/redis/, /([a-z]+)/, /(.+)/),
            ownerGuard,
            this.executorRedis
        );

        // Arbitrary redis command (no args)
        this.addExecutorMapping(
            group(/redis/, /([a-z]+)/),
            ownerGuard,
            (msg, method) => this.executorRedis(msg, method)
        );

        // Arbitrary JS eval with context
        this.addExecutorMapping(
            group(/eval/, /(.+)/),
            ownerGuard,
            this.executorEvalJs
        );
    }

    async executorResendWelcomeForm(msg, userId) {
        const user = await msg.client.fetchUser(userId);
        const dmChannel = user.dmChannel || (await user.createDM());

        await msg.channel.send(createSuccessMessage('Form triggered'));
        await welcomeForm(dmChannel.recipient, dmChannel);
    }

    executorRedis(msg, method, args) {
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

    executorEvalJs(msg, code, options) {
        let res;
        try {
            res = new Function('client', 'msg', code)(msg.client, msg);
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
                `**Code**: \`\`\`js\n${code}\`\`\`
                 **Result**: \`\`\`js\n${res}\`\`\``
            )
        );
    }
}

module.exports = new AdminCommand();

/** @format */

import { inspect } from 'util';
import { Command } from './Command';
import {
    adminRoleGuard,
    broadcastGuard,
    group,
    messageLinkPattern,
    ownerGuard,
    userMentionToIdPattern
} from './commandUtils';
import {
    createDetailedErrorMessage,
    createErrorMessage,
    createInfoMessageWithTitle,
    createSuccessMessage,
    createSuccessMessageWithTitle
} from '../messageUtils';
import { fetchAllUserSettings, redisClient } from '../config/storage';
import welcomeForm from '../forms/welcomeForm';

class AdminCommand extends Command {
    constructor() {
        super(['admin', 'sudo'], 'Admin command');

        // Broadcast a message to every user that agreed to by MP
        this.addExecutorMapping(
            group(/broadcast/, messageLinkPattern),
            broadcastGuard,
            this.broadcast
        );

        // Resend welcome form
        this.addExecutorMapping(
            group(/resend-welcome/, userMentionToIdPattern),
            adminRoleGuard,
            this.executorResendWelcomeForm
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

    async broadcast(msg, channelId, messageId) {
        const messagePromise = msg.client.channels
            .get(channelId)
            ?.fetchMessage(messageId);

        if (!messagePromise) {
            return msg.channel.send(
                createErrorMessage('Ce channel ne semble pas exister')
            );
        }

        try {
            // Fetch the message and the user settings
            const [message, allSettings] = await Promise.all([
                messagePromise,
                fetchAllUserSettings()
            ]);

            // Filter the targeted users
            const sendTo = allSettings
                .filter(settings => settings.allowPm === 'true')
                .map(({ user }) => user);

            // Broadcast the message
            const sentMessages = await Promise.all(
                sendTo.map(async id => {
                    const realUser = await msg.client.fetchUser(id);
                    const dmChannel =
                        realUser.dmChannel || (await realUser.createDM());

                    return dmChannel.send(message.content);
                })
            );

            return msg.channel.send(
                createSuccessMessage(
                    `Broadcasted to ${sentMessages.length} users`
                )
            );
        } catch (e) {
            return msg.channel.send(
                createErrorMessage("Ce message n'éxiste pas")
            );
        }
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

export default new AdminCommand();

/** @format */

const { createErrorMessage } = require('../messageUtils');
const { permissionError } = require('./errors');

/**
 * Utility method to group multiple regex separated by any number of whitespaces.
 * This method exist to avoid redundancy.
 *
 * @param patterns {RegExp}
 */
const group = (...patterns) => {
    const combined = patterns.map(p => p.source).join(groupSeparator);
    return new RegExp(combined, 'i');
};
const groupSeparator = /\s+/.source;

// Useful argument regex

const userMentionToIdPattern = /<@!?(\d+)>/i;
const channelMentionToIdPattern = /<#(\d+)>/;
const roleMentionToIdPattern = /<@&(\d+)>/;
const booleanPattern = /(true|false|1|0|on|off)/i;
const messageLinkPattern = /https:\/\/(?:canary\.)?discordapp\.com\/channels\/[0-9]+\/([0-9+]+)\/([0-9]+)/;

// Guards

const reject = msg => {
    msg.channel.send(createErrorMessage(permissionError));
};

// Guard factories
const makeRoleGuard = roleId => {
    return msg => {
        // Must be in guild
        if (!msg.guild) return false;
        else if (msg.member.roles.has(roleId)) {
            return true;
        } else {
            reject(msg);
            return false;
        }
    };
};

const makePermissionGuard = rawPerm => {
    return msg => {
        // Must be in guild
        if (!msg.guild) return false;
        else if (msg.member.permissions.has(rawPerm)) {
            return true;
        } else {
            reject(msg);
            return false;
        }
    };
};

const ownerGuard = msg => {
    if (msg.author.id === process.env.OWNER_ID) {
        return true;
    } else {
        reject(msg);
        return false;
    }
};

const adminRoleGuard = makeRoleGuard(process.env.ADMIN_ROLE_ID);

const broadcastAllowedIds = !!process.env.BROADCAST_ALLOWED_IDS
    ? process.env.BROADCAST_ALLOWED_IDS.split(',')
    : [];
const broadcastGuard = msg => {
    if (broadcastAllowedIds.includes(msg.author.id)) {
        return true;
    } else {
        reject(msg);
        return false;
    }
};

module.exports = {
    group,

    userMentionToIdPattern,
    channelMentionToIdPattern,
    roleMentionToIdPattern,
    booleanPattern,
    messageLinkPattern,

    ownerGuard,
    broadcastGuard,
    adminRoleGuard,
    makeRoleGuard,
    makePermissionGuard
};

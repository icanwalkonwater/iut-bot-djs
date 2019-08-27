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

// Guards

const reject = msg => {
    msg.channel.send(createErrorMessage(permissionError));
};

const ownerGuard = msg => {
    if (msg.author.id === process.env.OWNER_ID) {
        return true;
    } else {
        reject(msg);
        return false;
    }
};

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

module.exports = {
    group,

    userMentionToIdPattern,
    channelMentionToIdPattern,
    roleMentionToIdPattern,
    booleanPattern,

    ownerGuard,
    makeRoleGuard,
    makePermissionGuard
};

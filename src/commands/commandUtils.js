/** @format */

import { createErrorMessage } from '../messageUtils';
import { permissionError } from './errors';

/**
 * Utility method to group multiple regex separated by any number of whitespaces.
 * This method exist to avoid redundancy.
 *
 * @param patterns {RegExp}
 */
export const group = (...patterns) => {
    const combined = patterns.map(p => p.source).join(groupSeparator);
    return new RegExp(combined, 'i');
};
const groupSeparator = /\s+/.source;

// Useful argument regex

export const userMentionToIdPattern = /<@!?(\d+)>/i;
export const channelMentionToIdPattern = /<#(\d+)>/;
export const roleMentionToIdPattern = /<@&(\d+)>/;
export const booleanPattern = /(true|false|1|0|on|off)/i;
export const messageLinkPattern = /https:\/\/(?:canary\.)?discordapp\.com\/channels\/[0-9]+\/([0-9+]+)\/([0-9]+)/;

// Guards

const reject = msg => {
    msg.channel.send(createErrorMessage(permissionError));
};

// Guard factories
export const makeRoleGuard = roleId => {
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

export const makePermissionGuard = rawPerm => {
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

export const ownerGuard = msg => {
    if (msg.author.id === process.env.OWNER_ID) {
        return true;
    } else {
        reject(msg);
        return false;
    }
};

export const adminRoleGuard = makeRoleGuard(process.env.ADMIN_ROLE_ID);

const broadcastAllowedIds = !!process.env.BROADCAST_ALLOWED_IDS
    ? process.env.BROADCAST_ALLOWED_IDS.split(',')
    : [];

export const broadcastGuard = msg => {
    if (broadcastAllowedIds.includes(msg.author.id)) {
        return true;
    } else {
        reject(msg);
        return false;
    }
};

/** @format */

import { createInfoMessage } from '../messageUtils';

// Setup groups

const groups = process.env.GROUPS.split(',').map(g => g.toUpperCase());
const groupsMap = new Map();

if (process.env.GROUPS) {
    groups.forEach(id => {
        const [channelId, roleId] = process.env[`GROUPS_${id}`].split(',');
        groupsMap.set(id, { channelId, roleId });
    });
}

// Functions

export const getGroupIds = () => {
    return groups;
};

// Reverse map (with cache)
let groupIds = undefined;

const getGroupRoleIds = () => {
    if (groupIds === undefined) {
        groupIds = Array.from(groupsMap.values()).map(({ roleId }) => roleId);
    }

    return groupIds;
};

export const joinGroup = async (user, groupId) => {
    // Sanitize
    groupId = groupId.toUpperCase();
    if (!groups.includes(groupId)) {
        return false;
    }

    const member = await user.client.guilds
        .get(process.env.GUILD_ID)
        .fetchMember(user);

    // Check if user already have a group role, in that case, abort
    if (member.roles.some((role, id) => getGroupIds().includes(id))) {
        throw new Error('You already have a group role !');
    }

    // Trigger discord-side logic
    return await joinDiscordHook(member, groupId);
};

const joinDiscordHook = async (member, groupId) => {
    const client = member.client;
    const { channelId, roleId } = groupsMap.get(groupId);

    const channel = client.channels.get(channelId);

    // Apply to discord
    return await Promise.all([
        member.addRole(roleId),
        channel.send(
            createInfoMessage(
                `${member.displayName} viens de rejoindre ce groupe !`
            )
        )
    ]);
};

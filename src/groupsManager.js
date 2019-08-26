/** @format */

const { createInfoMessage } = require('./messageUtils');

const groups = process.env.GROUPS.split(',');
const groupsMap = new Map();

groups.forEach(id => {
    const [channelId, roleId] = process.env[`GROUPS_${id}`].split(',');
    groupsMap.set(id, { channelId, roleId });
});

const joinHook = async (member, groupId) => {
    const client = member.client;
    const { channelId, roleId } = groupsMap.get(groupId);

    const channel = client.channels?.[channelId];

    // Apply to discord
    await Promise.all([
        member.addRole(roleId),
        channel?.send(
            createInfoMessage(`${member.displayName} just joined this group !`)
        )
    ]);
};

const getGroupIds = () => {
    return groups;
};

let groupIds = undefined;
const getGroupRoleIds = () => {
    if (groupIds === undefined) {
        groupIds = Array.from(groupsMap.values()).map(({ roleId }) => roleId);
    }

    return groupIds;
};

const joinGroup = async (user, groupId) => {
    // Sanitize
    if (!groups.includes(groupId)) {
        return false;
    }

    const member = await user.client.guilds[process.env.GUILD_ID].fetchMember(
        user
    );

    // Check if user already have a group role, in that case, abort
    if (member.roles.some((role, id) => getGroupIds().includes(id))) {
        throw new Error('You already have a group role !');
    }

    // Trigger discord-side logic
    await joinHook(member, groupId);
};

module.exports = {
    getGroupIds,
    joinGroup
};

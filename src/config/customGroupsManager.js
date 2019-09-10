/** @format */

const {
    commitNewGroup,
    fetchGroup,
    deleteGroup,
    commitGroupSettings,
    addGroupMembers,
    removeGroupMembers
} = require('./storage');

const neededPermissions = [
    'VIEW_CHANNEL',
    'SEND_MESSAGES',
    'MANAGE_MESSAGES',
    'MENTION_EVERYONE',
    'CONNECT'
];

const createGroup = async (client, name, ownerId, memberIds) => {
    // Create group entry to generate id
    const id = await commitNewGroup({ name: name, owner: ownerId }, memberIds);

    // Create discord category
    const guild = client.guilds.get(process.env.GUILD_ID);
    const { id: category } = await createDiscordHook(
        guild,
        id,
        name,
        memberIds
    );

    // Commit new settings
    await commitGroupSettings(id, { category });

    // Return the id of the newly created group
    return id;
};

const eraseGroup = async (client, id) => {
    const { settings } = await fetchGroup(id);
    if (!settings) throw new Error("Group doesn't exists");

    const { category: categoryId } = settings;
    const category = client.channels.get(categoryId);

    // Delete child channels
    await Promise.all(category.children.map(channel => channel.delete()));
    // Delete category
    await category.delete();

    // Delete from DB
    await deleteGroup(id);
};

const addMembers = async (client, id, memberIds) => {
    const { settings } = await fetchGroup(id);
    if (!settings) throw new Error("Group doesn't exists");

    const { category: categoryId } = settings;
    const category = client.channels.get(categoryId);

    // Craft permissions
    const permissionOverwriteOptions = {};
    neededPermissions.forEach(p => {
        permissionOverwriteOptions[p] = true;
    });

    // Overwrite permissions for these members
    if (!Array.isArray(memberIds)) memberIds = [memberIds];
    await Promise.all(
        memberIds.map(memberId =>
            category.overwritePermissions(memberId, permissionOverwriteOptions)
        )
    );

    // Commit them to db
    await addGroupMembers(id, memberIds);
};

// Almost a copy-paste from the addMembers()
const removeMembers = async (client, id, memberIds) => {
    const { settings } = await fetchGroup(id);
    if (!settings) throw new Error("Group doesn't exists");

    const { categoryId } = settings;
    const category = client.channels.get(categoryId);

    // Delete perm overwrites
    if (!Array.isArray(memberIds)) memberIds = [memberIds];
    await Promise.all(
        memberIds.map(memberId =>
            category.permissionOverwrites.get(memberId).delete()
        )
    );

    // Commit them to db
    await removeGroupMembers(id, memberIds);
};

const transferOwnership = async (client, id, newOwnerId) => {
    const { settings, members } = await fetchGroup(id);
    if (!settings) throw new Error("Group doesn't exists");

    settings.owner = newOwnerId;

    if (!members.includes(newOwnerId)) {
        await addMembers(client, id, newOwnerId);
    }

    await commitGroupSettings(id, settings);
};

const isGroupOwner = async (id, userId) => {
    const { settings } = await fetchGroup(id);
    if (!settings) throw new Error("Group doesn't exists");

    return settings.owner === userId;
};

const createDiscordHook = async (guild, id, name, memberIds) => {
    // Create category
    // Deny permissions for @everyone
    // Grant them for the members
    const category = await guild.createChannel(`Groupe #${id} - ${name}`, {
        type: 'category',
        permissionOverwrites: [
            {
                id: guild.defaultRole.id,
                deny: neededPermissions
            },
            ...memberIds.map(m => ({
                id: m,
                allow: neededPermissions
            }))
        ]
    });

    // Create a text channel and a voice channel by default
    await guild.createChannel('général', { type: 'text', parent: category });
    await guild.createChannel('Vocal', { type: 'voice', parent: category });

    return category;
};

module.exports = {
    createGroup,
    eraseGroup,
    addMembers,
    removeMembers,
    transferOwnership,
    isGroupOwner
};

/** @format */

const { newForm } = require('./form');
const { createGroup } = require('../config/customGroupsManager');

const groupCreationForm = newForm(
    'Création de groupe',
    [
        {
            question: `
                Comment voulez-vous nommez votre groupe ?
            `,
            pattern: /(.+)/,
            error: "Ce nom n'est pas valide !"
        },
        {
            question: `
                Qui voulez-vous inviter dans votre groupe ?
                Mentionnez tous ceux que vous voulez inviter.
            `,
            pattern: /^(?:\s*(?:<@!?\d+>)\s*)+$/,
            error: 'Vous devez utilisez uniquement des mentions !',
            mapper: m => {
                const mentions = new Set();

                const regex = /<@!?(\d+)>/g;
                let match;
                while ((match = regex.exec(m)) !== null) {
                    mentions.add(match[1]);
                }

                return mentions;
            }
        }
    ],
    ([name, memberIds]) => ({ name, memberIds })
);

const groupCreationFormHandler = async (user, channel) => {
    const { name, memberIds } = await groupCreationForm(user, channel);

    // Add the owner to the ids
    memberIds.add(user.id);

    // Create the group
    return await createGroup(user.client, name, user.id, memberIds);
};

module.exports = groupCreationFormHandler;

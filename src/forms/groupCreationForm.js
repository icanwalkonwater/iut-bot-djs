/** @format */

const signale = require('signale');
const { createWarningMessage } = require('../messageUtils');
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
                
                *Tips: Mentionnez vous vous même pour n'inviter personne*
            `,
            pattern: /^(?:\s*(?:<@!?\d+>)\s*)+$/,
            error: 'Vous devez utilisez uniquement des mentions !',
            mapper: m => {
                // Use a set to not bother about duplicates
                const mentions = new Set();

                const regex = /<@!?(\d+)>/g;
                let match;
                while ((match = regex.exec(m)) !== null) {
                    mentions.add(match[1]);
                }

                // Return as an array for convenience
                return Array.from(mentions);
            }
        }
    ],
    ([name, memberIds]) => ({ name, memberIds })
);

const groupCreationFormHandler = async (user, channel) => {
    try {
        const { name, memberIds } = await groupCreationForm(user, channel);

        // Add the owner to the ids
        // Note: we don't care if there is a duplicate, it wil be gone when persisted
        memberIds.push(user.id);

        // Create the group
        return await createGroup(user.client, name, user.id, memberIds);
    } catch (e) {
        channel.send(
            createWarningMessage(
                'Form failed. This can be due to inactivity or an error occurred.'
            )
        );
        signale.warn(
            `Group creation form failed (${user.id} / #${channel.id})`
        );
        signale.warn(e);
    }
};

module.exports = groupCreationFormHandler;

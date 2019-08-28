/** @format */

const signale = require('signale');
const { getGroupIds, joinGroup } = require('../config/groupsManager');
const { commitUserSettings } = require('../config/storage');
const {
    createSuccessMessage,
    createWarningMessage
} = require('../messageUtils');
const { newForm } = require('./form');

const welcomeForm = newForm(
    'Formulaire de bienvenue',
    [
        {
            question: `
                **Bienvenue sur le discord de ta promo !**
                
                Ce petit questionnaire te permettra de rejoindre ton groupe sur le discord.
                **Aucune des réponses n'est définitive** (à part le choix du groupe).
                
                Mais tout d'abord: Comment t'appelle tu ? *(ne sera pas stocké)*
            `,
            pattern: /^[^0-9]+$/,
            error:
                'Ca ne ressemble pas à un nom, pourquoi tu aurai des chiffres dans ton nom ?'
        },
        {
            question: `
                Dans quel groupe est-tu ?
                Ex: \`C1\`
            `,
            pattern: new RegExp(`^(?:${getGroupIds().join('|')})$`, 'i'),
            error: 'Ca ne ressemble pas à un nom de groupe, réessaie.',
            mapper: m => m.toLowerCase()
        },
        {
            question: `
                Est-ce que tu souhaite recevoir les annonces du BDE (uniquement) par MP ?
                
                Les annonces concernent les informations sur les soirées ainsi que les annonces importantes.
                (Pas de spam ni de pub, promis !)
                
                *Tu pourra toujours modifier ton choix plus tard.*
            `,
            pattern: /^(?:o(?:ui)?|n(?:on)?)$/i,
            error: 'Répond par `oui` ou `non`.',
            mapper: m => m.startsWith('o')
        }
    ],
    ([name, group, allowMp]) => ({ name, group, allowMp })
);

const welcomeFormHandler = async (user, channel) => {
    try {
        const { name, group, ...settings } = await welcomeForm(user, channel);

        const guild = user.client.guilds.get(process.env.GUILD_ID);
        const member = await guild.fetchMember(user);

        // Rename
        await member.setNickname(name);

        // Set group
        if (!(await joinGroup(user, group))) {
            throw new Error("Group id doesn't exists");
        }

        // Save settings
        await commitUserSettings(user.id, settings);

        channel.send(
            createSuccessMessage(
                'Merci ! Vos réponses ont bien été prises en compte !'
            )
        );
    } catch (e) {
        channel.send(
            createWarningMessage(
                'Form failed. This can be due to inactivity or an error occurred.'
            )
        );
        signale.warn(`Welcome form failed (${user.id} / #${channel.id})`);
        signale.warn(e);
    }
};

module.exports = welcomeFormHandler;

/** @format */

const signale = require('signale');
const { Command } = require('./Command');
const {
    createInfoMessage,
    createInfoMessageWithTitle,
    createSuccessMessage,
    createErrorMessage,
    smallBlueDiamond
} = require('../messageUtils');
const { group, userMentionToIdPattern } = require('./commandUtils');
const groupCreationForm = require('../forms/groupCreationForm');
const {
    addMembers,
    removeMembers,
    eraseGroup,
    transferOwnership,
    isGroupOwner
} = require('../config/customGroupsManager');
const { fetchGroup } = require('../config/storage');

class GroupCommand extends Command {
    constructor() {
        super(
            ['group', 'g'],
            'Manage groups',
            GroupCommand.prototype.helpExecutor
        );

        // Create
        this.addExecutorMapping(/create/i, undefined, this.createExecutor);

        // Invite
        this.addExecutorMapping(
            group(/invite/, /(\d+)/, userMentionToIdPattern),
            undefined,
            this.inviteExecutor
        );

        // Leave
        this.addExecutorMapping(
            group(/leave/, /(\d+)/),
            undefined,
            this.leaveExecutor
        );

        // Delete
        this.addExecutorMapping(
            group(/delete/, /(\d+)/, undefined, this.deleteExecutor),
            undefined,
            this.deleteExecutor
        );

        // Transfer ownership
        this.addExecutorMapping(
            group(/transfer-ownership/i, /(\d+)/, userMentionToIdPattern),
            undefined,
            this.transferOwnershipExecutor
        );
    }

    async helpExecutor(msg) {
        const res = createInfoMessageWithTitle(
            'Groupe personnalisés',
            `
                Pour vous eviter de créer 754681 convos différents pour vos projets de groupes,
                vous pouvez en créer un sur ce discord.
                
                Une catégorie de channel dont seul les membres y ont accès.
            `
        )
            .addField(
                smallBlueDiamond + process.env.COMMAND_PREFIX + 'group create',
                'Invoque le créateur de groupe. Vous en serez le propriétaire.',
                false
            )
            .addField(
                smallBlueDiamond +
                    process.env.COMMAND_PREFIX +
                    'group invite <id> <@mention>',
                `
                    Invite une personne dans votre groupe. L'ID est indiquer dans le nom de votre catégorie.
                    Seul le propriétaire du group peut le faire.
                    
                    Ex: \`group invite 17 @Ricardo\`
                `,
                false
            )
            .addField(
                smallBlueDiamond +
                    process.env.COMMAND_PREFIX +
                    'group leave <id>',
                `
                    Vous permez de quitter un groupe.
                    Si vous en etiez le propriétaire, une personne aléatoire vous remplacera.
                    Si vous etiez le dernier membre, le groupe est supprimé.
                `,
                false
            )
            .addField(
                smallBlueDiamond +
                    process.env.COMMAND_PREFIX +
                    'group delete <id>',
                `
                    Supprime un groupe, vous devez en être le propriétaire.
                    Tous les channels seront supprimés.
                `,
                false
            )
            .addField(
                smallBlueDiamond +
                    process.env.COMMAND_PREFIX +
                    'group transfer-ownership <id> <@mention>',
                `
                    Transfère le contrôle du groupe a quelqu'un d'autre.
                    Si il ne faisait pas encore parti du groupe, il y est automatiquement ajouter.
                `,
                false
            );

        await msg.channel.send(res);
    }

    async createExecutor(msg) {
        const groupId = await groupCreationForm(msg.author, msg.channel);

        await msg.channel.send(
            createSuccessMessage(
                `Votre groupe a été créé avec l'ID ${groupId} !`
            )
        );
    }

    async inviteExecutor(msg, id, newMemberId) {
        try {
            if (!(await isGroupOwner(id))) {
                return msg.channel.send(
                    createErrorMessage(
                        "Vous n'êtes pas le propriétaire de ce groupe !"
                    )
                );
            }

            await addMembers(msg.client, id, newMemberId);
            await msg.channel.send(
                createSuccessMessage('Nouveau membre ajouté !')
            );
        } catch (e) {
            await msg.channel.send(
                createErrorMessage(
                    "Vérifiez que l'ID du groupe est le bon. Si le probleme persiste, contactez un admin"
                )
            );

            signale.warn(e.message || e);
        }
    }

    async leaveExecutor(msg, id) {
        try {
            await removeMembers(msg.client, id, msg.author.id);
            await msg.channel.send(
                createSuccessMessage('Vous avez quitter le groupe !')
            );

            // Check if was owner
            if (await isGroupOwner(id, msg.author.id)) {
                const { members } = await fetchGroup(id);

                // If he was owner, chances are he was also the only member
                if (!members.length) {
                    await eraseGroup(msg.client, id);
                    return msg.channel.send(
                        createInfoMessage(`Le groupe ${id} a été supprimé`)
                    );
                } else {
                    await transferOwnership(msg.client, id, members[0]);

                    return msg.channel.send(
                        createInfoMessage(
                            `Le groupe a été transféré à <@${members[0]}>`
                        )
                    );
                }
            }
        } catch (e) {
            await msg.channel.send(
                createErrorMessage(
                    "Vérifiez que l'ID du groupe est le bon. Si le probleme persiste, contactez un admin"
                )
            );

            signale.warn(e.message || e);
        }
    }

    deleteExecutor(msg, id) {}

    transferOwnershipExecutor(msg, id, newOwnerId) {}
}

module.exports = new GroupCommand();

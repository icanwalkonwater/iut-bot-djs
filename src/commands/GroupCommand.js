/** @format */

const signale = require('signale');
const { Command } = require('./Command');
const {
    createInfoMessage,
    createInfoMessageWithTitle,
    createSuccessMessage,
    createWarningMessageWithTitle,
    createErrorMessage,
    smallBlueDiamond,
    smallOrangeDiamond
} = require('../messageUtils');
const {
    group,
    userMentionToIdPattern,
    channelMentionToIdPattern
} = require('./commandUtils');
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

        // Create channel
        this.addExecutorMapping(
            group(/channels/, /(\d+)/, /create/, /(.+)/),
            undefined,
            this.channelCreateExecutor
        );

        // Delete channel
        this.addExecutorMapping(
            group(/channels/, /(\d+)/, /delete/, channelMentionToIdPattern),
            undefined,
            this.channelDeleteExecutor
        );

        // Leave
        this.addExecutorMapping(
            group(/leave/, /(\d+)/),
            undefined,
            this.leaveExecutor
        );

        // Delete
        this.addExecutorMapping(
            group(/delete/, /(\d+)/),
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
                Pour vous eviter de créer 754681 convos différents pour vos projets de groupes, vous pouvez en créer un sur ce discord.
                
                Une catégorie de channel dont seul les membres y ont accès.
            `
        )
            .addField(
                smallBlueDiamond + process.env.COMMAND_PREFIX + 'group create',
                'Invoque le créateur de groupe. Vous en serez le propriétaire.',
                true
            )
            .addField(
                smallOrangeDiamond +
                    process.env.COMMAND_PREFIX +
                    'group invite <id> <@mention>',
                `
                    Invite une personne dans votre groupe. L'ID est indiquer dans le nom de votre catégorie.
                    
                    Seul le propriétaire du groupe peut le faire.
                    
                    Ex: \`group invite 17 @Ricardo\`
                `,
                true
            )
            .addField(
                smallOrangeDiamond +
                    process.env.COMMAND_PREFIX +
                    'group channels <id> create <name> [--text|--voice]',
                `
                    Crée un nouveau channel dans votre groupe, ajouter \`--text\` ou \`--voice\` pour forcer le type de channel.
                    Par défault, un channel textuel sera créé.
                    
                    Seul le propriétaire du groupe peut le faire.
                    
                    Ex: \`group channels 17 create MC Moddé --voice\`
                `,
                true
            )
            .addField(
                smallOrangeDiamond +
                    process.env.COMMAND_PREFIX +
                    'group channels <id> delete <#mention>',
                `
                    Supprime un channel de votre catégorie en le mentionnant.
                    
                    Pour mentionner un channel vocal fait \`Clic Droit > Copier l'Identifiant\` dessus et créez la mention en tapant \`<#id>\`.
                    
                    Seul le propriétaire du groupe peut le faire.
                    
                    Ex: \`group channels 17 delete #useless\`
                    Ex: \`group channels 17 delete <#264001800686796802>\`
                `,
                true
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
                true
            )
            .addField(
                smallOrangeDiamond +
                    process.env.COMMAND_PREFIX +
                    'group delete <id>',
                `
                    Supprime un groupe, vous devez en être le propriétaire.
                    Tous les channels seront supprimés.
                `,
                true
            )
            .addField(
                smallOrangeDiamond +
                    process.env.COMMAND_PREFIX +
                    'group transfer-ownership <id> <@mention>',
                `
                    Transfère le contrôle du groupe a quelqu'un d'autre.
                    Si il ne faisait pas encore parti du groupe, il y est automatiquement ajouter.
                `,
                true
            );

        await msg.channel.send(res);
    }

    async _ensureOwner(msg, id) {
        if (!(await isGroupOwner(id, msg.author.id))) {
            await msg.channel.send(
                createErrorMessage(
                    "Vous n'êtes pas le propriétaire de ce groupe !"
                )
            );

            return false;
        }

        return true;
    }

    async createExecutor(msg) {
        const groupId = await groupCreationForm(msg.author, msg.channel);

        if (groupId !== undefined) {
            await msg.channel.send(
                createSuccessMessage(
                    `Votre groupe a été créé avec l'ID ${groupId} !`
                )
            );
        }
    }

    async inviteExecutor(msg, id, newMemberId) {
        try {
            // Check if is owner
            if (!(await this._ensureOwner(msg, id))) return;

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

    async channelCreateExecutor(msg, id, name, options) {
        try {
            // Check if is owner
            if (!(await this._ensureOwner(msg, id))) return;

            const { settings } = await fetchGroup(id);

            const guild = msg.client.guilds.get(process.env.GUILD_ID);
            await guild.createChannel(name, {
                type: options.voice ? 'voice' : 'text',
                parent: settings.category
            });

            await msg.channel.send(
                createSuccessMessage('Nouveau channel créé !')
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

    async channelDeleteExecutor(msg, id, channelId) {
        try {
            // Check if is owner
            if (!(await this._ensureOwner(msg, id))) return;

            const { settings } = await fetchGroup(id);

            // Check if channel is deletable
            const category = msg.client.channels.get(settings.category);
            if (!category.children.has(channelId)) {
                return msg.channel.send(
                    createErrorMessage(
                        "Ce channel n'éxiste pas ou ne fait pas partie de ce groupe !"
                    )
                );
            }

            // Delete channel
            await category.children.get(channelId).delete();
            await msg.channel.send(createSuccessMessage('Channel supprimé !'));
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
            // Remove the user from the members
            await removeMembers(msg.client, id, msg.author.id);
            await msg.channel.send(
                createSuccessMessage('Vous avez quitter le groupe !')
            );

            // Check if was owner
            if (await isGroupOwner(id, msg.author.id)) {
                const { members } = await fetchGroup(id);

                // If he was owner, chances are he was also the only member
                if (!members.length) {
                    // No one is left so we delete the group
                    await eraseGroup(msg.client, id);

                    signale.info(`Group ${id}: delete (0 member)`);

                    return msg.channel.send(
                        createInfoMessage(`Le groupe ${id} a été supprimé`)
                    );
                } else {
                    // If there are members left, transfer the ownership to some random guy
                    await transferOwnership(msg.client, id, members[0]);

                    signale.info(
                        `Group ${id}: transfer ${msg.author.id} > ${
                            members[0]
                        } (owner leave)`
                    );

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

    async deleteExecutor(msg, id, options) {
        try {
            // Check if is owner
            if (!(await this._ensureOwner(msg, id))) return;

            // Check if confirmed
            if (!options.confirm) {
                return msg.channel.send(
                    createWarningMessageWithTitle(
                        'Voulez vous vraiment supprimer ce groupe ?',
                        `Confirmez avec \`${process.env.COMMAND_PREFIX}group delete ${id} --confirm\``
                    )
                );
            }

            await eraseGroup(msg.client, id);

            signale.info(`Group ${id}: delete (owner)`);

            // If the command was typed in a channel of the category, it doesn't exist anymore
            try {
                await msg.channel.send(
                    createSuccessMessage(
                        `Le groupe ${id} a bien été supprimé !`
                    )
                );
            } catch (e) {
                // Failed to send probably because the channel is gone.
                signale.warn(`Confirm erase ${id}: channel deleted`);
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

    async transferOwnershipExecutor(msg, id, newOwnerId, options) {
        try {
            // Check if is owner
            if (!(await this._ensureOwner(msg, id))) return;

            // Check if confirm
            if (!options.confirm) {
                return msg.channel.send(
                    createWarningMessageWithTitle(
                        'Voulez vous vraiment transférer votre groupe ?',
                        `Confirmer avec \`${process.env.COMMAND_PREFIX}group transfer-ownership ${id} <@${newOwnerId}> --confirm\``
                    )
                );
            }

            await transferOwnership(msg.client, id, newOwnerId);

            signale.info(
                `Group ${id}: transfer ${msg.author.id} > ${newOwnerId} (manual)`
            );

            await msg.channel.send(
                createSuccessMessage('Vos droits ont bien été transférés')
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
}

module.exports = new GroupCommand();

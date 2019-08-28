/** @format */

const { RedisError } = require('redis');
const { Command } = require('./Command');
const { group, booleanPattern } = require('./commandUtils');
const {
    createInfoMessage,
    createSuccessMessage,
    createErrorMessage,
    whiteCheckMark,
    noEntrySign
} = require('../messageUtils');
const { fetchUserSettings, commitUserSettings } = require('../config/storage');

const settingDescriptionCreator = (key, value) => {
    return `
        ${value}
        
        *Edite avec: \`${process.env.COMMAND_PREFIX}settings set ${key} <value>\`*
    `;
};

class SettingsCommand extends Command {
    constructor() {
        super(
            ['settings', 'setting'],
            'Change personal settings',
            SettingsCommand.prototype.indexExecutor
        );

        // Set allowPm setting
        this.addExecutorMapping(
            group(/set/, /allowPm/, booleanPattern),
            undefined,
            this.setAllowPmExecutor
        );
    }

    async indexExecutor(msg) {
        const settings = await fetchUserSettings(msg.author.id);
        if (!settings) {
            return msg.channel.send(
                createErrorMessage(
                    'Vos paramètres sont introuvables, avez-vous rempli le questionnaire de bienvenue ?'
                )
            );
        }

        // Destructure settings
        const { allowPm } = settings;

        const res = createInfoMessage('Paramètres').addField(
            'Autoriser les MPs',
            settingDescriptionCreator(
                'allowPm',
                allowPm === 'true' ? whiteCheckMark : noEntrySign
            ),
            true
        );
        // TODO when other fields

        await msg.channel.send(res);
    }

    async setAllowPmExecutor(msg, value) {
        const settings = await fetchUserSettings(msg.author.id);
        if (!settings) {
            return msg.channel.send(
                createErrorMessage(
                    'Vos paramètres sont introuvables, avez-vous rempli le questionnaire de bienvenue ?'
                )
            );
        }

        settings.allowPm = /true|1|on/i.test(value);
        await commitUserSettings(msg.author.id, settings);

        await msg.channel.send(
            createSuccessMessage(
                settings.allowPm
                    ? 'Vous êtes maintenant susceptible de recevoir des MPs'
                    : 'Vous ne recevrez plus de MPs'
            )
        );
    }
}

module.exports = new SettingsCommand();

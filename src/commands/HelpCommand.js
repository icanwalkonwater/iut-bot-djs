/** @format */

const { Command } = require('./Command');
const {
    createInfoMessageWithTitle,
    smallBlueDiamond
} = require('../messageUtils');

class HelpCommand extends Command {
    constructor() {
        super(['help', 'h'], 'Show help', HelpCommand.prototype.helpExecutor);
    }

    helpExecutor(msg) {
        const res = createInfoMessageWithTitle(
            'Aide',
            'List des commandes disponibles'
        )
            .setColor(0xffffff)
            .addField(
                smallBlueDiamond + process.env.COMMAND_PREFIX + 'help',
                'Affiche cette aide',
                true
            )
            .addField(
                smallBlueDiamond + process.env.COMMAND_PREFIX + 'settings',
                'Affiche et modifie tes paramètres',
                true
            )
            .addField(
                smallBlueDiamond + process.env.COMMAND_PREFIX + 'group',
                'Crée et gère tes groupes custom',
                true
            )
            .addField(
                smallBlueDiamond + process.env.COMMAND_PREFIX + 'about',
                'Affiche quelques informations utiles sur le bot',
                true
            );

        return msg.channel.send(res);
    }
}

module.exports = new HelpCommand();

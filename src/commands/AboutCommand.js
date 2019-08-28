/** @format */

const { RichEmbed, version } = require('discord.js');
const { Command } = require('./Command');

const start = Date.now() / 1000;

class AboutCommand extends Command {
    constructor() {
        super(
            ['about', 'info'],
            'Info about the bot',
            AboutCommand.prototype.infoExecutor
        );
    }

    infoExecutor(msg) {
        const self = msg.client.user;

        const uptime = Date.now() / 1000 - start;
        const [uptimeSeconds, uptimeMinutes, uptimeHours, uptimeDays] = [
            uptime % 60 | 0,
            (uptime / 60) % 60 | 0,
            (uptime / 3600) % 24 | 0,
            (uptime / 86400) | 0
        ];

        const res = new RichEmbed()
            .setColor(0xffffff)
            .setAuthor('Informations', self.avatarURL)
            .addField(
                'Runtime',
                `
                **Node.JS**: ${process.version}
                **Discord.js**: v${version}
            `,
                true
            )
            .addField(
                'Uptime',
                `**${uptimeDays}**j **${uptimeHours}**h **${uptimeMinutes}**m **${uptimeSeconds}**s`,
                true
            )
            .addField(
                'Sources',
                '[Github](https://github.com/icanwalkonwater/iut-bot-djs)',
                true
            );

        msg.channel.send(res);
    }
}

module.exports = new AboutCommand();

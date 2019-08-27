/** @format */

// ###############################
// Register commands here
// ###############################

const commands = [
    require('./AdminCommand'),
    require('./StopCommand'),
    require('./SettingsCommand'),
    require('./GroupCommand'),
    require('./TestCommand')
];

// Normalize patterns
commands.forEach(command => {
    if (Array.isArray(command.executorMap)) {
        command.executorMap = command.executorMap.map(mapping => {
            // Ensure the regex will match only from the beginning of the command
            mapping[0] = new RegExp('^' + mapping[0].source);
            return mapping;
        });
    }
});

module.exports = commands;

/** @format */

// ###############################
// Register commands here
// ###############################

const commands = [
    require('./HelpCommand'),
    require('./AboutCommand'),
    require('./AdminCommand'),
    require('./StopCommand'),
    require('./SettingsCommand'),
    require('./GroupCommand')
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

export default commands;

/** @format */

const { RichEmbed } = require('discord.js');

// Factories

const createSmallMessage = (color, icon, message) => {
    return new RichEmbed().setColor(color).setAuthor(message, icon);
};

const createLongMessage = (color, icon, title, message) => {
    return new RichEmbed()
        .setColor(color)
        .setAuthor(title, icon)
        .setDescription(message);
};

const infoColor = 0x2196f3;
const successColor = 0x4caf50;
const errorColor = 0xff0000;

// Helpers

const createInfoMessage = message => {
    return createSmallMessage(
        infoColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/302790538627776512/sign-info-icon.png',
        message
    );
};

const createInfoMessageWithTitle = (title, message) => {
    return createLongMessage(
        infoColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/302790538627776512/sign-info-icon.png',
        title,
        message
    );
};

const createSuccessMessage = message => {
    return createSmallMessage(
        successColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/339750595907026954/sign-check-icon.png',
        message
    );
};

const createSuccessMessageWithTitle = (title, message) => {
    return createLongMessage(
        successColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/339750595907026954/sign-check-icon.png',
        title,
        message
    );
};

const createErrorMessage = error => {
    return createSmallMessage(
        errorColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/303136843153539082/sign-error-icon.png',
        error.message || error
    );
};

const createDetailedErrorMessage = (title, error) => {
    return createLongMessage(
        errorColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/303136843153539082/sign-error-icon.png',
        title,
        error.message || error
    );
};

module.exports = {
    createSmallMessage,
    createLongMessage,

    createInfoMessage,
    createInfoMessageWithTitle,

    createSuccessMessage,
    createSuccessMessageWithTitle,

    createErrorMessage,
    createDetailedErrorMessage
};

/** @format */

import { RichEmbed } from 'discord.js';

// Factories

/**
 * @param color {module:discord.js.ColorResolvable}
 * @param icon {String}
 * @param message {String}
 * @return {module:discord.js.RichEmbed}
 */
const createSmallMessage = (color, icon, message) => {
    return new RichEmbed().setColor(color).setAuthor(message, icon);
};

/**
 * @param color {module:discord.js.ColorResolvable}
 * @param icon {String}
 * @param title {String}
 * @param message {String}
 * @return {module:discord.js.RichEmbed}
 */
const createLongMessage = (color, icon, title, message) => {
    return new RichEmbed()
        .setColor(color)
        .setAuthor(title, icon)
        .setDescription(message);
};

const infoColor = 0x2196f3;
const successColor = 0x4caf50;
const warningColor = 0xff9800;
const errorColor = 0xff0000;

// Helpers

/**
 * @param message {String}
 * @return {module:discord.js.RichEmbed}
 */
const createInfoMessage = message => {
    return createSmallMessage(
        infoColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/302790538627776512/sign-info-icon.png',
        message
    );
};

/**
 * @param title {String}
 * @param message {String}
 * @return {module:discord.js.RichEmbed}
 */
const createInfoMessageWithTitle = (title, message) => {
    return createLongMessage(
        infoColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/302790538627776512/sign-info-icon.png',
        title,
        message
    );
};

/**
 * @param message {String}
 * @return {module:discord.js.RichEmbed}
 */
const createSuccessMessage = message => {
    return createSmallMessage(
        successColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/339750595907026954/sign-check-icon.png',
        message
    );
};

/**
 * @param title {String}
 * @param message {String}
 * @return {module:discord.js.RichEmbed}
 */
const createSuccessMessageWithTitle = (title, message) => {
    return createLongMessage(
        successColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/339750595907026954/sign-check-icon.png',
        title,
        message
    );
};

/**
 * @param message {String}
 * @return {module:discord.js.RichEmbed}
 */
const createWarningMessage = message => {
    return createSmallMessage(
        warningColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/303136843153539082/sign-error-icon.png',
        message
    );
};

/**
 * @param title {String}
 * @param message {String}
 * @return {module:discord.js.RichEmbed}
 */
const createWarningMessageWithTitle = (title, message) => {
    return createLongMessage(
        warningColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/303136843153539082/sign-error-icon.png',
        title,
        message
    );
};

/**
 * @param error {String|Error}
 * @return {module:discord.js.RichEmbed}
 */
const createErrorMessage = error => {
    return createSmallMessage(
        errorColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/303136843153539082/sign-error-icon.png',
        error.message || error
    );
};

/**
 * @param title {String}
 * @param error {String|Error}
 * @return {module:discord.js.RichEmbed}
 */
const createDetailedErrorMessage = (title, error) => {
    return createLongMessage(
        errorColor,
        'https://cdn.discordapp.com/attachments/302785106802638848/303136843153539082/sign-error-icon.png',
        title,
        error.message || error
    );
};

// Some emotes

const whiteCheckMark = '\u2705';
const noEntrySign = '\uD83D\uDEAB';
const smallBlueDiamond = '\uD83D\uDD39';
const smallOrangeDiamond = '\uD83D\uDD38';

module.exports = {
    createSmallMessage,
    createLongMessage,

    createInfoMessage,
    createInfoMessageWithTitle,

    createSuccessMessage,
    createSuccessMessageWithTitle,

    createWarningMessage,
    createWarningMessageWithTitle,

    createErrorMessage,
    createDetailedErrorMessage,

    whiteCheckMark,
    noEntrySign,
    smallBlueDiamond,
    smallOrangeDiamond
};

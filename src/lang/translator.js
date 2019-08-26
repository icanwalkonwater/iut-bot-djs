/** @format */

const { fetchUserSettings } = require('../config/storage');

const langs = {
    en_US: require('./en_US.json'),
    fr_FR: require('./fr_FR.json')
};

const getUserLang = async user => {
    if (!user) return 'en_US';

    return (await fetchUserSettings(user.id))?.lang || 'en_US';
};

const getTextIn = (text, lang) => {
    const trad = langs?.[lang]?.[text];

    if (trad) {
        return trad;
    } else if (lang !== 'en_US') {
        return getTextIn(text, 'en_US');
    } else {
        return null;
    }
};

const format = (text, ...args) => {
    for (const i in args) {
        const arg = args[i];
        text.replaceAll('{' + i + '}', arg);
    }
};

const translate = (text, user) => {};

// TODO: who the fuck can't read english anyway

/** @format */

const Discord = require('discord.js');
const {
    createInfoMessageWithTitle,
    createWarningMessage
} = require('../messageUtils');

/**
 * @param title {String}
 * @param questions {{question: String, pattern: RegExp|String, error: String, mapper: Function}[]}
 * @param answersMapper {Function}
 * @return {Function<Promise<Array<String>>>}
 */
const newForm = (title, questions, answersMapper) => {
    return async (user, channel) => {
        const answers = [];

        for (const index in questions) {
            const question = questions[index];
            const response = await askQuestion(
                channel,
                user.id,
                `${title} (${+index + 1}/${questions.length})`,
                question
            );
            answers.push(response);
        }

        if (typeof answersMapper === 'function') {
            return answersMapper(answers);
        } else {
            return answers;
        }
    };
};

/**
 *
 * @param channel {Discord.TextBasedChannel}
 * @param userId {String}
 * @param title {String}
 * @param question {String}
 * @param pattern {RegExp|String}
 * @param error {String}
 * @param mapper {Function}
 */
const askQuestion = async (
    channel,
    userId,
    title,
    { question, pattern, error, mapper }
) => {
    // Prepare filter
    const filter = m => {
        if (m.author.id !== userId) return;

        if (pattern.test(m.content)) {
            return true;
        } else {
            channel.send(createWarningMessage(error));
            return false;
        }
    };

    // Send question
    await channel.send(createInfoMessageWithTitle(title, question));

    // No catch, the form need to handle the timeout error
    let validResponse = await channel.awaitMessages(filter, {
        max: 1,
        time: 60000,
        errors: ['time']
    });

    // Map answer
    if (typeof mapper === 'function') {
        validResponse = mapper(validResponse.values().next().value.content);
    } else {
        validResponse = validResponse.values().next().value.content;
    }

    return validResponse;
};

module.exports = {
    newForm
};

/** @format */

class CommandNotFoundError extends Error {
    constructor() {
        super('Command not found');
    }
}

class RouteMismatchError extends Error {
    constructor(msg) {
        super('SyntaxError: ' + msg);
    }
}

module.exports = {
    CommandNotFoundError,
    RouteMismatchError
};

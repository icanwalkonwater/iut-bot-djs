/** @format */

export class CommandNotFoundError extends Error {
    constructor() {
        super('Command not found');
    }
}

export class RouteMismatchError extends Error {
    constructor(msg) {
        super('SyntaxError: ' + msg);
    }
}

export const permissionError = new Error('Unsiffisent permissions');

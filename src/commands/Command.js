/** @format */

class Command {
    constructor(name, description, rootExecutor) {
        this.name = name;
        this.description = description;
        this.rootExecutor = rootExecutor?.bind(this);
        this.executorMap = [];
    }

    /**
     * @param regex {RegExp}
     * @param guards {Function|Function[]|undefined}
     * @param executor {Function}
     */
    addExecutorMapping(regex, guards, executor) {
        // *** Sanitize regex
        regex = new RegExp('^' + regex.source, 'i');

        // *** Apply optional guards
        if (Array.isArray(guards)) {
            // If an array of guards
            const delegate = executor;
            executor = (msg, ...args) => {
                if (guards.every(g => g(msg))) {
                    return delegate(msg, ...args);
                }
            };
        } else if (typeof guards === 'function') {
            // If a single guard
            const delegate = executor;
            executor = (msg, ...args) => {
                if (guards(msg)) {
                    return delegate(msg, ...args);
                }
            };
        }

        this.executorMap.push([regex, executor.bind(this)]);
    }
}

module.exports = { Command };

/** @format */

class Command {
    constructor(name, description, rootExecutor) {
        this.name = name;
        this.description = description;
        this.rootExecutor = rootExecutor?.bind(this);
        this.executorMap = [];
    }

    addExecutorMapping(regex, executor) {
        this.executorMap.push([regex, executor.bind(this)]);
    }
}

module.exports = { Command };

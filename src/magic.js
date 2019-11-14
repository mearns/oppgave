const { PureSyncTask } = require("./task");
const TaskGraph = require("./task-graph");

class BaseAutoWire {
    constructor(taskGraph) {
        this._taskGraph = taskGraph;
        this._magic = this.wireTo.bind(this);
    }

    wireTo(task) {
        const taskIdx = this._taskGraph.addTask(task);
        this._addWireTo(this._taskGraph, taskIdx);
        return new AutoWire(this._taskGraph, taskIdx)._magic;
    }

    _addWireTo(taskGraph, destIdx) {
        throw new Error("Abstract method not implemented");
    }
}

class InputWire extends BaseAutoWire {
    constructor() {
        super(new TaskGraph());
    }

    /**
     * @override
     */
    _addWireTo(taskGraph, destIdx) {
        taskGraph.wireInputTo(destIdx);
    }
}

class AutoWire extends BaseAutoWire {
    constructor(taskGraph, sourceTask) {
        super(taskGraph);
        this._sourceTask = sourceTask;
    }

    /**
     * @override
     */
    _addWireTo(taskGraph, destIdx) {
        taskGraph.addWire(this._sourceTask, destIdx);
    }
}

function createMagicTask(task) {
    return function(magicWire) {
        return magicWire(task);
    };
}

function createInput() {
    return new InputWire()._magic;
}

createInput.Task = {};
createInput.Task.pure = {};
createInput.Task.pure.sync = func => createMagicTask(new PureSyncTask(func));

module.exports = createInput;

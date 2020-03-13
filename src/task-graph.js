/**
 * This is a utility module. It does the hard work of actually defining and executing
 * a task graph, but there's not a lot of book-keeping or anything to make it easy to
 * actually use. That's why you use the magic wires and stuff from the index.
 */

const { topologicalSort } = require("./graph-utils");
const assert = require("assert");

const INPUT_UNTASK_IDX = 0;

class TaskGraph {
    constructor() {
        // The vertices in the graph (i.e., the tasks to execute)
        this._tasks = [null];
        this._inEdges = [[]];
    }

    /**
     * Add a task to the graph, but not connected to anything.
     * @param {Task} task
     * @sync
     * @returns {TaskId} The ID of the new task.
     */
    addTask(task) {
        const taskIdx = this._tasks.length;
        this._tasks.push(task);
        this._inEdges.push([]);
        return taskIdx;
    }

    /**
     * Wire up the graph's hypothetical input to the specified task.
     * @param {TaskId} toTask
     */
    wireInputTo(toTask) {
        this.addWire(INPUT_UNTASK_IDX, toTask);
    }

    /**
     * Add a wire from the one task to the other. This means that when the `fromTask`
     * completes, it's output will be provided to the `toTask`.
     * @param {TaskId} fromTask
     * @param {TaskId} toTask
     */
    addWire(fromTask, toTask) {
        this._inEdges[toTask].push(fromTask);
    }

    /**
     * Execute the graph with the given input values. Each task is invoked (through its `runSync`
     * method), passed an array of the values from its inputs, in the order those inputs were added.
     * @async
     * @param {*} input The input value.
     * @returns {Array<*>} An array of the task output values, indexed by task id.
     */
    async run(
        input,
        { onStart = () => {}, onFinish = () => {}, onError = () => {} } = {}
    ) {
        // Reverse our wire lookup. inEdges will be a LUT by the destination (output)
        // taskId containing a list of the input taskIds for it.
        const outEdges = this._tasks.map(() => []);
        this._inEdges.forEach((inEdges, destTaskIdx) => {
            inEdges.forEach(source => {
                outEdges[source].push(destTaskIdx);
            });
        });

        // Sort the tasks based on the order they need to execute in.
        const sortedIndexes = topologicalSort(outEdges);

        // This will hold the output values from each task. Basically the
        // value in the wire coming out of the task.
        const wires = sortedIndexes.map(() => []);

        // Execute them in topological order.
        for (const taskIdx of sortedIndexes) {
            const sources = this._inEdges[taskIdx];
            const inputWires = sources.map(idx => wires[idx]);
            assert(
                inputWires.every(v => v.length === 1),
                `Input tasks [${sources
                    .map(String)
                    .join(", ")}] for task ${taskIdx} are not all defined`
            );
            assert(
                wires[taskIdx].length === 0,
                `Task ${taskIdx} already has a value....?`
            );
            if (taskIdx === INPUT_UNTASK_IDX) {
                assert(
                    this._tasks[taskIdx] === null,
                    `Input task should be null`
                );
                assert(
                    inputWires.length === 0,
                    `Input task has inputs....huh? ${inputWires
                        .map(String)
                        .join(", ")}`
                );
                // Wire value coming "out" of the input "task" ("untask")
                // is the input value.
                wires[taskIdx].push(input);
            } else {
                // Run the task and put it's value on the wire.
                const taskInputs = inputWires.map(([v]) => v);
                const cookie = onStart(taskIdx, taskInputs);
                let value;
                try {
                    value = this._tasks[taskIdx].runSync(taskInputs);
                } catch (error) {
                    onError(error, taskIdx, taskInputs, cookie);
                    throw error;
                }
                onFinish(value, taskIdx, taskInputs, cookie);
                wires[taskIdx].push(value);
            }
        }
        assert(
            wires.every(v => v.length === 1),
            "Not every wire has a value defined"
        );

        // Unwrap the Optionals on our wires.
        return wires.map(([v]) => v);
    }
}

module.exports = TaskGraph;

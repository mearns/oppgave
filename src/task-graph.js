const { topologicalSort } = require("./graph-utils");
const assert = require("assert");

const INPUT_UNTASK_IDX = 0;

class TaskGraph {
    constructor() {
        this._tasks = [null];
        this._outEdges = [[]];
    }

    addTask(task) {
        const taskIdx = this._tasks.length;
        this._tasks.push(task);
        this._outEdges.push([]);
        return taskIdx;
    }

    addWire(fromTask, toTask) {
        this._outEdges[fromTask].push(toTask);
    }

    runSync(input) {
        const sortedIndexes = topologicalSort(this._outEdges);
        const inEdges = sortedIndexes.map(() => []);
        this._outEdges.forEach((outEdges, taskIdx) => {
            outEdges.forEach(dest => {
                inEdges[dest].push(taskIdx);
            });
        });
        const pipeValues = sortedIndexes.map(() => []);
        for (const taskIdx of sortedIndexes) {
            const sources = inEdges[taskIdx];
            const inputValues = sources.map(idx => pipeValues[idx]);
            assert(
                inputValues.every(v => v.length === 1),
                `Input tasks [${sources
                    .map(String)
                    .join(", ")}] for task ${taskIdx} are not all defined`
            );
            assert(
                pipeValues[taskIdx].length === 0,
                `Task ${taskIdx} already has a value....?`
            );
            if (taskIdx === INPUT_UNTASK_IDX) {
                assert(
                    this._tasks[taskIdx] === null,
                    `Input task should be null`
                );
                assert(
                    inputValues.length === 0,
                    `Input task has inputs....huh?`
                );
                pipeValues[taskIdx].push(input);
            } else {
                pipeValues[taskIdx].push(
                    this._tasks[taskIdx].runSync(inputValues)
                );
            }
        }
        assert(pipeValues.every(v => v.length === 1));
        return pipeValues.map(([v]) => v);
    }
}

module.exports = TaskGraph;

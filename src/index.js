const { PureSyncTask } = require("./task");
const TaskGraph = require("./task-graph");

const createMagicPipe = (taskGraph, taskIdx) => func =>
    func(taskGraph, taskIdx);

const createMagicTask = task => magicPipe =>
    magicPipe((taskGraph, taskIdx) => {
        const destTaskIdx = taskGraph.addTask(task);
        taskGraph.addWire(taskIdx, destTaskIdx);
        return createMagicPipe(taskGraph, destTaskIdx);
    });

const createMagicResult = resultsArray => magicPipe =>
    magicPipe((taskGraph, taskIdx) => resultsArray[taskIdx]);

const supertask = () => {
    const graph = new TaskGraph();
    const inputPipe = createMagicPipe(graph, 0);
    return {
        input: inputPipe,
        runSync: inputValue => createMagicResult(graph.runSync(inputValue))
    };
};

supertask.Task = {};
supertask.Task.pure = {};
supertask.Task.pure.sync = func => createMagicTask(new PureSyncTask(func));

module.exports = supertask;

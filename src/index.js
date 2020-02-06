const { PureSyncTask } = require("./task");
const TaskGraph = require("./task-graph");

/**
 * A magic pipe encapsulates a specific task in a task graph. The magic pipe is a function
 * which takes a function and applies it to the task (as a TaskGraph and taskId).
 * @param {TaskGraph} taskGraph The graph
 * @param {TaskId} taskIdx The ID of the task to create a pipe for.
 */
const createMagicPipe = (taskGraph, taskIdx) => func =>
    func(taskGraph, taskIdx);

/**
 * A magic task is a function tied to a Task; the function takes a magic pipe
 * and uses it to invoke a function which adds the magic task's task to the pipe's
 * graph, wires it up as a sink from the pipe's task's, and then returns a new
 * magic pipe for added task.
 * @param {Task} task
 */
const createMagicTask = task => magicPipe =>
    magicPipe((taskGraph, taskIdx) => {
        const destTaskIdx = taskGraph.addTask(task);
        taskGraph.addWire(taskIdx, destTaskIdx);
        return createMagicPipe(taskGraph, destTaskIdx);
    });

/**
 * A magic result encapsulates the results of a task graph execution,
 * which can be accessed with a magic pipe.
 * @param {*} resultsArray
 */
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

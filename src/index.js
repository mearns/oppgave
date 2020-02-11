const { PureSyncTask } = require("./task");
const TaskGraph = require("./task-graph");

/**
 * A magic pipe encapsulates a specific task in a task graph. The magic pipe is a function
 * which takes a function and applies it to the task (as a TaskGraph and taskId).
 * @param {TaskGraph} taskGraph The graph
 * @param {TaskId} taskId The ID of the task to create a pipe for.
 */
const createMagicPipe = (taskGraph, taskId) => {
    const name = `magicPipe-${taskId}`;
    return {
        [name]: func => func(taskGraph, taskId)
    }[name];
};

const getGraphFromPipe = pipe => pipe(graph => graph);
const getTaskIdFromPipe = pipe => pipe((graph, taskId) => taskId);

const reduceInputs = inputs => {
    const magicPipes = [];
    const inputShapers = [];
    const pipeMap = new Map();
    const createInputGetter = magicPipe => {
        const taskIdx = getTaskIdFromPipe(magicPipe);
        if (pipeMap.has(taskIdx)) {
            const inputIdx = pipeMap.get(taskIdx);
            return inputs => inputs[inputIdx];
        }
        const inputIdx = magicPipes.length;
        magicPipes.push(magicPipe);
        pipeMap.set(taskIdx, inputIdx);
        return inputs => inputs[inputIdx];
    };
    inputs.forEach(input => {
        if (typeof input === "function") {
            inputShapers.push(createInputGetter(input));
        } else if (Array.isArray(input)) {
            const inputGetters = input.map(createInputGetter);
            inputShapers.push(inputs => inputGetters.map(get => get(inputs)));
        } else {
            const inputEntries = Object.entries(input);
            const inputGetterEntries = inputEntries.map(([k, v]) => [
                k,
                createInputGetter(v)
            ]);
            inputShapers.push(inputs => {
                return inputGetterEntries.reduce((o, [k, get]) => {
                    o[k] = get(inputs);
                    return o;
                }, {});
            });
        }
    });
    return { magicPipes, inputShapers };
};

/**
 * A magic task is a function tied to a Task; the function takes a magic pipe
 * and uses it to invoke a function which adds the magic task's task to the pipe's
 * graph, wires it up as a sink from the pipe's task's, and then returns a new
 * magic pipe for added task.
 * @param {Task} task
 */
const createMagicTask = task => (...inputs) => {
    const { magicPipes, inputShapers } = reduceInputs(inputs);
    const modifiedTask = task.wrap(func => (...inputs) => {
        const shapedInputs = inputShapers.map(shaper => shaper(inputs));
        return func(...shapedInputs);
    });
    const [magicPipe, ...otherPipes] = magicPipes;
    const graph = getGraphFromPipe(magicPipe);
    if (otherPipes.some(pipe => graph !== getGraphFromPipe(pipe))) {
        // TODO: Actually, maybe you can. Could we just create a new graph with
        // the inputs as subgraphs?
        throw new Error("Cannot merge multiple tasks");
    }
    const destTaskIdx = graph.addTask(modifiedTask);
    graph.addWire(getTaskIdFromPipe(magicPipe), destTaskIdx);
    otherPipes.forEach(pipe =>
        graph.addWire(getTaskIdFromPipe(pipe), destTaskIdx)
    );
    return createMagicPipe(graph, destTaskIdx);
};

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

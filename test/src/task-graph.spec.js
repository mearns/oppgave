/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const TaskGraph = require("../../src/task-graph");

// Support modules
const { expect } = require("chai");

describe("task-graph", () => {
    it("should do what it does", () => {
        // given
        const graph = new TaskGraph();
        const t1 = graph.addTask(mockTask(x => x * x * x));
        const t2 = graph.addTask(mockTask(x => 5 * x * x));
        const t3 = graph.addTask(mockTask(x => 7 * x));
        graph.addWire(0, t1);
        graph.addWire(t1, t2);
        graph.addWire(t2, t3);

        // when
        const values = graph.runSync(3);

        // expect
        expect(values[0]).to.equal(3);
        expect(values[t1]).to.equal(27);
    });
});

function mockTask(func) {
    return {
        runSync: inputs => func(...inputs)
    };
}

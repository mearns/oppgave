/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const TaskGraph = require("../../src/task-graph");

// Support modules
const { expect } = require("chai");

describe("task-graph", () => {
    it("should do what it does", async () => {
        // given
        const graph = new TaskGraph();
        const t1 = graph.addTask(mockTask(x => x * x * x));
        const t2 = graph.addTask(mockTask(x => 5 * x * x));
        const t3 = graph.addTask(mockTask(x => 7 * x));
        graph.wireInputTo(t1);
        graph.addWire(t1, t2);
        graph.addWire(t2, t3);

        // when
        const values = await graph.run(3);

        // expect
        expect(values[0]).to.equal(3);
        expect(values[t1]).to.equal(27);
    });

    it("should handle multiple inputs to a task", async () => {
        // given
        const graph = new TaskGraph();
        const t1 = graph.addTask(mockTask(x => x + "-1"));
        const t2 = graph.addTask(mockTask(x => x + "-2"));
        const t3 = graph.addTask(mockTask(x => x + "-3"));
        const t4 = graph.addTask(mockTask((x, y) => x + "_" + y));
        graph.wireInputTo(t1);
        graph.addWire(t1, t2);
        graph.addWire(t2, t3);
        graph.addWire(t2, t4);
        graph.addWire(t3, t4);

        // when
        const values = await graph.run("S");

        // expect
        expect(values[0]).to.equal("S");
        expect(values[t1]).to.equal("S-1");
        expect(values[t2]).to.equal("S-1-2");
        expect(values[t3]).to.equal("S-1-2-3");
        expect(values[t4]).to.equal("S-1-2_S-1-2-3");
    });
});

function mockTask(func) {
    return {
        runSync: inputs => func(...inputs)
    };
}

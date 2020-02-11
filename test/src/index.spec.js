/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const supertask = require("../../src");
const { Task } = supertask;

// Support modules
const { expect } = require("chai");

describe("magic", () => {
    it("should do what it does", () => {
        const task1 = Task.pure.sync(x => x + "-1");
        const task2 = Task.pure.sync(x => x + "-2");
        const task3 = Task.pure.sync(x => x + "-3");
        const task4 = Task.pure.sync((a, b, [c, d], { x }) =>
            [a, b, c, d, x].join("_")
        );
        const st = supertask();
        const p0 = st.input;
        const p1 = task1(p0);
        const p2 = task2(p1);
        const p3 = task3(p1);
        const p4 = task4(p2, p3, [p1, p0], { x: p3 });

        const results = st.runSync("in");

        expect(results(p0)).to.equal("in");
        expect(results(p1)).to.equal("in-1");
        expect(results(p2)).to.equal("in-1-2");
        expect(results(p3)).to.equal("in-1-3");
        expect(results(p4)).to.equal("in-1-2_in-1-3_in-1_in_in-1-3");
    });

    it("should do what it does 2", () => {
        const task1 = Task.pure.sync(x => x + "-1");
        const task2 = Task.pure.sync(x => x + "-2");
        const task3 = Task.pure.sync(x => x + "-3");
        const task4 = Task.pure.sync(
            (a, b, [c, d, [e, f], g], { x, y: [h, i], z: { j, k } }) =>
                [a, b, c, d, e, f, g, h, i, j, k, x].join("_")
        );
        const st = supertask();
        const p0 = st.input;
        const p1 = task1(p0);
        const p2 = task2(p1);
        const p3 = task3(p1);
        const p4 = task4(p2, p3, [p1, p0, [p2, p3], p0], {
            x: p3,
            y: [p0, p1], // [h, i]
            z: { j: p3, k: p1 } // { j, k }
        });

        const results = st.runSync("in");

        expect(results(p0)).to.equal("in");
        expect(results(p1)).to.equal("in-1");
        expect(results(p2)).to.equal("in-1-2");
        expect(results(p3)).to.equal("in-1-3");
        expect(results(p4)).to.equal(
            [
                "in-1-2", // a
                "in-1-3", // b
                "in-1", // c
                "in", // d
                "in-1-2", // e
                "in-1-3", // f
                "in", // g
                "in", // h
                "in-1", // i
                "in-1-3", // j
                "in-1", // k
                "in-1-3" // x
            ].join("_")
        );
    });
});

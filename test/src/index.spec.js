/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const supertask = require("../../src");
const { Task } = supertask;

// Support modules
const { expect } = require("chai");

describe("magic", () => {
    it("should do what it does", () => {
        const task1 = Task.pure.sync(x => 3 * x * x + 5);
        const st = supertask();
        const opipe = task1(st.input);

        const results = st.runSync(7);

        expect(results(st.input)).to.equal(7);
        expect(results(opipe)).to.equal(152);
    });
});

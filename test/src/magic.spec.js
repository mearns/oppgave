/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const createInput = require("../../src/magic");
const { Task } = createInput;

// Support modules
const { expect } = require("chai");

describe("magic", () => {
    it("should do what it does", () => {
        const task1 = Task.pure.sync(x => 3 * x * x + 5);
        const input = createInput();
        const opipe = task1(input);

        // XXX:
    });
});

/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const Task = require("../../src");
const { createPipeline } = Task;

// Support modules
const chai = require("chai");
const { expect } = chai;

describe("oppgave", () => {
    it("should really have a description", () => {
        const taskUnderTest = Task.sync(x => x * x);
        const pipeline = createPipeline();
        const outputPipe = taskUnderTest(pipeline);

        // when
        const result = pipeline.syncRunner(outputPipe)(11);

        // then
        expect(result).to.equal(121);
    });
});

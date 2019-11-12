/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
import Task, { createPipeline } from "../src";

// Support modules
import sinon from "sinon";
import chai, { expect } from "chai";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";

chai.use(sinonChai);
chai.use(chaiAsPromised);

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

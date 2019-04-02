/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
import Task from '../src'

// Support modules
import sinon from 'sinon'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(sinonChai)
chai.use(chaiAsPromised)

describe('oppgave', () => {
  it('should support a basic graph of computation', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage([taskUnderTest.inputStage], function stageA ([input0, input1]) { return input0 + input1 })

    // when
    const res = await taskUnderTest.execute([15, 23])

    expect(res.getOutputs(stageA)).to.deep.equal([38])
  })
})

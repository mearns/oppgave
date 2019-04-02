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
  it('should support single-line inputs with scalar arguments', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inputStage, function stageA (a) { return 2 * a })

    // when
    const res = await taskUnderTest.execute(31)

    expect(res.getOutputs(stageA)).to.deep.equal(62)
  })

  it('should support single-line inputs with array arguments', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inputStage, function stageA (a) { return a.length })

    // when
    const res = await taskUnderTest.execute([3, 1, 4, 1, 5, 9])

    expect(res.getOutputs(stageA)).to.deep.equal(6)
  })

  it('should support fanning out a stage to two stages', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inputStage, function stageA (x) { return x * x })
    const stageB = taskUnderTest.addStage(taskUnderTest.inputStage, function stageB (x) { return 2 * x })

    // when
    const res = await taskUnderTest.execute(7)

    expect(res.getOutputs(stageA)).to.deep.equal(49)
    expect(res.getOutputs(stageB)).to.deep.equal(14)
  })

  it('should support an array of inputs to a stage', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inputStage, function stageA (x) { return x * x })
    const stageB = taskUnderTest.addStage(taskUnderTest.inputStage, function stageB (x) { return 2 * x })
    const stageC = taskUnderTest.addStage([stageA, stageB], function stageC ([a, b]) { return a + b + 9 })

    // when
    const res = await taskUnderTest.execute(5)

    expect(res.getOutputs(stageA)).to.deep.equal(25)
    expect(res.getOutputs(stageB)).to.deep.equal(10)
    expect(res.getOutputs(stageC)).to.deep.equal(44)
  })

  it('should support an object of inputs to a stage', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inputStage, function stageA (x) { return x * x })
    const stageB = taskUnderTest.addStage(taskUnderTest.inputStage, function stageB (x) { return 2 * x })
    const stageC = taskUnderTest.addStage({ a: stageA, b: stageB }, function stageC ({a, b}) { return a + b + 9 })

    // when
    const res = await taskUnderTest.execute(3)

    expect(res.getOutputs(stageA)).to.deep.equal(9)
    expect(res.getOutputs(stageB)).to.deep.equal(6)
    expect(res.getOutputs(stageC)).to.deep.equal(24)
  })
})

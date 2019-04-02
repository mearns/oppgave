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
  it('should support single input port with scalar arguments', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inport, function stageA (a) { return 2 * a })

    // when
    const res = await taskUnderTest.execute(31)

    expect(res.getOutputs(stageA)).to.deep.equal(62)
  })

  it('should support single input port with array arguments', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inport, function stageA (a) { return a.length })

    // when
    const res = await taskUnderTest.execute([3, 1, 4, 1, 5, 9])

    expect(res.getOutputs(stageA)).to.deep.equal(6)
  })

  it('should support an array of input ports to the task', async () => {
    // given
    const taskUnderTest = new Task(3)
    const stageA = taskUnderTest.addStage(taskUnderTest.inport[0], function stageA (i0) { return i0 * 7 })
    const stageB = taskUnderTest.addStage([taskUnderTest.inport[1], taskUnderTest.inport[2]], function stageB ([i1, i2]) { return i1 + i2 })

    // when
    const res = await taskUnderTest.execute([2, 3, 5])

    expect(res.getOutputs(stageA)).to.deep.equal(14)
    expect(res.getOutputs(stageB)).to.deep.equal(8)
  })

  it('should support an object of input ports to the task', async () => {
    // given
    const taskUnderTest = new Task(['a', 'b', 'c'])
    const stageA = taskUnderTest.addStage(taskUnderTest.inport.a, function stageA (a) { return a * 7 })
    const stageB = taskUnderTest.addStage([taskUnderTest.inport.b, taskUnderTest.inport.c], function stageB ([b, c]) { return b + c })

    // when
    const res = await taskUnderTest.execute({ a: 11, b: 7, c: 5 })

    expect(res.getOutputs(stageA)).to.deep.equal(77)
    expect(res.getOutputs(stageB)).to.deep.equal(12)
  })

  it('should support wiring a stage to two follow on stages', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inport, function stageA (x) { return x * x })
    const stageB = taskUnderTest.addStage(taskUnderTest.inport, function stageB (x) { return 2 * x })

    // when
    const res = await taskUnderTest.execute(7)

    expect(res.getOutputs(stageA)).to.deep.equal(49)
    expect(res.getOutputs(stageB)).to.deep.equal(14)
  })

  it('should support an array of wires into a stage', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inport, function stageA (x) { return x * x })
    const stageB = taskUnderTest.addStage(taskUnderTest.inport, function stageB (x) { return 2 * x })
    const stageC = taskUnderTest.addStage([stageA, stageB], function stageC ([a, b]) { return a + b + 9 })

    // when
    const res = await taskUnderTest.execute(5)

    expect(res.getOutputs(stageA)).to.deep.equal(25)
    expect(res.getOutputs(stageB)).to.deep.equal(10)
    expect(res.getOutputs(stageC)).to.deep.equal(44)
  })

  it('should support a single wire into a stage', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inport, function stageA (x) { return x * x })
    const stageB = taskUnderTest.addStage(stageA, function stageB (a) { return a + 31 })

    // when
    const res = await taskUnderTest.execute(23)

    expect(res.getOutputs(stageA)).to.deep.equal(529)
    expect(res.getOutputs(stageB)).to.deep.equal(560)
  })

  it('should support an object of wires into a stage', async () => {
    // given
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inport, function stageA (x) { return x * x })
    const stageB = taskUnderTest.addStage(taskUnderTest.inport, function stageB (x) { return 2 * x })
    const stageC = taskUnderTest.addStage({ a: stageA, b: stageB }, function stageC ({a, b}) { return a + b + 9 })

    // when
    const res = await taskUnderTest.execute(3)

    expect(res.getOutputs(stageA)).to.deep.equal(9)
    expect(res.getOutputs(stageB)).to.deep.equal(6)
    expect(res.getOutputs(stageC)).to.deep.equal(24)
  })

  it('should support an array of output ports', async () => {
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inport, function stageA (x) { return x * x })
    const stageB = taskUnderTest.addStage(taskUnderTest.inport, function stageB (x) { return 2 * x })
    const stageC = taskUnderTest.addStage(taskUnderTest.inport, function stageC (x) { return 3 * (x ** 3) })

    // when
    const res = await taskUnderTest.execute(5)

    expect(res.getOutputs([stageA, stageB, stageC])).to.deep.equal([
      25,
      10,
      375
    ])
  })

  it('should support an object of output ports', async () => {
    const taskUnderTest = new Task()
    const stageA = taskUnderTest.addStage(taskUnderTest.inport, function stageA (x) { return x * x })
    const stageB = taskUnderTest.addStage(taskUnderTest.inport, function stageB (x) { return 2 * x })
    const stageC = taskUnderTest.addStage(taskUnderTest.inport, function stageC (x) { return 3 * (x ** 3) })

    // when
    const res = await taskUnderTest.execute(4)

    expect(res.getOutputs({ a: stageA, b: stageB, c: stageC })).to.deep.equal({
      a: 16,
      b: 8,
      c: 192
    })
  })

  it('should support complex computation graphs', async () => {
    // given
    const taskUnderTest = new Task(['a', 'b', 'c'])
    const { a: inportA, b: inportB, c: inportC } = taskUnderTest.inport
    const stageD = taskUnderTest.addStage([inportA, inportC], function stageD ([a, c]) { return Promise.resolve(a + c) })
    const stageE = taskUnderTest.addStage({ b: inportB }, function stageE ({ b }) { return b * b })
    const stageF = taskUnderTest.addStage([stageD, inportA, inportB], async function stageF ([ d, a, b ]) {
      const i = await Promise.resolve(d + a)
      return i + b
    })
    const stageG = taskUnderTest.addStage({ d: stageD, e: stageE }, function stageG ({ d, e }) { return d + e })

    // when
    const res = await taskUnderTest.execute({ a: 2, b: 3, c: 4 })

    expect(res.getOutputs(stageD)).to.equal(6)
    expect(res.getOutputs(stageE)).to.equal(9)
    expect(res.getOutputs(stageF)).to.equal(11)
    expect(res.getOutputs(stageG)).to.equal(15)
  })

  it('should support the "withSingleInput" factory function', async () => {
    // given
    const taskUnderTest = Task.withSingleInput()

    // when
    const res = await taskUnderTest.execute(17)

    expect(res.getOutputs(taskUnderTest.inport)).to.equal(17)
  })

  it('should support the "withInputArray" factory function', async () => {
    // given
    const taskUnderTest = Task.withInputArray(3)

    // when
    const res = await taskUnderTest.execute([21, 23, 27])

    expect(res.getOutputs(taskUnderTest.inport)).to.deep.equal([21, 23, 27])
  })

  it('should support the "withInputsNamed" factory function', async () => {
    // given
    const taskUnderTest = Task.withInputsNamed(['a', 'b', 'c'])

    // when
    const res = await taskUnderTest.execute({ a: 1, b: true, c: 'see?' })

    expect(res.getOutputs(taskUnderTest.inport)).to.deep.equal({ a: 1, b: true, c: 'see?' })
  })

  it('should support the "withInputsShapedLike" factory function', async () => {
    // given
    const taskUnderTest = Task.withInputsShapedLike({ a: null, b: null, c: undefined })

    // when
    const res = await taskUnderTest.execute({ a: 1, b: true, c: 'see?' })

    expect(res.getOutputs(taskUnderTest.inport)).to.deep.equal({ a: 1, b: true, c: 'see?' })
  })

  // TODO: Test Failures.
})

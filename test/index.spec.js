/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
import defineTask from '../src'

// Support modules
import sinon from 'sinon'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(sinonChai)
chai.use(chaiAsPromised)

describe('oppgave', () => {
  describe('synchronous computation functions', () => {
    it('should execute the given computation function', () => {
      // given
      const computationFunc = sinon.spy()
      const taskUnderTest = defineTask([], computationFunc)

      // expect
      return taskUnderTest.execute()
        .then(() => {
          expect(computationFunc).to.have.been.calledOnce
          expect(computationFunc).to.have.been.calledWithExactly()
        })
    })

    it('should fulfill with the value returned by the given computation function', () => {
      // given
      const TEST_RESULT = '--test-value-314159--'
      const computationFunc = sinon.stub().returns(TEST_RESULT)
      const taskUnderTest = defineTask([], computationFunc)

      // expect
      return taskUnderTest.execute()
        .then((result) => {
          expect(result).to.equal(TEST_RESULT)
        })
    })

    it('should reject if the computation function throws', () => {
      const TEST_ERROR = new Error('--test-error-8660--')
      const computationFunc = sinon.stub().throws(TEST_ERROR)
      const taskUnderTest = defineTask([], computationFunc)

      // expect
      return expect(taskUnderTest.execute()).to.be.rejectedWith(TEST_ERROR)
    })

    it('should reject if the computation function rejects', () => {
      const TEST_ERROR = new Error('--test-error-8660--')
      const computationFunc = sinon.stub().callsFake(() => Promise.reject(TEST_ERROR))
      const taskUnderTest = defineTask([], computationFunc)

      // expect
      return expect(taskUnderTest.execute()).to.be.rejectedWith(TEST_ERROR)
    })
  })

  describe('input suppliers', () => {
    it('should invoke the computation function with the values provided by the input suppliers', () => {
      // given
      const INPUT_1 = '--test-input-1414--'
      const INPUT_2 = '--test-input-2718--'
      const inputSupplier1 = sinon.stub().returns(INPUT_1)
      const inputSupplier2 = sinon.stub().returns(INPUT_2)
      const computationFunc = sinon.spy()
      const taskUnderTest = defineTask([inputSupplier1, inputSupplier2], computationFunc)

      // expect
      return taskUnderTest.execute()
        .then(() => {
          expect(computationFunc).to.have.been.calledOnce
          expect(computationFunc).to.have.been.calledWithExactly(INPUT_1, INPUT_2)
          expect(inputSupplier1).to.have.been.calledOnce
          expect(inputSupplier2).to.have.been.calledOnce
          expect(inputSupplier1).to.have.been.calledWithExactly()
          expect(inputSupplier2).to.have.been.calledWithExactly()
        })
    })

    it('should work as well with promise-returning input suppliers', () => {
      const INPUT_1 = '--test-input-1618--'
      const INPUT_2 = '--test-input-2236--'
      const inputSupplier1 = sinon.stub().returns(INPUT_1)
      const inputSupplier2 = sinon.stub().callsFake(() => Promise.resolve(INPUT_2))
      const computationFunc = sinon.spy()
      const taskUnderTest = defineTask([inputSupplier1, inputSupplier2], computationFunc)

      // expect
      return taskUnderTest.execute()
        .then(() => {
          expect(computationFunc).to.have.been.calledOnce
          expect(computationFunc).to.have.been.calledWithExactly(INPUT_1, INPUT_2)
          expect(inputSupplier1).to.have.been.calledOnce
          expect(inputSupplier2).to.have.been.calledOnce
          expect(inputSupplier1).to.have.been.calledWithExactly()
          expect(inputSupplier2).to.have.been.calledWithExactly()
        })
    })

    it('should not invoke the computation if an input supplier throws', () => {
      const inputSupplier = sinon.stub().throws(new Error())
      const computationFunc = sinon.spy()
      const taskUnderTest = defineTask([inputSupplier], computationFunc)

      // expect
      return expect(taskUnderTest.execute()).to.be.rejected
        .then(() => {
          expect(computationFunc).to.not.have.been.called
        })
    })

    it('should reject if an input supplier throws', () => {
      const INPUT_ERROR = new Error('test-error-1234')
      const inputSupplier = sinon.stub().throws(INPUT_ERROR)
      const computationFunc = sinon.spy()
      const taskUnderTest = defineTask([inputSupplier], computationFunc)

      // expect
      return expect(taskUnderTest.execute()).to.be.rejectedWith(INPUT_ERROR)
    })

    it('should reject if an input supplier rejects', () => {
      const INPUT_ERROR = new Error('test-error-1234')
      const inputSupplier = sinon.stub().callsFake(() => Promise.reject(INPUT_ERROR))
      const computationFunc = sinon.spy()
      const taskUnderTest = defineTask([inputSupplier], computationFunc)

      // expect
      return expect(taskUnderTest.execute()).to.be.rejectedWith(INPUT_ERROR)
    })

    describe('input tasks', () => {
      it('should run an input task and provide the result as an input', () => {
        // given
        const inputTask = defineTask([() => 3, () => 7], (a, b) => a * b)
        const taskUnderTest = defineTask([() => 13, inputTask], (c, d) => c * d)

        // expect
        return expect(taskUnderTest.execute()).to.eventually.equal(3 * 7 * 13)
      })
    })
  })

  describe('trackers', () => {
    let clock

    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it('should record all tasks that are executed with the tracker', () => {
      // given
      const task1 = defineTask(
        [
          () => {
            clock.tick(100)
            return 3
          },
          () => {
            clock.tick(100)
            return 5
          }
        ],
        () => {
          clock.tick(100)
          return 41
        }
      )
      const task2 = defineTask(
        [
          () => {
            clock.tick(100)
            return 7
          }
        ],
        () => {
          clock.tick(100)
          return 43
        }
      )

      // when
      const tracker = task1.execute()
      return tracker
        .then(() => task2.runWithTracker(tracker))
        .then(() => {
          expect(tracker._tasksExecuted).to.have.length(2)

          expect(tracker._tasksExecuted[0]._startTime).to.equal(0)
          expect(tracker._tasksExecuted[0]._inputs[0]._result).to.equal(3)
          expect(tracker._tasksExecuted[0]._inputs[1]._result).to.equal(5)
          expect(tracker._tasksExecuted[0]._executionStart).to.equal(200)
          expect(tracker._tasksExecuted[0]._executionEnd).to.equal(300)
          expect(tracker._tasksExecuted[0]._result).to.equal(41)
          expect(tracker._tasksExecuted[0]._error).to.be.null

          expect(tracker._tasksExecuted[1]._startTime).to.equal(300)
          expect(tracker._tasksExecuted[1]._inputs[0]._result).to.equal(7)
          expect(tracker._tasksExecuted[1]._executionStart).to.equal(400)
          expect(tracker._tasksExecuted[1]._executionEnd).to.equal(500)
          expect(tracker._tasksExecuted[1]._result).to.equal(43)
          expect(tracker._tasksExecuted[1]._error).to.be.null
        })
    })
  })
})

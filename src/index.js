import Promise from 'bluebird'
import Tracker from './tracker'

export default function defineTask (inputs, func) {
  return new Task(inputs, func)
}

class Task {
  constructor (inputSuppliers, func, { name } = {}) {
    this.name = name || func.name
    this.inputs = inputSuppliers.map((inputSupplier, idx) => {
      const input = { idx, name: inputSupplier.name }
      if (inputSupplier instanceof Task) {
        input.method = (inputTracker) => inputSupplier.runWithTracker(inputTracker.createSubTracker())
      } else {
        const method = Promise.method(inputSupplier)
        input.method = (inputTracker) => method()
      }
      return input
    })
    this.method = Promise.method(func)
  }

  runWithTracker (tracker) {
    const taskTracker = tracker.startingTask(this)
    return Promise.map(this.inputs, input => this._runInput(taskTracker, input))
      .tapCatch(taskTracker.taskAborted)
      .then(inputs => {
        taskTracker.taskExecutingWithInputs(inputs)
        return this.method(...inputs)
          .tap(taskTracker.taskCompleted)
          .tapCatch(taskTracker.taskFailed)
      })
  }

  _runInput (taskTracker, input) {
    const inputTracker = taskTracker.startingInput(input)
    return input.method(inputTracker)
      .tap(inputTracker.inputCompleted)
      .tapCatch(inputTracker.inputFailed)
  }

  execute (config) {
    const tracker = new Tracker(config)
    const p = this.runWithTracker(tracker)
    tracker.then = p.then.bind(p)
    return tracker
  }
}

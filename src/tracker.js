
export default class Tracker {
  constructor ({ clock = () => Date.now() } = {}) {
    this._clock = clock
    this._tasksExecuted = []
  }

  startingTask (task) {
    const taskTracker = new TaskTracker(task, { clock: this._clock })
    this._tasksExecuted.push(taskTracker)
    return taskTracker
  }
}

class TaskTracker {
  constructor (task, { clock }) {
    this._task = task
    this._clock = clock
    this._inputs = []

    this._startTime = this._clock()
    this._taskAborted = null
    this._executionStart = null
    this._executionEnd = null
    this._taskFailed = null
    this._result = null
    this._error = null

    this.taskAborted = this.taskAborted.bind(this)
    this.taskCompleted = this.taskCompleted.bind(this)
    this.taskFailed = this.taskFailed.bind(this)
  }

  /**
   * Indicates that the task was never executed, possibly because of an error running one of the inputs.
   */
  taskAborted () {
    this._taskAborted = true
  }

  startingInput (input) {
    const inputTracker = new InputTracker(input, { clock: this._clock })
    this._inputs.push(inputTracker)
    return inputTracker
  }

  taskExecutingWithInputs (inputValues) {
    this._taskAborted = false
    this._executionStart = this._clock()
  }

  taskCompleted (result) {
    this._executionEnd = this._clock()
    this._taskFailed = false
    this._result = result
  }

  taskFailed (err) {
    this._executionEnd = this._clock()
    this._taskFailed = true
    this._error = err
  }
}

class InputTracker {
  constructor (input, { clock }) {
    this._input = input
    this._clock = clock
    this._subTracker = null

    this._startTime = this._clock()
    this._endTime = null
    this._inputFailed = null
    this._result = null
    this._error = null

    this.inputCompleted = this.inputCompleted.bind(this)
    this.inputFailed = this.inputFailed.bind(this)
  }

  createSubTracker () {
    if (this._subTracker) {
      throw new Error('Input Tracker was asked for multiple subtrackers.')
    }
    this._subTracker = new Tracker({ clock: this._clock })
    return this._subTracker
  }

  inputCompleted (result) {
    this._endTime = this._clock()
    this._inputFailed = false
    this._result = result
  }

  inputFailed (err) {
    this._endTime = this._clock()
    this._inputFailed = true
    this._error = err
  }
}

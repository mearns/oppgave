import Promise from 'bluebird'
import Tracker from './tracker'
import buildObject from 'build-object-better'
import ExtrinsicPromise from 'extrinsic-promises'

class Stage {
  constructor (stageIdx) {
    this._addPair = (pairs, second) => {
      pairs.push([stageIdx, second])
    }
    this._getFromArray = (ari) => ari[stageIdx]
  }
}

function isStage (stage) {
  return stage instanceof Stage
}

function createStage (stageIdx) {
  return new Stage(stageIdx)
}

function namedFunction (name, func) {
  return ({
    [name]: function (...args) { return func(...args) }
  })[name]
}

export default class Task {
  constructor (inputShape = null) {
    // An ordered pair of node (indices into this._nodes, below)
    this._arrows = []

    // Each node is just a transformation (possibly impure) from inputs to a value.
    this._nodes = [{
      computer: namedFunction('--input--', input => input),
      chainFromStagePromises: () => { throw new Error('The input node\'s chainFromStagePromises method should not be used') }
    }]

    const inputStage = createStage(0)
    if (inputShape == null) {
      this.inport = this.addStage(inputStage, namedFunction('--inport--', input => input))
    } else if (Number.isInteger(inputShape)) {
      this.inport = new Array(inputShape).fill(null).map((ignore, idx) => {
        return this.addStage(inputStage, namedFunction(`--inport-${idx}--`, (input) => input[idx]))
      })
    } else if (Array.isArray(inputShape)) {
      this.inport = buildObject(
        inputShape,
        inputName => this.addStage(inputStage, namedFunction(`--inport-${inputName}--`, (input) => input[inputName]))
      )
    } else {
      throw new TypeError(`Unexpected input port shape: ${inputShape}`)
    }
  }

  addStage (inputShape, computer) {
    const nodeIdx = this._nodes.length
    let chainFromStagePromises
    let inputStages
    if (isStage(inputShape)) {
      const inputStage = inputShape
      inputStages = [inputStage]
      chainFromStagePromises = (inputPromises) => inputStage._getFromArray(inputPromises)
    } else if (Array.isArray(inputShape)) {
      const arrayOfInputStages = inputShape
      inputStages = arrayOfInputStages
      chainFromStagePromises = (inputPromises) => Promise.map(arrayOfInputStages, inputStage => inputStage._getFromArray(inputPromises))
    } else {
      const objectOfInputStages = inputShape
      inputStages = Object.values(objectOfInputStages)
      chainFromStagePromises = (inputPromises) => Promise.map(
        Object.entries(objectOfInputStages),
        ([inputName, inputStage]) => inputStage._getFromArray(inputPromises).then(inputValue => [inputName, inputValue])
      )
        .then(inputEntries => buildObject(inputEntries))
    }
    for (let inputStage of inputStages) {
      inputStage._addPair(this._arrows, nodeIdx)
    }
    this._nodes.push({ computer, chainFromStagePromises })
    return createStage(nodeIdx)
  }

  execute (input, tracker = Tracker.dummy) {
    const nodes = []
    const stagePromises = []
    for (let { computer, chainFromStagePromises } of this._nodes) {
      const node = {
        inputPromises: [],
        outputPromise: new ExtrinsicPromise(),
        computer,
        chainFromStagePromises,
        name: computer.name,
        idx: nodes.length
      }
      nodes.push(node)
      stagePromises.push(node.outputPromise)
    }
    const [inputNode] = nodes
    inputNode.chainFromStagePromises = () => Promise.resolve(input)

    for (let node of nodes) {
      const inputStagesReady = node.chainFromStagePromises(stagePromises)
      const stageComplete = inputStagesReady
        .then(inputs => {
          tracker.stageStarted(node.idx, inputs);
          return node.computer(inputs)
        })
        .then(
          res => {
            tracker.stageCompleted(node.idx, res)
            return res
          },
          error => {
            tracker.stageFailed(node.idx, error)
            throw error
          }
        )
      node.outputPromise.adopt(stageComplete);
    }

    const p = Promise.all(stagePromises)
      .then(stageValues => ({
        getResult: (stages) => {
          if (isStage(stages)) {
            return stages._getFromArray(stageValues)
          } else if (Array.isArray(stages)) {
            return stages.map(stage => stage._getFromArray(stageValues))
          } else if (typeof stages === 'object') {
            return buildObject(
              Object.keys(stages),
              outputName => stages[outputName]._getFromArray(stageValues)
            )
          } else {
            throw new TypeError(`Unknown output shape: ${stages}`)
          }
        }
      }))

    p.waitFor = (stages) => {
      if (isStage(stages)) {
        return stages._getFromArray(stagePromises)
      } else if (Array.isArray(stages)) {
        return Promise.map(stages, stage => stage._getFromArray(stagePromises))
      } else if (typeof stages === 'object') {
        return Promise.map(Object.entries(stages), ([propName, stage]) => {
          return stage._getFromArray(stagePromises).then(stageValue => ([propName, stageValue]))
        }).then(buildObject)
      } else {
        throw new TypeError(`Unknown stage shape: ${stages}`)
      }
    }
    return p
  }
}
Task.withSingleInput = function () {
  return new Task(null)
}

Task.withInputArray = function (length) {
  return new Task(length)
}

Task.withInputsNamed = function (names) {
  return new Task(names)
}

Task.withInputsShapedLike = function (obj) {
  return new Task(Object.keys(obj))
}

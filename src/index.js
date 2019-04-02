import Promise from 'bluebird'
import Tracker from './tracker'
import buildObject from 'build-object-better'
import ExtrinsicPromise from 'extrinsic-promises'
import { strict as assert } from 'assert'

class Stage {
  constructor (stageIdx) {
    this._addPair = (pairs, second) => {
      pairs.push([stageIdx, second])
    }
    this._getFromArray = (ari) => ari[stageIdx]
  }
}

function isPromise (p) {
  return !!(p && typeof p.then === 'function')
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
      computer: namedFunction('--fan-out--', input => input),
      chainFromStagePromises: () => { throw new Error('The input node\'s chainFromStagePromises method should not be used') }
    }]

    const fanOutStage = createStage(0)
    if (inputShape == null) {
      this.inputStage = this.addStage(fanOutStage, namedFunction('--input--', (input) => input))
    } else if (Number.isInteger(inputShape)) {
      this.inputStage = new Array(inputShape).fill(null).map((ignore, idx) => {
        this.addStage(fanOutStage, namedFunction(`--input-${idx}--`, (input) => input[idx]))
      })
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

  execute (input) {
    const nodes = []
    const stagePromises = []
    for (let { computer, chainFromStagePromises } of this._nodes) {
      const node = {
        inputPromises: [],
        outputPromise: new ExtrinsicPromise(),
        computer,
        chainFromStagePromises,
        name: computer.name
      }
      nodes.push(node)
      stagePromises.push(node.outputPromise)
    }
    const [inputNode] = nodes
    inputNode.chainFromStagePromises = () => Promise.resolve(input)

    for (let node of nodes) {
      node.ready = node.chainFromStagePromises(stagePromises)
      node.outputPromise.adopt(node.ready.then(inputs => {
        console.log(`(${node.name}) Received inputs:`, JSON.stringify(inputs))
        return node.computer(inputs)
      }))
    }

    return Promise.all(stagePromises)
      .then(stageValues => ({
        getOutputs: (stage) => stage._getFromArray(stageValues)
      }))
  }
}

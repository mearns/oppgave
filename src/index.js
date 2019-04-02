import Promise from 'bluebird'
import Tracker from './tracker'
import buildObject from 'build-object-better'
import ExtrinsicPromise from 'extrinsic-promises'

function isPromise (p) {
  return !!(p && typeof p.then === 'function')
}

function createStage (stageIdx) {
  return {
    _addPair: (pairs, second) => {
      pairs.push([stageIdx, second])
    },
    _getFromArray: (ari) => ari[stageIdx]
  }
}

export default class Task {
  constructor () {
    // Each node is just a transformation (possibly impure) from inputs to a value.
    const inputFunction = function __input__ (input) { return input }
    this._nodes = [inputFunction]

    // An ordered pair of node (indices)
    this._arrows = []

    this.inputStage = createStage(0)
  }

  addStage (inputStages, computer) {
    const nodeIdx = this._nodes.length
    this._nodes.push(computer)
    for (let stage of inputStages) {
      stage._addPair(this._arrows, nodeIdx)
    }
    return createStage(nodeIdx)
  }

  execute (input) {
    const nodes = []
    const stagePromises = []
    for (let computer of this._nodes) {
      const node = {
        inputPromises: [],
        outputPromise: new ExtrinsicPromise(),
        computer,
        name: computer.name
      }
      nodes.push(node)
      stagePromises.push(node.outputPromise)
    }
    const [inputNode] = nodes

    for (let [srcIdx, sinkIdx] of this._arrows) {
      nodes[sinkIdx].inputPromises.push(nodes[srcIdx].outputPromise)
    }
    inputNode.inputPromises = [Promise.resolve(input)]

    for (let node of nodes) {
      node.ready = Promise.all(node.inputPromises)
      node.outputPromise.adopt(node.ready.then(inputs => {
        console.log(`(${node.name}) Received inputs:`, JSON.stringify(inputs))
        return node.computer(inputs)
      }))
    }

    return Promise.all(stagePromises)
      .then(stageValues => ({
        getOutputs: (...stages) => stages.map(stage => stage._getFromArray(stageValues))
      }))
  }
}

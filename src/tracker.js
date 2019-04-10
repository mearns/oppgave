import assert from 'assert';

export default class Tracker {
  constructor ({ clock = () => Date.now() } = {}) {
    this._clock = clock
    this.timeline = []
  }

  stageStarted (idx, inputs) {
    const stageTracker = {
      stageIdx: idx,
      inputs,
      startTime: this._clock()
    }
    this.timeline.push(stageTracker);
  }

  stageCompleted (idx, result) {
    const stageTracker = this.timeline[this.timeline.length - 1]
    assert.strictEqual(stageTracker.stageIdx, idx)
    stageTracker.endTime = this._clock()
    stageTracker.output = result
  }

  stageFailed (idx, error) {
    const stageTracker = this.timeline[this.timeline.length - 1]
    assert.strictEqual(stageTracker.stageIdx, idx)
    stageTracker.endTime = this._clock()
    stageTracker.error = error
  }
}

Tracker.dummy = {
  stageStarted() {},
  stageCompleted() {},
  stageFailed() {}
}

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;

var _sourceMapSupport = _interopRequireDefault(require("source-map-support"));

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

_sourceMapSupport.default.install();

class Tracker {
    constructor({ clock = () => Date.now() } = {}) {
        this._clock = clock;
        this.timeline = [];
    }

    stageStarted(idx, inputs) {
        const stageTracker = {
            stageIdx: idx,
            inputs,
            startTime: this._clock()
        };
        this.timeline.push(stageTracker);
    }

    stageCompleted(idx, result) {
        const stageTracker = this.timeline[this.timeline.length - 1];

        _assert.default.strictEqual(stageTracker.stageIdx, idx);

        stageTracker.endTime = this._clock();
        stageTracker.output = result;
    }

    stageFailed(idx, error) {
        const stageTracker = this.timeline[this.timeline.length - 1];

        _assert.default.strictEqual(stageTracker.stageIdx, idx);

        stageTracker.endTime = this._clock();
        stageTracker.error = error;
    }
}

exports.default = Tracker;
Tracker.dummy = {
    stageStarted() {},

    stageCompleted() {},

    stageFailed() {}
};
//# sourceMappingURL=tracker.js.map

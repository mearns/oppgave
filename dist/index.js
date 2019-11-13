"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;

var _bluebird = _interopRequireDefault(require("bluebird"));

var _tracker = _interopRequireDefault(require("./tracker"));

var _buildObjectBetter = _interopRequireDefault(require("build-object-better"));

var _extrinsicPromises = _interopRequireDefault(require("extrinsic-promises"));

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Stage {
    constructor(stageIdx) {
        this._addPair = (pairs, second) => {
            pairs.push([stageIdx, second]);
        };

        this._getFromArray = ari => ari[stageIdx];
    }
}

function isStage(stage) {
    return stage instanceof Stage;
}

function createStage(stageIdx) {
    return new Stage(stageIdx);
}

function namedFunction(name, func) {
    return {
        [name]: function(...args) {
            return func(...args);
        }
    }[name];
}

class Task {
    constructor(inputShape = null) {
        // An ordered pair of node (indices into this._nodes, below)
        this._arrows = []; // Each node is just a transformation (possibly impure) from inputs to a value.

        this._nodes = [
            {
                computer: namedFunction("--input--", input => input),
                chainFromStagePromises: () => {
                    throw new Error(
                        "The input node's chainFromStagePromises method should not be used"
                    );
                }
            }
        ];
        const inputStage = createStage(0);

        if (inputShape == null) {
            this.inport = this.addStage(
                inputStage,
                namedFunction("--inport--", input => input)
            );
        } else if (Number.isInteger(inputShape)) {
            this.inport = new Array(inputShape)
                .fill(null)
                .map((ignore, idx) => {
                    return this.addStage(
                        inputStage,
                        namedFunction(`--inport-${idx}--`, input => input[idx])
                    );
                });
        } else if (Array.isArray(inputShape)) {
            this.inport = (0, _buildObjectBetter.default)(
                inputShape,
                inputName =>
                    this.addStage(
                        inputStage,
                        namedFunction(
                            `--inport-${inputName}--`,
                            input => input[inputName]
                        )
                    )
            );
        } else {
            throw new TypeError(`Unexpected input port shape: ${inputShape}`);
        }
    }

    addStage(inputShape, computer) {
        const nodeIdx = this._nodes.length;
        let chainFromStagePromises;
        let inputStages;

        if (isStage(inputShape)) {
            const inputStage = inputShape;
            inputStages = [inputStage];

            chainFromStagePromises = inputPromises =>
                inputStage._getFromArray(inputPromises);
        } else if (Array.isArray(inputShape)) {
            const arrayOfInputStages = inputShape;
            inputStages = arrayOfInputStages;

            chainFromStagePromises = inputPromises =>
                _bluebird.default.map(arrayOfInputStages, inputStage =>
                    inputStage._getFromArray(inputPromises)
                );
        } else {
            const objectOfInputStages = inputShape;
            inputStages = Object.values(objectOfInputStages);

            chainFromStagePromises = inputPromises =>
                _bluebird.default
                    .map(
                        Object.entries(objectOfInputStages),
                        ([inputName, inputStage]) =>
                            inputStage
                                ._getFromArray(inputPromises)
                                .then(inputValue => [inputName, inputValue])
                    )
                    .then(inputEntries =>
                        (0, _buildObjectBetter.default)(inputEntries)
                    );
        }

        for (let inputStage of inputStages) {
            inputStage._addPair(this._arrows, nodeIdx);
        }

        this._nodes.push({
            computer,
            chainFromStagePromises
        });

        return createStage(nodeIdx);
    }

    execute(input, tracker = _tracker.default.dummy) {
        const nodes = [];
        const stagePromises = [];

        for (let _ref of this._nodes) {
            let { computer, chainFromStagePromises } = _ref;
            const node = {
                inputPromises: [],
                outputPromise: new _extrinsicPromises.default(),
                computer,
                chainFromStagePromises,
                name: computer.name,
                idx: nodes.length
            };
            nodes.push(node);
            stagePromises.push(node.outputPromise);
        }

        const [inputNode] = nodes;

        inputNode.chainFromStagePromises = () =>
            _bluebird.default.resolve(input);

        for (let node of nodes) {
            const inputStagesReady = node.chainFromStagePromises(stagePromises);
            const stageComplete = inputStagesReady
                .then(inputs => {
                    tracker.stageStarted(node.idx, inputs);
                    return node.computer(input);
                })
                .then(
                    res => {
                        tracker.stageCompleted(node.idx, res);
                        return res;
                    },
                    error => {
                        tracker.stageFailed(node.idx, error);
                        throw error;
                    }
                );
            node.outputPromise.adopt(stageComplete);
        }

        const p = _bluebird.default.all(stagePromises).then(stageValues => ({
            getResult: stages => {
                if (isStage(stages)) {
                    return stages._getFromArray(stageValues);
                } else if (Array.isArray(stages)) {
                    return stages.map(stage =>
                        stage._getFromArray(stageValues)
                    );
                } else if (typeof stages === "object") {
                    return (0, _buildObjectBetter.default)(
                        Object.keys(stages),
                        outputName =>
                            stages[outputName]._getFromArray(stageValues)
                    );
                } else {
                    throw new TypeError(`Unknown output shape: ${stages}`);
                }
            }
        }));

        p.waitFor = stages => {
            if (isStage(stages)) {
                return stages._getFromArray(stagePromises);
            } else if (Array.isArray(stages)) {
                return _bluebird.default.map(stages, stage =>
                    stage._getFromArray(stagePromises)
                );
            } else if (typeof stages === "object") {
                return _bluebird.default
                    .map(Object.entries(stages), ([propName, stage]) => {
                        return stage
                            ._getFromArray(stagePromises)
                            .then(stageValue => [propName, stageValue]);
                    })
                    .then(_buildObjectBetter.default);
            } else {
                throw new TypeError(`Unknown stage shape: ${stages}`);
            }
        };

        return p;
    }
}

exports.default = Task;

Task.withSingleInput = function() {
    return new Task(null);
};

Task.withInputArray = function(length) {
    return new Task(length);
};

Task.withInputsNamed = function(names) {
    return new Task(names);
};

Task.withInputsShapedLike = function(obj) {
    return new Task(Object.keys(obj));
};

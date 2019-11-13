"use strict";

var _sourceMapSupport = _interopRequireDefault(require("source-map-support"));

var _src = _interopRequireDefault(require("../src"));

var _sinon = _interopRequireDefault(require("sinon"));

var _chai = _interopRequireWildcard(require("chai"));

var _sinonChai = _interopRequireDefault(require("sinon-chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc =
                        Object.defineProperty && Object.getOwnPropertyDescriptor
                            ? Object.getOwnPropertyDescriptor(obj, key)
                            : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

_sourceMapSupport.default.install();

_chai.default.use(_sinonChai.default);

_chai.default.use(_chaiAsPromised.default);

describe("oppgave", () => {
    it("should support single input port with scalar arguments", async () => {
        // given
        const taskUnderTest = new _src.default();
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageA(a) {
                return 2 * a;
            }
        ); // when

        const res = await taskUnderTest.execute(31);
        (0, _chai.expect)(res.getResult(stageA)).to.deep.equal(62);
    });
    it("should support single input port with array arguments", async () => {
        // given
        const taskUnderTest = new _src.default();
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageA(a) {
                return a.length;
            }
        ); // when

        const res = await taskUnderTest.execute([3, 1, 4, 1, 5, 9]);
        (0, _chai.expect)(res.getResult(stageA)).to.deep.equal(6);
    });
    it("should support an array of input ports to the task", async () => {
        // given
        const taskUnderTest = new _src.default(3);
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport[0],
            function stageA(i0) {
                return i0 * 7;
            }
        );
        const stageB = taskUnderTest.addStage(
            [taskUnderTest.inport[1], taskUnderTest.inport[2]],
            function stageB([i1, i2]) {
                return i1 + i2;
            }
        ); // when

        const res = await taskUnderTest.execute([2, 3, 5]);
        (0, _chai.expect)(res.getResult(stageA)).to.deep.equal(14);
        (0, _chai.expect)(res.getResult(stageB)).to.deep.equal(8);
    });
    it("should support an object of input ports to the task", async () => {
        // given
        const taskUnderTest = new _src.default(["a", "b", "c"]);
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport.a,
            function stageA(a) {
                return a * 7;
            }
        );
        const stageB = taskUnderTest.addStage(
            [taskUnderTest.inport.b, taskUnderTest.inport.c],
            function stageB([b, c]) {
                return b + c;
            }
        ); // when

        const res = await taskUnderTest.execute({
            a: 11,
            b: 7,
            c: 5
        });
        (0, _chai.expect)(res.getResult(stageA)).to.deep.equal(77);
        (0, _chai.expect)(res.getResult(stageB)).to.deep.equal(12);
    });
    it("should support wiring a stage to two follow on stages", async () => {
        // given
        const taskUnderTest = new _src.default();
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageA(x) {
                return x * x;
            }
        );
        const stageB = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageB(x) {
                return 2 * x;
            }
        ); // when

        const res = await taskUnderTest.execute(7);
        (0, _chai.expect)(res.getResult(stageA)).to.deep.equal(49);
        (0, _chai.expect)(res.getResult(stageB)).to.deep.equal(14);
    });
    it("should support an array of wires into a stage", async () => {
        // given
        const taskUnderTest = new _src.default();
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageA(x) {
                return x * x;
            }
        );
        const stageB = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageB(x) {
                return 2 * x;
            }
        );
        const stageC = taskUnderTest.addStage(
            [stageA, stageB],
            function stageC([a, b]) {
                return a + b + 9;
            }
        ); // when

        const res = await taskUnderTest.execute(5);
        (0, _chai.expect)(res.getResult(stageA)).to.deep.equal(25);
        (0, _chai.expect)(res.getResult(stageB)).to.deep.equal(10);
        (0, _chai.expect)(res.getResult(stageC)).to.deep.equal(44);
    });
    it("should support a single wire into a stage", async () => {
        // given
        const taskUnderTest = new _src.default();
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageA(x) {
                return x * x;
            }
        );
        const stageB = taskUnderTest.addStage(stageA, function stageB(a) {
            return a + 31;
        }); // when

        const res = await taskUnderTest.execute(23);
        (0, _chai.expect)(res.getResult(stageA)).to.deep.equal(529);
        (0, _chai.expect)(res.getResult(stageB)).to.deep.equal(560);
    });
    it("should support an object of wires into a stage", async () => {
        // given
        const taskUnderTest = new _src.default();
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageA(x) {
                return x * x;
            }
        );
        const stageB = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageB(x) {
                return 2 * x;
            }
        );
        const stageC = taskUnderTest.addStage(
            {
                a: stageA,
                b: stageB
            },
            function stageC({ a, b }) {
                return a + b + 9;
            }
        ); // when

        const res = await taskUnderTest.execute(3);
        (0, _chai.expect)(res.getResult(stageA)).to.deep.equal(9);
        (0, _chai.expect)(res.getResult(stageB)).to.deep.equal(6);
        (0, _chai.expect)(res.getResult(stageC)).to.deep.equal(24);
    });
    it("should support an array of output ports", async () => {
        const taskUnderTest = new _src.default();
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageA(x) {
                return x * x;
            }
        );
        const stageB = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageB(x) {
                return 2 * x;
            }
        );
        const stageC = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageC(x) {
                return 3 * x ** 3;
            }
        ); // when

        const res = await taskUnderTest.execute(5);
        (0, _chai.expect)(
            res.getResult([stageA, stageB, stageC])
        ).to.deep.equal([25, 10, 375]);
    });
    it("should support an object of output ports", async () => {
        const taskUnderTest = new _src.default();
        const stageA = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageA(x) {
                return x * x;
            }
        );
        const stageB = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageB(x) {
                return 2 * x;
            }
        );
        const stageC = taskUnderTest.addStage(
            taskUnderTest.inport,
            function stageC(x) {
                return 3 * x ** 3;
            }
        ); // when

        const res = await taskUnderTest.execute(4);
        (0, _chai.expect)(
            res.getResult({
                a: stageA,
                b: stageB,
                c: stageC
            })
        ).to.deep.equal({
            a: 16,
            b: 8,
            c: 192
        });
    });
    it("should support complex computation graphs", async () => {
        // given
        const taskUnderTest = new _src.default(["a", "b", "c"]);
        const { a: inportA, b: inportB, c: inportC } = taskUnderTest.inport;
        const stageD = taskUnderTest.addStage(
            [inportA, inportC],
            function stageD([a, c]) {
                return Promise.resolve(a + c);
            }
        );
        const stageE = taskUnderTest.addStage(
            {
                b: inportB
            },
            function stageE({ b }) {
                return b * b;
            }
        );
        const stageF = taskUnderTest.addStage(
            [stageD, inportA, inportB],
            async function stageF([d, a, b]) {
                const i = await Promise.resolve(d + a);
                return i + b;
            }
        );
        const stageG = taskUnderTest.addStage(
            {
                d: stageD,
                e: stageE
            },
            function stageG({ d, e }) {
                return d + e;
            }
        ); // when

        const res = await taskUnderTest.execute({
            a: 2,
            b: 3,
            c: 4
        });
        (0, _chai.expect)(res.getResult(stageD)).to.equal(6);
        (0, _chai.expect)(res.getResult(stageE)).to.equal(9);
        (0, _chai.expect)(res.getResult(stageF)).to.equal(11);
        (0, _chai.expect)(res.getResult(stageG)).to.equal(15);
    });
    it('should support the "withSingleInput" factory function', async () => {
        // given
        const taskUnderTest = _src.default.withSingleInput(); // when

        const res = await taskUnderTest.execute(17);
        (0, _chai.expect)(res.getResult(taskUnderTest.inport)).to.equal(17);
    });
    it('should support the "withInputArray" factory function', async () => {
        // given
        const taskUnderTest = _src.default.withInputArray(3); // when

        const res = await taskUnderTest.execute([21, 23, 27]);
        (0, _chai.expect)(res.getResult(taskUnderTest.inport)).to.deep.equal([
            21,
            23,
            27
        ]);
    });
    it('should support the "withInputsNamed" factory function', async () => {
        // given
        const taskUnderTest = _src.default.withInputsNamed(["a", "b", "c"]); // when

        const res = await taskUnderTest.execute({
            a: 1,
            b: true,
            c: "see?"
        });
        (0, _chai.expect)(res.getResult(taskUnderTest.inport)).to.deep.equal({
            a: 1,
            b: true,
            c: "see?"
        });
    });
    it('should support the "withInputsShapedLike" factory function', async () => {
        // given
        const taskUnderTest = _src.default.withInputsShapedLike({
            a: null,
            b: null,
            c: undefined
        }); // when

        const res = await taskUnderTest.execute({
            a: 1,
            b: true,
            c: "see?"
        });
        (0, _chai.expect)(res.getResult(taskUnderTest.inport)).to.deep.equal({
            a: 1,
            b: true,
            c: "see?"
        });
    });
    it("should support a single stage waitFor", async () => {
        // given
        const taskUnderTest = _src.default.withSingleInput();

        const stageA = taskUnderTest.addStage(taskUnderTest.inport, i => i * i);
        const stageB = taskUnderTest.addStage(
            taskUnderTest.inport,
            () => new Promise(() => {})
        ); // when

        const res = await taskUnderTest.execute(17).waitFor(stageA);
        (0, _chai.expect)(res).to.equal(289);
    });
    it("should support an array of stages for waitFor", async () => {
        // given
        const taskUnderTest = _src.default.withSingleInput();

        const stageA = taskUnderTest.addStage(taskUnderTest.inport, i => i * i);
        const stageB = taskUnderTest.addStage(taskUnderTest.inport, i =>
            Promise.resolve(3 * i)
        ); // when

        const res = await taskUnderTest.execute(6).waitFor([stageA, stageB]);
        (0, _chai.expect)(res).to.deep.equal([36, 18]);
    });
    it("should support an object of stages for waitFor", async () => {
        // given
        const taskUnderTest = _src.default.withSingleInput();

        const stageA = taskUnderTest.addStage(taskUnderTest.inport, i => i * i);
        const stageB = taskUnderTest.addStage(taskUnderTest.inport, i =>
            Promise.resolve(3 * i)
        ); // when

        const res = await taskUnderTest.execute(12).waitFor({
            a: stageA,
            b: stageB,
            c: stageB
        });
        (0, _chai.expect)(res).to.deep.equal({
            a: 144,
            b: 36,
            c: 36
        });
    }); // TODO: Test Failures.
});
//# sourceMappingURL=index.spec.js.map

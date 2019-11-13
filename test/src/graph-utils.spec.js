/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const { topologicalSort } = require("../../src/graph-utils");

// Support modules
const { expect } = require("chai");

describe("graph-utils", () => {
    describe("getMaximumDepths(...)", () => {
        it("test case 1", () => {
            const result = topologicalSort([[1, 2], [], [1]]);
            expect(result).to.deep.equal([0, 2, 1]);
        });

        it("should detect cycles", () => {
            expect(() => topologicalSort([[1], [2], [1]])).to.throw(
                /not topologically sortable/
            );
        });
    });
});

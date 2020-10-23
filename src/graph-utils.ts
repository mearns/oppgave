import assert from "assert";

class UnsortableGraphError extends Error {
  constructor(sortedNodes, unsortableNodes) {
    super(
      `Graph is not topologically sortable: it may contain cycles, or may be disconnected`
    );
    this.name = "UnsortableGraphError";
    Error.captureStackTrace(this, UnsortableGraphError);
    this.sortedNodes = sortedNodes;
    this.unsortableNodes = unsortableNodes;
  }
}

function calculateInDegreesFromOutEdgeList(outEdges) {
  const inDegrees = new Array(outEdges.length).fill(0);
  for (const dests of outEdges) {
    for (const v of dests) {
      inDegrees[v]++;
    }
  }
  return inDegrees;
}

export function topologicalSort(outEdges) {
  const sorted = [];
  const remainingInDegree = calculateInDegreesFromOutEdgeList(outEdges);
  const queue = remainingInDegree
    .map((inDegree, idx) => [inDegree, idx])
    .filter(([inDegree]) => inDegree === 0)
    .map(([inDegree, idx]) => idx);
  let nodesVisited = 0;
  while (queue.length) {
    const v = queue.shift();
    sorted.push(v);
    nodesVisited++;
    for (const dest of outEdges[v]) {
      remainingInDegree[dest]--;
      assert(remainingInDegree[dest] >= 0);
      if (remainingInDegree[dest] === 0) {
        queue.push(dest);
      }
    }
  }
  if (nodesVisited !== outEdges.length) {
    throw new UnsortableGraphError(
      sorted,
      remainingInDegree
        .map((inDegree, idx) => [inDegree, idx])
        .filter(([inDegree]) => inDegree > 0)
        .map(([inD, idx]) => idx)
    );
  }
  return sorted;
}

# oppgave

WIP: JavaScript library to describe a computation as a tree of tasks, each with a set of non-pure input suppliers that feed a pure computation function

## Overview

We're building a task graph, it's a directed acyclic graph of tasks. Each task is a function of inputs to outputs. Some tasks are pure, some are not.
Non-pure tasks have side-effects and/or hidden inputs. Tasks can also be either synchronous or asynchronous. If any task is a graph is asynchronous,
then the whole graph has to be handled as asynchronous.

Tasks have to be stateless; if you have stateful things, they need to be handled outside of the task graph. That means we can use the same task in
multiple graphs, or even as multiple nodes in the same graph.

A graph is a single pass execution. The graph has a single root node; when it is invoked, every other node in the graph will be executed exactly once.
In the graph, nodes can split, they can also join. For a split, a single node can provide output to multiple other nodes. For a join, multiple nodes
provide input to the same node.

As a function, a task takes a dictionary of named inputs. When wiring nodes into a graph, you specify which input each wire connects to. A task provides
a single output.

A non-pure task is used for any external dependencies. The logic in these tasks should be kept to a minimum. In a generic sense, the input to
the task should be a request, and the output should be the response. However, task graphs don't include conditionals or loops, so things like
retries need to be handled inside the task, generally.

For the purposes of testing, non-pure tasks will be mocked out with a pure task.

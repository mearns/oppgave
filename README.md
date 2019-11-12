# oppgave

**Warning:** This project is a Work In Progress and not yet ready for use

## Overview

```javascript
const foo = Task.sync(event => Math.random() * event.x);
const bar = Task.pure.sync(rx => rx + 10);
const trot = Task.pure.sync(y => y * y);
const baz = Task.pure.sync(rx => rx / 2);
const hart = Task.pure.sync((a, b) => a + b);
```

```javascript
import { foo, bar, baz, trot, hart } from "./my-tasks";
import { createPipeline } from "oppgave";

const pipeline = createPipeline();

const fooOut = foo(pipeline);
const barOut = bar(fooOut);
const trotOut = trot(barOut);
const bazOut = baz(fooOut);
const hartOut = hart(trotOut, bazOut);

module.exports.handler = pipeline.syncRunner(hartOut);
```

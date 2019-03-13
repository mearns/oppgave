# oppgave

**This project is a Work In Progress and not yet ready for use**

## Overview

**Oppgave** is a JavaScript library that you can use to define software
as a tree of tasks, where each task is a set of non-pure input suppliers that provide the input
arguments to a pure computation function. These input suppliers can themselves be tasks, thus
creating a tree of tasks.

This library also provides a `Tracker` for tasks that will record the inputs and execution
times for each task; logging this tracker at the end of the execution should provide all
the information needed to recreate state at any point during the computation, since the
computation should be a pure function of its inputs. Further, since the computation functions
are pure, you can replay them with the recorded inputs at any time for debugging and testing.

Structuring your application as a tree of tasks can help you isolate the pure business
logic from the non-pure peripheral work that needs to be done, which makes your business
logic more easily testable. In general, defining your application in this way can help make
it easier to reason about because the non-pure pieces are isolated and called out.

Future work in this library (or external to it) could automatically split up a task tree into
microservices, serverless functions, or something like an AWS Step Function.

## Example

The following examples import the `defineTask` function from the `oppgave` package, e.g.:

```javascript
import defineTask from 'oppgave'
```

The first example fetches a remote resource from a web server with the hypothetical'
`fetchWebResource` function), then does some deterministic transformation on it, and
returns the result

```javascript
const task = defineTask([fetchWebResource], (response) => {
  return transformResource(response)
})
task.execute().then(res => console.log(res))
```

The next example is slightly more complicated: fetching credentials from a file,
and then using those to make a request to a database before transforming the
database result set:

```javascript
const getCredentialsTask = defineTask(
  [
    () => readFile('credentials.json', 'utf8')
  ],
  (contents) => {
    const parsedCredsFile = JSON.parse(contents)
    return [parsedCredsFile.username, parsedCredsFile.token]
  }
)
// XXX: Now what? How do I get the creds task as an input to
// another non-pure function, making the DB request?
```

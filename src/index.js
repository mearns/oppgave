const Task = {};
export default Task;

Task.sync = func => {
  return input => {};
};

class Pipeline {
  constructor() {}
}

class PipelineRun {}

export function createPipeline() {
  const pipeline = new Pipeline();
  return {
    syncRunner: target => {
      return input => {
        return pipeline.runSync(input).get(target);
      };
    }
  };
}

type TaskFunc = (...args: Array<unknown>) => unknown;

type WrapperFunc = (func: TaskFunc) => TaskFunc;

export type Task = TaskFunc & {
  wrap: (wrapper: WrapperFunc) => Task;
};

export default function Task(func: TaskFunc): Task {
  const task = (...args: Array<unknown>): unknown => func(...args);
  task.wrap = (wrapper: WrapperFunc): Task => {
    return Task(wrapper(func));
  };
  return task;
}

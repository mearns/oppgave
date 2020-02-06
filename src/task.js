class BaseTask {}

class PureSyncTask extends BaseTask {
    constructor(func) {
        super();
        this._func = func;
    }

    wrap(wrapper) {
        return new PureSyncTask(wrapper(this._func));
    }

    runSync(inputs) {
        return this._func(...inputs);
    }
}

module.exports = {
    PureSyncTask
};

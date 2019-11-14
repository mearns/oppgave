class BaseTask {}

class PureSyncTask extends BaseTask {
    constructor(func) {
        super();
        this._func = func;
    }

    runSync(inputs) {
        return this._func(...inputs);
    }
}

module.exports = {
    PureSyncTask
};

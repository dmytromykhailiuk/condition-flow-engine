"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createObservableStore = void 0;
const rxjs_1 = require("rxjs");
const createObservableStore = (store) => {
    const subject = new rxjs_1.BehaviorSubject(store.getState());
    store.subscribe(() => subject.next(store.getState()));
    return Object.assign(store, {
        pipe: subject.pipe.bind(subject),
        subscribe: subject.subscribe.bind(subject),
        getState: subject.getValue.bind(subject),
    });
};
exports.createObservableStore = createObservableStore;
//# sourceMappingURL=create-observable-store.js.map
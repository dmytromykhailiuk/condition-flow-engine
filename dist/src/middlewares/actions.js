"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actions = void 0;
const rxjs_1 = require("rxjs");
class Actions {
    constructor() {
        this.actions$ = new rxjs_1.Subject();
    }
    get middleware() {
        return (_) => (next) => (action) => {
            next(action);
            this.actions$.next(action);
        };
    }
    getObservableActions() {
        return this.actions$.asObservable();
    }
}
exports.Actions = Actions;
//# sourceMappingURL=actions.js.map
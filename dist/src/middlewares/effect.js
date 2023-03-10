"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SideEffects = void 0;
class SideEffects {
    constructor(sideEffects = []) {
        this.sideEffects = sideEffects;
    }
    get middleware() {
        return (store) => {
            this.sideEffects.forEach(({ effect, dispatch }) => {
                effect.subscribe((action) => {
                    if (dispatch) {
                        store.dispatch(action);
                    }
                });
            });
            return (next) => (action) => next(action);
        };
    }
    add(sideEffect) {
        this.sideEffects.push(sideEffect);
    }
}
exports.SideEffects = SideEffects;
//# sourceMappingURL=effect.js.map
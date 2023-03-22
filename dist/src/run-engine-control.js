"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEngineControls = void 0;
const condition_operators_1 = require("./condition-operators");
const rxjs_1 = require("rxjs");
const runEngineControl = (engineControl, callback, context$, conditionsMap = {}) => {
    const once = Boolean(engineControl.once);
    if (!engineControl.from &&
        !engineControl.to) {
        callback({ runEngineMethods: engineControl.runEngineMethods }, context$);
        return (0, rxjs_1.of)({});
    }
    return (0, rxjs_1.of)({}).pipe((0, condition_operators_1.subscribeOnAllDataAndContinueWhenConditionWillBeValid)(engineControl.from, context$, conditionsMap), (0, condition_operators_1.subscribeOnAllDataAndContinueWhenConditionWillBeValid)(engineControl.to, context$, conditionsMap), (0, rxjs_1.switchMap)(() => {
        callback({ runEngineMethods: engineControl.runEngineMethods }, context$);
        return once ? (0, rxjs_1.of)({}) : runEngineControl(engineControl, callback, context$, conditionsMap);
    }));
};
const runEngineControls = (engineControls, callback, context$, conditionsMap = {}) => (0, rxjs_1.from)(engineControls)
    .pipe((0, rxjs_1.mergeMap)((engineControl) => runEngineControl(engineControl, callback, context$, conditionsMap)))
    .subscribe();
exports.runEngineControls = runEngineControls;
//# sourceMappingURL=run-engine-control.js.map
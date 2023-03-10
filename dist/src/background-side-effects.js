"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBackgroundSideEffects = void 0;
const rxjs_1 = require("rxjs");
const condition_operators_1 = require("./condition-operators");
const runBackgroundSideEffects = (context$, backgroundFlows, callback, conditionsMap = {}) => (0, rxjs_1.from)(backgroundFlows)
    .pipe((0, rxjs_1.mergeMap)((bagroundFlow) => (0, rxjs_1.of)({}).pipe((0, condition_operators_1.continueIfConditionIsValid)(bagroundFlow.conditionToSubscribe, context$, conditionsMap), (0, condition_operators_1.subscribeOnAllDataAndContinueWhenConditionWillBeValid)(bagroundFlow.conditionToSubscribe, context$, conditionsMap), (0, rxjs_1.withLatestFrom)(context$), (0, rxjs_1.tap)(([_, context]) => callback(bagroundFlow.flow, context)))))
    .subscribe();
exports.runBackgroundSideEffects = runBackgroundSideEffects;
//# sourceMappingURL=background-side-effects.js.map
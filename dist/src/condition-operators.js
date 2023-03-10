"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeOnAllDataAndContinueWhenConditionWillBeValid = exports.continueIfConditionIsValid = void 0;
const rxjs_1 = require("rxjs");
const condition_functions_1 = require("./condition-functions");
const continueIfConditionIsValid = (condition, context$, conditionsMap = {}) => (source$) => source$.pipe((0, rxjs_1.switchMap)((value) => (0, rxjs_1.of)(value).pipe((0, rxjs_1.withLatestFrom)(context$), (0, rxjs_1.filter)(([_, globalContext]) => (0, condition_functions_1.validateCondition)({
    condition,
    globalContext,
    conditionsMap,
})), (0, rxjs_1.map)(() => value))));
exports.continueIfConditionIsValid = continueIfConditionIsValid;
const subscribeOnAllDataAndContinueWhenConditionWillBeValid = (condition, context$, conditionsMap = {}) => (source$) => source$.pipe((0, rxjs_1.switchMap)((value) => context$.pipe((0, rxjs_1.distinctUntilChanged)((0, condition_functions_1.isSameStateForCondition)(condition, conditionsMap)), (0, exports.continueIfConditionIsValid)(condition, context$, conditionsMap), (0, rxjs_1.take)(1), (0, rxjs_1.map)(() => value))));
exports.subscribeOnAllDataAndContinueWhenConditionWillBeValid = subscribeOnAllDataAndContinueWhenConditionWillBeValid;
//# sourceMappingURL=condition-operators.js.map
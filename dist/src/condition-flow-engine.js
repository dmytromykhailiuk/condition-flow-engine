"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConditionFlowEngine = void 0;
const flow_runner_1 = require("./flow-runner");
const rxjs_1 = require("rxjs");
const condition_functions_1 = require("./condition-functions");
const condition_operators_1 = require("./condition-operators");
const background_side_effects_1 = require("./background-side-effects");
const validate_conditions_and_run_flow_1 = require("./validate-conditions-and-run-flow");
const createConditionFlowEngine = ({ actions$, prefix, dispatch, config: configFromPayload = {}, }) => {
    const config = { data: configFromPayload };
    const flowRunner = (0, flow_runner_1.createFlowRunner)({
        actions$,
        dispatch,
        prefix,
    });
    const flowInProgress$ = new rxjs_1.BehaviorSubject(false);
    const runFlow = (flow, context = {}) => {
        var _a;
        flowInProgress$.next(true);
        const actionsForFlow = typeof flow === 'string' ? (_a = config === null || config === void 0 ? void 0 : config.data) === null || _a === void 0 ? void 0 : _a.flowsMap[flow] : flow;
        return flowRunner(actionsForFlow, context).pipe((0, rxjs_1.tap)(() => {
            flowInProgress$.next(false);
        }));
    };
    const updateConfig = (fn) => {
        config.data = fn(config.data);
    };
    const backgroundFlowSubscriptions = {};
    return {
        runFlow,
        updateConfig,
        isFlowInProgress: () => flowInProgress$.getValue(),
        continueWhenFlowFinished: () => (source$) => source$.pipe((0, rxjs_1.switchMap)((value) => flowInProgress$.pipe((0, rxjs_1.filter)((flowInProgress) => !flowInProgress), (0, rxjs_1.take)(1), (0, rxjs_1.map)(() => value)))),
        validateCondition: (obj) => { var _a; return (0, condition_functions_1.validateCondition)({ ...obj, globalContext: obj.context, conditionsMap: (_a = config === null || config === void 0 ? void 0 : config.data) === null || _a === void 0 ? void 0 : _a.conditionsMap }); },
        continueIfConditionIsValid: (condition, context$) => { var _a; return (0, condition_operators_1.continueIfConditionIsValid)(condition, context$, (_a = config === null || config === void 0 ? void 0 : config.data) === null || _a === void 0 ? void 0 : _a.conditionsMap); },
        subscribeOnAllDataAndContinueWhenConditionWillBeValid: (condition, context$) => { var _a; return (0, condition_operators_1.subscribeOnAllDataAndContinueWhenConditionWillBeValid)(condition, context$, (_a = config === null || config === void 0 ? void 0 : config.data) === null || _a === void 0 ? void 0 : _a.conditionsMap); },
        validateConditionsAndRunFlow: (obj) => {
            var _a, _b;
            let validator = obj.validator;
            if (typeof validator === 'string') {
                validator = (_a = config === null || config === void 0 ? void 0 : config.data) === null || _a === void 0 ? void 0 : _a.flowValidatorMap[validator];
            }
            return (0, validate_conditions_and_run_flow_1.validateConditionsAndRunFlow)({
                ...obj,
                validator,
                flowRunner: runFlow,
                conditionsMap: (_b = config === null || config === void 0 ? void 0 : config.data) === null || _b === void 0 ? void 0 : _b.conditionsMap,
            });
        },
        runHook(hookName, context) {
            var _a, _b, _c, _d;
            if (!((_a = config === null || config === void 0 ? void 0 : config.data) === null || _a === void 0 ? void 0 : _a.hooks[hookName])) {
                return (0, rxjs_1.of)(context);
            }
            for (const conditionObject of ((_c = (_b = config === null || config === void 0 ? void 0 : config.data) === null || _b === void 0 ? void 0 : _b.hooks) === null || _c === void 0 ? void 0 : _c[hookName]) || []) {
                if (typeof conditionObject === 'string') {
                    return runFlow(conditionObject, context);
                }
                if ((0, condition_functions_1.validateCondition)({
                    condition: conditionObject.condition,
                    globalContext: context,
                    conditionsMap: (_d = config === null || config === void 0 ? void 0 : config.data) === null || _d === void 0 ? void 0 : _d.conditionsMap,
                })) {
                    return runFlow(conditionObject.flow, context);
                }
            }
            return (0, rxjs_1.of)(context);
        },
        runBackgroundFlows(groupId, context$, backgroundFlowsArr) {
            var _a, _b;
            if (backgroundFlowSubscriptions[groupId]) {
                backgroundFlowSubscriptions[groupId].unsubscribe();
            }
            backgroundFlowSubscriptions[groupId] = (0, background_side_effects_1.runBackgroundSideEffects)(context$, backgroundFlowsArr || ((_a = config === null || config === void 0 ? void 0 : config.data) === null || _a === void 0 ? void 0 : _a.backgroundFlows[groupId]) || [], runFlow, (_b = config === null || config === void 0 ? void 0 : config.data) === null || _b === void 0 ? void 0 : _b.conditionsMap);
        },
        stopBackgroundFlows(groupId) {
            if (backgroundFlowSubscriptions[groupId]) {
                backgroundFlowSubscriptions[groupId].unsubscribe();
            }
        },
        stopAllBackgroundFlows() {
            Object.values(backgroundFlowSubscriptions).forEach((sub) => sub.unsubscribe());
        },
    };
};
exports.createConditionFlowEngine = createConditionFlowEngine;
//# sourceMappingURL=condition-flow-engine.js.map
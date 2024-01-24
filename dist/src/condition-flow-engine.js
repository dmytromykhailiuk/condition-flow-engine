"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConditionFlowEngine = void 0;
const rxjs_1 = require("rxjs");
const condition_functions_1 = require("./condition-functions");
const condition_operators_1 = require("./condition-operators");
const background_side_effects_1 = require("./background-side-effects");
const validate_conditions_and_run_flow_1 = require("./validate-conditions-and-run-flow");
const createConditionFlowEngine = ({ flowRunner, config: configFromPayload = {}, }) => {
    let config = configFromPayload;
    const flowInProgress$ = new rxjs_1.BehaviorSubject(false);
    const runFlow = (flow, context = {}) => {
        flowInProgress$.next(true);
        const actionsForFlow = typeof flow === 'string' ? config === null || config === void 0 ? void 0 : config.flowsMap[flow] : flow;
        return flowRunner(actionsForFlow, context).pipe((0, rxjs_1.tap)(() => {
            flowInProgress$.next(false);
        }));
    };
    const updateConfig = (fn) => {
        config = fn(config);
    };
    const backgroundFlowSubscriptions = {};
    return {
        runFlow,
        updateConfig,
        isFlowInProgress: () => flowInProgress$.getValue(),
        continueWhenFlowFinished: () => (source$) => source$.pipe((0, rxjs_1.switchMap)((value) => flowInProgress$.pipe((0, rxjs_1.filter)((flowInProgress) => !flowInProgress), (0, rxjs_1.take)(1), (0, rxjs_1.map)(() => value)))),
        validateCondition: (obj) => (0, condition_functions_1.validateCondition)({ ...obj, globalContext: obj.context, conditionsMap: config === null || config === void 0 ? void 0 : config.conditionsMap }),
        continueIfConditionIsValid: (condition, context$) => (0, condition_operators_1.continueIfConditionIsValid)(condition, context$, config === null || config === void 0 ? void 0 : config.conditionsMap),
        subscribeOnAllDataAndContinueWhenConditionWillBeValid: (condition, context$) => (0, condition_operators_1.subscribeOnAllDataAndContinueWhenConditionWillBeValid)(condition, context$, config === null || config === void 0 ? void 0 : config.conditionsMap),
        validateConditionsAndRunFlow: (obj) => {
            let validator = obj.validator;
            if (typeof validator === 'string') {
                validator = config === null || config === void 0 ? void 0 : config.flowValidatorMap[validator];
            }
            return (0, validate_conditions_and_run_flow_1.validateConditionsAndRunFlow)({
                ...obj,
                validator,
                flowRunner: runFlow,
                conditionsMap: config === null || config === void 0 ? void 0 : config.conditionsMap,
            });
        },
        runHook(hookName, context) {
            var _a;
            if (!(config === null || config === void 0 ? void 0 : config.hooks[hookName])) {
                return (0, rxjs_1.of)(context);
            }
            for (const conditionObject of ((_a = config === null || config === void 0 ? void 0 : config.hooks) === null || _a === void 0 ? void 0 : _a[hookName]) || []) {
                if (typeof conditionObject === 'string') {
                    return runFlow(conditionObject, context);
                }
                if ((0, condition_functions_1.validateCondition)({
                    condition: conditionObject.condition,
                    globalContext: context,
                    conditionsMap: config === null || config === void 0 ? void 0 : config.conditionsMap,
                })) {
                    return runFlow(conditionObject.flow, context);
                }
            }
            return (0, rxjs_1.of)(context);
        },
        runBackgroundFlows(groupId, context$, backgroundFlowsArr) {
            if (backgroundFlowSubscriptions[groupId]) {
                backgroundFlowSubscriptions[groupId].unsubscribe();
            }
            backgroundFlowSubscriptions[groupId] = (0, background_side_effects_1.runBackgroundSideEffects)(context$, backgroundFlowsArr || (config === null || config === void 0 ? void 0 : config.backgroundFlows[groupId]) || [], runFlow, config === null || config === void 0 ? void 0 : config.conditionsMap);
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
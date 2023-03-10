"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConditionFlowEngine = void 0;
const rxjs_1 = require("rxjs");
const condition_functions_1 = require("./condition-functions");
const condition_operators_1 = require("./condition-operators");
const background_side_effects_1 = require("./background-side-effects");
const validate_conditions_and_run_flow_1 = require("./validate-conditions-and-run-flow");
const createConditionFlowEngine = ({ flowRunner, conditionsMap = {}, flowValidatorMap = {}, flowsMap = {}, hooks = {}, backgroundFlows = {}, }) => {
    const runFlow = (flow, context) => {
        const actionsForFlow = typeof flow === 'string' ? flowsMap[flow] : flow;
        return flowRunner(actionsForFlow, context);
    };
    const backgroundFlowSubscriptions = {};
    return {
        runFlow,
        validateCondition: (obj) => (0, condition_functions_1.validateCondition)({ ...obj, conditionsMap }),
        isSameStateForCondition: (condition) => (0, condition_functions_1.isSameStateForCondition)(condition, conditionsMap),
        continueIfConditionIsValid: (condition, context$) => (0, condition_operators_1.continueIfConditionIsValid)(condition, context$, conditionsMap),
        subscribeOnAllDataAndContinueWhenConditionWillBeValid: (condition, context$) => (0, condition_operators_1.subscribeOnAllDataAndContinueWhenConditionWillBeValid)(condition, context$, conditionsMap),
        validateConditionsAndRunFlow: (obj) => {
            let validator = obj.validator;
            if (typeof validator === 'string') {
                validator = flowValidatorMap[validator];
            }
            return (0, validate_conditions_and_run_flow_1.validateConditionsAndRunFlow)({ ...obj, validator, flowRunner: runFlow, conditionsMap });
        },
        runHook(hookName, context) {
            if (!hooks[hookName]) {
                return (0, rxjs_1.of)(context);
            }
            for (const conditionObject of hooks[hookName]) {
                if (typeof conditionObject === 'string') {
                    return runFlow(conditionObject, context);
                }
                if ((0, condition_functions_1.validateCondition)({ condition: conditionObject.condition, globalContext: context, conditionsMap })) {
                    return runFlow(conditionObject.flow, context);
                }
            }
            return (0, rxjs_1.of)(context);
        },
        runBackgroundFlows(groupId, context$, backgroundFlowsArr) {
            if (backgroundFlowSubscriptions[groupId]) {
                backgroundFlowSubscriptions[groupId].unsubscribe();
            }
            backgroundFlowSubscriptions[groupId] = (0, background_side_effects_1.runBackgroundSideEffects)(context$, backgroundFlowsArr || backgroundFlows[groupId] || [], runFlow, conditionsMap);
        },
        stopBackgrounFlows(groupId) {
            if (backgroundFlowSubscriptions[groupId]) {
                backgroundFlowSubscriptions[groupId].unsubscribe();
            }
        },
        stopAllBackgrounFlows() {
            Object.values(backgroundFlowSubscriptions).forEach((sub) => sub.unsubscribe());
        },
    };
};
exports.createConditionFlowEngine = createConditionFlowEngine;
//# sourceMappingURL=condition-flow-engine.js.map
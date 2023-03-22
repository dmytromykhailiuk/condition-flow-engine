"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConditionFlowEngine = void 0;
const run_engine_control_1 = require("./run-engine-control");
const rxjs_1 = require("rxjs");
const condition_functions_1 = require("./condition-functions");
const condition_operators_1 = require("./condition-operators");
const background_side_effects_1 = require("./background-side-effects");
const validate_conditions_and_run_flow_1 = require("./validate-conditions-and-run-flow");
const createConditionFlowEngine = ({ flowRunner, context$, config: configFromPayload = {}, }) => {
    let config = configFromPayload;
    const backgroundFlowSubscriptions = {};
    const engineBackgroundControlsSubscriptions = {};
    const runFlow = (flow) => {
        let context;
        context$.pipe((0, rxjs_1.take)(1)).subscribe((d) => {
            context = d;
        });
        const actionsForFlow = typeof flow === 'string' ? config === null || config === void 0 ? void 0 : config.flowsMap[flow] : flow;
        return flowRunner(actionsForFlow, context);
    };
    const runHook = (hookName) => {
        var _a;
        let context;
        context$.pipe((0, rxjs_1.take)(1)).subscribe((d) => {
            context = d;
        });
        if (!(config === null || config === void 0 ? void 0 : config.hooks[hookName])) {
            return (0, rxjs_1.of)(context);
        }
        for (const conditionObject of ((_a = config === null || config === void 0 ? void 0 : config.hooks) === null || _a === void 0 ? void 0 : _a[hookName]) || []) {
            if (typeof conditionObject === 'string') {
                return runFlow(conditionObject);
            }
            if ((0, condition_functions_1.validateCondition)({
                condition: conditionObject.condition,
                globalContext: context,
                conditionsMap: config === null || config === void 0 ? void 0 : config.conditionsMap,
            })) {
                return runFlow(conditionObject.flow);
            }
        }
        return (0, rxjs_1.of)(context);
    };
    const runBackgroundFlows = (groupId, backgroundFlowsArr) => {
        if (backgroundFlowSubscriptions[groupId]) {
            backgroundFlowSubscriptions[groupId].unsubscribe();
        }
        backgroundFlowSubscriptions[groupId] = (0, background_side_effects_1.runBackgroundSideEffects)(context$, backgroundFlowsArr || (config === null || config === void 0 ? void 0 : config.backgroundFlows[groupId]) || [], runFlow, config === null || config === void 0 ? void 0 : config.conditionsMap);
    };
    const stopBackgrounFlows = (groupId) => {
        if (backgroundFlowSubscriptions[groupId]) {
            backgroundFlowSubscriptions[groupId].unsubscribe();
        }
    };
    const stopAllBackgrounFlows = () => {
        Object.values(backgroundFlowSubscriptions).forEach((sub) => sub.unsubscribe());
    };
    const runEngineBackgroundControls = (groupId, engineBackgroundControlsArr) => {
        if (engineBackgroundControlsSubscriptions[groupId]) {
            engineBackgroundControlsSubscriptions[groupId].unsubscribe();
        }
        engineBackgroundControlsSubscriptions[groupId] = (0, run_engine_control_1.runEngineControls)(engineBackgroundControlsArr || (config === null || config === void 0 ? void 0 : config.engineBackgroundControls[groupId]) || [], ({ runEngineMethods }) => {
            runEngineMethods.forEach(({ methodName, ...rest }) => {
                switch (methodName) {
                    case 'runBackgroundFlows': {
                        runBackgroundFlows(rest.groupId);
                        return;
                    }
                    case 'runHook': {
                        runHook(rest.hookName);
                        return;
                    }
                    case 'runFlow': {
                        runFlow(rest.flowName);
                        return;
                    }
                    case 'stopBackgrounFlows': {
                        stopBackgrounFlows(rest.groupId);
                        return;
                    }
                    case 'stopAllBackgrounFlows': {
                        stopAllBackgrounFlows();
                        return;
                    }
                }
            });
        }, context$, config === null || config === void 0 ? void 0 : config.conditionsMap);
    };
    const stopEngineBackgroundControls = (groupId) => {
        if (engineBackgroundControlsSubscriptions[groupId]) {
            engineBackgroundControlsSubscriptions[groupId].unsubscribe();
        }
    };
    const stopAllEngineBackgroundControls = () => {
        Object.values(engineBackgroundControlsSubscriptions).forEach((sub) => sub.unsubscribe());
    };
    const updateConfig = (fn) => {
        config = fn(config);
    };
    return {
        runFlow,
        runHook,
        updateConfig,
        runBackgroundFlows,
        stopBackgrounFlows,
        stopAllBackgrounFlows,
        runEngineBackgroundControls,
        stopEngineBackgroundControls,
        stopAllEngineBackgroundControls,
        mapContext: (mapping) => {
            let context;
            context$.pipe((0, rxjs_1.take)(1)).subscribe((d) => {
                context = d;
            });
            return (0, condition_functions_1.mapContext)(context, mapping);
        },
        validateCondition: (condition) => {
            let context;
            context$.pipe((0, rxjs_1.take)(1)).subscribe((d) => {
                context = d;
            });
            return (0, condition_functions_1.validateCondition)({ condition, globalContext: context, conditionsMap: config === null || config === void 0 ? void 0 : config.conditionsMap });
        },
        continueIfConditionIsValid: (condition) => (0, condition_operators_1.continueIfConditionIsValid)(condition, context$, config === null || config === void 0 ? void 0 : config.conditionsMap),
        subscribeOnAllDataAndContinueWhenConditionWillBeValid: (condition) => (0, condition_operators_1.subscribeOnAllDataAndContinueWhenConditionWillBeValid)(condition, context$, config === null || config === void 0 ? void 0 : config.conditionsMap),
        validateConditionsAndRunFlow: (validatorObj) => {
            let context;
            context$.pipe((0, rxjs_1.take)(1)).subscribe((d) => {
                context = d;
            });
            let validator = validatorObj;
            if (typeof validator === 'string') {
                validator = config === null || config === void 0 ? void 0 : config.flowValidatorMap[validator];
            }
            return (0, validate_conditions_and_run_flow_1.validateConditionsAndRunFlow)({
                context,
                validator,
                flowRunner: runFlow,
                conditionsMap: config === null || config === void 0 ? void 0 : config.conditionsMap,
            });
        },
    };
};
exports.createConditionFlowEngine = createConditionFlowEngine;
//# sourceMappingURL=condition-flow-engine.js.map
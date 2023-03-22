import { FlowRunner } from './flow-runner';
import { Flow, LinkToCondition, BackgroundFlow, BackgroundFlowsMap, Hooks, FlowsMap, ConditionsMap, ConditionObject, FlowValidator, FlowValidatorMap, EngineBackgroundControl, EngineBackgroundControlsMap } from './interfaces';
import { Observable, ObservableInput } from 'rxjs';
export declare const createConditionFlowEngine: <T>({ flowRunner, context$, config: configFromPayload, }: {
    flowRunner: FlowRunner;
    context$: ObservableInput<T>;
    config?: {
        conditionsMap?: ConditionsMap;
        flowValidatorMap?: FlowValidatorMap;
        flowsMap?: FlowsMap;
        hooks?: Hooks;
        backgroundFlows?: BackgroundFlowsMap;
        engineBackgroundControls?: EngineBackgroundControlsMap;
    };
}) => {
    runFlow: (flow: Flow) => Observable<T>;
    runHook: (hookName: string) => Observable<T>;
    updateConfig: (fn: (_: {
        conditionsMap?: ConditionsMap;
        flowValidatorMap?: FlowValidatorMap;
        flowsMap?: FlowsMap;
        hooks?: Hooks;
        backgroundFlows?: BackgroundFlowsMap;
        engineBackgroundControls?: EngineBackgroundControlsMap;
    }) => {
        conditionsMap?: ConditionsMap;
        flowValidatorMap?: FlowValidatorMap;
        flowsMap?: FlowsMap;
        hooks?: Hooks;
        backgroundFlows?: BackgroundFlowsMap;
        engineBackgroundControls?: EngineBackgroundControlsMap;
    }) => void;
    runBackgroundFlows: (groupId: string, backgroundFlowsArr?: BackgroundFlow[]) => void;
    stopBackgrounFlows: (groupId: string) => void;
    stopAllBackgrounFlows: () => void;
    runEngineBackgroundControls: (groupId: string, engineBackgroundControlsArr?: EngineBackgroundControl[]) => void;
    stopEngineBackgroundControls: (groupId: string) => void;
    stopAllEngineBackgroundControls: () => void;
    mapContext: (mapping: string[]) => any;
    validateCondition: (condition: ConditionObject | LinkToCondition) => boolean;
    continueIfConditionIsValid: (condition: ConditionObject | LinkToCondition) => <T_1>(source$: Observable<T_1>) => Observable<T_1>;
    subscribeOnAllDataAndContinueWhenConditionWillBeValid: (condition: ConditionObject | LinkToCondition) => <T_2>(source$: Observable<T_2>) => Observable<T_2>;
    validateConditionsAndRunFlow: (validatorObj: FlowValidator | FlowValidator[] | string) => boolean;
};

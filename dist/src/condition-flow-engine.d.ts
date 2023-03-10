import { FlowRunner } from './flow-runner';
import { Flow, LinkToCondition, BackgroundFlow, BackgroundFlowsMap, Hooks, FlowsMap, ConditionsMap, ConditionObject, FlowValidator, FlowValidatorMap } from './interfaces';
import { ObservableInput } from 'rxjs';
export declare const createConditionFlowEngine: <T>({ flowRunner, config: configFromPayload, }: {
    flowRunner: FlowRunner;
    config?: {
        conditionsMap?: ConditionsMap;
        flowValidatorMap?: FlowValidatorMap;
        flowsMap?: FlowsMap;
        hooks?: Hooks;
        backgroundFlows?: BackgroundFlowsMap;
    };
}) => {
    runFlow: (flow: Flow, context: T) => import("rxjs").Observable<T>;
    updateConfig: (fn: (_: {
        conditionsMap?: ConditionsMap;
        flowValidatorMap?: FlowValidatorMap;
        flowsMap?: FlowsMap;
        hooks?: Hooks;
        backgroundFlows?: BackgroundFlowsMap;
    }) => {
        conditionsMap?: ConditionsMap;
        flowValidatorMap?: FlowValidatorMap;
        flowsMap?: FlowsMap;
        hooks?: Hooks;
        backgroundFlows?: BackgroundFlowsMap;
    }) => void;
    validateCondition: (obj: {
        condition: ConditionObject | LinkToCondition;
        context: T;
    }) => boolean;
    continueIfConditionIsValid: (condition: ConditionObject | LinkToCondition, context$: ObservableInput<T>) => <T_1>(source$: import("rxjs").Observable<T_1>) => import("rxjs").Observable<T_1>;
    subscribeOnAllDataAndContinueWhenConditionWillBeValid: (condition: ConditionObject | LinkToCondition, context$: ObservableInput<T>) => <T_2>(source$: import("rxjs").Observable<T_2>) => import("rxjs").Observable<T_2>;
    validateConditionsAndRunFlow: (obj: {
        validator: FlowValidator | FlowValidator[] | string;
        context: T;
    }) => boolean;
    runHook(hookName: string, context: T): import("rxjs").Observable<T>;
    runBackgroundFlows(groupId: string, context$: ObservableInput<T>, backgroundFlowsArr?: BackgroundFlow[]): void;
    stopBackgrounFlows(groupId: string): void;
    stopAllBackgrounFlows(): void;
};

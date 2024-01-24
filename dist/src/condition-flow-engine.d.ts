import { FlowRunner } from './flow-runner';
import { Flow, LinkToCondition, BackgroundFlow, ConditionObject, FlowValidator, Config } from './interfaces';
import { Observable, ObservableInput } from 'rxjs';
export declare const createConditionFlowEngine: <T>({ flowRunner, config: configFromPayload, }: {
    flowRunner: FlowRunner;
    config?: Config;
}) => {
    runFlow: (flow: Flow, context?: T) => Observable<T>;
    updateConfig: (fn: (_: Config) => Config) => void;
    isFlowInProgress: () => boolean;
    continueWhenFlowFinished: () => <T_1>(source$: Observable<T_1>) => Observable<T_1>;
    validateCondition: (obj: {
        condition: ConditionObject | LinkToCondition;
        context: T;
    }) => boolean;
    continueIfConditionIsValid: (condition: ConditionObject | LinkToCondition, context$: ObservableInput<T>) => <T_2>(source$: Observable<T_2>) => Observable<T_2>;
    subscribeOnAllDataAndContinueWhenConditionWillBeValid: (condition: ConditionObject | LinkToCondition, context$: ObservableInput<T>) => <T_3>(source$: Observable<T_3>) => Observable<T_3>;
    validateConditionsAndRunFlow: (obj: {
        validator: FlowValidator | FlowValidator[] | string;
        context: T;
    }) => boolean;
    runHook(hookName: string, context: T): Observable<T>;
    runBackgroundFlows(groupId: string, context$: ObservableInput<T>, backgroundFlowsArr?: BackgroundFlow[]): void;
    stopBackgroundFlows(groupId: string): void;
    stopAllBackgroundFlows(): void;
};

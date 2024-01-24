import { BackgroundFlow, ConditionObject, Config, Flow, FlowValidator, LinkToCondition } from './interfaces';
import { Observable, ObservableInput } from 'rxjs';

export abstract class ConditionFlowEngine {
  runFlow: <T = any>(flow: Flow, context?: T) => Observable<T>;
  isFlowInProgress: () => boolean;
  continueWhenFlowFinished: () => <T>(
    source$: Observable<T>,
  ) => Observable<Observable<T> extends ObservableInput<infer T> ? T : never>;
  updateConfig: (fn: (_: Config) => Config) => void;
  validateCondition: <T = any>(obj: { condition: ConditionObject | LinkToCondition; context: T }) => boolean;
  continueIfConditionIsValid: <T = any>(
    condition: ConditionObject | LinkToCondition,
    context$: ObservableInput<T>,
  ) => <T>(source$: Observable<T>) => Observable<Observable<T> extends ObservableInput<infer T> ? T : never>;
  subscribeOnAllDataAndContinueWhenConditionWillBeValid: <T = any>(
    condition: ConditionObject | LinkToCondition,
    context$: ObservableInput<T>,
  ) => <T>(source$: Observable<T>) => Observable<Observable<T> extends ObservableInput<infer T> ? T : never>;
  validateConditionsAndRunFlow: <T = any>(obj: {
    validator: FlowValidator | FlowValidator[] | string;
    context: T;
  }) => boolean;
  runHook: <T = any>(hookName: string, context?: T) => Observable<T>;
  runBackgroundFlows: <T = any>(
    groupId: string,
    context$: ObservableInput<T>,
    backgroundFlowsArr?: BackgroundFlow[],
  ) => void;
  stopBackgroundFlows: (groupId: string) => void;
  stopAllBackgroundFlows: () => void;
}

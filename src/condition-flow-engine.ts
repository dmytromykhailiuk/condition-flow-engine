import { FlowRunner, createFlowRunner } from './flow-runner';
import { Flow, LinkToCondition, BackgroundFlow, ConditionObject, FlowValidator, Config, Action } from './interfaces';
import {
  Observable,
  ObservableInput,
  of,
  Subscription,
  take,
  tap,
  filter,
  map,
  BehaviorSubject,
  Subject,
  switchMap,
} from 'rxjs';
import { validateCondition } from './condition-functions';
import {
  continueIfConditionIsValid,
  subscribeOnAllDataAndContinueWhenConditionWillBeValid,
} from './condition-operators';
import { runBackgroundSideEffects } from './background-side-effects';
import { validateConditionsAndRunFlow } from './validate-conditions-and-run-flow';

export const createConditionFlowEngine = <T>({
  actions$,
  prefix,
  dispatch,
  config: configFromPayload = {},
}: {
  actions$: Subject<Action>;
  prefix?: string;
  dispatch: (_: Action<string>) => void;
  config?: Config;
}) => {
  const config = { data: configFromPayload };

  const flowRunner = createFlowRunner({
    actions$,
    dispatch,
    prefix,
  });

  const flowInProgress$ = new BehaviorSubject(false);

  const runFlow = (flow: Flow, context: T = {} as T) => {
    flowInProgress$.next(true);
    const actionsForFlow = typeof flow === 'string' ? config?.data?.flowsMap[flow] : flow;

    return flowRunner<T>(actionsForFlow, context).pipe(
      tap(() => {
        flowInProgress$.next(false);
      }),
    );
  };

  const updateConfig = (fn: (_: Config) => Config) => {
    config.data = fn(config.data);
  };

  const backgroundFlowSubscriptions: { [groupId: string]: Subscription } = {};

  return {
    runFlow,
    updateConfig,
    isFlowInProgress: () => flowInProgress$.getValue(),
    continueWhenFlowFinished:
      () =>
      <T>(source$: Observable<T>) =>
        source$.pipe(
          switchMap((value) =>
            flowInProgress$.pipe(
              filter((flowInProgress) => !flowInProgress),
              take(1),
              map(() => value),
            ),
          ),
        ),
    validateCondition: (obj: { condition: ConditionObject | LinkToCondition; context: T }) =>
      validateCondition<T>({ ...obj, globalContext: obj.context, conditionsMap: config?.data?.conditionsMap }),
    continueIfConditionIsValid: (condition: ConditionObject | LinkToCondition, context$: ObservableInput<T>) =>
      continueIfConditionIsValid<T>(condition, context$, config?.data?.conditionsMap),
    subscribeOnAllDataAndContinueWhenConditionWillBeValid: (
      condition: ConditionObject | LinkToCondition,
      context$: ObservableInput<T>,
    ) => subscribeOnAllDataAndContinueWhenConditionWillBeValid<T>(condition, context$, config?.data?.conditionsMap),
    validateConditionsAndRunFlow: (obj: { validator: FlowValidator | FlowValidator[] | string; context: T }) => {
      let validator = obj.validator;

      if (typeof validator === 'string') {
        validator = config?.data?.flowValidatorMap[validator];
      }

      return validateConditionsAndRunFlow<T>({
        ...obj,
        validator,
        flowRunner: runFlow,
        conditionsMap: config?.data?.conditionsMap,
      });
    },
    runHook(hookName: string, context: T) {
      if (!config?.data?.hooks[hookName]) {
        return of(context);
      }

      for (const conditionObject of config?.data?.hooks?.[hookName] || []) {
        if (typeof conditionObject === 'string') {
          return runFlow(conditionObject as Flow, context);
        }

        if (
          validateCondition({
            condition: (conditionObject as any).condition,
            globalContext: context,
            conditionsMap: config?.data?.conditionsMap,
          })
        ) {
          return runFlow((conditionObject as any).flow, context);
        }
      }

      return of(context);
    },
    runBackgroundFlows(groupId: string, context$: ObservableInput<T>, backgroundFlowsArr?: BackgroundFlow[]) {
      if (backgroundFlowSubscriptions[groupId]) {
        backgroundFlowSubscriptions[groupId].unsubscribe();
      }

      backgroundFlowSubscriptions[groupId] = runBackgroundSideEffects<T>(
        context$,
        backgroundFlowsArr || config?.data?.backgroundFlows[groupId] || [],
        runFlow,
        config?.data?.conditionsMap,
      );
    },
    stopBackgroundFlows(groupId: string) {
      if (backgroundFlowSubscriptions[groupId]) {
        backgroundFlowSubscriptions[groupId].unsubscribe();
      }
    },
    stopAllBackgroundFlows() {
      Object.values(backgroundFlowSubscriptions).forEach((sub) => sub.unsubscribe());
    },
  };
};

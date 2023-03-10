import { FlowRunner } from './flow-runner';
import {
  Flow,
  LinkToCondition,
  BackgroundFlow,
  BackgroundFlowsMap,
  Hooks,
  FlowsMap,
  ConditionsMap,
  ConditionObject,
  FlowValidator,
  FlowValidatorMap,
} from './interfaces';
import { ObservableInput, of, Subscription } from 'rxjs';
import { validateCondition } from './condition-functions';
import {
  continueIfConditionIsValid,
  subscribeOnAllDataAndContinueWhenConditionWillBeValid,
} from './condition-operators';
import { runBackgroundSideEffects } from './background-side-effects';
import { validateConditionsAndRunFlow } from './validate-conditions-and-run-flow';

export const createConditionFlowEngine = <T>({
  flowRunner,
  config: configFromPayload = {},
}: {
  flowRunner: FlowRunner;
  config?: {
    conditionsMap?: ConditionsMap;
    flowValidatorMap?: FlowValidatorMap;
    flowsMap?: FlowsMap;
    hooks?: Hooks;
    backgroundFlows?: BackgroundFlowsMap;
  };
}) => {
  let config = configFromPayload;

  const runFlow = (flow: Flow, context: T) => {
    const actionsForFlow = typeof flow === 'string' ? config?.flowsMap[flow] : flow;

    return flowRunner<T>(actionsForFlow, context);
  };

  const updateConfig = (fn: (_: typeof config) => typeof config) => {
    config = fn(config);
  };

  const backgroundFlowSubscriptions: { [groupId: string]: Subscription } = {};

  return {
    runFlow,
    updateConfig,
    validateCondition: (obj: { condition: ConditionObject | LinkToCondition; context: T }) =>
      validateCondition<T>({ ...obj, globalContext: obj.context, conditionsMap: config?.conditionsMap }),
    continueIfConditionIsValid: (condition: ConditionObject | LinkToCondition, context$: ObservableInput<T>) =>
      continueIfConditionIsValid<T>(condition, context$, config?.conditionsMap),
    subscribeOnAllDataAndContinueWhenConditionWillBeValid: (
      condition: ConditionObject | LinkToCondition,
      context$: ObservableInput<T>,
    ) => subscribeOnAllDataAndContinueWhenConditionWillBeValid<T>(condition, context$, config?.conditionsMap),
    validateConditionsAndRunFlow: (obj: { validator: FlowValidator | FlowValidator[] | string; context: T }) => {
      let validator = obj.validator;

      if (typeof validator === 'string') {
        validator = config?.flowValidatorMap[validator];
      }

      return validateConditionsAndRunFlow<T>({
        ...obj,
        validator,
        flowRunner: runFlow,
        conditionsMap: config?.conditionsMap,
      });
    },
    runHook(hookName: string, context: T) {
      if (!config?.hooks[hookName]) {
        return of(context);
      }

      for (const conditionObject of config?.hooks?.[hookName] || []) {
        if (typeof conditionObject === 'string') {
          return runFlow(conditionObject as Flow, context);
        }

        if (
          validateCondition({
            condition: (conditionObject as any).condition,
            globalContext: context,
            conditionsMap: config?.conditionsMap,
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
        backgroundFlowsArr || config?.backgroundFlows[groupId] || [],
        runFlow,
        config?.conditionsMap,
      );
    },
    stopBackgrounFlows(groupId: string) {
      if (backgroundFlowSubscriptions[groupId]) {
        backgroundFlowSubscriptions[groupId].unsubscribe();
      }
    },
    stopAllBackgrounFlows() {
      Object.values(backgroundFlowSubscriptions).forEach((sub) => sub.unsubscribe());
    },
  };
};

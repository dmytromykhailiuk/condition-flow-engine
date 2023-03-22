import { runEngineControls } from './run-engine-control';
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
  EngineBackgroundControl,
  EngineBackgroundControlsMap,
} from './interfaces';
import { Observable, ObservableInput, of, Subscription, take } from 'rxjs';
import { mapContext, validateCondition } from './condition-functions';
import {
  continueIfConditionIsValid,
  subscribeOnAllDataAndContinueWhenConditionWillBeValid,
} from './condition-operators';
import { runBackgroundSideEffects } from './background-side-effects';
import { validateConditionsAndRunFlow } from './validate-conditions-and-run-flow';

export const createConditionFlowEngine = <T>({
  flowRunner,
  context$,
  config: configFromPayload = {},
}: {
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
  let config = configFromPayload;
  const backgroundFlowSubscriptions: { [groupId: string]: Subscription } = {};
  const engineBackgroundControlsSubscriptions: { [groupId: string]: Subscription } = {};

  const runFlow = (flow: Flow) => {
    let context: T;

    (context$ as Observable<T>).pipe(take(1)).subscribe((d) => {
      context = d;
    });

    const actionsForFlow = typeof flow === 'string' ? config?.flowsMap[flow] : flow;

    return flowRunner<T>(actionsForFlow, context);
  };

  const runHook = (hookName: string) => {
    let context: T;

    (context$ as Observable<T>).pipe(take(1)).subscribe((d) => {
      context = d;
    });

    if (!config?.hooks[hookName]) {
      return of(context);
    }

    for (const conditionObject of config?.hooks?.[hookName] || []) {
      if (typeof conditionObject === 'string') {
        return runFlow(conditionObject as Flow);
      }

      if (
        validateCondition({
          condition: (conditionObject as any).condition,
          globalContext: context,
          conditionsMap: config?.conditionsMap,
        })
      ) {
        return runFlow((conditionObject as any).flow);
      }
    }

    return of(context);
  };

  const runBackgroundFlows = (groupId: string, backgroundFlowsArr?: BackgroundFlow[]) => {
    if (backgroundFlowSubscriptions[groupId]) {
      backgroundFlowSubscriptions[groupId].unsubscribe();
    }

    backgroundFlowSubscriptions[groupId] = runBackgroundSideEffects<T>(
      context$,
      backgroundFlowsArr || config?.backgroundFlows[groupId] || [],
      runFlow,
      config?.conditionsMap,
    );
  };

  const stopBackgrounFlows = (groupId: string) => {
    if (backgroundFlowSubscriptions[groupId]) {
      backgroundFlowSubscriptions[groupId].unsubscribe();
    }
  };

  const stopAllBackgrounFlows = () => {
    Object.values(backgroundFlowSubscriptions).forEach((sub) => sub.unsubscribe());
  };

  const runEngineBackgroundControls = (groupId: string, engineBackgroundControlsArr?: EngineBackgroundControl[]) => {
    if (engineBackgroundControlsSubscriptions[groupId]) {
      engineBackgroundControlsSubscriptions[groupId].unsubscribe();
    }

    engineBackgroundControlsSubscriptions[groupId] = runEngineControls<T>(
      engineBackgroundControlsArr || config?.engineBackgroundControls[groupId] || [],
      ({ runEngineMethods }) => {
        runEngineMethods.forEach(({ methodName, ...rest }) => {
          switch (methodName) {
            case 'runBackgroundFlows': {
              runBackgroundFlows((rest as any).groupId);
              return;
            }
            case 'runHook': {
              runHook((rest as any).hookName);
              return;
            }
            case 'runFlow': {
              runFlow((rest as any).flowName);
              return;
            }
            case 'stopBackgrounFlows': {
              stopBackgrounFlows((rest as any).groupId);
              return;
            }
            case 'stopAllBackgrounFlows': {
              stopAllBackgrounFlows();
              return;
            }
          }
        });
      },
      context$,
      config?.conditionsMap,
    );
  };

  const stopEngineBackgroundControls = (groupId: string) => {
    if (engineBackgroundControlsSubscriptions[groupId]) {
      engineBackgroundControlsSubscriptions[groupId].unsubscribe();
    }
  };

  const stopAllEngineBackgroundControls = () => {
    Object.values(engineBackgroundControlsSubscriptions).forEach((sub) => sub.unsubscribe());
  };

  const updateConfig = (fn: (_: typeof config) => typeof config) => {
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
    mapContext: (mapping: string[]) => {
      let context: T;

      (context$ as Observable<T>).pipe(take(1)).subscribe((d) => {
        context = d;
      });

      return mapContext(context, mapping);
    },
    validateCondition: (condition: ConditionObject | LinkToCondition) => {
      let context: T;

      (context$ as Observable<T>).pipe(take(1)).subscribe((d) => {
        context = d;
      });

      return validateCondition<T>({ condition, globalContext: context, conditionsMap: config?.conditionsMap });
    },
    continueIfConditionIsValid: (condition: ConditionObject | LinkToCondition) =>
      continueIfConditionIsValid<T>(condition, context$, config?.conditionsMap),
    subscribeOnAllDataAndContinueWhenConditionWillBeValid: (condition: ConditionObject | LinkToCondition) =>
      subscribeOnAllDataAndContinueWhenConditionWillBeValid<T>(condition, context$, config?.conditionsMap),
    validateConditionsAndRunFlow: (validatorObj: FlowValidator | FlowValidator[] | string) => {
      let context: T;

      (context$ as Observable<T>).pipe(take(1)).subscribe((d) => {
        context = d;
      });
      let validator = validatorObj;

      if (typeof validator === 'string') {
        validator = config?.flowValidatorMap[validator];
      }

      return validateConditionsAndRunFlow<T>({
        context,
        validator,
        flowRunner: runFlow,
        conditionsMap: config?.conditionsMap,
      });
    },
  };
};

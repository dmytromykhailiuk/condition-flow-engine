import { subscribeOnAllDataAndContinueWhenConditionWillBeValid } from './condition-operators';
import { from, mergeMap, ObservableInput, of, switchMap } from 'rxjs';
import {
  ConditionsMap,
  EngineBackgroundControl,
  EngineBackgroundControlBase,
  EngineBackgroundControlWithTransition,
} from './interfaces';

const runEngineControl = <T>(
  engineControl: EngineBackgroundControl,
  callback: (_: EngineBackgroundControlBase, _2: ObservableInput<T>) => void,
  context$: ObservableInput<T>,
  conditionsMap: ConditionsMap = {},
) => {
  const once = Boolean(engineControl.once);

  if (
    !(engineControl as EngineBackgroundControlWithTransition).from &&
    !(engineControl as EngineBackgroundControlWithTransition).to
  ) {
    callback({ runEngineMethods: engineControl.runEngineMethods }, context$);
    return of({});
  }

  return of({}).pipe(
    subscribeOnAllDataAndContinueWhenConditionWillBeValid(
      (engineControl as EngineBackgroundControlWithTransition).from,
      context$,
      conditionsMap,
    ),
    subscribeOnAllDataAndContinueWhenConditionWillBeValid(
      (engineControl as EngineBackgroundControlWithTransition).to,
      context$,
      conditionsMap,
    ),
    switchMap(() => {
      callback({ runEngineMethods: engineControl.runEngineMethods }, context$);

      return once ? of({}) : runEngineControl(engineControl, callback, context$, conditionsMap);
    }),
  );
};

export const runEngineControls = <T>(
  engineControls: EngineBackgroundControl[],
  callback: (_: EngineBackgroundControlBase, _2: ObservableInput<T>) => void,
  context$: ObservableInput<T>,
  conditionsMap: ConditionsMap = {},
) =>
  from(engineControls)
    .pipe(mergeMap((engineControl) => runEngineControl<T>(engineControl, callback, context$, conditionsMap)))
    .subscribe();

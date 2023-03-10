import { from, mergeMap, ObservableInput, of, tap, withLatestFrom } from 'rxjs';
import {
  continueIfConditionIsValid,
  subscribeOnAllDataAndContinueWhenConditionWillBeValid,
} from './condition-operators';
import { BackgroundFlow, ConditionsMap, Flow } from './interfaces';

export const runBackgroundSideEffects = <T>(
  context$: ObservableInput<T>,
  backgroundFlows: BackgroundFlow[],
  callback: (flow: Flow, context: T) => void,
  conditionsMap: ConditionsMap = {},
) =>
  from(backgroundFlows)
    .pipe(
      mergeMap((bagroundFlow) =>
        of({}).pipe(
          continueIfConditionIsValid(bagroundFlow.conditionToSubscribe, context$, conditionsMap),
          subscribeOnAllDataAndContinueWhenConditionWillBeValid(
            bagroundFlow.conditionToSubscribe,
            context$,
            conditionsMap,
          ),
          withLatestFrom(context$),
          tap(([_, context]) => callback(bagroundFlow.flow, context)),
        ),
      ),
    )
    .subscribe();

import {
  distinctUntilChanged,
  filter,
  map,
  Observable,
  ObservableInput,
  of,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';
import { isSameStateForCondition, validateCondition } from './condition-functions';
import { ConditionObject, ConditionsMap, LinkToCondition } from './interfaces';

export const continueIfConditionIsValid =
  <F>(condition: ConditionObject | LinkToCondition, context$: ObservableInput<F>, conditionsMap: ConditionsMap = {}) =>
  <T>(source$: Observable<T>) =>
    source$.pipe(
      switchMap((value) =>
        of(value).pipe(
          withLatestFrom(context$),
          filter(([_, globalContext]: [T, F]) =>
            validateCondition<F>({
              condition,
              globalContext,
              conditionsMap,
            }),
          ),
          map(() => value),
        ),
      ),
    );

export const subscribeOnAllDataAndContinueWhenConditionWillBeValid =
  <F>(condition: ConditionObject | LinkToCondition, context$: ObservableInput<F>, conditionsMap: ConditionsMap = {}) =>
  <T>(source$: Observable<T>) =>
    source$.pipe(
      switchMap((value) =>
        (context$ as Observable<F>).pipe(
          distinctUntilChanged(isSameStateForCondition<F>(condition, conditionsMap)),
          continueIfConditionIsValid<F>(condition, context$, conditionsMap),
          take(1),
          map(() => value as T)
        ),
      ),
    );

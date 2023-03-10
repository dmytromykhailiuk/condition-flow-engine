import { Observable, ObservableInput } from 'rxjs';
import { ConditionObject, ConditionsMap, LinkToCondition } from './interfaces';
export declare const continueIfConditionIsValid: <F>(condition: ConditionObject | LinkToCondition, context$: ObservableInput<F>, conditionsMap?: ConditionsMap) => <T>(source$: Observable<T>) => Observable<T>;
export declare const subscribeOnAllDataAndContinueWhenConditionWillBeValid: <F>(condition: ConditionObject | LinkToCondition, context$: ObservableInput<F>, conditionsMap?: ConditionsMap) => <T>(source$: Observable<T>) => Observable<T>;

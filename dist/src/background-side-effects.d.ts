import { ObservableInput } from 'rxjs';
import { BackgroundFlow, ConditionsMap, Flow } from './interfaces';
export declare const runBackgroundSideEffects: <T>(context$: ObservableInput<T>, backgroundFlows: BackgroundFlow[], callback: (flow: Flow, context: T) => void, conditionsMap?: ConditionsMap) => import("rxjs").Subscription;

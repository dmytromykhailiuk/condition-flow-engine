import { ObservableInput } from 'rxjs';
import { ConditionsMap, EngineBackgroundControl, EngineBackgroundControlBase } from './interfaces';
export declare const runEngineControls: <T>(engineControls: EngineBackgroundControl[], callback: (_: EngineBackgroundControlBase, _2: ObservableInput<T>) => void, context$: ObservableInput<T>, conditionsMap?: ConditionsMap) => import("rxjs").Subscription;

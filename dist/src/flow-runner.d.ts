import { Observable } from 'rxjs';
import { Action } from './interfaces';
export type FlowRunner = <T>(actions: Action[], context: T) => Observable<T>;
export declare const continueWhenFlowIsNotRunning: () => <T>(source$: Observable<T>) => Observable<T>;
export declare const createFlowRunner: <T>({ actions$, dispatch, prefix, }: {
    actions$: Observable<Action>;
    dispatch: (_: Action) => void;
    prefix?: string;
}) => FlowRunner;

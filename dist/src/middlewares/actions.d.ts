import { Action } from './../interfaces';
export declare class Actions {
    private actions$;
    get middleware(): (_: any) => (next: (arg: Action) => void) => (action: Action) => void;
    getObservableActions(): import("rxjs").Observable<Action<string>>;
}

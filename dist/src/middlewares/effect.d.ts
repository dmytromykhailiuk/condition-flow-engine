import { SideEffect, Action } from './../interfaces';
export declare class SideEffects {
    private sideEffects;
    constructor(sideEffects?: SideEffect[]);
    get middleware(): (store: {
        dispatch: (action: Action) => void;
    }) => (next: (arg: Action) => void) => (action: Action) => void;
    add(sideEffect: SideEffect): void;
}

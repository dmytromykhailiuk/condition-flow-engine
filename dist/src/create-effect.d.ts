import { Action, SideEffect } from './interfaces';
import { Observable } from 'rxjs';
export declare const createEffect: <T extends Action<string>>(fn: () => Observable<any>, obj?: {
    dispatch: boolean;
}) => SideEffect;

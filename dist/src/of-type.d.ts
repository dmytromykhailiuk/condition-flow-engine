import { Observable } from 'rxjs';
import { Action } from './interfaces';
export declare const ofType: <F extends Action<string>, T extends F["type"], E extends (_: any) => F>(typeToCompare: F | T | E) => (source$: Observable<F>) => Observable<F & {
    type: T;
}>;

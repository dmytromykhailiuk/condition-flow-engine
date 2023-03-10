import { Observable } from 'rxjs';
export declare const select: <T, F>(selector: (_: T) => F) => (source$: Observable<T>) => Observable<F>;

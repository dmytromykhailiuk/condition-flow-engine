import { Action, ObservableStore, Store } from './interfaces';
export declare const createObservableStore: <T, A extends Action<string>>(store: Store<T, A>) => ObservableStore<T>;

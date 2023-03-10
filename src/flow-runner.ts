import { Observable, BehaviorSubject, switchMap, filter, take, map, tap, mergeMap } from 'rxjs';
import { Action } from './interfaces';

const generateId = () =>
  `${Date.now()}${Array.from({ length: 7 }, () => String(Math.floor(Math.random() * 10))).join('')}`;

const START_FLOW_ACTION_TYPE = '__START_RUN_FLOW__';
const FINISH_FLOW_ACTION_TYPE = '__FINISH_RUN_FLOW__';

const getSuccessActionForFlow = (type: string) => `${type} Success`;

const flowIsRunning$ = new BehaviorSubject<string[]>([]);

export type FlowRunner = <T>(actions: Action[], context: T) => Observable<T>;

const buildFlow = <T>({
  id,
  actions,
  actions$,
  dispatch,
  context,
  prefix,
}: {
  id: string;
  actions: Action;
  actions$: Observable<Action>;
  dispatch: (_: Action) => void;
  context: T;
  prefix: string;
}) => {
  const currentAction = actions[0];

  Promise.resolve().then(() => {
    dispatch({ ...currentAction, context });
  });

  return actions$.pipe(
    filter(action => action.type === getSuccessActionForFlow(currentAction.type)),
    take(1),
    tap(({ context }) => {
      if (actions.length <= 1) {
        Promise.resolve().then(() => {
          dispatch({
            type: `${prefix} ${FINISH_FLOW_ACTION_TYPE}`,
            context,
            id,
          });
        });

        flowIsRunning$.next(flowIsRunning$.getValue().slice(1));
      }
    }),
    filter(() => actions.length > 1),
    switchMap(({ context }) =>
      buildFlow({
        id,
        actions: actions.slice(1),
        actions$,
        dispatch,
        context,
        prefix,
      }),
    ),
  );
};

export const continueWhenFlowIsNotRunning = () =>
  function <T>(source$: Observable<T>) {
    return source$.pipe(
      mergeMap((value: T) =>
        flowIsRunning$.pipe(
          filter((flows) => flows.length === 0 || flows[0] === (value as any)?.id),
          take(1),
          map(() => value),
        ),
      ),
    );
  };

export const createFlowRunner = <T>({
  actions$,
  dispatch,
  prefix = '[FLOW]',
}: {
  actions$: Observable<Action>;
  dispatch: (_: Action) => void;
  prefix?: string;
}): FlowRunner => {
  const type = `${prefix} ${START_FLOW_ACTION_TYPE}`;

  actions$
    .pipe(
      filter(action => action.type === type),
      tap(({ id }) => {
        flowIsRunning$.next([...flowIsRunning$.getValue(), id]);
      }),
      continueWhenFlowIsNotRunning(),
      switchMap(({ actions, context, id }) => buildFlow({ id, actions, actions$, dispatch, context, prefix })),
    )
    .subscribe();

  return ((actions: Action[], context: T) => {
    const flowId = generateId();

    Promise.resolve().then(() => {
      dispatch({
        type,
        id: flowId,
        actions,
        context,
      });
    });

    return actions$.pipe(
      filter(action => action.type === `${prefix} ${FINISH_FLOW_ACTION_TYPE}`),
      filter(({ id }) => id === flowId),
      take(1),
      map(({ context }) => context as T),
    );
  }) as FlowRunner;
};

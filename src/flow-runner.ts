import { validateCondition } from './condition-functions';
import { Observable, BehaviorSubject, switchMap, filter, take, map, tap, mergeMap, of, takeUntil, Subject } from 'rxjs';
import { Action, ConditionObject, Config } from './interfaces';

const generateId = () =>
  `${Date.now()}${Array.from({ length: 7 }, () => String(Math.floor(Math.random() * 10))).join('')}`;

const getEndActionForFlow = (type: string) => `${type} End`;

const START_FLOW_ACTION_TYPE = '__START_RUN_FLOW__';
const FINISH_FLOW_ACTION_TYPE = '__FINISH_RUN_FLOW__';

const FORCE_FINISH_FLOW = '__FORCE_FINISH_FLOW__';
const FORCE_FINISH_FLOW_END = getEndActionForFlow(FORCE_FINISH_FLOW);

const RUN_FLOW_IN_SCOPE = '__RUN_FLOW_IN_SCOPE__';
const RUN_FLOW_IN_SCOPE_END = getEndActionForFlow(RUN_FLOW_IN_SCOPE);

const RUN_CONDITION_FLOW = '__RUN_CONDITION_FLOW__';
const RUN_CONDITION_FLOW_END = getEndActionForFlow(RUN_CONDITION_FLOW);

const RUN_REPEATED_FLOW = '__RUN_REPEATED_FLOW__';
const RUN_REPEATED_FLOW_END = getEndActionForFlow(RUN_REPEATED_FLOW);

const RUN_DYNAMIC_ACTION = '__RUN_DYNAMIC_ACTION__';
const RUN_DYNAMIC_ACTION_END = getEndActionForFlow(RUN_DYNAMIC_ACTION);

const flowIsRunning$ = new BehaviorSubject<string[]>([]);

export type FlowRunner = <T>(actions: Action[], context?: T) => Observable<T>;

const buildNestedFlow = <T>({
  relatedAction,
  actions,
  actions$,
  dispatch,
  prefix,
  buildFlowFn,
  flowTag,
  context,
  finishParentFlow,
  config,
}: {
  relatedAction: Action;
  actions: Action[];
  actions$: Observable<Action>;
  dispatch: (_: Action) => void;
  prefix: string;
  buildFlowFn: (obj: any) => Observable<any>;
  flowTag?: string;
  context: T;
  config?: {
    data: Config;
  };
  finishParentFlow: (input: { tag?: string; context?: T; stopNestedFlows?: () => void }) => void;
}) => {
  const nestedFlowId = generateId();

  Promise.resolve().then(() => {
    buildFlowFn({
      id: nestedFlowId,
      actions,
      actions$,
      dispatch,
      context,
      prefix,
      flowTag,
      finishParentFlow: finishParentFlow || relatedAction.finishFlow,
      config,
    }).subscribe();
  });

  return actions$.pipe(
    filter((action) => action.type === `${prefix} ${FINISH_FLOW_ACTION_TYPE}`),
    filter(({ id }) => id === nestedFlowId),
    take(1),
    map(({ context }) => ({ context, id: relatedAction.id })),
  );
};

const buildNestedRepeatedFlow = <T>({
  relatedAction,
  actions,
  actions$,
  dispatch,
  prefix,
  buildFlowFn,
  flowTag,
  context,
  times,
  conditionToRepeat,
  finishParentFlow,
  config,
}: {
  relatedAction: Action;
  actions: Action[];
  actions$: Observable<Action>;
  dispatch: (_: Action) => void;
  prefix: string;
  buildFlowFn: (obj: any) => Observable<any>;
  flowTag?: string;
  context: T;
  times?: number;
  conditionToRepeat?: ConditionObject<T>;
  finishParentFlow: (input: { tag?: string; context?: T; stopNestedFlows?: () => void }) => void;
  config?: {
    data: Config;
  };
}) => {
  let currentContext = context;
  let count = 0;

  const finishRepeatedFlow$ = new Subject<T>();

  const finishRepeatedFlow = ({
    tag,
    context = {} as T,
    stopNestedFlows = () => {},
  }: {
    tag?: string;
    context: T;
    stopNestedFlows?: () => void;
  }) => {
    if (tag === undefined || tag === flowTag) {
      finishRepeatedFlow$.next(context);

      stopNestedFlows();
      return;
    }

    if (tag) {
      finishParentFlow({
        tag,
        context,
        stopNestedFlows: () => {
          finishRepeatedFlow$.next(context);
          stopNestedFlows();
        },
      });
    }
  };

  const runRepeatedFlow = () => {
    return of({}).pipe(
      map(() => {
        if (typeof times === 'number' && times > 0) {
          return count !== times;
        }
        if (!conditionToRepeat) {
          return false;
        }
        return validateCondition({
          condition:
            typeof conditionToRepeat !== 'string'
              ? conditionToRepeat
              : config?.data?.conditionsMap?.[conditionToRepeat],
          globalContext: currentContext,
        });
      }),
      tap((shouldRepead) => {
        if (!shouldRepead) {
          finishRepeatedFlow({ context: currentContext });
        }
      }),
      filter(Boolean),
      switchMap(() =>
        buildNestedFlow({
          relatedAction,
          actions,
          actions$,
          dispatch,
          prefix,
          buildFlowFn,
          context: currentContext,
          finishParentFlow: finishRepeatedFlow,
          config,
        }),
      ),
      tap(({ context }) => {
        count++;
        currentContext = context;
      }),
      switchMap(() => runRepeatedFlow()),
    );
  };

  Promise.resolve().then(() => {
    runRepeatedFlow()
      .pipe(takeUntil(finishRepeatedFlow$.pipe(take(1))))
      .subscribe();
  });

  return finishRepeatedFlow$.pipe(take(1));
};

const buildFlow = <T>({
  id = generateId(),
  actions: actionsFromPayload,
  actions$,
  dispatch,
  context,
  prefix,
  flowTag,
  finishParentFlow = () => {},
  config,
}: {
  id?: string;
  actions: Action[];
  actions$: Observable<Action>;
  dispatch: (_: Action) => void;
  context: T;
  prefix: string;
  flowTag?: string;
  finishParentFlow?: (input: { tag?: string; context?: T; stopNestedFlows?: () => void }) => void;
  config?: {
    data: Config;
  };
}) => {
  const actions: Action[] = Array.isArray(actionsFromPayload)
    ? actionsFromPayload
    : config?.data?.flowsMap?.[actionsFromPayload];

  if (actions.length === 0) {
    return of(null);
  }

  const currentAction = actions[0];

  const finishFlow$ = new Subject<void>();

  const finishFlow = ({
    tag,
    context = {} as T,
    stopNestedFlows = () => {},
  }: {
    tag?: string;
    context: T;
    stopNestedFlows?: () => void;
  }) => {
    if (tag === undefined || tag === flowTag) {
      Promise.resolve().then(() => {
        dispatch({
          type: `${prefix} ${FINISH_FLOW_ACTION_TYPE}`,
          context,
          id,
        });
      });

      if (flowIsRunning$.getValue()[0] === id) {
        flowIsRunning$.next(flowIsRunning$.getValue().slice(1));
      }

      finishFlow$.next();

      stopNestedFlows();
      return;
    }

    if (tag) {
      finishParentFlow({
        tag,
        context,
        stopNestedFlows: () => {
          finishFlow$.next();
          stopNestedFlows();
        },
      });
    }
  };

  Promise.resolve().then(() => {
    dispatch({
      ...currentAction,
      context,
      id,
      buildFlow: ({ context = {} as T, actions, flowTag }: { context?: T; actions: Action[]; flowTag: string }) => {
        return buildNestedFlow({
          relatedAction: currentAction,
          context,
          actions,
          actions$,
          dispatch,
          prefix,
          flowTag,
          buildFlowFn: buildFlow,
          finishParentFlow: finishFlow,
          config,
        }).pipe(map(({ context }) => context as T));
      },
      runRepeatedFlow: ({
        actions,
        flowTag,
        context,
        times,
        conditionToRepeat,
      }: {
        context?: T;
        actions: Action[];
        flowTag: string;
        times?: number;
        conditionToRepeat?: ConditionObject;
      }) => {
        return buildNestedRepeatedFlow({
          actions,
          actions$,
          dispatch,
          prefix,
          relatedAction: currentAction,
          buildFlowFn: buildFlow,
          flowTag,
          context,
          times,
          conditionToRepeat,
          finishParentFlow: finishFlow,
          config,
        });
      },
      finishFlow,
    });
  });

  return actions$.pipe(
    filter((action) => action.type === getEndActionForFlow(currentAction.type)),
    filter((action) => action.id === id),
    take(1),
    tap(({ context }) => {
      if (actions.length <= 1) {
        finishFlow({ context });
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
        finishParentFlow,
        flowTag,
        config,
      }),
    ),
    takeUntil(finishFlow$.pipe(take(1))),
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
  config,
}: {
  actions$: Observable<Action>;
  dispatch: (_: Action) => void;
  prefix?: string;
  config?: {
    data: Config;
  };
}): FlowRunner => {
  const runFlowActionType = `${prefix} ${START_FLOW_ACTION_TYPE}`;
  const endFlowActionType = `${prefix} ${FINISH_FLOW_ACTION_TYPE}`;
  const runFlowInScope = `${prefix} ${RUN_FLOW_IN_SCOPE}`;
  const runFlowInScopeEnd = `${prefix} ${RUN_FLOW_IN_SCOPE_END}`;
  const runConditionalFlow = `${prefix} ${RUN_CONDITION_FLOW}`;
  const runConditionalFlowEnd = `${prefix} ${RUN_CONDITION_FLOW_END}`;
  const runRepeatedFlow = `${prefix} ${RUN_REPEATED_FLOW}`;
  const runRepeatedFlowEnd = `${prefix} ${RUN_REPEATED_FLOW_END}`;
  const forceFinishFlow = `${prefix} ${FORCE_FINISH_FLOW}`;
  const forceFinishFlowEnd = `${prefix} ${FORCE_FINISH_FLOW_END}`;
  const runDynamicAction = `${prefix} ${RUN_DYNAMIC_ACTION}`;
  const runDynamicActionEnd = `${prefix} ${RUN_DYNAMIC_ACTION_END}`;

  actions$
    .pipe(
      filter((action) => action.type === runFlowActionType),
      tap(({ id }) => {
        flowIsRunning$.next([...flowIsRunning$.getValue(), id]);
      }),
      continueWhenFlowIsNotRunning(),
      switchMap(({ actions, context, id }) =>
        buildFlow({
          id,
          actions,
          actions$,
          dispatch,
          context,
          prefix,
          flowTag: '#main',
          config,
        }),
      ),
    )
    .subscribe();

  actions$
    .pipe(
      filter((action) => action.type === forceFinishFlow),
      tap((action) => {
        action.finishFlow({ tag: action.tag, context: action.context });

        dispatch({
          type: forceFinishFlowEnd,
          context: action.context,
          id: action.id,
        });
      }),
    )
    .subscribe();

  actions$
    .pipe(
      filter((action) => action.type === runFlowInScope),
      switchMap((action) => {
        return buildNestedFlow<T>({
          relatedAction: action,
          actions: action.actions,
          actions$,
          context: action.context,
          dispatch,
          flowTag: action.flowTag,
          prefix,
          buildFlowFn: buildFlow,
          finishParentFlow: action.finishFlow,
          config,
        });
      }),
      tap(({ context, id }) => {
        dispatch({
          type: runFlowInScopeEnd,
          context,
          id,
        });
      }),
    )
    .subscribe();

  actions$
    .pipe(
      filter((action) => action.type === runDynamicAction),
      tap((action) => {
        const newContext = eval(action.code || 'action.context');

        dispatch({
          type: runDynamicActionEnd,
          context: newContext,
          id: action.id,
        });
      }),
    )
    .subscribe();

  actions$
    .pipe(
      filter((action) => action.type === runConditionalFlow),
      switchMap((action) => {
        const actions = (action.conditions || []).find((obj) =>
          validateCondition({
            condition: typeof obj.condition !== 'string' ? obj.condition : config?.data?.conditionsMap?.[obj.condition],
            globalContext: action.context,
          }),
        )?.actions;

        if (!actions) {
          return of(action);
        }

        return buildNestedFlow<T>({
          relatedAction: action,
          actions,
          actions$,
          context: action.context,
          dispatch,
          flowTag: action.flowTag,
          prefix,
          buildFlowFn: buildFlow,
          finishParentFlow: action.finishFlow,
          config,
        });
      }),
      tap(({ context, id }) => {
        dispatch({
          type: runConditionalFlowEnd,
          context,
          id,
        });
      }),
    )
    .subscribe();

  actions$
    .pipe(
      filter((action) => action.type === runRepeatedFlow),
      switchMap((action) =>
        buildNestedRepeatedFlow({
          actions: action.actions,
          actions$,
          dispatch,
          prefix,
          relatedAction: action,
          buildFlowFn: buildFlow,
          flowTag: action.flowTag,
          context: action.context,
          times: action.times,
          conditionToRepeat: action.conditionToRepeat,
          finishParentFlow: action.finishFlow,
          config,
        }).pipe(
          tap((context) => {
            dispatch({
              type: runRepeatedFlowEnd,
              context,
              id: action.id,
            });
          }),
        ),
      ),
    )
    .subscribe();

  return ((actions: Action[], context: T = {} as T) => {
    const flowId = generateId();

    Promise.resolve().then(() => {
      dispatch({
        type: runFlowActionType,
        id: flowId,
        actions,
        context,
      });
    });

    return actions$.pipe(
      filter((action) => action.type === endFlowActionType),
      filter(({ id }) => id === flowId),
      take(1),
      map(({ context }) => context as T),
    );
  }) as FlowRunner;
};

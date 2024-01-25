"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFlowRunner = exports.continueWhenFlowIsNotRunning = void 0;
const condition_functions_1 = require("./condition-functions");
const rxjs_1 = require("rxjs");
const generateId = () => `${Date.now()}${Array.from({ length: 7 }, () => String(Math.floor(Math.random() * 10))).join('')}`;
const getEndActionForFlow = (type) => `${type} End`;
const START_FLOW_ACTION_TYPE = '__START_RUN_FLOW__';
const FINISH_FLOW_ACTION_TYPE = '__FINISH_RUN_FLOW__';
const FORCE_FINISH_FLOW = '__RUN_FINISH_FLOW__';
const FORCE_FINISH_FLOW_END = getEndActionForFlow(FORCE_FINISH_FLOW);
const RUN_CONDITION_FLOW = '__RUN_CONDITION_FLOW__';
const RUN_CONDITION_FLOW_END = getEndActionForFlow(RUN_CONDITION_FLOW);
const RUN_REPEATED_FLOW = '__RUN_REPEATED_FLOW__';
const RUN_REPEATED_FLOW_END = getEndActionForFlow(RUN_REPEATED_FLOW);
const RUN_DYNAMIC_ACTION = '__RUN_DYNAMIC_ACTION__';
const RUN_DYNAMIC_ACTION_END = getEndActionForFlow(RUN_DYNAMIC_ACTION);
const flowIsRunning$ = new rxjs_1.BehaviorSubject([]);
const buildNestedFlow = ({ relatedAction, actions, actions$, dispatch, prefix, buildFlowFn, flowTag, context, finishParentFlow, }) => {
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
        }).subscribe();
    });
    return actions$.pipe((0, rxjs_1.filter)((action) => action.type === `${prefix} ${FINISH_FLOW_ACTION_TYPE}`), (0, rxjs_1.filter)(({ id }) => id === nestedFlowId), (0, rxjs_1.take)(1), (0, rxjs_1.map)(({ context }) => ({ context, id: relatedAction.id })));
};
const buildNestedRepeatedFlow = ({ relatedAction, actions, actions$, dispatch, prefix, buildFlowFn, flowTag, context, times, conditionToRepeat, finishParentFlow, }) => {
    let currentContext = context;
    let count = 0;
    const finishRepeatedFlow$ = new rxjs_1.Subject();
    const finishRepeatedFlow = ({ tag, context = {}, stopNestedFlows = () => { }, }) => {
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
        return (0, rxjs_1.of)({}).pipe((0, rxjs_1.map)(() => {
            if (typeof times === 'number' && times > 0) {
                return count !== times;
            }
            if (!conditionToRepeat) {
                return false;
            }
            return (0, condition_functions_1.validateCondition)({
                condition: conditionToRepeat,
                globalContext: currentContext,
            });
        }), (0, rxjs_1.tap)((shouldRepead) => {
            if (!shouldRepead) {
                finishRepeatedFlow({ context: currentContext });
            }
        }), (0, rxjs_1.filter)(Boolean), (0, rxjs_1.switchMap)(() => buildNestedFlow({
            relatedAction,
            actions,
            actions$,
            dispatch,
            prefix,
            buildFlowFn,
            context: currentContext,
            finishParentFlow: finishRepeatedFlow,
        })), (0, rxjs_1.tap)(({ context }) => {
            count++;
            currentContext = context;
        }), (0, rxjs_1.switchMap)(() => runRepeatedFlow()));
    };
    Promise.resolve().then(() => {
        runRepeatedFlow()
            .pipe((0, rxjs_1.takeUntil)(finishRepeatedFlow$.pipe((0, rxjs_1.take)(1))))
            .subscribe();
    });
    return finishRepeatedFlow$.pipe((0, rxjs_1.take)(1));
};
const buildFlow = ({ id = generateId(), actions, actions$, dispatch, context, prefix, flowTag, finishParentFlow = () => { }, }) => {
    if (actions.length === 0) {
        return (0, rxjs_1.of)(null);
    }
    const currentAction = actions[0];
    const finishFlow$ = new rxjs_1.Subject();
    const finishFlow = ({ tag, context = {}, stopNestedFlows = () => { }, }) => {
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
            buildFlow: ({ context = {}, actions, flowTag }) => {
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
                }).pipe((0, rxjs_1.map)(({ context }) => context));
            },
            runRepeatedFlow: ({ actions, flowTag, context, times, conditionToRepeat, }) => {
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
                });
            },
            finishFlow,
        });
    });
    return actions$.pipe((0, rxjs_1.filter)((action) => action.type === getEndActionForFlow(currentAction.type)), (0, rxjs_1.filter)((action) => action.id === id), (0, rxjs_1.take)(1), (0, rxjs_1.tap)(({ context }) => {
        if (actions.length <= 1) {
            finishFlow({ context });
        }
    }), (0, rxjs_1.filter)(() => actions.length > 1), (0, rxjs_1.switchMap)(({ context }) => buildFlow({
        id,
        actions: actions.slice(1),
        actions$,
        dispatch,
        context,
        prefix,
        finishParentFlow,
        flowTag,
    })), (0, rxjs_1.takeUntil)(finishFlow$.pipe((0, rxjs_1.take)(1))));
};
const continueWhenFlowIsNotRunning = () => function (source$) {
    return source$.pipe((0, rxjs_1.mergeMap)((value) => flowIsRunning$.pipe((0, rxjs_1.filter)((flows) => flows.length === 0 || flows[0] === (value === null || value === void 0 ? void 0 : value.id)), (0, rxjs_1.take)(1), (0, rxjs_1.map)(() => value))));
};
exports.continueWhenFlowIsNotRunning = continueWhenFlowIsNotRunning;
const createFlowRunner = ({ actions$, dispatch, prefix = '[FLOW]', }) => {
    const runFlowActionType = `${prefix} ${START_FLOW_ACTION_TYPE}`;
    const endFlowActionType = `${prefix} ${FINISH_FLOW_ACTION_TYPE}`;
    const runConditionalFlow = `${prefix} ${RUN_CONDITION_FLOW}`;
    const runConditionalFlowEnd = `${prefix} ${RUN_CONDITION_FLOW_END}`;
    const runRepeatedFlow = `${prefix} ${RUN_REPEATED_FLOW}`;
    const runRepeatedFlowEnd = `${prefix} ${RUN_REPEATED_FLOW_END}`;
    const forceFinishFlow = `${prefix} ${FORCE_FINISH_FLOW}`;
    const forceFinishFlowEnd = `${prefix} ${FORCE_FINISH_FLOW_END}`;
    const runDynamicAction = `${prefix} ${RUN_DYNAMIC_ACTION}`;
    const runDynamicActionEnd = `${prefix} ${RUN_DYNAMIC_ACTION_END}`;
    actions$
        .pipe((0, rxjs_1.filter)((action) => action.type === runFlowActionType), (0, rxjs_1.tap)(({ id }) => {
        flowIsRunning$.next([...flowIsRunning$.getValue(), id]);
    }), (0, exports.continueWhenFlowIsNotRunning)(), (0, rxjs_1.switchMap)(({ actions, context, id }) => buildFlow({
        id,
        actions,
        actions$,
        dispatch,
        context,
        prefix,
        flowTag: '#main',
    })))
        .subscribe();
    actions$
        .pipe((0, rxjs_1.filter)((action) => action.type === forceFinishFlow), (0, rxjs_1.tap)((action) => {
        action.finishFlow(action.tag);
        dispatch({
            type: forceFinishFlowEnd,
            context: action.context,
            id: action.id,
        });
    }))
        .subscribe();
    actions$
        .pipe((0, rxjs_1.filter)((action) => action.type === runDynamicAction), (0, rxjs_1.tap)((action) => {
        const newContext = eval(action.code || 'action.context');
        dispatch({
            type: runDynamicActionEnd,
            context: newContext,
            id: action.id,
        });
    }))
        .subscribe();
    actions$
        .pipe((0, rxjs_1.filter)((action) => action.type === runConditionalFlow), (0, rxjs_1.switchMap)((action) => {
        var _a;
        const actions = (_a = (action.conditions || []).find((obj) => (0, condition_functions_1.validateCondition)({
            condition: obj.condition,
            globalContext: action.context,
        }))) === null || _a === void 0 ? void 0 : _a.actions;
        if (!actions) {
            return (0, rxjs_1.of)(action);
        }
        return buildNestedFlow({
            relatedAction: action,
            actions,
            actions$,
            context: action.context,
            dispatch,
            flowTag: action.flowTag,
            prefix,
            buildFlowFn: buildFlow,
            finishParentFlow: action.finishFlow,
        });
    }), (0, rxjs_1.tap)(({ context, id }) => {
        dispatch({
            type: runConditionalFlowEnd,
            context,
            id,
        });
    }))
        .subscribe();
    actions$
        .pipe((0, rxjs_1.filter)((action) => action.type === runRepeatedFlow), (0, rxjs_1.switchMap)((action) => buildNestedRepeatedFlow({
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
    }).pipe((0, rxjs_1.tap)((context) => {
        dispatch({
            type: runRepeatedFlowEnd,
            context,
            id: action.id,
        });
    }))))
        .subscribe();
    return ((actions, context = {}) => {
        const flowId = generateId();
        Promise.resolve().then(() => {
            dispatch({
                type: runFlowActionType,
                id: flowId,
                actions,
                context,
            });
        });
        return actions$.pipe((0, rxjs_1.filter)((action) => action.type === endFlowActionType), (0, rxjs_1.filter)(({ id }) => id === flowId), (0, rxjs_1.take)(1), (0, rxjs_1.map)(({ context }) => context));
    });
};
exports.createFlowRunner = createFlowRunner;
//# sourceMappingURL=flow-runner.js.map
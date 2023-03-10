"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFlowRunner = exports.continueWhenFlowIsNotRunning = void 0;
const rxjs_1 = require("rxjs");
const generateId = () => `${Date.now()}${Array.from({ length: 7 }, () => String(Math.floor(Math.random() * 10))).join('')}`;
const START_FLOW_ACTION_TYPE = '__START_RUN_FLOW__';
const FINISH_FLOW_ACTION_TYPE = '__FINISH_RUN_FLOW__';
const getSuccessActionForFlow = (type) => `${type} Success`;
const flowIsRunning$ = new rxjs_1.BehaviorSubject([]);
const buildFlow = ({ id, actions, actions$, dispatch, context, prefix, }) => {
    const currentAction = actions[0];
    Promise.resolve().then(() => {
        dispatch({ ...currentAction, context });
    });
    return actions$.pipe((0, rxjs_1.filter)(action => action.type === getSuccessActionForFlow(currentAction.type)), (0, rxjs_1.take)(1), (0, rxjs_1.tap)(({ context }) => {
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
    }), (0, rxjs_1.filter)(() => actions.length > 1), (0, rxjs_1.switchMap)(({ context }) => buildFlow({
        id,
        actions: actions.slice(1),
        actions$,
        dispatch,
        context,
        prefix,
    })));
};
const continueWhenFlowIsNotRunning = () => function (source$) {
    return source$.pipe((0, rxjs_1.mergeMap)((value) => flowIsRunning$.pipe((0, rxjs_1.filter)((flows) => flows.length === 0 || flows[0] === (value === null || value === void 0 ? void 0 : value.id)), (0, rxjs_1.take)(1), (0, rxjs_1.map)(() => value))));
};
exports.continueWhenFlowIsNotRunning = continueWhenFlowIsNotRunning;
const createFlowRunner = ({ actions$, dispatch, prefix = '[FLOW]', }) => {
    const type = `${prefix} ${START_FLOW_ACTION_TYPE}`;
    actions$
        .pipe((0, rxjs_1.filter)(action => action.type === type), (0, rxjs_1.tap)(({ id }) => {
        flowIsRunning$.next([...flowIsRunning$.getValue(), id]);
    }), (0, exports.continueWhenFlowIsNotRunning)(), (0, rxjs_1.switchMap)(({ actions, context, id }) => buildFlow({ id, actions, actions$, dispatch, context, prefix })))
        .subscribe();
    return ((actions, context) => {
        const flowId = generateId();
        Promise.resolve().then(() => {
            dispatch({
                type,
                id: flowId,
                actions,
                context,
            });
        });
        return actions$.pipe((0, rxjs_1.filter)(action => action.type === `${prefix} ${FINISH_FLOW_ACTION_TYPE}`), (0, rxjs_1.filter)(({ id }) => id === flowId), (0, rxjs_1.take)(1), (0, rxjs_1.map)(({ context }) => context));
    });
};
exports.createFlowRunner = createFlowRunner;
//# sourceMappingURL=flow-runner.js.map
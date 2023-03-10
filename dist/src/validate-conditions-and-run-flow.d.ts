import { ConditionsMap, Flow, FlowValidator } from './interfaces';
export declare const validateConditionsAndRunFlow: <T>({ validator, context, flowRunner, conditionsMap, }: {
    validator: FlowValidator | FlowValidator[];
    context: T;
    flowRunner: (flow: Flow, context: T) => void;
    conditionsMap?: ConditionsMap;
}) => boolean;

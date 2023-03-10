import { ConditionObject, ConditionsMap, LinkToCondition } from './interfaces';
export declare const isSameStateForCondition: <T = any>(condition: ConditionObject | LinkToCondition, conditionsMap?: ConditionsMap) => (prevContext: T, currContext: T) => boolean;
export declare const validateCondition: <T>({ condition, globalContext, localContext, conditionsMap, }: {
    condition: ConditionObject | LinkToCondition;
    globalContext: T;
    localContext?: any;
    conditionsMap?: ConditionsMap;
}) => boolean;

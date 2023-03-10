export interface Action<T extends string = string> {
    [key: string]: any;
    type: T;
}
export type Flow = string | Action[];
export interface BackgroundFlow {
    conditionToSubscribe: ConditionObject | string;
    conditionToRunFlow: ConditionObject | string;
    flow: Flow;
}
export interface BackgroundFlowsMap {
    [groupId: string]: BackgroundFlow[];
}
export type LinkToCondition = string;
export interface ConditionsMap {
    [linkToCondition: LinkToCondition]: ConditionObject;
}
export interface FlowsMap {
    [linkToFlow: string]: Action[];
}
export interface Hooks {
    [hookName: string]: ({
        condition: ConditionObject | LinkToCondition;
        flow: Flow;
    } | Flow)[];
}
export declare enum Operation {
    OR = "OR",
    AND = "AND",
    NOT = "NOT",
    EQ = "EQ",
    NE = "NE",
    GT = "GT",
    LT = "LT",
    GE = "GE",
    LE = "LE",
    INCLUDES = "INCLUDES",
    TO_BOOLEAN_EQ = "TO_BOOLEAN_EQ"
}
export interface ConditionObject<T = any> {
    operation: Operation;
    mapFromLocalContext?: string[];
    mapFromGlobalContext?: string[];
    value: T | ConditionObject | ConditionObject[] | LinkToCondition | LinkToCondition[];
}
export interface VariableInCondition<T = any> {
    mapping: string[];
    operation: Operation;
    value: T;
}
export interface FlowValidatorBase {
    conditionToValidate: ConditionObject | LinkToCondition;
    conditionToIgnore: ConditionObject | LinkToCondition;
}
export interface FlowValidatorWithSuccessFlow extends FlowValidatorBase {
    onSuccess: Flow;
}
export interface FlowValidatorWithFailureFlow extends FlowValidatorBase {
    onFailure: Flow;
}
export type FlowValidator = FlowValidatorWithSuccessFlow | FlowValidatorWithFailureFlow;
export interface FlowValidatorMap {
    [flowvalidatorName: string]: FlowValidator | FlowValidator[];
}

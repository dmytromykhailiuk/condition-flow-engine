"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCondition = exports.isSameStateForCondition = exports.mapContext = void 0;
const interfaces_1 = require("./interfaces");
const getVariablesInCondition = (conditionObject, variableContext = []) => {
    let localVariableContext = variableContext;
    if (conditionObject.mapFromGlobalContext) {
        localVariableContext = conditionObject.mapFromGlobalContext;
    }
    if (conditionObject.mapFromLocalContext) {
        localVariableContext = [...localVariableContext, ...conditionObject.mapFromLocalContext];
    }
    switch (conditionObject.operation) {
        case interfaces_1.Operation.OR:
        case interfaces_1.Operation.AND: {
            return conditionObject.value.reduce((acc, obj) => [...acc, ...getVariablesInCondition(obj, localVariableContext)], []);
        }
        case interfaces_1.Operation.NOT: {
            return getVariablesInCondition(conditionObject.value, localVariableContext);
        }
        default: {
            return [
                {
                    mapping: localVariableContext,
                    operation: conditionObject.operation,
                    value: conditionObject.value,
                },
            ];
        }
    }
};
const mapContext = (context, mapping) => !mapping.length ? context : (0, exports.mapContext)(context === null || context === void 0 ? void 0 : context[mapping[0]], mapping.slice(1));
exports.mapContext = mapContext;
const makeBaseOperation = (operation, valueFromCondition, valueFromContext) => {
    switch (operation) {
        case interfaces_1.Operation.EQ: {
            return valueFromCondition === valueFromContext;
        }
        case interfaces_1.Operation.NE: {
            return valueFromCondition !== valueFromContext;
        }
        case interfaces_1.Operation.GT: {
            return valueFromCondition < valueFromContext;
        }
        case interfaces_1.Operation.LT: {
            return valueFromCondition > valueFromContext;
        }
        case interfaces_1.Operation.GE: {
            return valueFromCondition <= valueFromContext;
        }
        case interfaces_1.Operation.LE: {
            return valueFromCondition >= valueFromContext;
        }
        case interfaces_1.Operation.INCLUDES: {
            return Array.isArray(valueFromCondition)
                ? valueFromCondition.includes(valueFromContext)
                : valueFromContext.includes(valueFromCondition);
        }
        case interfaces_1.Operation.TO_BOOLEAN_EQ: {
            return Boolean(valueFromContext) === valueFromCondition;
        }
        default: {
            return true;
        }
    }
};
const isSameStateForCondition = (condition, conditionsMap = {}) => (prevContext, currContext) => {
    const conditionObject = typeof condition === 'string' ? conditionsMap[condition] : condition;
    const variablesInConditions = getVariablesInCondition(conditionObject);
    return variablesInConditions.every(({ mapping, operation, value }) => {
        const prevValue = (0, exports.mapContext)(prevContext, mapping);
        const currValue = (0, exports.mapContext)(currContext, mapping);
        return makeBaseOperation(operation, value, prevValue) === makeBaseOperation(operation, value, currValue);
    });
};
exports.isSameStateForCondition = isSameStateForCondition;
const validateCondition = ({ condition, globalContext, localContext = globalContext, conditionsMap = {}, }) => {
    let newContext = localContext;
    const conditionObject = typeof condition === 'string' ? conditionsMap[condition] : condition;
    if (conditionObject.mapFromGlobalContext) {
        newContext = (0, exports.mapContext)(localContext, conditionObject.mapFromGlobalContext);
    }
    if (conditionObject.mapFromLocalContext) {
        newContext = (0, exports.mapContext)(localContext, conditionObject.mapFromLocalContext);
    }
    switch (conditionObject.operation) {
        case interfaces_1.Operation.OR: {
            return conditionObject.value.some((childCondition) => (0, exports.validateCondition)({ condition: childCondition, globalContext, localContext: newContext, conditionsMap }));
        }
        case interfaces_1.Operation.AND: {
            return conditionObject.value.every((childCondition) => (0, exports.validateCondition)({ condition: childCondition, globalContext, localContext: newContext, conditionsMap }));
        }
        case interfaces_1.Operation.NOT: {
            return !(0, exports.validateCondition)({ condition, globalContext, localContext: newContext, conditionsMap });
        }
        default: {
            return makeBaseOperation(conditionObject.operation, conditionObject.value, newContext);
        }
    }
};
exports.validateCondition = validateCondition;
//# sourceMappingURL=condition-functions.js.map
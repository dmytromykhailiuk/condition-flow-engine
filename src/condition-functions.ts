import { ConditionObject, ConditionsMap, LinkToCondition, Operation, VariableInCondition } from './interfaces';

const getVariablesInCondition = (
  conditionObject: ConditionObject,
  variableContext: string[] = [],
): VariableInCondition[] => {
  let localVariableContext = variableContext;

  if (conditionObject.mapFromGlobalContext) {
    localVariableContext = conditionObject.mapFromGlobalContext;
  }

  if (conditionObject.mapFromLocalContext) {
    localVariableContext = [...localVariableContext, ...conditionObject.mapFromLocalContext];
  }

  switch (conditionObject.operation) {
    case Operation.OR:
    case Operation.AND: {
      return conditionObject.value.reduce(
        (acc, obj) => [...acc, ...getVariablesInCondition(obj, localVariableContext)],
        [],
      );
    }
    case Operation.NOT: {
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

export const mapContext = (context: any, mapping: string[]) =>
  !mapping.length ? context : mapContext(context?.[mapping[0]], mapping.slice(1));

const makeBaseOperation = (operation: Operation, valueFromCondition: any, valueFromContext: any): boolean => {
  switch (operation) {
    case Operation.EQ: {
      return valueFromCondition === valueFromContext;
    }
    case Operation.NE: {
      return valueFromCondition !== valueFromContext;
    }
    case Operation.GT: {
      return valueFromCondition < valueFromContext;
    }
    case Operation.LT: {
      return valueFromCondition > valueFromContext;
    }
    case Operation.GE: {
      return valueFromCondition <= valueFromContext;
    }
    case Operation.LE: {
      return valueFromCondition >= valueFromContext;
    }
    case Operation.INCLUDES: {
      return Array.isArray(valueFromCondition)
        ? valueFromCondition.includes(valueFromContext)
        : valueFromContext.includes(valueFromCondition);
    }
    case Operation.TO_BOOLEAN_EQ: {
      return Boolean(valueFromContext) === valueFromCondition;
    }
    default: {
      return true;
    }
  }
};

export const isSameStateForCondition =
  <T = any>(condition: ConditionObject | LinkToCondition, conditionsMap: ConditionsMap = {}) =>
  (prevContext: T, currContext: T): boolean => {
    const conditionObject: ConditionObject = typeof condition === 'string' ? conditionsMap[condition] : condition;

    const variablesInConditions = getVariablesInCondition(conditionObject);

    return variablesInConditions.every(({ mapping, operation, value }) => {
      const prevValue = mapContext(prevContext, mapping);
      const currValue = mapContext(currContext, mapping);

      return makeBaseOperation(operation, value, prevValue) === makeBaseOperation(operation, value, currValue);
    });
  };

export const validateCondition = <T>({
  condition,
  globalContext,
  localContext = globalContext,
  conditionsMap = {},
}: {
  condition: ConditionObject | LinkToCondition;
  globalContext: T;
  localContext?: any | T;
  conditionsMap?: ConditionsMap;
}): boolean => {
  let newContext = localContext;

  const conditionObject: ConditionObject =
    typeof condition === 'string' ? conditionsMap[condition] : (condition as ConditionObject);

  if (conditionObject.mapFromGlobalContext) {
    newContext = mapContext(localContext, conditionObject.mapFromGlobalContext);
  }

  if (conditionObject.mapFromLocalContext) {
    newContext = mapContext(localContext, conditionObject.mapFromLocalContext);
  }

  switch (conditionObject.operation) {
    case Operation.OR: {
      return conditionObject.value.some((childCondition: ConditionObject) =>
        validateCondition({ condition: childCondition, globalContext, localContext: newContext, conditionsMap }),
      );
    }
    case Operation.AND: {
      return conditionObject.value.every((childCondition: ConditionObject) =>
        validateCondition({ condition: childCondition, globalContext, localContext: newContext, conditionsMap }),
      );
    }
    case Operation.NOT: {
      return !validateCondition({ condition, globalContext, localContext: newContext, conditionsMap });
    }
    default: {
      return makeBaseOperation(conditionObject.operation, conditionObject.value, newContext);
    }
  }
};

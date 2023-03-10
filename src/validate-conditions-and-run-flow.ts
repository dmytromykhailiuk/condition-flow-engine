import { validateCondition } from './condition-functions';
import {
  ConditionsMap,
  Flow,
  FlowValidator,
  FlowValidatorWithFailureFlow,
  FlowValidatorWithSuccessFlow,
} from './interfaces';

export const validateConditionsAndRunFlow = <T>({
  validator,
  context,
  flowRunner,
  conditionsMap = {},
}: {
  validator: FlowValidator | FlowValidator[];
  context: T;
  flowRunner: (flow: Flow, context: T) => void;
  conditionsMap?: ConditionsMap;
}): boolean => {
  if (!validator) {
    return true;
  }

  if (Array.isArray(validator)) {
    return validator.every((validatorObject) =>
      validateConditionsAndRunFlow({ conditionsMap, flowRunner, validator: validatorObject, context }),
    );
  }

  if (
    validateCondition<T>({
      condition: validator.conditionToIgnore,
      globalContext: context,
      conditionsMap,
    })
  ) {
    return true;
  }

  const isSuccess = validateCondition<T>({
    condition: validator.conditionToValidate,
    globalContext: context,
    conditionsMap,
  });

  if (isSuccess && (validator as FlowValidatorWithSuccessFlow).onSuccess) {
    flowRunner((validator as FlowValidatorWithSuccessFlow).onSuccess, context);

    return false;
  }

  if (!isSuccess && (validator as FlowValidatorWithFailureFlow).onFailure) {
    flowRunner((validator as FlowValidatorWithFailureFlow).onFailure, context);

    return false;
  }

  return true;
};
